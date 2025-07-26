import cv2
from fastapi import UploadFile
from services.utils import read_image_from_upload, encode_image_to_bytes


async def process(file: UploadFile):
    img = await read_image_from_upload(file)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    
    low_threshold = 55
    high_threshold = 75 # Adjusted to be roughly 3x low_threshold

    edges = cv2.Canny(blurred, threshold1=low_threshold, threshold2=high_threshold, L2gradient=True)

    return encode_image_to_bytes(edges)