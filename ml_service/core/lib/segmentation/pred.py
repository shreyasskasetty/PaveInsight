import os
import csv
import torch
import numpy as np
import PIL.Image
import torchvision.transforms as transforms
from mit_semseg.models.models import ModelBuilder, SegmentationModule
from typing import Optional

def load_class_names(filepath: str) -> dict:
    """Load class names from a CSV file for segmentation."""
    names = {}
    with open(filepath) as f:
        reader = csv.reader(f)
        next(reader)  # Skip header
        for row in reader:
            names[int(row[0])] = row[5].split(";")[0]
    return names

def initialize_segmentation_model(encoder_weights: str, decoder_weights: str) -> SegmentationModule:
    """Initialize the segmentation model with specified encoder and decoder weights."""
    net_encoder = ModelBuilder.build_encoder(arch='resnet50dilated', fc_dim=2048, weights=encoder_weights)
    net_decoder = ModelBuilder.build_decoder(arch='ppm_deepsup', fc_dim=2048, num_class=150, weights=decoder_weights, use_softmax=True)
    crit = torch.nn.NLLLoss(ignore_index=-1)
    segmentation_module = SegmentationModule(net_encoder, net_decoder, crit)
    segmentation_module.eval()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    segmentation_module.to(device)
    return segmentation_module

def preprocess_image(image_path: str) -> torch.Tensor:
    """Load and preprocess an image for segmentation."""
    pil_image = PIL.Image.open(image_path).convert('RGB')
    pil_to_tensor = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    img_data = pil_to_tensor(pil_image)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    return img_data[None].to(device)   # Add batch dimension

def perform_segmentation(segmentation_module: SegmentationModule, img_data: torch.Tensor) -> np.ndarray:
    """Run the segmentation model and obtain predictions."""
    with torch.no_grad():
        output_size = img_data.shape[2:]  # Skip batch dimension
        scores = segmentation_module({'img_data': img_data}, segSize=output_size)
        _, pred = torch.max(scores, dim=1)
    return pred.cpu().numpy()[0]  # Remove batch dimension and move to CPU

def postprocess_segmentation(pred: np.ndarray, img_original: np.ndarray) -> PIL.Image.Image:
    """Post-process segmentation output to isolate the pavement (class 7) and apply masking."""
    # Isolate road class (assuming class 6 corresponds to road)
    pred[pred != 6] = 255  # Set non-road classes to 255 (white)
    pred[pred == 6] = 0  # Set road pixels to 0 (black)

    # Mask the non-road areas in the original image
    result_image = img_original.copy()
    result_image[pred == 255] = [255, 255, 255]

    # Apply polygon-like mask to the bottom half of the image
    result_image_masked = apply_polygon_mask(result_image)
    return PIL.Image.fromarray(result_image_masked)

def apply_polygon_mask(result_image: np.ndarray) -> np.ndarray:
    """Apply a polygon-like mask to the bottom half of the image."""
    height, width, _ = result_image.shape
    mask = np.zeros((height, width), dtype=np.uint8)
    
    # Polygonal mask effect
    for row in range(height // 2, height):
        left_bound = int((width // 2) * (1 - (row - height // 2) / (height // 2)))
        right_bound = int(width - (width // 2) * (1 - (row - height // 2) / (height // 2)))
        mask[row, left_bound:right_bound] = 255

    # Apply mask and set outside pixels to white
    return np.where(mask[:, :, None] == 255, result_image, 255)

def segment_street_view(image_path: str, encoder_weights: str, decoder_weights: str) -> Optional[PIL.Image.Image]:
    """
    Complete pipeline to load, process, and segment a street view image.
    
    Args:
        image_path (str): Path to the input image.
        encoder_weights (str): Path to the encoder model weights.
        decoder_weights (str): Path to the decoder model weights.
    
    Returns:
        Optional[PIL.Image.Image]: The segmented and post-processed image, or None if no pavement pixels are found.
    """
    # Load and preprocess image
    img_data = preprocess_image(image_path)
    img_original = np.array(PIL.Image.open(image_path).convert('RGB'))

    # Initialize and perform segmentation
    segmentation_module = initialize_segmentation_model(encoder_weights, decoder_weights)
    pred = perform_segmentation(segmentation_module, img_data)

    # Check for presence of pavement pixels (class 6)
    if np.all(pred != 6):
        return None  # No pavement pixels found
    
    # Post-process and return the segmented image
    segmented_image = postprocess_segmentation(pred, img_original)
    return segmented_image
