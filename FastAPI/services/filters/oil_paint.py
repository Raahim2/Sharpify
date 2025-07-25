import cv2
import numpy as np
from fastapi import UploadFile
from services.utils import read_image_from_upload, encode_image_to_bytes

async def process(file: UploadFile, size: int = 4, levels: int = 16):
    """
    Applies a fully vectorized, high-performance, and visually authentic oil
    painting effect to an uploaded image.

    This version avoids all Python loops over pixels for maximum speed.

    Args:
        file: The uploaded image file.
        size: The radius of the neighborhood, simulating brush stroke size. (e.g., 3-6)
        levels: The number of color intensity levels. Fewer levels create a
                more abstract, stylized painting. (e.g., 8-20)

    Returns:
        The processed image with an authentic oil painting effect as bytes.
    """
    img = await read_image_from_upload(file)
    if img is None:
        return None

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    step = 256.0 / levels
    quantized_gray = (gray / step).astype(np.uint8)

    palette = np.zeros((levels, 3), dtype=np.uint8)
    for i in range(levels):
        mask = (quantized_gray == i)
        if np.any(mask):
            # Calculate the mean color from the original image for the current intensity
            avg_color = cv2.mean(img, mask=mask.astype(np.uint8))
            palette[i] = avg_color[:3]

    ksize = size * 2 + 1
    # Create N images, where each is a "count" of a specific intensity in a neighborhood.
    histograms = np.array([
        cv2.boxFilter( (quantized_gray == i).astype(np.float32), -1, (ksize, ksize), normalize=False)
        for i in range(levels)
    ])
    
    # Find which intensity level had the highest count for each pixel.
    dominant_level_map = np.argmax(histograms, axis=0).astype(np.uint8)

   
    oil_img = palette[dominant_level_map]

    return encode_image_to_bytes(oil_img)