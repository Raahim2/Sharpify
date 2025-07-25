import cv2
from fastapi import UploadFile
from services.utils import read_image_from_upload, encode_image_to_bytes

async def process(file: UploadFile):
    img = await read_image_from_upload(file)
    height, width = img.shape[:2]

    # Pixelation by resizing down then up
    w, h = width // 20, height // 20
    temp = cv2.resize(img, (w, h), interpolation=cv2.INTER_LINEAR)
    pixelated = cv2.resize(temp, (width, height), interpolation=cv2.INTER_NEAREST)

    return encode_image_to_bytes(pixelated)
