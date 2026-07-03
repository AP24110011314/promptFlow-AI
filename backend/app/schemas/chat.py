from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.schemas.paper import ResearchPaperResponse

class ChatRequest(BaseModel):
    message: str

class ChatFilters(BaseModel):
    title_keywords: Optional[List[str]] = []
    authors: Optional[List[str]] = []
    departments: Optional[List[str]] = []
    years: Optional[List[int]] = []
    categories: Optional[List[str]] = []
    general_query: Optional[str] = ""

class ChatResponse(BaseModel):
    is_academic_query: bool
    rejection_reason: Optional[str] = ""
    filters: Optional[ChatFilters] = None
    papers: Optional[List[ResearchPaperResponse]] = []
    response_text: str
