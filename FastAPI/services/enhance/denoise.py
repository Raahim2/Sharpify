# services/denoise.py
import cv2
import numpy as np
from fastapi import UploadFile
from ..utils import read_image_from_upload, encode_image_to_bytes

async def denoise_image(img_array: np.ndarray, strength_h: int = 10):
    """
    Applies Non-Local Means Denoising.
    h: Parameter regulating filter strength. Higher h value removes more noise
       but also removes image details. (Recommended values 5-30)
    hColor: Same as h, but for color components. Usually same as h.
    templateWindowSize: Should be odd. (Recommended 7)
    searchWindowSize: Should be odd. (Recommended 21)
    """
    # Parameters for fastNlMeansDenoisingColored
    # h and hColor are the same in this simplified version, controlled by strength_h
    template_window_size = 7
    search_window_size = 21

    denoised_img = cv2.fastNlMeansDenoisingColored(
        img_array,
        None,
        h=float(strength_h), # h (Luminance component)
        hColor=float(strength_h), # hColor (Color components) - often same as h
        templateWindowSize=template_window_size,
        searchWindowSize=search_window_size
    )
    return denoised_img

async def process(file: UploadFile, strength_h: int = 10):
    img_array = await read_image_from_upload(file)
    processed_img = await denoise_image(img_array, strength_h)
    return encode_image_to_bytes(processed_img)