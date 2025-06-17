import cv2
from fastapi import UploadFile
from services.utils import read_image_from_upload, encode_image_to_bytes

async def process(file: UploadFile):
    img = await read_image_from_upload(file)
    
    oil = cv2.xphoto.oilPainting(img, 7, 1)
    return encode_image_to_bytes(oil)
