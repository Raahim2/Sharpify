import cv2
import numpy as np
from fastapi import UploadFile
from services.utils import read_image_from_upload, encode_image_to_bytes

async def process(file: UploadFile):
    img = await read_image_from_upload(file)
    
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    hsv[..., 1] = cv2.equalizeHist(hsv[..., 1])  # Boost saturation
    hsv[..., 2] = np.clip(hsv[..., 2] * 1.2, 0, 255).astype(np.uint8)  # Boost brightness
    
    neon = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
    return encode_image_to_bytes(neon)
