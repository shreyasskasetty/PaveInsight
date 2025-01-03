import geopandas as gpd
from collections import defaultdict
from shapely.geometry import LineString
from typing import List, Dict, Optional, Tuple
from io import StringIO, BytesIO
from PIL import Image
from rasterio.mask import mask
import json
import os
import math
import rasterio
import requests
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../', '.env'))
# Functions related to Clipping points
def is_json(my_string):
    try:
        json_obj = json.loads(my_string)
        # print("JSON structure:", json.dumps(json_obj, indent=2)[:500])  
    except ValueError:
        return False
    return True

def load_data(polyline_path: str, geojson: str) -> (gpd.GeoDataFrame, gpd.GeoDataFrame):
    """Load the polyline and GeoJSON files as GeoDataFrames."""
    try:
        polyline_gdf = gpd.read_file(polyline_path)
        if polyline_gdf.crs is None:
            polyline_gdf.set_crs(epsg=4326, inplace=True)  # Set to EPSG:4326 or appropriate CRS
    except Exception as e:
        print(f"Error loading polyline file: {e}")
        return None, None

    if isinstance(geojson, str) and is_json(geojson):
        try:
            # Remove any extra quotes and escape characters
            geojson = geojson.strip('"').replace('\\"', '"')
            
            # Parse the GeoJSON string
            geojson_dict = json.loads(geojson)
            
            # Add empty properties if missing
            if 'properties' not in geojson_dict:
                geojson_dict['properties'] = {}
            # Create a GeoDataFrame from the parsed GeoJSON
            geojson_gdf = gpd.GeoDataFrame.from_features([geojson_dict])
            # geojson_gdf = gpd.read_file(StringIO(geojson))  # Load from JSON string
            if geojson_gdf.crs is None:
                geojson_gdf.set_crs(epsg=4326, inplace=True)  # Set to EPSG:4326 or appropriate CRS
        except Exception as e:
            print(f"Error loading GeoJSON from string: {e}")
            return None, None
    else:
        return None, None
    # Ensure both layers are in the same CRS
    if polyline_gdf.crs != geojson_gdf.crs:
        try:
            geojson_gdf = geojson_gdf.to_crs(polyline_gdf.crs)
        except Exception as e:
            print(f"Error transforming CRS: {e}")
            return None, None

    return polyline_gdf, geojson_gdf

def clip_polylines(polyline_gdf: gpd.GeoDataFrame, geojson_gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """Clip the polylines using the GeoJSON as a mask and remove any empty geometries."""
    try:
        clipped_polylines = gpd.clip(polyline_gdf, geojson_gdf)
    except Exception as e:
        print(f"Error clipping polylines: {e}")
        return gpd.GeoDataFrame()  # Return an empty GeoDataFrame on error
    return clipped_polylines[~clipped_polylines.is_empty]

def create_points_along_line(line: LineString, interval: float = 100) -> List:
    """Generate points along a line at specified intervals."""
    points = [line.interpolate(0)]  # Start point
    current_distance = interval
    while current_distance < line.length:
        point = line.interpolate(current_distance)
        points.append(point)
        current_distance += interval
    if line.length % interval != 0:
        points.append(line.interpolate(line.length))  # End point
    return points

def generate_points_data(clipped_polylines: gpd.GeoDataFrame, interval: float = 100) -> gpd.GeoDataFrame:
    """Generate points along clipped polylines, assign unique names, and track surface data."""
    all_points = []
    all_names = []
    all_surfaces = []
    
    # Dictionary to keep track of occurrences of each FULL_NAME
    name_occurrences = defaultdict(int)

    try:
        for idx, row in clipped_polylines.iterrows():
            line = row.geometry
            line_name = row.get('FULL_NAME', f'line_{idx}')  # Use 'full_name' if available
            surface = row.get('Surface', 'unknown')  # Use 'surface' field or 'unknown' if not present
            # Increment the occurrence count for this line name
            name_occurrences[line_name] += 1
            occurrence_number = name_occurrences[line_name]
            
            points = create_points_along_line(line, interval)
            
            for point_idx, point in enumerate(points, 1):
                all_points.append(point)
                all_names.append(f"{line_name}_{occurrence_number}_{point_idx}")
                all_surfaces.append(surface)  # Add surface information for each point
    except Exception as e:
        print(f"Error generating points data: {e}")
        return gpd.GeoDataFrame()  # Return an empty GeoDataFrame on error
    
    # Create the new GeoDataFrame with points
    points_gdf = gpd.GeoDataFrame(geometry=all_points, crs=clipped_polylines.crs)
    points_gdf['name'] = all_names
    points_gdf['surface'] = all_surfaces

    return points_gdf[['name', 'surface', 'geometry']]

# def save_points(points_gdf: gpd.GeoDataFrame, output_path: str):
#     """Save the generated points to a shapefile."""
#     points_gdf.to_file(output_path)
def process_clip_points(polyline_path: str, geojson: str, interval: float = 100):
    """
    Full processing pipeline to load data, clip polylines, create points, and save output.
    
    Args:
        polyline_path (str): Path to the polyline shapefile.
        geojson (str): GeoJSON mask.
        interval (float): Distance interval to generate points along the line.
    """
    # Load data
    polyline_gdf, geojson_gdf = load_data(polyline_path, geojson)
    # Check if either GeoDataFrame is empty
    if polyline_gdf is None or geojson_gdf is None or polyline_gdf.empty or geojson_gdf.empty:
        raise ValueError("Failed to load polyline or GeoJSON data.")
    
    # Clip polylines
    clipped_polylines = clip_polylines(polyline_gdf, geojson_gdf)
    
    # Check if clipped_polylines is empty and raise an error if it is
    if clipped_polylines.empty:
        raise ValueError("Clipped polylines GeoDataFrame is empty.")
    
    # Convert to a CRS suitable for measurements if needed
    clipped_polylines = clipped_polylines.to_crs("EPSG:4326")
    
    # Generate points along lines
    points_gdf = generate_points_data(clipped_polylines, interval)
    
    if points_gdf.empty:
        raise ValueError("Points GeoDataFrame is empty.")
    
    # return the output points
    return points_gdf

########## functions related to satellite image saving #############
def load_tif(tif_path: str) -> Tuple[rasterio.io.DatasetReader, dict]:
    """Load the TIF file and return its dataset and CRS."""
    src = rasterio.open(tif_path)
    return src, src.crs

# def load_geojson(geojson: str, target_crs: Optional[str] = None) -> gpd.GeoDataFrame:
#     """Load the GeoJSON file and reproject it to the target CRS if specified."""
#     gdf = gpd.read_file(StringIO(geojson))
#     if target_crs and gdf.crs != target_crs:
#         gdf = gdf.to_crs(target_crs)
#     return gdf

def convert_gdf_to_geometry(gdf: gpd.GeoDataFrame) -> list:
    """Convert a GeoDataFrame to a geometry list for masking."""
    return [json.loads(gdf.to_json())['features'][0]['geometry']]

def mask_tif_with_geojson(tif_path: str, gdf: gpd.GeoDataFrame) -> Tuple:
    """
    Perform the mask operation on a TIF file using a GeoJSON mask.
    
    Args:
        tif_path (str): Path to the TIF file.
        geojson_path (str): Path to the GeoJSON mask file.

    Returns:
        Tuple: Masked image array, transformation details, and updated metadata.
    """
    # Load TIF and GeoJSON files
    src, tif_crs = load_tif(tif_path)

    if tif_crs and gdf.crs != tif_crs:
        gdf = gdf.to_crs(tif_crs)

    # Convert GeoDataFrame to geometry for masking
    geometry = convert_gdf_to_geometry(gdf)

    # Mask the TIF file
    out_image, out_transform = mask(src, geometry, crop=True)
    out_meta = src.meta.copy()
    out_meta.update({
        "driver": "GTiff",
        "height": out_image.shape[1],
        "width": out_image.shape[2],
        "transform": out_transform
    })

    # Close the TIF file after masking
    src.close()
    
    return out_image, out_transform, out_meta

def save_masked_tif(output_path: str, out_image, out_meta):
    """Save the masked TIF image with updated metadata."""
    with rasterio.open(output_path, "w", **out_meta) as dest:
        dest.write(out_image)

def process_satellite_image(tif_path: str, points_gdf: gpd.GeoDataFrame, output_path: Optional[str] = None):
    """
    Full processing pipeline to load data, perform the mask operation, and optionally save output.
    
    Args:
        tif_path (str): Path to the TIF file.
        geojson_path (str): Path to the GeoJSON mask file.
        output_path (Optional[str]): Path to save the output masked TIF file. If None, the image is not saved.
    
    Returns:
        Optional[Tuple]: If output_path is not provided, returns the masked image and metadata.
    """
    # Perform masking operation
    out_image, out_transform, out_meta = mask_tif_with_geojson(tif_path, points_gdf)
    
    # Save the output if an output path is provided, otherwise return the result
    if output_path:
        save_masked_tif(output_path, out_image, out_meta)
        print(f"Masked image saved to {output_path}")
    else:
        return out_image, out_meta

### functions related to saving street view images ####
def calculate_heading(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the heading angle between two points in degrees."""
    dLon = math.radians(lon2 - lon1)
    lat1 = math.radians(lat1)
    lat2 = math.radians(lat2)

    y = math.sin(dLon) * math.cos(lat2)
    x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dLon)
    heading = math.atan2(y, x)
    heading = math.degrees(heading)
    return (heading + 360) % 360  # Normalize to 0-360 degrees

def fetch_street_view_image(lat: float, lon: float, api_key: str, size: str = "640x640", heading: float = 90) -> Optional[Image.Image]:
    """Fetch a Google Street View image at the given location and heading."""
    metadata_url = f"https://maps.googleapis.com/maps/api/streetview/metadata?location={lat},{lon}&key={api_key}"
    metadata_response = requests.get(metadata_url)
    
    if metadata_response.status_code != 200:
        return None
    
    metadata = json.loads(metadata_response.text)
    if metadata.get('status') != "OK":
        return None
    
    date = metadata.get('date', '')  # Date is optional; only use if available

    image_url = f"https://maps.googleapis.com/maps/api/streetview?size={size}&location={lat},{lon}&heading={heading}&fov=90&date={date}&key={api_key}"
    image_response = requests.get(image_url)
    
    if image_response.status_code == 200:
        return Image.open(BytesIO(image_response.content))
    else:
        print("Failed to download, status code:", image_response.status_code)
        exit(1)
        return None

def process_points_for_images(points_gdf: gpd.GeoDataFrame, api_key: str, output_dir: str):
    """
    Process pairs of consecutive points from the GeoDataFrame to fetch and save Street View images.
    
    Args:
        points_gdf (gpd.GeoDataFrame): GeoDataFrame containing points with 'NAME' and geometry columns.
        api_key (str): Google Street View API key.
        output_dir (str): Directory to save the downloaded images.
    """
    # Ensure the GeoDataFrame is sorted to keep points in sequential order
    points_gdf = points_gdf.sort_values('name')
    
    for i in range(len(points_gdf) - 1):
        current_point = points_gdf.iloc[i]
        next_point = points_gdf.iloc[i + 1]
        
        # Extract prefixes from 'NAME' to ensure they belong to the same street segment
        current_prefix = '_'.join(current_point['name'].split('_')[:-1])
        next_prefix = '_'.join(next_point['name'].split('_')[:-1])

        if current_prefix == next_prefix:
            lat1, lon1 = current_point.geometry.y, current_point.geometry.x
            lat2, lon2 = next_point.geometry.y, next_point.geometry.x
            heading = calculate_heading(lat1, lon1, lat2, lon2)
            
            # Fetch and save Street View image
            img = fetch_street_view_image(lat1, lon1, api_key, heading=heading)
            if img:
                img_filename = f"{current_point['name']}_to_{next_point['name']}.jpg"
                img.save(f"{output_dir}/{img_filename}")
        else:
            continue

def load_points(shapefile_path: str, geojson: str) -> gpd.GeoDataFrame:
    """Load the points shapefile and ensure it's in the correct CRS."""
    points_gdf = process_clip_points(shapefile_path, geojson)
    points_gdf = points_gdf.to_crs("EPSG:4326")  
    return points_gdf

def save_street_view_images(shapefile_path: str, geojson: str, output_dir: str):
    """
    Full processing pipeline to load points, calculate heading, fetch Street View images, and save them.
    
    Args:
        shapefile_path (str): Path to the points shapefile.
        api_key (str): Google Street View API key.
        output_dir (str): Directory to save the images.
    """
    api_key = os.getenv("GOOGLE_STREET_VIEW_API_KEY")
    points_gdf = load_points(shapefile_path, geojson)
    process_points_for_images(points_gdf, api_key, output_dir)
    print("Street View image processing complete.")