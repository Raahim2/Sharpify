import cv2
import numpy as np
from fastapi import UploadFile
from services.utils import read_image_from_upload, encode_image_to_bytes

async def process(file: UploadFile):
    img = await read_image_from_upload(file)

    blurred = cv2.GaussianBlur(img, (0, 0), sigmaX=2.0)

    sharpened = cv2.addWeighted(img, 1.5, blurred, -0.5, 0)

    return encode_image_to_bytes(sharpened)
