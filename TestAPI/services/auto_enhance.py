# services/auto_enhance.py
import cv2
import numpy as np
from fastapi import UploadFile
from .utils import read_image_from_upload, encode_image_to_bytes

async def auto_enhance_image(img_array: np.ndarray):
    """
    Applies Contrast Limited Adaptive Histogram Equalization (CLAHE)
    to LAB color space for color images.
    """
    # Convert image to LAB color space
    lab_img = cv2.cvtColor(img_array, cv2.COLOR_BGR2LAB)

    # Split the LAB image into L, A, and B channels
    l_channel, a_channel, b_channel = cv2.split(lab_img)

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))

    # Apply CLAHE to the L-channel
    cl_l_channel = clahe.apply(l_channel)

    # Merge the CLAHE enhanced L-channel with the A and B channels
    enhanced_lab_img = cv2.merge((cl_l_channel, a_channel, b_channel))

    # Convert the LAB image back to BGR color space
    enhanced_bgr_img = cv2.cvtColor(enhanced_lab_img, cv2.COLOR_LAB2BGR)

    return enhanced_bgr_img

async def process(file: UploadFile):
    img_array = await read_image_from_upload(file)
    processed_img = await auto_enhance_image(img_array)
    return encode_image_to_bytes(processed_img)