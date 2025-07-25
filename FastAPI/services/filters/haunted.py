import cv2
import numpy as np
from fastapi import UploadFile
from services.utils import read_image_from_upload, encode_image_to_bytes

async def process(
    file: UploadFile,
    fog_density: float = 0.5,
    vignette_strength: float = 1.5,
    grain_amount: int = 25
):
    """
    Applies a creepy, haunted filter to an uploaded image.

    This effect combines a cold color tint, a foggy/low-contrast look,
    film grain, and a dark vignette to create an eerie atmosphere.

    Args:
        file: The uploaded image file.
        fog_density: Controls how washed-out and foggy the image appears.
                     Ranges from 0 (no fog) to 1 (full fog).
        vignette_strength: Controls the intensity of the dark corners.
                           Higher values make the vignette darker and more focused.
        grain_amount: The intensity of the film grain noise.

    Returns:
        The processed image with the haunted effect.
    """
    img = await read_image_from_upload(file)
    if img is None:
        return None

    height, width, _ = img.shape

    # 1. Apply a cold, foggy color tint.
    # We blend the original image with a solid, cold-bluish color.
    # This single step handles desaturation, tinting, and contrast reduction.
    color_tint = np.full_like(img, (150, 120, 100), dtype=np.uint8) # BGR for a cold, murky blue
    haunted_img = cv2.addWeighted(img, 1 - fog_density, color_tint, fog_density, 0)

    # 2. Add film grain.
    # We generate Gaussian noise and add it to the image.
    noise = np.random.normal(0, grain_amount, haunted_img.shape).astype(np.int16)
    haunted_img = np.clip(haunted_img.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    # 3. Create and apply a dark vignette.
    # This darkens the corners to create a claustrophobic, focused feel.
    k_x = cv2.getGaussianKernel(width, int(width / 2 / vignette_strength))
    k_y = cv2.getGaussianKernel(height, int(height / 2 / vignette_strength))
    # Multiply the 1D kernels to get a 2D Gaussian mask
    vignette_mask = k_y * k_x.T
    
    # Normalize the mask to be between 0 and 1
    vignette_mask = vignette_mask / vignette_mask.max()
    
    # Apply the mask to each color channel of the image
    for i in range(3):
        haunted_img[:, :, i] = haunted_img[:, :, i] * vignette_mask

    return encode_image_to_bytes(haunted_img)

