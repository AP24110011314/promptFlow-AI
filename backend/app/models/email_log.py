from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class EmailIngestionLog(Base):
    __tablename__ = "email_logs"

    id = Column(Integer, primary_key=True, index=True)
    sender = Column(String, index=True, nullable=False)
    subject = Column(String, nullable=False)
    body_snippet = Column(Text, nullable=True)
    status = Column(String, default="processed")  # "processed", "rejected_spam", "error", "pending"
    ml_classification_score = Column(Float, default=0.0)
    ml_predicted_class = Column(String, default="research_paper")  # "research_paper" vs "general_email"
    extracted_paper_id = Column(Integer, ForeignKey("research_papers.id", ondelete="SET NULL"), nullable=True)
    error_message = Column(Text, nullable=True)
    received_at = Column(DateTime(timezone=True), server_default=func.now())
