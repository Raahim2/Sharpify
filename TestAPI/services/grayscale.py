import numpy as np
import cv2
import base64
from fastapi import UploadFile

async def process(image: UploadFile):
    contents = await image.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, buffer = cv2.imencode('.jpg', gray)
    encoded = base64.b64encode(buffer).decode("utf-8")
    return encoded
