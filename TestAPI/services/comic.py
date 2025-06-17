import cv2
from fastapi import UploadFile
from services.utils import read_image_from_upload, encode_image_to_bytes

async def process(file: UploadFile):
    img = await read_image_from_upload(file)

    # Convert to gray
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    blurred_gray = cv2.medianBlur(gray, 5) # Reduced from 7

    edges = cv2.adaptiveThreshold(
        blurred_gray, 255,
        cv2.ADAPTIVE_THRESH_MEAN_C,
        cv2.THRESH_BINARY,
        blockSize=9, # Must be odd, 9 is a common value
        C=2          # Reduced from 10 to be more sensitive to edges
    )

  
    color_smoothed = cv2.bilateralFilter(img, d=9, sigmaColor=75, sigmaSpace=75) # Sigmas reduced

    
    cartoon = cv2.bitwise_and(color_smoothed, color_smoothed, mask=edges)

    return encode_image_to_bytes(cartoon)