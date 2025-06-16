import requests

# Base URL of your FastAPI server
BASE_URL = "http://localhost:8000/api"

# Path to your test image
IMAGE_PATH = "FastAPI/image.png"  # Replace with your image file


def test_endpoint(endpoint_name, save_as):
    url = BASE_URL + "/" + endpoint_name 
    
    with open(IMAGE_PATH, "rb") as image_file:
        files = {"file": (IMAGE_PATH, image_file, "image/jpeg")}
        response = requests.post(url, files=files)
        
        if response.status_code == 200:
            with open(save_as, "wb") as out_file:
                out_file.write(response.content)
            print(f"{endpoint_name} result saved to {save_as}")
        else:
            print(f"Error {response.status_code} on {endpoint_name} endpoint:")
            print(response.text)

if __name__ == "__main__":
    test_endpoint("enlighten", "enhanced2.png")



# import onnxruntime as ort
# import cv2
# import numpy as np
# import os

# # --- Paths ---
# MODEL_PATH = 'FastAPI/Models/enlighten.onnx'
# IMAGE_PATH = 'FastAPI/image.png'       # Replace with your image
# OUTPUT_PATH = 'enhanced.png'
# DIVISOR = 16  # For padding to multiple of 16


# # ---- Check Model ----
# if not os.path.exists(MODEL_PATH):
#     raise RuntimeError(f"Model not found at: {MODEL_PATH}")

# # ---- Load Model ----
# try:
#     session = ort.InferenceSession(MODEL_PATH, providers=["CPUExecutionProvider"])
#     input_name = session.get_inputs()[0].name
#     output_name = session.get_outputs()[0].name
# except Exception as e:
#     raise RuntimeError(f"Failed to load ONNX model: {e}")

# # ---- Pad to multiple of DIVISOR ----
# def pad_to_multiple(img, divisor=16):
#     h, w = img.shape[:2]
#     pad_h = (divisor - (h % divisor)) % divisor
#     pad_w = (divisor - (w % divisor)) % divisor

#     top = pad_h // 2
#     bottom = pad_h - top
#     left = pad_w // 2
#     right = pad_w - left

#     padded = cv2.copyMakeBorder(img, top, bottom, left, right, cv2.BORDER_REFLECT_101)
#     return padded, (h, w)

# # ---- Preprocess ----
# def preprocess(img):
#     padded_img, orig_size = pad_to_multiple(img, DIVISOR)
#     rgb = cv2.cvtColor(padded_img, cv2.COLOR_BGR2RGB)
#     normalized = rgb.astype(np.float32) / 255.0
#     chw = normalized.transpose(2, 0, 1)[None, :]  # NCHW format
#     return chw, orig_size

# # ---- Postprocess ----
# def postprocess(output_tensor, orig_size):
#     output = output_tensor.squeeze(0).transpose(1, 2, 0)  # CHW -> HWC
#     output = np.clip(output, 0, 1)
#     output = (output * 255).astype(np.uint8)
#     output_bgr = cv2.cvtColor(output, cv2.COLOR_RGB2BGR)
#     h, w = orig_size
#     return output_bgr[:h, :w]  # Crop back to original size

# # ---- Main Processing ----
# def run_enlighten(image_path):
#     img = cv2.imread(image_path)
#     if img is None:
#         raise FileNotFoundError(f"Could not read image: {image_path}")

#     input_tensor, orig_size = preprocess(img)

#     try:
#         output_tensor = session.run([output_name], {input_name: input_tensor})[0]
#     except Exception as e:
#         raise RuntimeError(f"Inference failed: {e}")

#     final_image = postprocess(output_tensor, orig_size)
#     cv2.imwrite(OUTPUT_PATH, final_image)
#     print(f"Enhanced image saved to: {OUTPUT_PATH}")

# # ---- Run ----
# if __name__ == "__main__":
#     run_enlighten(IMAGE_PATH)
