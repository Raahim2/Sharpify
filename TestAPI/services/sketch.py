import cv2
import numpy as np
from fastapi import UploadFile
from services.utils import read_image_from_upload, encode_image_to_bytes

async def process(file: UploadFile):
    img = await read_image_from_upload(file)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    inverted = cv2.bitwise_not(gray)

    blurred = cv2.GaussianBlur(inverted, (61, 61), sigmaX=0, sigmaY=0)

    sketch = cv2.divide(gray, 255 - blurred, scale=256)

    noise = np.random.normal(0, 1, sketch.shape).astype(np.uint8)
    sketch = cv2.add(sketch, noise)

    return encode_image_to_bytes(sketch)