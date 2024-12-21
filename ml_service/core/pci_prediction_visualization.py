import os
import torch
import json
import geopandas as gpd
import torch.nn as nn
from PIL import Image
from torchvision import transforms
from shapely.geometry import LineString, Point
from shapely.ops import nearest_points
from torchvision.models import resnet50
from typing import Optional
import matplotlib.pyplot as plt
import contextily as cx
import pandas as pd

# Set device
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Constants
IMG_SIZE = 224


data_transforms = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.RandomHorizontalFlip(),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# Functions for model handling
def load_model(model_path: str) -> nn.Module:
    """Load and prepare the ResNet50 model for PCI prediction, mapping it to the CPU if needed."""
    model = resnet50()
    num_ftrs = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Linear(num_ftrs, 256),
        nn.ReLU(),
        nn.Dropout(0.3),
        nn.Linear(256, 1)
    )
    
    # Load the model weights with map_location to handle CPU-only environment
    model.load_state_dict(torch.load(model_path, map_location=torch.device('cpu')))
    return model.to(device)

# Prediction function
def predict_pci(image_path: str, model: nn.Module) -> float:
    """Predict PCI for an image using the given model."""
    image = Image.open(image_path).convert('RGB')
    image = data_transforms(image).unsqueeze(0).to(device)
    with torch.no_grad():
        pci = model(image).item()
    return max(0, min(pci, 1))  # Clamp PCI between 0 and 1

# Function to add PCI column if not present
def add_pci_column(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """Add an empty 'PCI' column to the GeoDataFrame if it doesn't exist."""
    if 'PCI' not in gdf.columns:
        gdf['PCI'] = None
    return gdf

# Function to create line segments between points
def create_lines_between_points(points_gdf: gpd.GeoDataFrame, line_gdf: gpd.GeoDataFrame, beg_name: str, end_name: str, idx: int) -> Optional[LineString]:
    """Create a LineString segment between two points on a matched street line."""
    point1 = points_gdf[points_gdf['name'] == beg_name].geometry.values[0]
    point2 = points_gdf[points_gdf['name'] == end_name].geometry.values[0]
    point_name = beg_name.split('_')[0]
    matching_lines = line_gdf[line_gdf['FULL_NAME'] == point_name]

    if matching_lines.empty:
        return None

    def line_contains_points(line, point1, point2, tolerance=1e-6):
        return line.distance(point1) <= tolerance and line.distance(point2) <= tolerance

    for idx, row in matching_lines.iterrows():
        if line_contains_points(row.geometry, point1, point2):
            containing_line = row.geometry
            break
    else:
        return None

    nearest_point1, _ = nearest_points(containing_line, point1)
    nearest_point2, _ = nearest_points(containing_line, point2)
    distance1 = containing_line.project(nearest_point1)
    distance2 = containing_line.project(nearest_point2)

    if distance1 > distance2:
        distance1, distance2 = distance2, distance1

    segment_coords = [
        coord for coord in containing_line.coords
        if distance1 <= containing_line.project(Point(coord)) <= distance2
    ]
    return LineString(segment_coords) if len(segment_coords) >= 2 else None

# Function to process all images and calculate PCI
def process_images(asphalt_model: nn.Module, concrete_model: nn.Module, points_gdf: gpd.GeoDataFrame, line_gdf: gpd.GeoDataFrame):
    """Process images to calculate PCI values and create line segments."""
    lines, names, pcis = [], [], []
    images_folder = os.path.abspath(os.path.join(os.path.dirname(__file__), '../data/inpainted_images/'))
    for idx, filename in enumerate(os.listdir(images_folder)):
        if filename.endswith(('.png', '.jpg', '.jpeg')):
            img_path = os.path.join(images_folder, filename)
            street_name = filename.split('_to_')[0]
            matching_row = points_gdf[points_gdf['name'] == street_name]
            if matching_row.empty:
                continue

            matching_index = matching_row.index[0]
            surface = points_gdf.loc[matching_index, 'surface']
            pci = predict_pci(img_path, asphalt_model if surface == 0 else concrete_model) * 100
            print(f"Surface={surface}")
            beg_street_name = street_name
            end_street_name = filename.split('_to_')[-1].split('_mask.png')[0]
            segment = create_lines_between_points(points_gdf, line_gdf, beg_street_name, end_street_name, idx)
            if segment:
                lines.append(segment)
                names.append(f"{beg_street_name.split('_')[0]}_{beg_street_name.split('_')[1]}")
                pcis.append(pci)

    return gpd.GeoDataFrame({'StreetName': names, 'PCI': pcis, 'Surface': surface}, geometry=lines, crs=points_gdf.crs)

def predict(points_gdf: gpd.GeoDataFrame, jobId: str):
    line_shapefile = "data/inputs/college_station_streets.shp"
    output_shapefile = f"data/outputs/pci_shape_file_{jobId}.shp"
    try:
        polyline_gdf = gpd.read_file(line_shapefile)
        if polyline_gdf.crs is None:
            polyline_gdf.set_crs(epsg=4326, inplace=True)  # Set to EPSG:4326 or appropriate CRS
        
        if polyline_gdf.crs != points_gdf.crs:
            points_gdf = points_gdf.to_crs(polyline_gdf.crs)
    except Exception as e:
        print(f"Error loading polyline file: {e}")
        return None, None

    #Load the model
    model_dir = os.path.join(os.path.dirname(__file__), "models")
    asphalt_model = load_model(os.path.join(model_dir, 'Unclamped_Best_Asphalt_All_ResNet_Layer_Unfreezed.pth'))
    concrete_model = load_model(os.path.join(model_dir, 'Unclamped_Best_Concrete_All_ResNet_Layer_Unfreezed.pth'))
    
    # Add PCI column if missing
    points_gdf = add_pci_column(points_gdf)
    
    # Process images and calculate PCI values
    final_polyline_gdf = process_images(asphalt_model, concrete_model, points_gdf, polyline_gdf)
    
    # Save the final polyline shapefile
    final_polyline_gdf.to_file(output_shapefile)
    return final_polyline_gdf, output_shapefile

def plot_pci_network(df: gpd.GeoDataFrame, output_image_path: str):
    """
    Plots the road network colored by PCI categories with an OpenStreetMap background.
    
    Args:
        shapefile_path (str): Path to the Polyline shapefile containing road network data.
        output_image_path (str): Path where the output image will be saved.
    """
    # Ensure the CRS is in Web Mercator (EPSG:3857) for compatibility with contextily
    df = df.to_crs(epsg=3857)

    # Create the plot
    fig, ax = plt.subplots(figsize=(12, 12))

    # Define the PCI categories and colors
    categories = [0, 55, 70, 85, 100]
    colors = ['red', 'orange', 'lightgreen', 'darkgreen']  # Adjusted colors for better visualization

    # Create a categorical column based on PCI values
    df['PCI_category'] = pd.cut(df['PCI'], bins=categories, labels=colors, include_lowest=True)

    # Plot the polylines with categorized colors
    for color in colors:
        subset = df[df['PCI_category'] == color]
        if not subset.empty:
            subset.plot(ax=ax, color=color, linewidth=2,
                        label=f'PCI {categories[colors.index(color)]}-{categories[colors.index(color)+1]}')

    # Add the OpenStreetMap background map
    cx.add_basemap(ax, source=cx.providers.OpenStreetMap.Mapnik, alpha=0.5)

    # Remove axis for cleaner look
    ax.axis('off')

    # Add a legend for PCI categories
    ax.legend(title='PCI Categories', loc='best')

    # Add a title to the plot
    plt.title('Road Network Colored by PCI with OpenStreetMap Background')

    # Adjust the plot to show the full extent of the data
    ax.set_xlim(df.total_bounds[0], df.total_bounds[2])
    ax.set_ylim(df.total_bounds[1], df.total_bounds[3])

    # Save the plot as a PNG file
    plt.savefig(output_image_path, dpi=300, bbox_inches='tight')
    plt.close(fig)
    return output_image_path

def predict_and_save_image(points_gdf: str, jobId: str):
    final_polyline_gdf, result_shapefile_path = predict(points_gdf=points_gdf, jobId=jobId)
    result_image_path = os.path.abspath(os.path.join(os.path.dirname(__file__), f'../data/outputs/network_pci_{jobId}.png'))
    plot_pci_network(final_polyline_gdf, output_image_path=result_image_path)
    return result_image_path, result_shapefile_path

result_image_path = os.path.abspath(os.path.join(os.path.dirname(__file__), f'../data/outputs/network_pci_{1}.png'))

