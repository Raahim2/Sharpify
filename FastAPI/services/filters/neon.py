import cv2
import numpy as np
import random # Import the random module
from fastapi import UploadFile
from services.utils import read_image_from_upload, encode_image_to_bytes

# Define a list of vibrant, neon-style BGR colors
NEON_COLORS = [
    (255, 0, 255),    # Magenta
    (255, 255, 0),    # Cyan
    (0, 255, 0),      # Lime Green
    (255, 102, 0),    # Electric Blue
    (0, 165, 255),    # Bright Orange
    (180, 105, 255),  # Hot Pink
    (0, 255, 255)     # Yellow
]

async def process(
    file: UploadFile,
    line_thickness: int = 3,
    glow_strength: int = 50
):
    """
    Applies a vibrant neon glow effect with a random color to an uploaded image.

    This filter works by detecting the edges, then creating and layering
    multiple blurred versions to simulate a realistic neon glow.

    Args:
        file: The uploaded image file.
        line_thickness: The thickness of the core neon "tube".
        glow_strength: An integer controlling the size and intensity of the glow.
                       Higher values create a larger, softer glow.

    Returns:
        The processed image with the neon effect.
    """
    img = await read_image_from_upload(file)
    if img is None:
        return None

    # --- NEW: Randomly select a color from the predefined list ---
    color = random.choice(NEON_COLORS)

    # 1. Detect the edges of the image.
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.medianBlur(gray, 5)
    edges = cv2.Canny(blurred, 50, 150)

    # 2. Make the neon "tube" thicker if requested.
    if line_thickness > 1:
        kernel = np.ones((line_thickness, line_thickness), np.uint8)
        edges = cv2.dilate(edges, kernel, iterations=1)

    # 3. Create the glow effect by layering blurred versions of the edges.
    neon_canvas = np.zeros_like(img)

    # The kernel size must be an odd number.
    glow_layers = [
        (glow_strength * 4 + 1, 0.3),  # Large, faint outer glow
        (glow_strength * 2 + 1, 0.5),  # Medium glow
        (glow_strength + 1, 1.0),      # Small, bright inner glow
    ]

    B, G, R = color

    for ksize, intensity_factor in glow_layers:
        blurred_edges = cv2.GaussianBlur(edges, (ksize, ksize), 0)
        neon_canvas[:, :, 0] = cv2.add(neon_canvas[:, :, 0], (blurred_edges * (B/255.0) * intensity_factor).astype(np.uint8))
        neon_canvas[:, :, 1] = cv2.add(neon_canvas[:, :, 1], (blurred_edges * (G/255.0) * intensity_factor).astype(np.uint8))
        neon_canvas[:, :, 2] = cv2.add(neon_canvas[:, :, 2], (blurred_edges * (R/255.0) * intensity_factor).astype(np.uint8))

    # 4. Add the bright "hot core" of the neon tube.
    neon_canvas[edges != 0] = (255, 255, 255) # White hot core

    return encode_image_to_bytes(neon_canvas)