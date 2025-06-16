import cv2
import numpy as np
import onnxruntime as ort
import os
from fastapi import UploadFile, HTTPException
from .utils import read_image_from_upload, encode_image_to_bytes

# --- Constants ---
DIVISOR = 16  # For padding to multiple of 16
MODEL_PATH = 'Models/enlighten.onnx'


# ---- Global ONNX Session ----
session = None
input_name = None
output_name = None

def _load_model():
    global session, input_name, output_name
    if not os.path.exists(MODEL_PATH):
        raise RuntimeError(f"Model not found at: {MODEL_PATH}. Please ensure the path is correct.")
    try:
        # Consider adding more providers like 'CUDAExecutionProvider' if GPU is available and preferred
        session = ort.InferenceSession(MODEL_PATH, providers=["CPUExecutionProvider"])
        input_name = session.get_inputs()[0].name
        output_name = session.get_outputs()[0].name
        print(f"ONNX model '{MODEL_PATH}' loaded successfully.")
    except Exception as e:
        raise RuntimeError(f"Failed to load ONNX model: {e}")

_load_model() # Load the model when the module is imported

# ---- Helper Functions for ONNX processing ----
def _pad_to_multiple(img: np.ndarray, divisor: int = DIVISOR):
    h, w = img.shape[:2]
    pad_h = (divisor - (h % divisor)) % divisor
    pad_w = (divisor - (w % divisor)) % divisor

    top = pad_h // 2
    bottom = pad_h - top
    left = pad_w // 2
    right = pad_w - left

    padded_img = cv2.copyMakeBorder(img, top, bottom, left, right, cv2.BORDER_REFLECT_101)
    return padded_img, (h, w) # Return original height and width for cropping

def _preprocess_onnx(img: np.ndarray):
    padded_img, original_size = _pad_to_multiple(img, DIVISOR)
    rgb_img = cv2.cvtColor(padded_img, cv2.COLOR_BGR2RGB)
    normalized_img = rgb_img.astype(np.float32) / 255.0
    # Reshape to NCHW format (Batch_size, Channels, Height, Width)
    chw_img = normalized_img.transpose(2, 0, 1)[np.newaxis, :]
    return chw_img, original_size

def _postprocess_onnx(output_tensor: np.ndarray, original_size: tuple):
    # Squeeze batch dimension, and convert CHW to HWC
    output_img = output_tensor.squeeze(0).transpose(1, 2, 0)
    # Clip values to [0, 1] range and scale to [0, 255]
    output_img = np.clip(output_img, 0, 1)
    output_img_uint8 = (output_img * 255).astype(np.uint8)
    # Convert RGB back to BGR for OpenCV compatibility if needed for saving/display with cv2
    output_bgr = cv2.cvtColor(output_img_uint8, cv2.COLOR_RGB2BGR)

    # Crop back to original size
    h_orig, w_orig = original_size
    
    cropped_bgr = output_bgr[:h_orig, :w_orig]
    return cropped_bgr

async def process(file: UploadFile):
    """
    Applies the EnlightenGAN model to the uploaded image to enhance its lighting.
    """
    global session, input_name, output_name
    if session is None:
        # This should ideally not happen if _load_model() was successful.
        raise HTTPException(status_code=500, detail="ONNX model is not loaded.")

    try:
        img_np = await read_image_from_upload(file)
    except HTTPException as e:
        # Re-raise HTTPException from read_image_from_upload
        raise e
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading image file: {str(e)}")

    try:
        # Preprocess the image for the ONNX model
        input_tensor, original_size = _preprocess_onnx(img_np)

        # Run inference
        output_tensor = session.run([output_name], {input_name: input_tensor})[0]

        # Postprocess the output
        enhanced_image_np = _postprocess_onnx(output_tensor, original_size)

    except RuntimeError as e: # Catch runtime errors from ONNX or processing steps
        raise HTTPException(status_code=500, detail=f"Error during image enlightenment processing: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred during processing: {str(e)}")

    try:
        image_bytes_io = encode_image_to_bytes(enhanced_image_np)
        return image_bytes_io
    except HTTPException as e:
        # Re-raise HTTPException from encode_image_to_bytes
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error encoding processed image: {str(e)}")