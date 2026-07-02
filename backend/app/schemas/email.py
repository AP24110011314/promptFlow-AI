from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SimulateEmailRequest(BaseModel):
    sender: str
    subject: str
    body: str
    department_hint: Optional[str] = "Computer Science"

class EmailLogResponse(BaseModel):
    id: int
    sender: str
    subject: str
    body_snippet: Optional[str] = None
    status: str
    ml_classification_score: float
    ml_predicted_class: str
    extracted_paper_id: Optional[int] = None
    error_message: Optional[str] = None
    received_at: Optional[datetime] = None

    class Config:
        from_attributes = True
