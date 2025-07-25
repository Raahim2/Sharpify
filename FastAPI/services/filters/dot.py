import cv2
import numpy as np
from fastapi import UploadFile
from services.utils import read_image_from_upload, encode_image_to_bytes

async def process(file: UploadFile, block_size: int = 8):
    """
    Applies a halftone-like dot effect by reducing the image resolution in blocks,
    replacing each block with a dot (circle) whose radius depends on brightness.
    
    Args:
        file: Uploaded image.
        block_size: Size of blocks used to generate dots.
    
    Returns:
        Image with dot effect.
    """
    img = await read_image_from_upload(file)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape

    # Create a blank white canvas
    dot_img = np.ones_like(img) * 255

    for y in range(0, h, block_size):
        for x in range(0, w, block_size):
            block = gray[y:y+block_size, x:x+block_size]
            avg_intensity = np.mean(block)
            radius = int((1 - avg_intensity / 255) * (block_size // 2))

            center_x = x + block_size // 2
            center_y = y + block_size // 2

            if radius > 0:
                cv2.circle(dot_img, (center_x, center_y), radius, (0, 0, 0), -1)

    return encode_image_to_bytes(dot_img)



