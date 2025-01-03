import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))  # Add the app to sys path
from core.data_preparation import process_clip_points, process_satellite_image, save_street_view_images
from core.image_processing_segmentation import process_images
from osgeo import ogr
from core.pci_prediction_visualization import predict_and_save_image
import json
import warnings
from core.lib.aws.s3_service.upload_image import S3Uploader
from core.lib.notification.stomp_notification_manager import STOMPConnectionManager
import shutil  # Import shutil for directory operations

# Ignore FutureWarnings
warnings.simplefilter(action='ignore', category=FutureWarning)
def clean_up():
    # List of folders to clean up
    folders_to_cleanup = [
        "data/outputs",
        "data/street_view_images",
        "data/inpainted_images",
        "data/resized_and_masked_images",
        "data/segmented_street_view_images"
        # Add more folders as needed
    ]

    for folder in folders_to_cleanup:
        if os.path.exists(folder):  # Check if the folder exists
            for filename in os.listdir(folder):  # Iterate over the contents of the folder
                file_path = os.path.join(folder, filename)  # Get the full path of the file
                if os.path.isfile(file_path):  # Check if it's a file
                    os.remove(file_path)  # Remove the file
                elif os.path.isdir(file_path):  # Check if it's a directory
                    shutil.rmtree(file_path)  # Remove the directory and its contents
            print(f"Cleaned up folder: {folder}")
        else:
            print(f"Folder not found: {folder}")

def convert_shapefile_to_geojson(shapefile_path: str, geojson_path: str):
    driver = ogr.GetDriverByName("ESRI Shapefile")
    data_source = driver.Open(shapefile_path, 0)  # 0 means read-only

    # Convert to GeoJSON
    geojson_driver = ogr.GetDriverByName("GeoJSON")
    if geojson_driver is None:
        print("GeoJSON driver is not available.")
    else:
        geojson_data = geojson_driver.CopyDataSource(data_source, geojson_path)
        print(f"Conversion successful. Output saved at {geojson_path}")

def generate_shapefile_extensions(shape_file_path: str) -> list:
    return [shape_file_path, shape_file_path.replace(".shp", ".dbf"), shape_file_path.replace(".shp", ".shx"), shape_file_path.replace(".shp", ".prj"), shape_file_path.replace(".shp", ".cpg")]

def run_pipeline(geojson_string, jobId: str, notification_manager: STOMPConnectionManager):
    try:
        clean_up()
    except Exception as e:
        print(f"Clean up failed: {e}")
    ## Run data preprocessing and download street view images
    print("Clipping points...")
    points_gdf = process_clip_points(polyline_path="data/inputs/college_station_streets.shp", geojson=geojson_string)
    
    print("Process Satellite Image...")
    process_satellite_image(tif_path="data/inputs/satellite_streets.tif", points_gdf=points_gdf, output_path="data/outputs/background_satellite_streets.tif")
    
    print("Downloading Streetview Images...")
    save_street_view_images("data/inputs/college_station_streets.shp", geojson=geojson_string, output_dir="data/street_view_images")

    print("Segmentating, resizing, masking and inpainting streetview images...")
    ## Run Image processing tasks like segmentations, resizing, masking, inpainting
    process_images()

    print("Predicting pci and generating image...")
    ## Run PCI prediction and visualization
    result_image_path, pci_shape_file_path = predict_and_save_image(points_gdf=points_gdf, jobId=jobId)
    result_geojson_file_path = os.path.abspath(os.path.join(os.path.dirname(__file__),f"../data/outputs/{jobId}_pci.geojson"))
    convert_shapefile_to_geojson(pci_shape_file_path, result_geojson_file_path)
    try:
    # upload to s3 bucket
        config_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../configs/s3config.yaml'))
        uploader = S3Uploader(config_path)
        # image_url = uploader.upload_image(result_image_path)
        geojson_file_url = uploader.upload_image(result_geojson_file_path)
        shape_file_paths = generate_shapefile_extensions(pci_shape_file_path)
        shape_zip_file_url = uploader.zip_and_upload(shape_file_paths)
        try:
            clean_up()
        except Exception as e:
            print(f"Clean up failed: {e}")
        return shape_zip_file_url, geojson_file_url 
    except Exception as e:
        raise Exception(f"An error occurred during the pipeline execution: {e}")
    

# if __name__ == "__main__":
#     print(generate_shapefile_extensions("data/inputs/college_station_streets.shp"))