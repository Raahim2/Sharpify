import cv2
import numpy as np
from fastapi import UploadFile
from services.utils import read_image_from_upload, encode_image_to_bytes

def naruto_style(img, k=8, warm_tone=True):
    # 1) Color Quantization using K-means
    data = img.reshape((-1, 3))
    data = np.float32(data)
    _, label, center = cv2.kmeans(data, k, None,
                                  (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0),
                                  2, cv2.KMEANS_RANDOM_CENTERS)
    center = np.uint8(center)
    quant = center[label.flatten()].reshape(img.shape)

    # 2) Bilateral filter for smoothing shading
    smooth = cv2.bilateralFilter(quant, d=9, sigmaColor=75, sigmaSpace=75)

    # 3) Edge Detection (combine Sobel X/Y)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gradx = cv2.Sobel(gray, cv2.CV_16S, 1, 0, ksize=3)
    grady = cv2.Sobel(gray, cv2.CV_16S, 0, 1, ksize=3)
    edge = cv2.convertScaleAbs(cv2.addWeighted(cv2.convertScaleAbs(gradx), 0.5,
                                               cv2.convertScaleAbs(grady), 0.5, 0))
    _, mask = cv2.threshold(edge, 50, 255, cv2.THRESH_BINARY_INV)

    # 4) Warm tone overlay
    if warm_tone:
        overlay = smooth.copy().astype(np.float32)
        overlay[..., 2] *= 1.1
        overlay[..., 1] *= 1.05
        warm = np.clip(overlay, 0, 255).astype(np.uint8)
    else:
        warm = smooth

    # 5) Combine edges with coloring
    edge_bgr = cv2.cvtColor(mask, cv2.COLOR_GRAY2BGR)
    cartoon = cv2.bitwise_and(warm, edge_bgr)
    return cartoon

async def process(file: UploadFile):
    img = await read_image_from_upload(file)
    result = naruto_style(img)
    return encode_image_to_bytes(result)
