from fastapi import FastAPI
from routes import image_routes

app = FastAPI()

# Root endpoint
@app.get("/")
def root():
    return {"message": "Hello from FastAPI on Vercel!"}

# Include API routes
app.include_router(image_routes.router, prefix="/api")
