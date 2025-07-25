import cv2
import numpy as np
from fastapi import UploadFile
from services.utils import read_image_from_upload, encode_image_to_bytes

def _create_hatch_texture(shape, spacing):
    """Helper function to create a simple cross-hatch texture."""
    hatch = np.full(shape, 255, dtype=np.uint8)
    # Draw diagonal lines one way
    for i in range(0, shape[1] + shape[0], spacing):
        cv2.line(hatch, (i, 0), (i - shape[0], shape[0]), 0, 1)
    # Draw diagonal lines the other way
    for i in range(0 - shape[0], shape[1], spacing):
        cv2.line(hatch, (i, 0), (i + shape[0], shape[0]), 0, 1)
    return hatch

async def process(file: UploadFile, blur_level: int = 5, shadow_threshold: int = 100, line_thickness: int = 1):
    """
    Applies a more artistic and less distorted thread sketch filter.

    This version combines clean edge detection for outlines with a subtle
    cross-hatch texture for shading, creating a more authentic look.

    Args:
        file: The uploaded image file.
        blur_level: The amount of simplification before edge detection. Must be an odd number.
                    Higher values create smoother, more abstract lines. (e.g., 3, 5, 7)
        shadow_threshold: The brightness level below which shading is applied.
                          Lower values (e.g., 80) mean only the darkest parts get shaded.
                          Higher values (e.g., 140) apply shading more broadly.
        line_thickness: The thickness of the main outlines.

    Returns:
        The processed image with the improved thread sketch effect.
    """
    img = await read_image_from_upload(file)
    if img is None:
        return None

    # 1. Get the grayscale image for processing.
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 2. Pre-process by blurring. This is crucial for a good sketch.
    # It removes noise and simplifies the image, leading to cleaner edge lines.
    gray_blurred = cv2.medianBlur(gray, blur_level)

    # 3. Create the two main components: Shading and Lines.

    # --- SHADING ---
    # Start with a white canvas.
    shading_canvas = np.full(gray.shape, 255, dtype=np.uint8)
    # Create a cross-hatch pattern for texture.
    hatch_texture = _create_hatch_texture(gray.shape, 10)
    # Create a mask for the shadow areas of the image.
    shadow_mask = gray_blurred < shadow_threshold
    # Apply the hatch texture only to the shadow areas.
    shading_canvas[shadow_mask] = hatch_texture[shadow_mask]

    # --- LINES ---
    # Use Canny edge detector to find the main outlines.
    edges = cv2.Canny(gray_blurred, 50, 150)
    # Invert the lines so they are black on a white background.
    if line_thickness > 1:
        # Make lines thicker if requested
        kernel = np.ones((line_thickness, line_thickness), np.uint8)
        edges = cv2.dilate(edges, kernel, iterations=1)
    lines_canvas = cv2.bitwise_not(edges)

    # 4. Combine the lines and shading.
    # Using bitwise_and ensures that the black lines are drawn "on top of"
    # the shaded texture, creating a clean final result.
    final_sketch = cv2.bitwise_and(shading_canvas, lines_canvas)

    # Convert back to BGR for consistent API output.
    final_image = cv2.cvtColor(final_sketch, cv2.COLOR_GRAY2BGR)

    return encode_image_to_bytes(final_image)
