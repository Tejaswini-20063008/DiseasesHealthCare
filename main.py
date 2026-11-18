from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {"model_loaded": False, "status": "demo_mode"}

@app.post("/api/analyze")
async def analyze(file: UploadFile = File(...)):
    return {
        "status": "demo_mode",
        "message": "Backend connected, but model not loaded yet. Please add skin_model.pt"
    }