import cv2
import numpy as np
from fastapi import UploadFile
from io import BytesIO

async def read_image_from_upload(file: UploadFile):
    contents = await file.read()
    np_arr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return img

def encode_image_to_bytes(img, format: str = ".jpg"):
    success, encoded = cv2.imencode(format, img)
    if not success:
        raise ValueError("Failed to encode image")
    return BytesIO(encoded.tobytes())
