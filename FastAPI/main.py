from fastapi import FastAPI
from routes import image_routes

app = FastAPI()

app.include_router(image_routes.router, prefix="/api")
