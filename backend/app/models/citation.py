from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class PaperCitation(Base):
    __tablename__ = "paper_citations"

    id = Column(Integer, primary_key=True, index=True)
    citing_paper_id = Column(Integer, ForeignKey("research_papers.id", ondelete="CASCADE"), nullable=False)
    cited_paper_id = Column(Integer, ForeignKey("research_papers.id", ondelete="SET NULL"), nullable=True)
    raw_reference_text = Column(Text, nullable=False)
    extracted_title = Column(String, nullable=True)
    doi = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    citing_paper = relationship("ResearchPaper", foreign_keys=[citing_paper_id], back_populates="citations_made")
    cited_paper = relationship("ResearchPaper", foreign_keys=[cited_paper_id], back_populates="citations_received")
