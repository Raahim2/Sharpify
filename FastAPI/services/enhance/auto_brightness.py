# services/auto_brightness.py
import cv2
import numpy as np
from fastapi import UploadFile
from ..utils import read_image_from_upload, encode_image_to_bytes

async def adjust_brightness_to_target(img_array: np.ndarray, target_avg_intensity: int = 128) -> np.ndarray:
    """
    Adjusts the image brightness so its average intensity in the V channel (HSV)
    approaches target_avg_intensity.
    """
    hsv = cv2.cvtColor(img_array, cv2.COLOR_BGR2HSV)
    h, s, v = cv2.split(hsv)

    current_avg_v = np.mean(v)
    
    # Avoid division by zero if current_avg_v is 0
    if current_avg_v == 0:
        # If image is all black (or V channel is all 0), only brighten if target is > 0
        if target_avg_intensity > 0:
            # Add a fixed small amount or target_avg_intensity if it's small
            v_new = np.clip(v.astype(np.int16) + target_avg_intensity, 0, 255).astype(np.uint8)
        else:
            v_new = v # No change
    else:
        # Calculate scale factor for V channel
        # We want new_avg_v / current_avg_v = target_avg_intensity / current_avg_v
        # so new_v = v * (target_avg_intensity / current_avg_v)
        scale = target_avg_intensity / current_avg_v
        
        # Apply scaling and clip to 0-255
        v_scaled_float = v.astype(float) * scale
        v_new = np.clip(v_scaled_float, 0, 255).astype(np.uint8)

    final_hsv = cv2.merge((h, s, v_new))
    adjusted_img = cv2.cvtColor(final_hsv, cv2.COLOR_HSV2BGR)
    
    return adjusted_img

async def process(file: UploadFile, target_intensity: int = 128):
    img_array = await read_image_from_upload(file)
    processed_img = await adjust_brightness_to_target(img_array, target_intensity)
    return encode_image_to_bytes(processed_img)