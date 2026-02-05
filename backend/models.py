from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str
class ChatResponse(BaseModel):
    result : str    
    
# new model for file upload 
class FileUploadRequest(BaseModel):
    filename: str
    data : str  # base64 encoded file data