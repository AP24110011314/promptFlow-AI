import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.paper import ResearchPaper
from app.models.user import User
from app.schemas.paper import ResearchPaperResponse, ResearchPaperCreate
from app.core.security import get_current_user, get_current_admin_user
from app.ml_engine.extractor import paper_extractor
from app.ml_engine.summarizer import summarizer
from app.config import settings

router = APIRouter()

@router.get("", response_model=List[ResearchPaperResponse])
def list_papers(
    response: Response,
    query: Optional[str] = None,
    department: Optional[str] = None,
    author: Optional[str] = None,
    category: Optional[str] = None,
    year: Optional[int] = None,
    publication_type: Optional[str] = None,
    start_year: Optional[int] = None,
    end_year: Optional[int] = None,
    limit: Optional[int] = None,
    offset: Optional[int] = None,
    db: Session = Depends(get_db)
):
    q = db.query(ResearchPaper)

    if query:
        search_term = f"%{query.lower()}%"
        q = q.filter(
            (ResearchPaper.title.ilike(search_term)) |
            (ResearchPaper.abstract.ilike(search_term)) |
            (ResearchPaper.authors_raw.ilike(search_term))
        )
    if department and department != "All":
        q = q.filter(ResearchPaper.department == department)
    if author:
        q = q.filter(ResearchPaper.authors_raw.ilike(f"%{author}%"))
    if year:
        q = q.filter(ResearchPaper.publication_year == year)
    if publication_type and publication_type != "All":
        q = q.filter(ResearchPaper.publication_type.ilike(publication_type))
    if start_year:
        q = q.filter(ResearchPaper.publication_year >= start_year)
    if end_year:
        q = q.filter(ResearchPaper.publication_year <= end_year)

    results = q.order_by(ResearchPaper.id.desc()).all()

    # Filter by category tag in python if needed (since it's stored in JSON list)
    if category and category != "All":
        results = [p for p in results if category in (p.categories_list or [])]

    total_count = len(results)
    response.headers["X-Total-Count"] = str(total_count)
    response.headers["Access-Control-Expose-Headers"] = "X-Total-Count"

    if offset is not None:
        results = results[offset:]
    if limit is not None:
        results = results[:limit]

    return results

@router.get("/{paper_id}", response_model=ResearchPaperResponse)
def get_paper(paper_id: int, db: Session = Depends(get_db)):
    paper = db.query(ResearchPaper).filter(ResearchPaper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Research paper not found")
    return paper

@router.post("/upload", response_model=ResearchPaperResponse)
def upload_and_parse_pdf(
    file: UploadFile = File(...),
    department_hint: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files can be uploaded and parsed")

    file_path = os.path.join(settings.STORAGE_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Run ML extraction & parsing
    meta = paper_extractor.extract_from_pdf(file_path)
    if department_hint and department_hint != "General":
        meta["department"] = department_hint

    ai_sum = summarizer.summarize(meta["abstract"], max_sentences=3)

    new_paper = ResearchPaper(
        title=meta["title"],
        abstract=meta["abstract"],
        authors_raw=meta["authors_raw"],
        authors_list=meta["authors_list"],
        department=meta["department"],
        journal_or_conference=meta["journal_or_conference"],
        publication_type=meta.get("publication_type", "Journal"),
        publication_date=meta["publication_date"],
        publication_year=meta["publication_year"],
        doi=meta["doi"],
        keywords_list=meta["keywords_list"],
        categories_list=meta["categories_list"],
        ml_confidence=meta["ml_confidence"],
        ml_predicted_dept=meta["ml_predicted_dept"],
        ai_summary=ai_sum,
        pdf_filename=file.filename,
        pdf_url=f"/static/pdfs/{file.filename}",
        email_source_subject="Direct Manual Upload by Faculty",
        citation_count=1
    )
    db.add(new_paper)
    db.commit()
    db.refresh(new_paper)

    # Build citation graph links
    try:
        from app.services.citation_service import citation_service
        citation_service.build_citations_for_paper(db, new_paper.id, meta.get("references", []))
    except Exception as cit_err:
        print(f"Error building citations during manual upload: {cit_err}")

    # Trigger immediate email alerts to department faculty
    try:
        from app.services.alert_service import alert_service
        alert_service.send_immediate_alert(db, new_paper)
    except Exception as alert_err:
        print(f"Error sending immediate alert during manual upload: {alert_err}")

    return new_paper

@router.delete("/{paper_id}")
def delete_paper(paper_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    paper = db.query(ResearchPaper).filter(ResearchPaper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Research paper not found")
    db.delete(paper)
    db.commit()
    return {"message": "Paper deleted successfully"}
