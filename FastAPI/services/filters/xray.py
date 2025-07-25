import cv2
import numpy as np
from fastapi import UploadFile
from services.utils import read_image_from_upload, encode_image_to_bytes

def xray_filter(img):
    if img is None:
        # Fallback for None image, though read_image_from_upload should handle errors
        return np.zeros((100, 100, 3), dtype=np.uint8)

    if len(img.shape) == 3 and img.shape[2] == 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    elif len(img.shape) == 2:
        gray = img # Already grayscale
    elif len(img.shape) == 3 and img.shape[2] == 4: # BGRA
        gray = cv2.cvtColor(img, cv2.COLOR_BGRA2GRAY)
    else:
        # Fallback to original behavior if image format is unexpected
        inverted_original = cv2.bitwise_not(img)
        xray_fallback = cv2.convertScaleAbs(inverted_original, alpha=1.5, beta=0)
        return xray_fallback

    inverted_gray = cv2.bitwise_not(gray)
    
    
    # Adjust alpha (contrast) and beta (brightness)
    # Higher alpha increases contrast, negative beta can make darks darker
    xray_effect_gray = cv2.convertScaleAbs(inverted_gray, alpha=1.7, beta=-10)
    
    xray_effect_bgr = cv2.cvtColor(xray_effect_gray, cv2.COLOR_GRAY2BGR)
    
    return xray_effect_bgr

async def process(file: UploadFile):
    img = await read_image_from_upload(file)
    output = xray_filter(img)
    return encode_image_to_bytes(output)