# services/ghibli_style_v2.py
import cv2
import numpy as np
import onnxruntime as ort
from fastapi import UploadFile, HTTPException
from services.utils import read_image_from_upload, encode_image_to_bytes
import os
import traceback

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GHIBLI_ANIMIGAN_V2_MODEL_PATH = "Models/animeganv3.onnx"

GHIBLI_ANIMIGAN_V2_SESSION = None

def load_ghibli_animigan_v2_model_if_not_loaded():
    global GHIBLI_ANIMIGAN_V2_SESSION
    if GHIBLI_ANIMIGAN_V2_SESSION is None:
        if not os.path.exists(GHIBLI_ANIMIGAN_V2_MODEL_PATH):
            print(f"CRITICAL ERROR: Model file not found at '{GHIBLI_ANIMIGAN_V2_MODEL_PATH}'.")
            # Consider raising an exception here or ensuring process() handles this
            return False
        try:
            # You can specify providers e.g. ['CUDAExecutionProvider', 'CPUExecutionProvider']
            # providers = ['CPUExecutionProvider'] # Example
            # GHIBLI_ANIMIGAN_V2_SESSION = ort.InferenceSession(GHIBLI_ANIMIGAN_V2_MODEL_PATH, providers=providers)
            GHIBLI_ANIMIGAN_V2_SESSION = ort.InferenceSession(GHIBLI_ANIMIGAN_V2_MODEL_PATH)
            print(f"ONNX model '{GHIBLI_ANIMIGAN_V2_MODEL_PATH}' loaded for Ghibli-Style (AnimeGAN v2).")
            
            # Optional: Log input details to confirm
            # input_details = GHIBLI_ANIMIGAN_V2_SESSION.get_inputs()
            # if input_details:
            #     print(f"Ghibli-Style Model Expected Input Name: {input_details[0].name}, Shape: {input_details[0].shape}") # Shape will show ?,H,W,C or ?,C,H,W
            return True
        except Exception as e:
            print(f"CRITICAL ERROR loading ONNX model '{GHIBLI_ANIMIGAN_V2_MODEL_PATH}': {e}")
            traceback.print_exc()
            GHIBLI_ANIMIGAN_V2_SESSION = None
            return False
    return True

async def process(file: UploadFile):
    if not load_ghibli_animigan_v2_model_if_not_loaded() or GHIBLI_ANIMIGAN_V2_SESSION is None:
        raise HTTPException(status_code=503, detail="Ghibli-Style (AnimeGAN v2) Model is not available. Check server logs.")

    img_bgr = await read_image_from_upload(file)

    try:
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB) # H, W, C
        h_orig, w_orig = img_rgb.shape[:2]

        # Model's expected input size (Height, Width). Adjust if your model expects differently.
        target_model_input_height, target_model_input_width = (512, 512)
        
        # cv2.resize expects (Width, Height)
        img_resized = cv2.resize(img_rgb, (target_model_input_width, target_model_input_height), interpolation=cv2.INTER_AREA) # H, W, C
        
        # Normalize: H, W, C -> values between -1 and 1
        img_norm = img_resized.astype(np.float32) / 127.5 - 1.0
        
        # Add batch dimension: H, W, C -> 1, H, W, C (NHWC format)
        img_input_nhwc = img_norm[np.newaxis, ...]

        input_name = GHIBLI_ANIMIGAN_V2_SESSION.get_inputs()[0].name
        ort_inputs = {input_name: img_input_nhwc}
        ort_outs = GHIBLI_ANIMIGAN_V2_SESSION.run(None, ort_inputs)

        # Output is expected to be NHWC: (1, H, W, C)
        out_img_tensor_nhwc = ort_outs[0]
        
        # Remove batch dimension: 1, H, W, C -> H, W, C
        if out_img_tensor_nhwc.ndim == 4 and out_img_tensor_nhwc.shape[0] == 1:
            out_img_processed_hwc = out_img_tensor_nhwc[0]
        elif out_img_tensor_nhwc.ndim == 3: # If model directly outputs HWC
             out_img_processed_hwc = out_img_tensor_nhwc
        else:
            raise ValueError(f"ONNX model output has unexpected dimensions: {out_img_tensor_nhwc.shape}")

        # Denormalize: H, W, C -> values between 0 and 255
        out_img_denorm = ((out_img_processed_hwc + 1.0) * 127.5).clip(0, 255).astype(np.uint8)
        
        # Resize back to original image dimensions
        out_img_resized_original = cv2.resize(out_img_denorm, (w_orig, h_orig), interpolation=cv2.INTER_CUBIC)
        
        # Convert from RGB back to BGR for OpenCV encoding
        out_img_bgr_final = cv2.cvtColor(out_img_resized_original, cv2.COLOR_RGB2BGR)
        
        return encode_image_to_bytes(out_img_bgr_final)

    except Exception as e:
        print(f"Error during Ghibli-Style (AnimeGAN v2) effect processing: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error applying Ghibli-Style (AnimeGAN v2) effect: {str(e)}")