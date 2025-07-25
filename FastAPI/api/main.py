from fastapi import FastAPI
from routes import image_routes

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Hello from FastAPI on Vercel!"}

app.include_router(image_routes.router, prefix="/api")
