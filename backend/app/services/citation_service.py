import re
from typing import List
from sqlalchemy.orm import Session
from app.models.paper import ResearchPaper
from app.models.citation import PaperCitation

class CitationService:
    def parse_title_from_ref(self, ref_text: str) -> str:
        """Heuristic to extract paper title from raw reference text."""
        # Look for content in standard double quotes, single quotes, or smart quotes
        quotes_match = re.search(r'["\'“]([^"\'”]{15,})["\'”]', ref_text)
        if quotes_match:
            return quotes_match.group(1).strip()
        
        # Fallback: if no quotes, look for title after year or author
        # E.g., Vance et al., Title of Paper, Journal, 2026.
        parts = ref_text.split(',')
        if len(parts) > 1:
            for part in parts:
                p_strip = part.strip()
                if len(p_strip) > 20 and not any(x in p_strip.lower() for x in ['press', 'university', 'journal', 'vol.', 'pp.']):
                    return p_strip
        return ref_text

    def extract_doi_from_ref(self, ref_text: str) -> str:
        """Extracts DOI if present in the reference string."""
        doi_match = re.search(r'(10\.\d{4,9}/[-._;()/:A-Za-z0-9]+)', ref_text)
        return doi_match.group(1) if doi_match else None

    def build_citations_for_paper(self, db: Session, paper_id: int, raw_references: List[str]):
        """Parses references list for a newly indexed paper and builds PaperCitation records."""
        for ref in raw_references:
            ref_clean = ref.strip()
            if not ref_clean:
                continue

            doi = self.extract_doi_from_ref(ref_clean)
            title = self.parse_title_from_ref(ref_clean)

            cited_paper_id = None
            
            # 1. Search by DOI first
            if doi:
                matched = db.query(ResearchPaper).filter(ResearchPaper.doi == doi).first()
                if matched:
                    cited_paper_id = matched.id
            
            # 2. Search by Title substring
            if not cited_paper_id and len(title) > 20:
                # search for exact or substring match in db
                matched = db.query(ResearchPaper).filter(
                    (ResearchPaper.title.ilike(f"%{title}%")) |
                    (ResearchPaper.title.ilike(title))
                ).first()
                if matched:
                    cited_paper_id = matched.id

            # Create citation entry
            citation = PaperCitation(
                citing_paper_id=paper_id,
                cited_paper_id=cited_paper_id,
                raw_reference_text=ref_clean,
                extracted_title=title[:250] if title else None,
                doi=doi
            )
            db.add(citation)
            
            # Update citation count for the cited paper
            if cited_paper_id:
                db.query(ResearchPaper).filter(ResearchPaper.id == cited_paper_id).update({
                    "citation_count": ResearchPaper.citation_count + 1
                })
        
        db.commit()

citation_service = CitationService()
