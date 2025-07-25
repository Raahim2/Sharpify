import cv2
import numpy as np
from fastapi import UploadFile
from services.utils import read_image_from_upload, encode_image_to_bytes

async def process(file: UploadFile, padding_percent: int = 5):
    """
    Removes the background from an image using a performance-optimized
    GrabCut algorithm.

    This function processes a downscaled version of the image for speed and
    applies the resulting mask to the original for high-quality output.
    The output is a PNG with a transparent background.

    Args:
        file: The uploaded image file.
        padding_percent: The percentage of padding from the edge to define the
                         central rectangle containing the subject.

    Returns:
        A PNG image as bytes with the background removed (made transparent).
    """
    img = await read_image_from_upload(file)
    if img is None:
        return None

    original_shape = img.shape[:2]

    # --- PERFORMANCE OPTIMIZATION ---
    # Downscale the image to a manageable size for fast processing.
    # A max dimension of 600px is a good balance of speed and accuracy.
    MAX_DIMENSION = 600
    scale_ratio = MAX_DIMENSION / max(original_shape)
    
    # If the image is already small, don't upscale it.
    if scale_ratio > 1:
        scale_ratio = 1
        
    processing_shape = (int(original_shape[1] * scale_ratio), int(original_shape[0] * scale_ratio))
    small_img = cv2.resize(img, processing_shape, interpolation=cv2.INTER_AREA)

    # 1. Initialize a mask and models for GrabCut.
    mask = np.zeros(small_img.shape[:2], np.uint8)
    bgdModel = np.zeros((1, 65), np.float64)
    fgdModel = np.zeros((1, 65), np.float64)

    # 2. Define the central rectangle on the SMALL image.
    height, width, _ = small_img.shape
    padding_x = int(width * (padding_percent / 100.0))
    padding_y = int(height * (padding_percent / 100.0))
    rect = (padding_x, padding_y, width - 2 * padding_x, height - 2 * padding_y)

    # 3. Run GrabCut on the SMALL image. This will be very fast.
    cv2.grabCut(small_img, mask, rect, bgdModel, fgdModel, 5, cv2.GC_INIT_WITH_RECT)

    # 4. Create the final mask from the small result.
    small_mask = np.where((mask == cv2.GC_PR_FGD) | (mask == cv2.GC_FGD), 255, 0).astype('uint8')

    # 5. --- UPSCALE THE MASK ---
    # Resize the low-resolution mask back to the original image dimensions.
    # Use INTER_NEAREST to avoid blurry, semi-transparent edges.
    final_mask = cv2.resize(small_mask, (original_shape[1], original_shape[0]), interpolation=cv2.INTER_NEAREST)

    # 6. Apply the full-resolution mask to the original, high-resolution image.
    bgra_img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
    bgra_img[:, :, 3] = final_mask

    # Return the result encoded as a PNG to preserve transparency.
    return encode_image_to_bytes(bgra_img, '.png')

# async def process(file: UploadFile):
#     img = await read_image_from_upload(file)

#     gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    
#     blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    
#     low_threshold = 55
#     high_threshold = 75 # Adjusted to be roughly 3x low_threshold

#     edges = cv2.Canny(blurred, threshold1=low_threshold, threshold2=high_threshold, L2gradient=True)

#     return encode_image_to_bytes(edges)