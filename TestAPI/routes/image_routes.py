from fastapi import APIRouter, UploadFile, File
from services import grayscale, canny

router = APIRouter()

@router.post("/grayscale")
async def grayscale_endpoint(image: UploadFile = File(...)):
    result = await grayscale.process(image)
    return {"image": result}

@router.post("/canny")
async def canny_endpoint(image: UploadFile = File(...)):
    result = await canny.process(image)
    return {"image": result}
