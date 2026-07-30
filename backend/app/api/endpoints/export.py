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
    query: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    q = db.query(ResearchPaper)
    if department and department != "All":
        q = q.filter(ResearchPaper.department == department)
    if year:
        q = q.filter(ResearchPaper.publication_year == year)
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
    query: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    q = db.query(ResearchPaper)
    if department and department != "All":
        q = q.filter(ResearchPaper.department == department)
    if year:
        q = q.filter(ResearchPaper.publication_year == year)
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

    filepath = export_service.export_to_pdf(papers)
    return FileResponse(
        filepath,
        media_type="application/pdf",
        filename=os.path.basename(filepath)
    )
