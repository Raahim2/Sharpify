import cv2
import numpy as np
from fastapi import UploadFile
from services.utils import read_image_from_upload, encode_image_to_bytes

ASCII_CHARS = "@%#*+=-:. "

def image_to_ascii_image(img, num_cols=120, bg_color=(255, 255, 255), font_color=(0, 0, 0)):
    if img is None:
        return np.full((100, 100, 3), bg_color, dtype=np.uint8)

    original_height, original_width = img.shape[:2]

    if original_height == 0 or original_width == 0:
        return np.full((max(1, original_height), max(1, original_width), 3), bg_color, dtype=np.uint8)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.4 
    thickness = 1

    try:
        (char_cell_w, char_cell_h), baseline = cv2.getTextSize("@", font, font_scale, thickness)
    except cv2.error: 
        (char_cell_w, char_cell_h), baseline = cv2.getTextSize("A", font, font_scale, thickness)

    if char_cell_w == 0: char_cell_w = int(font_scale * 15) or 1
    if char_cell_h == 0: char_cell_h = int(font_scale * 15) or 1
    if baseline == 0 and char_cell_h > 0 : baseline = int(char_cell_h * 0.2) 

    glyph_aspect_ratio = char_cell_h / char_cell_w if char_cell_w > 0 else 1.0

    num_rows_for_grid = int((original_height * num_cols * glyph_aspect_ratio) / original_width) if original_width > 0 else int(original_height * glyph_aspect_ratio)
    num_rows_for_grid = max(1, num_rows_for_grid)

    resized_gray = cv2.resize(gray, (num_cols, num_rows_for_grid), interpolation=cv2.INTER_LINEAR)

    if not ASCII_CHARS:
        effective_ascii_chars = [" "]
    else:
        effective_ascii_chars = list(ASCII_CHARS)
    
    num_ascii_chars = len(effective_ascii_chars)
    
    # Using the exact scaling method from the original snippet for character mapping
    # scale = 256 // num_ascii_chars
    # This can be 0 if num_ascii_chars > 256. For the given ASCII_CHARS, it's 256 // 10 = 25.
    char_map_scale = 256 // num_ascii_chars if num_ascii_chars > 0 else 255 
    if char_map_scale == 0: # Avoid division by zero if num_ascii_chars is very large (e.g. > 256)
        char_map_scale = 1 


    ascii_lines = []
    for r in range(num_rows_for_grid):
        line_chars = []
        for c in range(num_cols):
            pixel_value = resized_gray[r, c]
            char_index = min(pixel_value // char_map_scale, num_ascii_chars - 1)
            line_chars.append(effective_ascii_chars[char_index])
        ascii_lines.append("".join(line_chars))
    
    padding = 5 
    intermediate_img_width = char_cell_w * num_cols + 2 * padding
    intermediate_img_height = char_cell_h * num_rows_for_grid + 2 * padding
    
    intermediate_img_width = max(1, int(intermediate_img_width))
    intermediate_img_height = max(1, int(intermediate_img_height))

    ascii_intermediate_img = np.full((intermediate_img_height, intermediate_img_width, 3), bg_color, dtype=np.uint8)

    for i, line_text in enumerate(ascii_lines):
        y_baseline = padding + (char_cell_h - baseline) + (i * char_cell_h)
        current_x = padding
        for char_to_draw in line_text:
            cv2.putText(ascii_intermediate_img, char_to_draw, 
                        (int(current_x), int(y_baseline)), 
                        font, font_scale, font_color, thickness, lineType=cv2.LINE_AA)
            current_x += char_cell_w 

    if original_width > 0 and original_height > 0:
        if intermediate_img_width * intermediate_img_height > original_width * original_height and intermediate_img_width > 0 and intermediate_img_height > 0 :
            interpolation_method = cv2.INTER_AREA
        else: 
            interpolation_method = cv2.INTER_CUBIC 
        final_ascii_img = cv2.resize(ascii_intermediate_img, (original_width, original_height), interpolation=interpolation_method)
    else:
        final_ascii_img = ascii_intermediate_img 

    return final_ascii_img

async def process(file: UploadFile): # Minimal change to this part as requested
    img = await read_image_from_upload(file) # Assuming this function exists
    ascii_img = image_to_ascii_image(img)
    return encode_image_to_bytes(ascii_img) # Assuming this function exists