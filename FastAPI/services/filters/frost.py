import cv2
import numpy as np
from fastapi import UploadFile
from services.utils import read_image_from_upload, encode_image_to_bytes

def frosted_glass(img, radius=3):
    output = img.copy()
    h, w = img.shape[:2]
    for y in range(radius, h - radius):
        for x in range(radius, w - radius):
            rand_x = x + np.random.randint(-radius, radius)
            rand_y = y + np.random.randint(-radius, radius)
            output[y, x] = img[rand_y, rand_x]
    return output

async def process(file: UploadFile):
    img = await read_image_from_upload(file)
    output = frosted_glass(img)
    return encode_image_to_bytes(output)
