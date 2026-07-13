from sqlalchemy import Column, Integer, String, Text, Float, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class ResearchPaper(Base):
    __tablename__ = "research_papers"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    abstract = Column(Text, nullable=True)
    authors_raw = Column(String, nullable=True)
    authors_list = Column(JSON, default=list)  # list of author names
    department = Column(String, index=True, nullable=True)
    journal_or_conference = Column(String, index=True, nullable=True)
    publication_type = Column(String, default="Journal", index=True)
    publication_date = Column(String, nullable=True)
    publication_year = Column(Integer, index=True, nullable=True)
    doi = Column(String, nullable=True)
    keywords_list = Column(JSON, default=list)  # list of keyword strings
    categories_list = Column(JSON, default=list)  # list of category names assigned
    pdf_filename = Column(String, nullable=True)
    pdf_url = Column(String, nullable=True)
    paper_url = Column(String, nullable=True)
    
    # ML & AI Metadata
    ml_confidence = Column(Float, default=0.0)
    ml_predicted_dept = Column(String, nullable=True)
    ai_summary = Column(Text, nullable=True)
    
    # Tracking
    citation_count = Column(Integer, default=0)
    email_source_subject = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    citations_made = relationship("PaperCitation", foreign_keys="[PaperCitation.citing_paper_id]", back_populates="citing_paper", cascade="all, delete-orphan")
    citations_received = relationship("PaperCitation", foreign_keys="[PaperCitation.cited_paper_id]", back_populates="cited_paper")
