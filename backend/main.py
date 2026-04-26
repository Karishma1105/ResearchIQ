from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import chat
import uvicorn

app = FastAPI(title="ResearchIQ API", description="AI-powered research assistant API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the exact frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "ResearchIQ API is running."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
