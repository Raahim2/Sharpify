import cv2
import numpy as np
from fastapi import UploadFile
from services.utils import read_image_from_upload, encode_image_to_bytes

async def process(file: UploadFile, levels: int = 4):
    img = await read_image_from_upload(file)
    original_shape = img.shape[:2]

    # Step 1: Convert to LAB for lightness control
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)

    # Step 2: Posterize (quantize) the lightness channel
    l = np.floor(l / (256 / levels)) * (256 / levels)
    l = l.astype(np.uint8)

    # Reconstruct posterized LAB image
    quantized_lab = cv2.merge([l, a, b])
    poster_img = cv2.cvtColor(quantized_lab, cv2.COLOR_LAB2BGR)

    # Step 3: Map quantized tones to HOPE-style color palette
    # Custom 4-color BGR palette (Obama-style)
    hope_palette = [
        (0, 0, 128),      # dark blue
        (220, 20, 60),    # red
        (245, 245, 220),  # beige
        (70, 130, 180),   # steel blue
    ]

    # Determine tone index based on grayscale brightness
    gray = cv2.cvtColor(poster_img, cv2.COLOR_BGR2GRAY)
    tone_indices = np.floor(gray / (256 / len(hope_palette))).astype(np.uint8)

    # Create final output image with same shape
    obama_img = np.zeros_like(poster_img)

    for i, color in enumerate(hope_palette):
        obama_img[tone_indices == i] = color

    return encode_image_to_bytes(obama_img)
