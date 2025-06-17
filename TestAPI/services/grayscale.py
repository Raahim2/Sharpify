import cv2
from fastapi import UploadFile
from services.utils import read_image_from_upload, encode_image_to_bytes

async def process(file: UploadFile):
    img = await read_image_from_upload(file)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return encode_image_to_bytes(gray)
