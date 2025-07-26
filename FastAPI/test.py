import requests

# Base URL of your FastAPI server
# BASE_URL = "http://localhost:8000/api"
BASE_URL = "http://enhance-ai-gamma.vercel.app/api"


# Path to your testimage

IMAGE_PATH = "image.png"

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
    test_endpoint("thread", "demo/Thread.png")




#   const toolsFilter = [
#     { name: 'Edge Sketch', icon: 'image-search-outline', lib: MCIcon, endpoint_filter_type: 'canny' },
#     { name: 'ASCII Art', icon: 'code-tags', lib: MCIcon, endpoint_filter_type: 'ascii_art' },
#     { name: 'Comic', icon: 'emoticon-outline', lib: MCIcon, endpoint_filter_type: 'comic' },
#     { name: 'Sketch', icon: 'pencil-outline', lib: MCIcon, endpoint_filter_type: 'sketch' },
#     { name: 'Color Sketch', icon: 'brush-variant', lib: MCIcon, endpoint_filter_type: 'color_sketch' },
#     { name: 'Cartoon', icon: 'emoticon-happy-outline', lib: MCIcon, endpoint_filter_type: 'cartoon' },
#     { name: 'Water Color', icon: 'water-outline', lib: MCIcon, endpoint_filter_type: 'water_color' },
#     { name: 'Heat Map', icon: 'thermometer', lib: MCIcon, endpoint_filter_type: 'heat' },
#     { name: 'X-Ray', icon: 'ray-start-end', lib: MCIcon, endpoint_filter_type: 'xray' },
#     { name: 'Invert Colors', icon: 'invert-colors', lib: MCIcon, endpoint_filter_type: 'invert' },
#     { name: 'Frost', icon: 'snowflake', lib: MCIcon, endpoint_filter_type: 'frost' },
#     { name: 'Grayscale', icon: 'contrast-box', lib: MCIcon, endpoint_filter_type: 'grayscale' },
#     { name: 'Pixelate', icon: 'grid', lib: MCIcon, endpoint_filter_type: 'pixelate' },
#     { name: 'Oil Paint', icon: 'palette-outline', lib: MCIcon, endpoint_filter_type: 'oil_paint' },

#     { name: 'Kaleidoscop', icon: 'shape-polygon-plus', lib: MCIcon, endpoint_filter_type: 'kalaidoscope' },
#   ];

#   const toolsEnhance = [
#     { name: 'Upscale', icon: 'auto-fix', lib: MCIcon, endpoint_filter_type: 'auto_enhance' },
#     { name: 'Enhance', icon: 'image-auto-adjust', lib: MCIcon, endpoint_filter_type: 'sharpen' },
#     { name: 'Reduce Noise', icon: 'water-off-outline', lib: MCIcon, endpoint_filter_type: 'denoise' },
#     { name: 'Auto Brightness', icon: 'brightness-auto', lib: MCIcon, endpoint_filter_type: 'auto_brightness' },
#   ];