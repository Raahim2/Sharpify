import numpy as np
import cv2
import base64
from fastapi import UploadFile

async def process(image: UploadFile):
    contents = await image.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    edges = cv2.Canny(img, 100, 200)
    _, buffer = cv2.imencode('.jpg', edges)
    encoded = base64.b64encode(buffer).decode("utf-8")
    return encoded
