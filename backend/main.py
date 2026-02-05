import base64
from datetime import datetime
from fastapi import FastAPI, Form, UploadFile, File
from fastapi.responses import JSONResponse, StreamingResponse
import uvicorn
from llm import Chat_Completion, process_excel_from_base64, set_uploaded_data, clear_uploaded_data
from fastapi.middleware.cors import CORSMiddleware
import time
import json 


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)


@app.post("/chat/stream")
async def chat_stream(message: str = Form(...)):
    """
    Chat with AI - accepts FormData with 'message' field
    """
    if not message.strip():
        return JSONResponse(
            status_code=400,
            content={"error": "Message is required"}
        )
    
    print(f"Received message: {message}")
    
    try:
        full_response = Chat_Completion(message)
        print(f"LLM response received")
        
        chunks = full_response.split("\n\n")
        
        async def event_generator():
            for chunk in chunks:
                if chunk.strip():
                    yield f"data: {chunk}\n\n"
                    time.sleep(0.5)
            yield "\n"
        
        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        )
        
    except Exception as e:
        print(f"Error in chat_stream: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Internal server error: {str(e)}"}
        )


@app.post('/upload')
async def upload_excel(file: UploadFile = File(...)):
    try:
        if not file.filename.endswith(('.xlsx', '.xls')):
            return JSONResponse(
                status_code=400,
                content={"error": "Only Excel files (.xlsx, .xls) allowed"}
            )
        
        content = await file.read()
        base64_content = base64.b64encode(content).decode('utf-8')
        processed_data = process_excel_from_base64(base64_content)
        
        if "error" in processed_data:
            return JSONResponse(
                status_code=400,
                content={"error": processed_data["error"]}
            )
        
        set_uploaded_data(processed_data)
        
        return JSONResponse(
            content={
                "success": True,
                "message": f"File uploaded: {file.filename}",
                "summary": {
                    "rows": processed_data.get("total_rows", 0),
                    "columns": processed_data.get("total_columns", 0),
                    "column_names": processed_data.get("column_names", [])
                }
            },
        )
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )
        
        
@app.post('/clear-data')
async def clear_data():
    """Clear uploaded data"""
    clear_uploaded_data()
    return {"success": True, "message": "Uploaded data cleared"}


@app.get('/data-status')
async def get_data_status():
    """Check if data is uploaded"""
    from llm import uploaded_data
    return {
        "has_data": uploaded_data is not None,
        "filename": uploaded_data.get("filename", None) if uploaded_data else None,
        "rows": uploaded_data.get("total_rows", 0) if uploaded_data else 0,
        "columns": uploaded_data.get("total_columns", 0) if uploaded_data else 0
    }

    

if __name__ == "__main__":
    uvicorn.run(port=8000, host="127.0.0.1", reload=True, app="main:app")