from fastapi import FastAPI
import uvicorn
from llm import Chat_Completion
from models import ChatRequest, ChatResponse
from fastapi.middleware.cors import CORSMiddleware
from chat import router as chat_router
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(chat_router)

@app.post('/chat', response_model=ChatResponse)
async def ask(request : ChatRequest):
    result = Chat_Completion(request.message)
    return {"result": result}
    

if __name__ == "__main__":
    uvicorn.run(port=8000, host="127.0.0.1", reload=True, app="main:app")