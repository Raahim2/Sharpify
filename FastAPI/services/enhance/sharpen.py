# services/sharpen.py
import cv2
import numpy as np
from fastapi import UploadFile
from ..utils import read_image_from_upload, encode_image_to_bytes

async def sharpen_image(img_array: np.ndarray, amount: float = 1.0):
    """
    Sharpens the image using a sharpening kernel and blends it.
    Amount controls the blending: 0 = original, 1 = fully sharpened, >1 = oversharpened.
    """
    # Sharpening kernel
    kernel = np.array([
        [0, -1, 0],
        [-1, 5, -1],
        [0, -1, 0]
    ])
    # A more aggressive kernel could be:
    # kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])

    sharpened_img_base = cv2.filter2D(img_array, -1, kernel)

    # Blend the sharpened image with the original based on the amount
    # amount = 0 gives original, amount = 1 gives fully sharpened_img_base
    if amount == 1.0:
        final_image = sharpened_img_base
    elif amount == 0.0:
        final_image = img_array
    else:
        # Ensure amount is within a reasonable range if not already validated by Pydantic/Query
        # amount_clamped = np.clip(amount, 0.0, 5.0) # Example clamping
        final_image = cv2.addWeighted(sharpened_img_base, amount, img_array, 1 - amount, 0)
        # Ensure the output is properly clipped to 0-255 if addWeighted produces values outside this range
        final_image = np.clip(final_image, 0, 255).astype(np.uint8)


    return final_image

async def process(file: UploadFile, amount: float = 1.0):
    img_array = await read_image_from_upload(file)
    processed_img = await sharpen_image(img_array, amount)
    return encode_image_to_bytes(processed_img)