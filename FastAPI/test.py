import requests

# Base URL of your FastAPI server
BASE_URL = "http://localhost:8000/api"

# Path to your testimage
IMAGE_PATH = "a.png"  # Replace with your image file


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
    test_endpoint("ascii_art", "c.png")


