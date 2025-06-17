from fastapi import APIRouter, UploadFile, File
from fastapi.responses import StreamingResponse
# from services import auto_brightness, grayscale, canny, invert, cartoon, sketch, pixelate, comic , sharpen, auto_enhance , denoise , background_removal , background_blur , enlighten
from services import canny, comic, cartoon, sketch
from fastapi import Query, HTTPException

router = APIRouter()

# =================================
# Image Enhancement Endpoints
# =================================

# @router.post("/denoise")
# async def apply_denoise(
#     file: UploadFile = File(...),
#     strength: int = Query(10, ge=1, le=50, description="Denoising strength for NLM. Higher is stronger.")
# ):
    
#     if not (1 <= strength <= 100): # Adjust max strength as needed
#         raise HTTPException(status_code=400, detail="Denoise strength must be between 1 and 100.")
#     result_stream = await denoise.process(file, strength_h=strength)
#     return StreamingResponse(result_stream, media_type="image/jpeg")

# @router.post("/sharpen")
# async def apply_sharpen(
#     file: UploadFile = File(...),
#     amount: float = Query(1.0, ge=0.1, le=5.0, description="Amount of sharpening. 1.0 is a moderate sharpen.")
# ):
    
#     if not (0.1 <= amount <= 10.0): # Adjust max amount as needed
#          raise HTTPException(status_code=400, detail="Sharpen amount must be between 0.1 and 10.0.")
#     result_stream = await sharpen.process(file, amount=amount)
#     return StreamingResponse(result_stream, media_type="image/jpeg")


# @router.post("/auto_enhance")
# async def apply_auto_enhance(file: UploadFile = File(...)):
#     result_stream = await auto_enhance.process(file)
#     return StreamingResponse(result_stream, media_type="image/jpeg")

# @router.post("/auto_brightness")  #✅
# async def apply_auto_brightness(file: UploadFile = File(...)):
#     result_stream = await auto_brightness.process(file)
#     return StreamingResponse(result_stream, media_type="image/jpeg")

# @router.post("/enlighten")  #✅
# async def apply_auto_light(file: UploadFile = File(...)):
#     result_stream = await enlighten.process(file)
#     return StreamingResponse(result_stream, media_type="image/jpeg")

# @router.post("/bgrem")  #✅
# async def remove_bg(file: UploadFile = File(...)):
#     result_stream = await background_removal.process(file)
#     return StreamingResponse(result_stream, media_type="image/jpeg")

# @router.post("/bgblur")  #✅
# async def blur_bg(file: UploadFile = File(...)):
#     result_stream = await background_blur.process(file)
#     return StreamingResponse(result_stream, media_type="image/jpeg")



# =================================
# Image Filter Endpoints
# =================================
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



# =================================
# Depricated endpoints
# =================================

# @router.post("/grayscale")  #✅
# async def convert_to_grayscale(file: UploadFile = File(...)):
#     result = await grayscale.process(file)
#     return StreamingResponse(result, media_type="image/jpeg")

# @router.post("/invert")  #✅
# async def invert_image(file: UploadFile = File(...)):
#     result = await invert.process(file)
#     return StreamingResponse(result, media_type="image/jpeg")

# @router.post("/pixelate")  #✅
# async def pixelate_image(file: UploadFile = File(...)):
#     result = await pixelate.process(file)
#     return StreamingResponse(result, media_type="image/jpeg")