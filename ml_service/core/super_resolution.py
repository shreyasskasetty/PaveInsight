import os
import json
import rasterio
from rasterio.mask import mask
from rasterio.plot import reshape_as_image
from pyproj import Transformer
import geopandas as gpd
from shapely.geometry import shape
from PIL import Image
import matplotlib.pyplot as plt
import numpy as np

def save_and_convert_super_resolution_image_tif(
    geojson_string: str,
    raster_file_name: str,
    out_raster_file_name: str,
    output_png_path: str
):
    """
    Reads a GeoJSON string, masks a given raster by the geometries, 
    saves the masked raster as a GeoTIFF, converts it to PNG, and 
    extracts its geospatial bounds.

    Parameters:
    - geojson_string (str): The GeoJSON data as a string.
    - raster_file_name (str): Filename of the input raster (GeoTIFF).
    - out_raster_file_name (str): Filename for the masked raster (GeoTIFF).
    - output_png_path (str): Path to save the converted PNG image.

    Returns:
    - bounds_wgs84 (dict): Geospatial bounds in WGS84 coordinates.
    - crs_wgs84 (str): CRS in WGS84.
    """
    # 1. Parse the GeoJSON string
    geojson_obj = json.loads(geojson_string)

    # 2. Convert parsed GeoJSON into a GeoDataFrame
    if geojson_obj["type"] == "FeatureCollection":
        geo_df = gpd.GeoDataFrame.from_features(geojson_obj["features"])
    elif geojson_obj["type"] == "Feature":
        geo_df = gpd.GeoDataFrame.from_features([geojson_obj])
    else:
        raise ValueError("Unsupported GeoJSON type")

    # 3. Set the CRS of the GeoDataFrame (assuming WGS84)
    geo_df.set_crs(epsg=4326, inplace=True)

    # 4. Open the source raster and get its CRS
    full_raster_path = os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            f'../data/inputs/super_resolution/{raster_file_name}'
        )
    )
    with rasterio.open(full_raster_path) as src:
        raster_crs = src.crs

    # 5. Reproject GeoDataFrame to match raster's CRS
    geo_df = geo_df.to_crs(raster_crs)

    # 6. Extract geometries for masking
    geometries = [feature["geometry"] for feature in json.loads(geo_df.to_json())["features"]]

    # 7. Mask the raster using the geometry
    with rasterio.open(full_raster_path) as src:
        out_image, out_transform = mask(src, shapes=geometries, crop=True)
        out_meta = src.meta.copy()

    # 8. Update metadata to reflect the new dimensions and transform
    out_meta.update({
        "driver": "GTiff",
        "height": out_image.shape[1],
        "width": out_image.shape[2],
        "transform": out_transform,
        "crs": raster_crs
    })

    # 9. Save the masked raster GeoTIFF
    result_raster_path = os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            f'../data/outputs/{out_raster_file_name}'
        )
    )
    with rasterio.open(result_raster_path, 'w', **out_meta) as dest:
        dest.write(out_image)

    print(f"Saved masked GeoTIFF to: {result_raster_path}")

    output_image_full_path = os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            f'../data/outputs/{output_png_path}'
        )
    )
    # 10. Convert the masked GeoTIFF to PNG
    convert_tif_to_png(result_raster_path, output_image_full_path)

    mask_white_with_transparent(output_image_full_path)
    # 11. Extract geospatial bounds in WGS84
    bounds_wgs84, crs_wgs84 = get_transformed_geo_bounds(result_raster_path, target_epsg=4326)

    return bounds_wgs84, crs_wgs84


def convert_tif_to_png(output_tif_path, output_png_path):
    # Open the GeoTIFF file
    with rasterio.open(output_tif_path) as src:
        # Read the image data and reshape it for visualization
        img = reshape_as_image(src.read())
        
        # Create a mask for transparency
        # Assuming white background (255, 255, 255)
        if len(img.shape) == 3:  # RGB image
            mask = ~((img[:, :, 0] == 255) & 
                    (img[:, :, 1] == 255) & 
                    (img[:, :, 2] == 255))
            
            # Convert to RGBA
            rgba = np.zeros((img.shape[0], img.shape[1], 4))
            rgba[:, :, :3] = img[:, :, :3]  # Copy RGB channels
            rgba[:, :, 3] = mask * 255  # Add alpha channel
        else:  # Single channel image
            mask = ~(img == 255)
            rgba = np.zeros((img.shape[0], img.shape[1], 4))
            rgba[:, :, :3] = np.stack([img] * 3, axis=-1)  # Convert to RGB
            rgba[:, :, 3] = mask * 255  # Add alpha channel

        # Create figure with transparent background
        fig = plt.figure(figsize=(10, 10))
        ax = plt.Axes(fig, [0., 0., 1., 1.])
        ax.set_axis_off()
        fig.add_axes(ax)
        
        # Display the RGBA image
        plt.imshow(rgba.astype(np.uint8))
        
        # Save with transparency
        plt.savefig(output_png_path,
                    bbox_inches='tight',
                    pad_inches=0,
                    transparent=True,
                    dpi=300)
        plt.close()

def mask_white_with_transparent(output_path):
    # Open the image
    img = Image.open(output_path).convert("RGBA")  # Ensure image is in RGBA mode

    # Get pixel data
    data = img.getdata()

    # Create a new pixel array to modify the alpha channel
    new_data = []
    for item in data:
        # If the pixel is white (255, 255, 255), make it transparent
        if item[:3] == (255, 255, 255):  # Check RGB values
            new_data.append((255, 255, 255, 0))  # Set alpha to 0
        else:
            new_data.append(item)  # Keep original pixel

    # Update the image data
    img.putdata(new_data)

    # Save the image with transparency
    img.save(output_path, "PNG")

def get_transformed_geo_bounds(tif_path, target_epsg=4326):
    """
    Extracts and transforms the geospatial bounds of a GeoTIFF to a target CRS.

    Parameters:
    - tif_path (str): Path to the GeoTIFF file.
    - target_epsg (int): EPSG code of the target CRS (default: 4326 - WGS84).

    Returns:
    - transformed_bounds (dict): {'north': ..., 'south': ..., 'east': ..., 'west': ...}
    - target_crs (str): CRS in WKT format.
    """
    try:
        with rasterio.open(tif_path) as src:
            bounds = src.bounds  # left, bottom, right, top
            src_crs = src.crs

        # Initialize transformer
        transformer = Transformer.from_crs(src_crs, f"epsg:{target_epsg}", always_xy=True)

        # Transform the four corners
        nw = transformer.transform(bounds.left, bounds.top)    # Northwest
        ne = transformer.transform(bounds.right, bounds.top)   # Northeast
        se = transformer.transform(bounds.right, bounds.bottom) # Southeast
        sw = transformer.transform(bounds.left, bounds.bottom)  # Southwest

        # Extract min and max latitudes and longitudes
        lons = [nw[0], ne[0], se[0], sw[0]]
        lats = [nw[1], ne[1], se[1], sw[1]]

        transformed_bounds = {
            'north': max(lats),
            'south': min(lats),
            'east': max(lons),
            'west': min(lons)
        }

        # Get target CRS in WKT
        target_crs = Transformer.from_crs(f"epsg:{target_epsg}", f"epsg:{target_epsg}", always_xy=True).target_crs.to_wkt()

        print(f"Transformed Bounds (EPSG:{target_epsg}): {transformed_bounds}")
        print(f"CRS: {target_crs}")
        bounds_json_pretty = json.dumps(transformed_bounds)
        return bounds_json_pretty, target_crs
    except Exception as e:
        print(f"Error extracting bounds from {tif_path}: {e}")
        return None, None

def get_geo_bounds(tif_path):
    """
    Extracts the CRS and bounds of a GeoTIFF.

    Parameters:
    - tif_path (str): Path to the GeoTIFF file.

    Returns:
    - bounds (rasterio.coords.BoundingBox): Bounding box.
    - crs (rasterio.crs.CRS): Coordinate Reference System.
    """
    try:
        with rasterio.open(tif_path) as src:
            bounds = src.bounds  # left, bottom, right, top
            crs = src.crs
            print(f"CRS: {crs}")
            print(f"Bounds: {bounds}")
            return bounds, crs
    except Exception as e:
        print(f"Error reading bounds from {tif_path}: {e}")
        return None, None

# Example usage
if __name__ == "__main__":
    # Define paths
    input_tif = os.path.abspath('data/outputs/intersected_super_resolution_image.tif')
    output_png = os.path.abspath('data/outputs/intersected_super_resolution_image.jpeg')
    
    # Define GeoJSON string (ensure it's correctly formatted)
    geojson_string = """{
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [-96.34239597591043, 30.619446982926355],
            [-96.34424133571268, 30.61814513444347],
            [-96.34247107776284, 30.616552423659943],
            [-96.34086711677196, 30.61774811333752],
            [-96.34239597591043, 30.619446982926355]
          ]
        ]
      },
      "properties": {}
    }"""

    # Filenames
    raster_file_name = "SuperResolution_Image.tif"
    out_raster_file_name = "intersected_super_resolution_image.tif"
    output_png_path = "data/outputs/intersected_super_resolution_image.jpeg"

    # Run the integrated function
    bounds_wgs84, crs_wgs84 = save_and_convert_super_resolution_image_tif(
        geojson_string=geojson_string,
        raster_file_name=raster_file_name,
        out_raster_file_name=out_raster_file_name,
        output_png_path=output_png_path
    )

    # Optionally, print or use the bounds for further processing
    if bounds_wgs84:
        print("Geospatial Bounds in WGS84:")
        print(bounds_wgs84)
