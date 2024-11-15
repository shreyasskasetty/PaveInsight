import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))  # Add the app to sys path
from core.data_preparation import process_clip_points, process_satellite_image, save_street_view_images
from core.image_processing_segmentation import process_images
from core.pci_prediction_visualization import predict_and_save_image
import json
import warnings
from core.lib.aws.s3_service.upload_image import S3Uploader
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

def run_pipeline(geojson_string, jobId: str):
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
    
    try:
    # upload to s3 bucket
        config_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../configs/s3config.yaml'))
        uploader = S3Uploader(config_path)
        image_url = uploader.upload_image(result_image_path)
        shape_file_url = uploader.upload_image(pci_shape_file_path)
        try:
            clean_up()
        except Exception as e:
            print(f"Clean up failed: {e}")
        return image_url, shape_file_url
    except Exception as e:
        raise Exception(f"An error occurred during the pipeline execution: {e}")
    
    