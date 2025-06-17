from flask import Flask, jsonify, request
import cv2
import numpy as np
import base64

app = Flask(__name__)

@app.route("/", methods=["GET"])
def hello():
    return jsonify({"message": "Hello from Flask on Vercel!"})

def image_to_base64(img):
    _, buffer = cv2.imencode('.jpg', img)
    img_base64 = base64.b64encode(buffer).decode('utf-8')
    return img_base64

@app.route("/grayscale", methods=["POST"])
def grayscale():
    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files['image']
    npimg = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    result_base64 = image_to_base64(gray)

    return jsonify({"image": result_base64})

@app.route("/canny2", methods=["POST"])
def canny2():
    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files['image']
    npimg = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

    edges = cv2.Canny(img, 100, 200)
    result_base64 = image_to_base64(edges)

    return jsonify({"image": result_base64})
