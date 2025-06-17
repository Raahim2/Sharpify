import cv2
import numpy as np
from fastapi import UploadFile
from services.utils import read_image_from_upload, encode_image_to_bytes

def apply_kaleidoscope_effect(img: np.ndarray, segments: int = 6) -> np.ndarray:
    h, w = img.shape[:2]
    center = (w // 2, h // 2)
    radius = min(center)

    output = np.zeros_like(img)

    angle = 360 / segments
    mask = np.zeros((h, w), dtype=np.uint8)
    pts = np.array([
        center,
        (int(center[0] + radius * np.cos(np.deg2rad(-angle/2))),
         int(center[1] + radius * np.sin(np.deg2rad(-angle/2)))),
        (int(center[0] + radius * np.cos(np.deg2rad(angle/2))),
         int(center[1] + radius * np.sin(np.deg2rad(angle/2))))
    ])
    cv2.fillConvexPoly(mask, pts, 255)

    base_sector = cv2.bitwise_and(img, img, mask=mask)

    for i in range(segments):
        rotation_angle = i * angle
        M = cv2.getRotationMatrix2D(center, rotation_angle, 1.0)
        rotated = cv2.warpAffine(base_sector, M, (w, h))

        if i % 2 == 1:
            flipped = cv2.flip(rotated, 1)
            output = cv2.add(output, flipped)
        else:
            output = cv2.add(output, rotated)

    return output


async def process(file: UploadFile):
    img = await read_image_from_upload(file)
    if img is None:
        return encode_image_to_bytes(np.zeros((100, 100, 3), dtype=np.uint8))

    result_img = apply_kaleidoscope_effect(img, segments=8)  # You can change segment count
    return encode_image_to_bytes(result_img)
