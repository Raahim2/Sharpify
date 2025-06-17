import cv2
import numpy as np
from fastapi import UploadFile
from services.utils import read_image_from_upload, encode_image_to_bytes

async def process(file: UploadFile):
    img = await read_image_from_upload(file)
    mask = np.zeros(img.shape[:2], np.uint8)

    height, width = img.shape[:2]
    rect = (10, 10, width - 20, height - 20)

    bgdModel = np.zeros((1, 65), np.float64)
    fgdModel = np.zeros((1, 65), np.float64)

    # Run GrabCut
    cv2.grabCut(img, mask, rect, bgdModel, fgdModel, 5, cv2.GC_INIT_WITH_RECT)

    # Create mask: 1 = foreground, 0 = background
    mask_binary = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype("uint8")

    # Clean and blur mask for smoother edges
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    mask_clean = cv2.morphologyEx(mask_binary, cv2.MORPH_OPEN, kernel)
    alpha = cv2.GaussianBlur(mask_clean, (7, 7), 0)

    # Merge original image with alpha channel
    b, g, r = cv2.split(img)
    rgba = cv2.merge((b, g, r, alpha))

    # Encode and return
    return encode_image_to_bytes(rgba)
