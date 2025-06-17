from flask import Flask, jsonify, request

app = Flask(__name__)

@app.route("/", methods=["GET"])
def hello():
    return jsonify({"message": "Hello from Flask on Vercel!"})
