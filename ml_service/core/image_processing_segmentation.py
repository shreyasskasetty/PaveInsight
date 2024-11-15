import os
from PIL import Image
from core.lib.segmentation.pred import segment_street_view
import pickle
import numpy as np
import yaml
from typing import Dict, Any
from core.lib.inpainting.predict import predict

# constants
base_dir = os.path.dirname(__file__)
encoder_weights = os.path.join(base_dir,'lib','segmentation', 'ckpt', 'ade20k-resnet50dilated-ppm_deepsup', 'encoder_epoch_20.pth')
decoder_weights = os.path.join(base_dir,'lib','segmentation', 'ckpt', 'ade20k-resnet50dilated-ppm_deepsup', 'decoder_epoch_20.pth')

# pickle file path containing non-white pixel indices
pickle_path = "models/required_non_white_pixels_512_512.pickle"
pickle_path = os.path.join(os.path.dirname(__file__),pickle_path)

## Image Segmentation functions
def load_image(image_path: str) -> Image.Image:
    """Load an image from the specified path."""
    return Image.open(image_path)

def save_segmented_image(segmented_image: Image.Image, save_path: str):
    """Save the segmented image to the specified path."""
    segmented_image.save(save_path)

def segment_images(input_directory: str, output_directory: str):
    """
    Process all images in the input directory, apply segmentation, and save results to the output directory.
    
    Args:
        input_directory (str): Directory containing the input images.
        output_directory (str): Directory to save the segmented images.
    """
    # Ensure the output directory exists
    if not os.path.exists(output_directory):
        os.makedirs(output_directory)

    # Process each image in the input directory
    for image_filename in os.listdir(input_directory):
        image_path = os.path.join(input_directory, image_filename)
        segmented_image = segment_street_view(image_path, encoder_weights, decoder_weights)

        # Skip saving if segmentation returned no pavement pixels
        if segmented_image:
            save_path = os.path.join(output_directory, image_filename)
            save_segmented_image(segmented_image, save_path)

## Image Resize and masking functions
# Highlight: Changed function to convert non-required pixels to black
def create_mask(image_path, expected_indices):
    image = Image.open(image_path).convert('RGB')
    image_array = np.array(image)
    mask = np.zeros((image_array.shape[0], image_array.shape[1]), dtype=np.uint8)
    
    # Create a boolean mask for expected indices
    expected_mask = np.zeros((image_array.shape[0], image_array.shape[1]), dtype=bool)
    expected_mask[tuple(np.array(expected_indices).T)] = True
    
    # Set mask to 255 where pixels are white in expected indices
    white_pixels = np.all(image_array >= 220, axis=2)
    mask[expected_mask & white_pixels] = 255
    
    # Set non-expected pixels to black in the image array
    image_array[~expected_mask] = [0, 0, 0]
    
    return mask, Image.fromarray(image_array)

def resize_and_mask_images(root_folder, output_folder, target_size=(512, 512)):
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    with open(pickle_path, "rb") as f:
        non_white_indices = pickle.load(f)

    for subdir, dirs, files in os.walk(root_folder):
        for file in files:
            if file.endswith('.jpg'):
                # Highlight: Changed naming convention
                base_name = os.path.splitext(file)[0]
                
                # Open and resize image
                img_path = os.path.join(subdir, file)
                img = Image.open(img_path).convert('RGB')  # Highlight: Changed to RGB
                img_resized = img.resize(target_size)
                
                # Save resized image
                # Highlight: Changed filename
                new_filename = f"{base_name}.png"
                img_resized.save(os.path.join(output_folder, new_filename))
                
                # Create and save mask
                mask, processed_img = create_mask(os.path.join(output_folder, new_filename), non_white_indices)
                mask_img = Image.fromarray(mask.astype(np.uint8))
                # Highlight: Changed mask filename
                mask_filename = f"{base_name}_mask.png"
                mask_img.save(os.path.join(output_folder, mask_filename))
                
                # Highlight: Save processed image with non-required pixels converted to black
                processed_img.save(os.path.join(output_folder, new_filename))

### Inpainting Functions
def load_config(config_file_path: str) -> Dict[str, Any]:
    """Load a YAML configuration file."""
    with open(config_file_path, 'r') as file:
        config = yaml.safe_load(file)
    return config

def update_paths(config: Dict[str, Any]) -> Dict[str, Any]:
    """Update and resolve paths in the configuration."""
    # Set new paths for model, input, and output directories
    config['model']['path'] = os.path.join(os.path.dirname(__file__), "lib/inpainting/experiments/rohanswilkho_93_2024-10-18_18-32-48_train_lama-fourier_")
    config['indir'] = "data/resized_and_masked_images"
    config['outdir'] = "data/inpainted_images"
    return config

def save_config(config: Dict[str, Any], config_file_path: str):
    """Save the updated configuration back to a YAML file."""
    with open(config_file_path, 'w') as file:
        yaml.dump(config, file, default_flow_style=False)

def run_inpainting(config_file_path: str):
    """Run the inpainting process using the specified configuration file."""
    predict(config_file_path)

def inpaint_images(config_file_path: str):
    """
    Full pipeline to load, update, and save the inpainting configuration, 
    then run the inpainting process.
    
    Args:
        config_file_path (str): Path to the YAML configuration file.
    """
    # Load configuration
    config = load_config(config_file_path)
    
    config = update_paths(config)
    
    # Save the updated configuration back to the file
    save_config(config, config_file_path)
    
    # Run the inpainting process
    run_inpainting(config_file_path)

def process_images():
    ## input and output directories for segmentation
    street_view_images_dir = "data/street_view_images"
    segmented_output_images_dir = "data/segmented_street_view_images"
    ## input and output directories for resizing
    segmented_images = "data/segmented_street_view_images/"
    resized_images_dir = "data/resized_and_masked_images/"

    segment_images(street_view_images_dir, segmented_output_images_dir)
    
    resize_and_mask_images(segmented_images, resized_images_dir)

    config_path = os.path.join(os.path.dirname(__file__), "lib/inpainting/configs/prediction/predict_config.yaml")
    inpaint_images(config_path)