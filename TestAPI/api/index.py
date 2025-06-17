from flask import Flask, jsonify, request

app = Flask(__name__)

@app.route("/", methods=["GET"])
def hello():
    return jsonify({"message": "Hello from Flask on Vercel!"})

# Vercel will call this handler
def handler(event, context):
    from werkzeug.middleware.dispatcher import DispatcherMiddleware
    from werkzeug.wrappers import Request, Response

    def simple_app(environ, start_response):
        return Response("Not Found", status=404)(environ, start_response)

    app_full = DispatcherMiddleware(simple_app, {"/": app})
    return app_full(environ=event["environ"], start_response=event["start_response"])
