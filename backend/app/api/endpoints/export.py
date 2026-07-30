import os
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.paper import ResearchPaper
from app.services.export_service import export_service
from app.core.security import get_current_user

router = APIRouter()

@router.get("/excel")
def export_excel_report(
    department: Optional[str] = None,
    category: Optional[str] = None,
    year: Optional[int] = None,
    start_year: Optional[int] = None,
    end_year: Optional[int] = None,
    publication_type: Optional[str] = None,
    author: Optional[str] = None,
    quartile: Optional[str] = None,
    query: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    q = db.query(ResearchPaper)
    if department and department != "All":
        q = q.filter(ResearchPaper.department == department)
    if year:
        q = q.filter(ResearchPaper.publication_year == year)
    if start_year:
        q = q.filter(ResearchPaper.publication_year >= start_year)
    if end_year:
        q = q.filter(ResearchPaper.publication_year <= end_year)
    if publication_type and publication_type != "All":
        q = q.filter(ResearchPaper.publication_type == publication_type)
    if author and author.strip():
        q = q.filter(ResearchPaper.authors_raw.ilike(f"%{author.strip()}%"))
    if query and query.strip():
        search_pattern = f"%{query.strip()}%"
        q = q.filter(
            (ResearchPaper.title.ilike(search_pattern)) |
            (ResearchPaper.authors_raw.ilike(search_pattern)) |
            (ResearchPaper.abstract.ilike(search_pattern))
        )

    papers = q.order_by(ResearchPaper.id.desc()).all()
    if category and category != "All":
        papers = [p for p in papers if category in (p.categories_list or [])]
    if quartile and quartile != "All":
        papers = [p for p in papers if p.abstract and quartile.lower() in p.abstract.lower()]

    filepath = export_service.export_to_excel(papers)
    return FileResponse(
        filepath,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=os.path.basename(filepath)
    )

@router.get("/pdf")
def export_pdf_report(
    department: Optional[str] = None,
    category: Optional[str] = None,
    year: Optional[int] = None,
    start_year: Optional[int] = None,
    end_year: Optional[int] = None,
    publication_type: Optional[str] = None,
    author: Optional[str] = None,
    quartile: Optional[str] = None,
    query: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    q = db.query(ResearchPaper)
    if department and department != "All":
        q = q.filter(ResearchPaper.department == department)
    if year:
        q = q.filter(ResearchPaper.publication_year == year)
    if start_year:
        q = q.filter(ResearchPaper.publication_year >= start_year)
    if end_year:
        q = q.filter(ResearchPaper.publication_year <= end_year)
    if publication_type and publication_type != "All":
        q = q.filter(ResearchPaper.publication_type == publication_type)
    if author and author.strip():
        q = q.filter(ResearchPaper.authors_raw.ilike(f"%{author.strip()}%"))
    if query and query.strip():
        search_pattern = f"%{query.strip()}%"
        q = q.filter(
            (ResearchPaper.title.ilike(search_pattern)) |
            (ResearchPaper.authors_raw.ilike(search_pattern)) |
            (ResearchPaper.abstract.ilike(search_pattern))
        )

    papers = q.order_by(ResearchPaper.id.desc()).all()
    if category and category != "All":
        papers = [p for p in papers if category in (p.categories_list or [])]
    if quartile and quartile != "All":
        papers = [p for p in papers if p.abstract and quartile.lower() in p.abstract.lower()]

    filepath = export_service.export_to_pdf(papers)
    return FileResponse(
        filepath,
        media_type="application/pdf",
        filename=os.path.basename(filepath)
    )
