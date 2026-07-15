import os
from sqlalchemy.orm import Session
from app.models.paper import ResearchPaper
from app.models.email_log import EmailIngestionLog
from app.ml_engine.classifier import ml_classifier
from app.ml_engine.extractor import paper_extractor
from app.ml_engine.summarizer import summarizer
from app.schemas.email import SimulateEmailRequest

class EmailIngestionService:
    def split_multi_paper_email(self, body: str) -> list:
        if not body:
            return [""]
        import re
        # Find start indices of all "Title of the paper:" (including numbered, space-less, and asterisk variations)
        matches = list(re.finditer(r'(?i)(?:\b\d+[\.\)]\s*(?:\*\s*)*)?Title(?:\s+of\s+the\s+paper)?[\s*\:\-\*]+', body))
        if len(matches) <= 1:
            return [body]
            
        sections = []
        for i in range(len(matches)):
            start = matches[i].start()
            end = matches[i+1].start() if i + 1 < len(matches) else len(body)
            sections.append(body[start:end])
            
        return sections

    def process_simulated_email(self, db: Session, req: SimulateEmailRequest, pdf_path: str = None) -> EmailIngestionLog:
        """Processes an incoming simulated or real email, checking for multi-paper content and routing to the extraction pipeline."""
        if not pdf_path and req.body:
            sections = self.split_multi_paper_email(req.body)
            if len(sections) > 1:
                print(f"Email Ingestion: Detected {len(sections)} distinct papers in a single email. Processing each separately...", flush=True)
                last_log = None
                for idx, sec in enumerate(sections):
                    sec_subject = f"{req.subject} (Paper {idx+1})"
                    sec_req = SimulateEmailRequest(
                        sender=req.sender,
                        subject=sec_subject,
                        body=sec,
                        department_hint=req.department_hint
                    )
                    last_log = self._process_single_email(db, sec_req, pdf_path=None)
                return last_log

        return self._process_single_email(db, req, pdf_path)

    def _process_single_email(self, db: Session, req: SimulateEmailRequest, pdf_path: str = None) -> EmailIngestionLog:
        """Processes a single publication email through the ML classification and PDF extraction pipeline."""
        # 1. Classify email relevance using ML model
        classification_res = ml_classifier.classify_email_relevance(f"{req.subject} {req.body}")
        score = classification_res["confidence"]
        pred_class = classification_res["predicted_class"]
        is_research = classification_res["is_research"]

        log_entry = EmailIngestionLog(
            sender=req.sender,
            subject=req.subject,
            body_snippet=req.body[:300] if req.body else "",
            ml_classification_score=score,
            ml_predicted_class=pred_class,
            status="pending"
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)

        if not is_research:
            log_entry.status = "rejected_spam"
            log_entry.error_message = "ML Classifier determined this email is general chatter/spam, not a research publication."
            db.commit()
            return log_entry

        try:
            # 2. Extract paper metadata
            if pdf_path and os.path.exists(pdf_path):
                meta = paper_extractor.extract_from_pdf(pdf_path)
            else:
                # Parse metadata directly from email subject and body text
                meta = paper_extractor.parse_text_metadata(req.body, req.body[:2000])
                if req.department_hint and req.department_hint != "General":
                    meta["department"] = req.department_hint
                if req.subject and len(req.subject) > 5 and meta.get("title", "Untitled Research Publication") == "Untitled Research Publication":
                    meta["title"] = req.subject

            # Check for duplicates before creating a new entry
            existing_paper = None
            if meta.get("doi"):
                existing_paper = db.query(ResearchPaper).filter(ResearchPaper.doi == meta["doi"]).first()
            if not existing_paper and meta.get("title"):
                existing_paper = db.query(ResearchPaper).filter(ResearchPaper.title == meta["title"]).first()

            if existing_paper:
                log_entry.extracted_paper_id = existing_paper.id
                log_entry.status = "processed"
                log_entry.error_message = "Paper already exists in repository."
                db.commit()
                return log_entry

            # 3. Generate AI summary
            ai_sum = summarizer.summarize(meta["abstract"], max_sentences=3)
            meta["ai_summary"] = ai_sum

            # 4. Create ResearchPaper database entry
            paper = ResearchPaper(
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
                paper_url=meta.get("paper_url"),
                keywords_list=meta["keywords_list"],
                categories_list=meta["categories_list"],
                ml_confidence=meta["ml_confidence"],
                ml_predicted_dept=meta["ml_predicted_dept"],
                ai_summary=ai_sum,
                pdf_filename=os.path.basename(pdf_path) if pdf_path else None,
                pdf_url=f"/static/pdfs/{os.path.basename(pdf_path)}" if pdf_path else None,
                email_source_subject=req.subject,
                citation_count=1
            )
            db.add(paper)
            db.commit()
            db.refresh(paper)

            # Build citation graph links
            try:
                from app.services.citation_service import citation_service
                citation_service.build_citations_for_paper(db, paper.id, meta.get("references", []))
            except Exception as cit_err:
                print(f"Error building citations during email processing: {cit_err}")

            # Trigger immediate email alerts to department faculty
            try:
                from app.services.alert_service import alert_service
                alert_service.send_immediate_alert(db, paper)
            except Exception as alert_err:
                print(f"Error sending immediate alert during email processing: {alert_err}")

            # 5. Link paper to email log
            log_entry.extracted_paper_id = paper.id
            log_entry.status = "processed"
            db.commit()
            db.refresh(log_entry)
            return log_entry

        except Exception as e:
            log_entry.status = "error"
            log_entry.error_message = f"Error during extraction pipeline: {str(e)}"
            db.commit()
            db.refresh(log_entry)
            return log_entry

email_service = EmailIngestionService()
