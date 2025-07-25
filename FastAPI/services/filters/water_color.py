import cv2
from fastapi import UploadFile
from services.utils import read_image_from_upload, encode_image_to_bytes

async def process(file: UploadFile):
    img = await read_image_from_upload(file)
    
    stylized = cv2.stylization(img, sigma_s=60, sigma_r=0.6)
    return encode_image_to_bytes(stylized)
