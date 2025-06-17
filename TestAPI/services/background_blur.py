# services/background_blur.py
import os
from pathlib import Path
import cv2
import numpy as np
from fastapi import UploadFile, HTTPException
from PIL import Image
from io import BytesIO
from rembg import remove
from rembg.sessions import U2netSession
import onnxruntime # Import onnxruntime
from .utils import encode_image_to_bytes

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
        raise FileNotFoundError(f"Local ONNX model not found for background_blur: {model_path} or {model_path_alt}")

sess_opts_blur = onnxruntime.SessionOptions()
# Configure sess_opts_blur if needed

try:
    onnx_session_blur = U2netSession(model_name="u2net", onnx_path=str(model_path), sess_opts=sess_opts_blur)
except Exception as e:
    raise RuntimeError(f"Failed to initialize U2netSession for background_blur: {e}. Check model path and onnxruntime compatibility.")

def convert_pil_to_cv2(pil_image: Image.Image) -> np.ndarray:
    
    if pil_image.mode == 'RGBA':
        cv2_image = cv2.cvtColor(np.array(pil_image, dtype=np.uint8), cv2.COLOR_RGBA2BGRA)
    elif pil_image.mode == 'RGB':
        cv2_image = cv2.cvtColor(np.array(pil_image, dtype=np.uint8), cv2.COLOR_RGB2BGR)
    elif pil_image.mode == 'L': # Grayscale
        cv2_image = np.array(pil_image, dtype=np.uint8)
    elif pil_image.mode == 'P': # Palette-based (like GIF)
        pil_image_rgb = pil_image.convert('RGB')
        cv2_image = cv2.cvtColor(np.array(pil_image_rgb, dtype=np.uint8), cv2.COLOR_RGB2BGR)
    else:
        try:
            cv2_image = np.array(pil_image, dtype=np.uint8)
            print(f"Warning: Converting PIL image with mode '{pil_image.mode}' directly to NumPy array. Channel order might be unexpected for OpenCV.")
        except Exception as e:
            raise ValueError(f"Unsupported PIL image mode for OpenCV conversion: {pil_image.mode}. Error: {e}")

    return cv2_image

def convert_cv2_to_pil(cv2_image: np.ndarray) -> Image.Image:
   
    if len(cv2_image.shape) == 3: # Color image
        if cv2_image.shape[2] == 4: # BGRA (e.g., from OpenCV operations involving alpha)
            pil_image = Image.fromarray(cv2.cvtColor(cv2_image, cv2.COLOR_BGRA2RGBA))
        elif cv2_image.shape[2] == 3: # BGR (standard OpenCV color format)
            pil_image = Image.fromarray(cv2.cvtColor(cv2_image, cv2.COLOR_BGR2RGB))
        else:
            raise ValueError(f"Unsupported number of channels for color OpenCV image: {cv2_image.shape[2]}")
    elif len(cv2_image.shape) == 2: # Grayscale image
        pil_image = Image.fromarray(cv2_image, mode='L') # 'L' mode for grayscale
    else:
        raise ValueError(f"Unsupported OpenCV image shape: {cv2_image.shape}")
        
    return pil_image


async def blur_background_with_rembg(
    original_image_bytes: bytes, 
    blur_kernel_size: int = 21
) -> bytes:
    if blur_kernel_size < 3 or blur_kernel_size % 2 == 0:
        blur_kernel_size = 21

    try:
        foreground_bytes_with_alpha = remove(original_image_bytes, session=onnx_session_blur)
        
        foreground_pil = Image.open(BytesIO(foreground_bytes_with_alpha)).convert("RGBA")
        original_pil = Image.open(BytesIO(original_image_bytes)).convert("RGB")
        original_cv2 = convert_pil_to_cv2(original_pil)

        blurred_background_cv2 = cv2.GaussianBlur(original_cv2, (blur_kernel_size, blur_kernel_size), 0)
        blurred_background_pil = convert_cv2_to_pil(blurred_background_cv2)

        if foreground_pil.size != blurred_background_pil.size:
            foreground_pil = foreground_pil.resize(blurred_background_pil.size, Image.Resampling.LANCZOS)

        composite_pil = blurred_background_pil.copy()
        composite_pil.paste(foreground_pil, (0, 0), foreground_pil)
        
        output_buffer = BytesIO()
        composite_pil.save(output_buffer, format="JPEG", quality=90)
        
        return output_buffer.getvalue()

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Background blur processing failed (local model): {str(e)}")

async def process(file: UploadFile, blur_strength: int = 21):
    original_image_bytes = await file.read()
    if not original_image_bytes:
        await file.close()
        raise HTTPException(status_code=400, detail="No file content received.")
    await file.close()
    
    processed_image_bytes = await blur_background_with_rembg(original_image_bytes, blur_strength)
    return BytesIO(processed_image_bytes)


