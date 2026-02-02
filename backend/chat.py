# streaming_chat.py
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from llm import Chat_Completion
import time

router = APIRouter()

@router.post("/chat/stream")
async def chat_stream(request: dict):

    full_response = Chat_Completion(request["message"])
    text = full_response.strip('"')  
    steps = [
    s.strip()
    for s in text.replace("\\n", "\n").split("\n\n")
    if s.strip()
]

    async def event_generator():
        for step in steps:
          yield f"data: {step}\n\n"
          time.sleep(0.6)  

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )
