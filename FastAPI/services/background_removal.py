# services/background_removal.py
import os
from pathlib import Path
from fastapi import UploadFile, HTTPException
from rembg import remove
from rembg.sessions import U2netSession
import onnxruntime # Import onnxruntime
from io import BytesIO

MODEL_NAME = "u2net" 
ONNX_MODEL_FILENAME = "bgrem.onnx"
MODEL_DIR_NAME = "Models"

model_path = Path(os.getcwd()) / MODEL_DIR_NAME / ONNX_MODEL_FILENAME
if not model_path.exists():
    current_file_dir = Path(__file__).parent
    model_path_alt = current_file_dir.parent / MODEL_DIR_NAME / ONNX_MODEL_FILENAME
    if model_path_alt.exists():
        model_path = model_path_alt
    else:
        raise FileNotFoundError(f"Local ONNX model not found for background_removal: {model_path} or {model_path_alt}")

sess_opts = onnxruntime.SessionOptions()

try:
    onnx_session_remover = U2netSession(model_name="u2net", onnx_path=str(model_path), sess_opts=sess_opts)
except Exception as e:
    raise RuntimeError(f"Failed to initialize U2netSession for background_removal: {e}. Check model path and onnxruntime compatibility.")


async def remove_background_rembg(image_bytes: bytes) -> bytes:
    try:
        output_bytes = remove(image_bytes, session=onnx_session_remover)
        return output_bytes
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Background removal failed with local model: {str(e)}")

async def process(file: UploadFile):
    input_image_bytes = await file.read()
    if not input_image_bytes:
        await file.close()
        raise HTTPException(status_code=400, detail="No file content received.")
    await file.close()
    
    processed_image_bytes = await remove_background_rembg(input_image_bytes)
    return BytesIO(processed_image_bytes)