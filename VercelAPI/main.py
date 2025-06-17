from fastapi import FastAPI
from routes import image_routes

app = FastAPI()

# Include your image routes under /api
app.include_router(image_routes.router, prefix="/api")

# Root endpoint for /
@app.get("/")
async def root():
    return {"message": "Hello from FastAPI on Vercel!"}
