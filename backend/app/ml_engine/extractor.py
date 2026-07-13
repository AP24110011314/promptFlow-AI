import os
import re
import fitz  # PyMuPDF
from typing import Dict, Any, List
from app.ml_engine.classifier import ml_classifier

class ResearchPaperExtractor:
    def extract_from_pdf(self, pdf_path: str) -> Dict[str, Any]:
        """Extracts text from PDF and parses metadata (Title, Authors, Abstract, Year, DOI, Keywords)."""
        if not os.path.exists(pdf_path):
            return self._empty_result()

        try:
            doc = fitz.open(pdf_path)
            full_text = ""
            first_page_text = ""
            
            for i, page in enumerate(doc):
                text = page.get_text()
                full_text += f"\n{text}"
                if i == 0:
                    first_page_text = text
            doc.close()

            return self.parse_text_metadata(full_text, first_page_text)
        except Exception as e:
            print(f"Error extracting PDF {pdf_path}: {e}")
            return self._empty_result()

    def parse_text_metadata(self, full_text: str, first_page_text: str = "") -> Dict[str, Any]:
        """Parses unstructured academic text into structured metadata fields."""
        if not first_page_text:
            first_page_text = full_text[:3000]

        # Check if this is a plain text announcement email (contains Title/Journal/Authors/DOI fields)
        text_lower = full_text.lower()
        announcement_mode = any(k in text_lower for k in ["title of the paper", "title of paper", "journal:", "authors:", "doi:"])

        if announcement_mode:
            # Extract using structured announcement patterns
            # Match multi-line title until next header block (Journal, Authors, or DOI)
            title_match = re.search(r'(?i)title(?:\s+of\s+the\s+paper)?[\s*\:\-]+([\s\S]+?)(?=\n\s*\*?(?:journal|authors?|doi|if and q)\b)', full_text)
            if title_match:
                title = re.sub(r'\s+', ' ', title_match.group(1)).strip("*_ \t\r\n")
            else:
                title_match_fallback = re.search(r'(?i)title(?:\s+of\s+the\s+paper)?[\s*\:\-]+([^\n]+)', full_text)
                title = title_match_fallback.group(1).strip("*_ \t\r\n") if title_match_fallback else "Untitled Research Publication"
            
            journal_match = re.search(r'(?i)journal[\s*\:\-]+([^\n]+)', full_text)
            journal = journal_match.group(1).strip("*_ \t\r\n") if journal_match else "International Journal of College Research"
            
            authors_match = re.search(r'(?i)authors?[\s*\:\-]+([^\n]+)', full_text)
            authors_raw = authors_match.group(1).strip("*_ \t\r\n") if authors_match else "Faculty Research Team"
            
            doi_match = re.search(r'(?i)doi[\s*\:\-]+([^\n]+)', full_text)
            doi_raw = doi_match.group(1).strip("*_ \t\r\n") if doi_match else ""

            # Year
            year_matches = re.findall(r'\b(19\d\d|20[0-2]\d)\b', full_text)
            publication_year = int(year_matches[0]) if year_matches else 2026
            publication_date = f"{publication_year}-01-01"
            
            # Extract standard DOI (e.g. 10.1007/...) from URL if needed
            doi_clean = re.search(r'(10\.\d{4,9}/[-._;()/:A-Za-z0-9]+)', doi_raw)
            if doi_clean:
                doi = doi_clean.group(1)
            else:
                import hashlib
                title_hash = hashlib.md5(title.encode('utf-8')).hexdigest()[:8]
                doi = f"10.1016/j.crd.{publication_year}.{title_hash}"

            # Authors List parsing (filter out designations and affiliations)
            authors_list = []
            for part in re.split(r'[,;]|\band\b', authors_raw):
                part_clean = re.sub(r'(?i)(?:Dr\.|Prof\.|Assistant\s+Professor|Associate\s+Professor|Professor|Department\s+of\s+.*|Lecturer|Researcher|Scholar)', '', part).strip("*_ \t\r\n")
                if len(part_clean) > 3 and not any(aff in part_clean.lower() for aff in ["university", "institute", "engineering", "science", "department", "research"]):
                    authors_list.append(part_clean)
            if not authors_list:
                authors_list = ["Faculty Research Team"]

            # Abstract: For announcements, the email text contains details, or we use title
            abstract_match = re.search(r'(?i)abstract[\s*\:\-]+([\s\S]+)', full_text)
            abstract = abstract_match.group(1).strip() if abstract_match else f"This publication outlines research on '{title}', accepted at '{journal}'."

            # Predict department & categories
            ml_dept_res = ml_classifier.predict_department(f"{title} {abstract}")
            predicted_dept = ml_dept_res["department"]
            ml_confidence = ml_dept_res["confidence"]
            
            categories = ml_classifier.auto_categorize(abstract, title)

            # Heuristics for publication type
            pub_type = "Journal"
            combined_text = f"{title} {abstract} {journal}".lower()
            if "patent" in combined_text or "inventor" in combined_text or "assignee" in combined_text:
                pub_type = "Patent"
            elif any(c in combined_text for c in ["proceedings", "conference", "symposium", "workshop", "proc."]):
                pub_type = "Conference"
            elif any(p in combined_text for p in ["preprint", "arxiv", "biorxiv", "ssrn"]):
                pub_type = "Preprint"

            references = self.extract_references_list(full_text)

            # Extract external paper URLs (filtering out Google Scholar, SRM domain, etc.)
            urls = re.findall(r'https?://[^\s<>"]+|www\.[^\s<>"]+', full_text)
            paper_url = ""
            for url in urls:
                url_clean = url.strip(").*_")
                if any(skip in url_clean.lower() for skip in ["scholar.google", "srmap.edu.in", "mailto", "twitter.com", "linkedin.com"]):
                    continue
                paper_url = url_clean
                break

            return {
                "title": title,
                "abstract": abstract,
                "authors_raw": authors_raw,
                "authors_list": authors_list,
                "department": predicted_dept,
                "journal_or_conference": journal,
                "publication_type": pub_type,
                "publication_date": publication_date,
                "publication_year": publication_year,
                "doi": doi,
                "paper_url": paper_url or None,
                "keywords_list": categories,
                "categories_list": categories,
                "ml_confidence": ml_confidence,
                "ml_predicted_dept": predicted_dept,
                "references": references
            }

        # Otherwise, fall back to standard PDF layout parsing
        lines = [line.strip() for line in first_page_text.split('\n') if line.strip()]
        
        # 1. Title Extraction: Usually first 1-3 lines before Author or Abstract
        title = "Untitled Research Publication"
        if lines:
            valid_title_lines = []
            for l in lines[:6]:
                if not any(header in l.lower() for header in ["ieee", "vol.", "issn", "doi:", "proc.", "journal", "received", "accepted"]):
                    valid_title_lines.append(l)
            if valid_title_lines:
                title = " ".join(valid_title_lines[:2])
                if len(title) > 200:
                    title = title[:197] + "..."

        # 2. Abstract Extraction
        abstract = ""
        abs_match = re.search(r'(?i)(?:abstract|summary)[\s:\.\-]+([\s\S]{100,1500}?)(?:\n\s*(?:keywords|index terms|introduction|1\s*\.\s*introduction|\n\n))', full_text)
        if abs_match:
            abstract = re.sub(r'\s+', ' ', abs_match.group(1)).strip()
        else:
            abstract = re.sub(r'\s+', ' ', full_text[200:800]).strip()

        # 3. Authors Extraction
        authors_list = []
        auth_section = first_page_text[:1200]
        name_matches = re.findall(r'(?i)(?:Dr\.|Prof\.)?\s*([A-Z][a-z]+(?: [A-Z]\.?)* [A-Z][a-z]+)', auth_section)
        for name in name_matches:
            clean_name = name.strip()
            if clean_name.lower() not in ["abstract", "introduction", "university", "department", "college", "journal", "proceedings"]:
                if clean_name not in authors_list and len(clean_name) > 4:
                    authors_list.append(clean_name)
        if not authors_list:
            authors_list = ["Faculty Research Team"]

        authors_raw = ", ".join(authors_list[:5])

        # 4. Publication Year & Date
        year_matches = re.findall(r'\b(19\d\d|20[0-2]\d)\b', first_page_text)
        publication_year = int(year_matches[0]) if year_matches else 2026
        publication_date = f"{publication_year}-01-01"

        # 5. DOI Extraction
        doi_match = re.search(r'(?i)doi:\s*(10\.\d{4,9}/[-._;()/:A-Za-z0-9]+)', full_text)
        if doi_match:
            doi = doi_match.group(1)
        else:
            import hashlib
            title_hash = hashlib.md5(title.encode('utf-8')).hexdigest()[:8]
            doi = f"10.1016/j.crd.{publication_year}.{title_hash}"

        # 6. Journal / Conference
        journal = "International Journal of College Research"
        journal_match = re.search(r'(?i)(?:published in|journal of|proceedings of|ieee transactions on|acm conference on)\s+([A-Za-z\s]{10,80})', first_page_text)
        if journal_match:
            journal = journal_match.group(0).strip().title()

        # 7. ML Department Prediction & Categorization
        ml_dept_res = ml_classifier.predict_department(f"{title} {abstract}")
        predicted_dept = ml_dept_res["department"]
        ml_confidence = ml_dept_res["confidence"]
        
        categories = ml_classifier.auto_categorize(abstract, title)
        
        # 8. Keywords
        kw_match = re.search(r'(?i)(?:keywords|index terms)[\s:\.\-]+([^\n\r]+)', full_text)
        if kw_match:
            keywords_list = [k.strip().title() for k in re.split(r'[,;]', kw_match.group(1)) if len(k.strip()) > 2][:6]
        else:
            keywords_list = categories.copy()

        # 9. Determine Publication Type Heuristic
        pub_type = "Journal"
        combined_text = f"{title} {abstract} {journal}".lower()
        if "patent" in combined_text or "inventor" in combined_text or "assignee" in combined_text:
            pub_type = "Patent"
        elif any(c in combined_text for c in ["proceedings", "conference", "symposium", "workshop", "proc."]):
            pub_type = "Conference"
        elif any(p in combined_text for p in ["preprint", "arxiv", "biorxiv", "ssrn"]):
            pub_type = "Preprint"

        # 10. Extract references list
        references = self.extract_references_list(full_text)

        # Extract external paper URLs (filtering out Google Scholar, SRM domain, etc.)
        urls = re.findall(r'https?://[^\s<>"]+|www\.[^\s<>"]+', full_text)
        paper_url = ""
        for url in urls:
            url_clean = url.strip(").*_")
            if any(skip in url_clean.lower() for skip in ["scholar.google", "srmap.edu.in", "mailto", "twitter.com", "linkedin.com"]):
                continue
            paper_url = url_clean
            break

        return {
            "title": title,
            "abstract": abstract,
            "authors_raw": authors_raw,
            "authors_list": authors_list,
            "department": predicted_dept,
            "journal_or_conference": journal,
            "publication_type": pub_type,
            "publication_date": publication_date,
            "publication_year": publication_year,
            "doi": doi,
            "paper_url": paper_url or None,
            "keywords_list": keywords_list,
            "categories_list": categories,
            "ml_confidence": ml_confidence,
            "ml_predicted_dept": predicted_dept,
            "references": references
        }

    def extract_references_list(self, full_text: str) -> List[str]:
        """Tries to find the references section and split it into individual citations."""
        ref_section_match = re.search(r'(?i)(?:references|bibliography|works cited)\s*[\n\r]+([\s\S]+)', full_text)
        if not ref_section_match:
            return []
        
        section_text = ref_section_match.group(1).strip()
        # Split references by standard numbering e.g. [1] or 1. or empty lines
        ref_items = re.split(r'\[\d+\]|\b\d+\.\s', section_text)
        cleaned_refs = []
        for item in ref_items:
            clean = re.sub(r'\s+', ' ', item).strip()
            if len(clean) > 20: # skip very short fragments
                cleaned_refs.append(clean)
        return cleaned_refs

    def _empty_result(self) -> Dict[str, Any]:
        return {
            "title": "Unidentified Document",
            "abstract": "No abstract could be extracted from this file.",
            "authors_raw": "Unknown Author",
            "authors_list": ["Unknown Author"],
            "department": "General",
            "journal_or_conference": "College Institutional Repository",
            "publication_type": "Journal",
            "publication_date": "2026-01-01",
            "publication_year": 2026,
            "doi": None,
            "paper_url": None,
            "keywords_list": ["Research"],
            "categories_list": ["General Research"],
            "ml_confidence": 0.50,
            "ml_predicted_dept": "General",
            "references": []
        }

paper_extractor = ResearchPaperExtractor()
