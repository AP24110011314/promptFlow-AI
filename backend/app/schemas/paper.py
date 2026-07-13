from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

class ResearchPaperBase(BaseModel):
    title: str
    abstract: Optional[str] = None
    authors_raw: Optional[str] = None
    authors_list: Optional[List[str]] = []
    department: Optional[str] = "General"
    journal_or_conference: Optional[str] = None
    publication_type: Optional[str] = "Journal"
    publication_date: Optional[str] = None
    publication_year: Optional[int] = None
    doi: Optional[str] = None
    keywords_list: Optional[List[str]] = []
    categories_list: Optional[List[str]] = []
    ml_confidence: Optional[float] = 0.0
    ml_predicted_dept: Optional[str] = None
    ai_summary: Optional[str] = None
    citation_count: Optional[int] = 0
    paper_url: Optional[str] = None

class ResearchPaperCreate(ResearchPaperBase):
    pdf_filename: Optional[str] = None
    pdf_url: Optional[str] = None
    email_source_subject: Optional[str] = None

class ResearchPaperUpdate(BaseModel):
    title: Optional[str] = None
    abstract: Optional[str] = None
    authors_raw: Optional[str] = None
    department: Optional[str] = None
    journal_or_conference: Optional[str] = None
    publication_type: Optional[str] = None
    doi: Optional[str] = None
    paper_url: Optional[str] = None

class ResearchPaperResponse(ResearchPaperBase):
    id: int
    pdf_filename: Optional[str] = None
    pdf_url: Optional[str] = None
    email_source_subject: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PaperSearchFilter(BaseModel):
    query: Optional[str] = None
    department: Optional[str] = None
    author: Optional[str] = None
    category: Optional[str] = None
    year: Optional[int] = None
