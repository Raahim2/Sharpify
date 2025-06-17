from fastapi import APIRouter, UploadFile, File
from fastapi.responses import StreamingResponse
from services import canny, comic, cartoon, sketch

router = APIRouter()

@router.post("/canny")  #✅
async def apply_canny_edge(file: UploadFile = File(...)):
    result = await canny.process(file)
    return StreamingResponse(result, media_type="image/jpeg")


@router.post("/comic")  #✅
async def comicify(file: UploadFile = File(...)):
    result = await comic.process(file)
    return StreamingResponse(result, media_type="image/jpeg")

@router.post("/cartoon")
async def cartoonify(file: UploadFile = File(...)):
    result = await cartoon.process(file)
    return StreamingResponse(result, media_type="image/jpeg")


@router.post("/sketch")  #✅
async def sketchify(file: UploadFile = File(...)):
    result = await sketch.process(file)
    return StreamingResponse(result, media_type="image/jpeg")


