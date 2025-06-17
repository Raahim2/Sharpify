from fastapi import FastAPI
from fastapi.responses import JSONResponse
from mangum import Mangum

app = FastAPI()

@app.get("/")
async def read_root():
    return {"message": "Hello from FastAPI on Vercel!"}

# Wrap the app in Mangum for AWS Lambda compatibility
handler = Mangum(app)
