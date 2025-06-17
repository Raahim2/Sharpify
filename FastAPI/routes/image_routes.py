from fastapi import APIRouter, UploadFile, File
from fastapi.responses import StreamingResponse
from fastapi import Query 
from services import auto_brightness, contrast_adjust, grayscale, canny, invert , sketch, pixelate, comic , sharpen, auto_enhance , denoise  ,shadow_removal , bgrem ,  edge_enhance, oil_paint, color_sketch, water_color, heat, ascii_art, frost, xray, cartoon , kalaidoscope


router = APIRouter()

# =================================
# Image Enhancement Endpoints
# =================================

@router.post("/denoise")
async def apply_denoise(file: UploadFile = File(...),strength: int = Query(10, ge=1, le=50, description="Denoising strength for NLM. Higher is stronger.")):
    result_stream = await denoise.process(file, strength_h=strength)
    return StreamingResponse(result_stream, media_type="image/jpeg")

@router.post("/sharpen")
async def apply_sharpen(file: UploadFile = File(...), amount: float = Query(1.0, ge=0.1, le=5.0, description="Amount of sharpening. 1.0 is a moderate sharpen.")): 
    result_stream = await sharpen.process(file, amount=amount)
    return StreamingResponse(result_stream, media_type="image/jpeg")

@router.post("/auto_enhance")
async def apply_auto_enhance(file: UploadFile = File(...)):
    result_stream = await auto_enhance.process(file)
    return StreamingResponse(result_stream, media_type="image/jpeg")

@router.post("/auto_brightness")  #✅
async def apply_auto_brightness(file: UploadFile = File(...)):
    result_stream = await auto_brightness.process(file)
    return StreamingResponse(result_stream, media_type="image/jpeg")

@router.post("/shadow_removal")  #✅
async def apply_shadow_removal(file: UploadFile = File(...)):
    result_stream = await shadow_removal.process(file)
    return StreamingResponse(result_stream, media_type="image/jpeg")

@router.post("/contrast_adjust")  #✅
async def apply_contrast_adjust(file: UploadFile = File(...)):
    result_stream = await contrast_adjust.process(file)
    return StreamingResponse(result_stream, media_type="image/jpeg")

@router.post("/bgrem")  #✅
async def apply_bgrem(file: UploadFile = File(...)):
    result_stream = await bgrem.process(file)
    return StreamingResponse(result_stream, media_type="image/jpeg")

@router.post("/edge_enhance")  #✅
async def apply_edge_enhance(file: UploadFile = File(...)):
    result_stream = await edge_enhance.process(file)
    return StreamingResponse(result_stream, media_type="image/jpeg")


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

@router.post("/sketch")  #✅
async def sketchify(file: UploadFile = File(...)):
    result = await sketch.process(file)
    return StreamingResponse(result, media_type="image/jpeg")

@router.post("/oil_paint")  #✅
async def apply_oil_paint(file: UploadFile = File(...)):
    result = await oil_paint.process(file)
    return StreamingResponse(result, media_type="image/jpeg")

@router.post("/color_sketch")  #✅
async def color_sketchify(file: UploadFile = File(...)):
    result = await color_sketch.process(file)
    return StreamingResponse(result, media_type="image/jpeg")

@router.post("/water_color")  #✅
async def apply_water_color(file: UploadFile = File(...)):
    result = await water_color.process(file)
    return StreamingResponse(result, media_type="image/jpeg")

@router.post("/heat")  #✅
async def apply_heat(file: UploadFile = File(...)):
    result = await heat.process(file)
    return StreamingResponse(result, media_type="image/jpeg")

@router.post("/ascii_art")  #✅
async def convert_to_ascii(file: UploadFile = File(...)):
    result = await ascii_art.process(file)
    return StreamingResponse(result, media_type="image/jpeg")

@router.post("/frost")  #✅
async def apply_frost(file: UploadFile = File(...)):
    result = await frost.process(file)
    return StreamingResponse(result, media_type="image/jpeg")

@router.post("/xray")  #✅
async def apply_xray(file: UploadFile = File(...)):
    result = await xray.process(file)
    return StreamingResponse(result, media_type="image/jpeg")

@router.post("/cartoon")  #✅
async def apply_cartoon(file: UploadFile = File(...)):
    result = await cartoon.process(file)
    return StreamingResponse(result, media_type="image/jpeg")

@router.post("/kalaidoscope")  #✅
async def apply_kalaidoscope(file: UploadFile = File(...), segments: int = Query(6, ge=3, le=12, description="Number of segments for the kaleidoscope effect.")):
    result = await kalaidoscope.process(file, segments=segments)
    return StreamingResponse(result, media_type="image/jpeg")
                           
@router.post("/grayscale")  #✅
async def convert_to_grayscale(file: UploadFile = File(...)):
    result = await grayscale.process(file)
    return StreamingResponse(result, media_type="image/jpeg")

@router.post("/invert")  #✅
async def invert_image(file: UploadFile = File(...)):
    result = await invert.process(file)
    return StreamingResponse(result, media_type="image/jpeg")

@router.post("/pixelate")  #✅
async def pixelate_image(file: UploadFile = File(...)):
    result = await pixelate.process(file)
    return StreamingResponse(result, media_type="image/jpeg")
