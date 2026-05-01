from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
from app.api import router as api_router
from app.websocket.manager import ConnectionManager
import os
import time

app = FastAPI(title="數位店長 API", version="0.1.0")

# 添加請求日誌中間件
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    print(f"[REQUEST] {request.method} {request.url.path}")
    response = await call_next(request)
    process_time = time.time() - start_time
    print(f"[RESPONSE] {request.method} {request.url.path} - Status: {response.status_code} - Time: {process_time:.2f}s")
    return response

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Serve static files from frontend/public directory
static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "frontend", "public")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

# API Routes
app.include_router(api_router, prefix="/api/v1")

# Chats API
from app.api.chats import router as chats_router
app.include_router(chats_router, prefix="/api/v1", tags=["chats"])

manager = ConnectionManager()

@app.get("/")
async def root():
    return {"message": "Digital Store Manager AI API is running"}

# Webhook endpoint with user_id
from app.api.line import router as webhook_router
app.include_router(webhook_router, prefix="/api/webhook", tags=["webhook"])

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle chat logic here
            await manager.broadcast(f"Client #{client_id} says: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
