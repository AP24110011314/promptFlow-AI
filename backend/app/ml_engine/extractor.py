import os
import re
import fitz  # PyMuPDF
from typing import Dict, Any, List
from app.ml_engine.classifier import ml_classifier

def clean_single_author_name(name_str: str) -> str:
    """Cleans a single author name string by removing titles, designations, and affiliations."""
    if not name_str:
        return ""

    # Strip academic titles, roles, and designations
    cleaned = re.sub(
        r'(?i)\b(?:Dr|Prof|Professor|Assistant\s+Professor|Associate\s+Professor|Senior\s+Professor|Professor\s+of\s+Practice|Post-doctoral\s+Research\s+Fellow|Post-doctoral|Research\s+Fellow|Lecturer|Researcher|Scholar|Head|Dean|Chair|PhD|Ph\.D|Mr|Mrs|Ms|Er|Eng|Sir)\b\.?',
        '',
        name_str
    ).strip("*_ \t\r\n")

    # Remove parenthetical text e.g. (Adhoc), (Co-Author)
    cleaned = re.sub(r'\(.*?\)', '', cleaned).strip("*_ \t\r\n")

    # Remove trailing department/school/university affiliation text
    cleaned = re.sub(
        r'(?i)\b(?:Department|Dept|Centre|Center|School|Faculty|University|College|Institute)\b.*$',
        '',
        cleaned
    ).strip("*_ \t\r\n")

    # Clean leading/trailing non-alphabet characters
    cleaned = re.sub(r'^[^a-zA-Z]+|[^a-zA-Z.]+$', '', cleaned).strip()

    # Reject non-person organizational keywords, discipline terms, and email noise
    invalid_keywords = [
        "department", "dept", "centre", "center", "school", "faculty", "university", 
        "college", "institute", "engineering", "science", "business", "research", 
        "practice", "fellow", "professor", "associate", "assistant", "adhoc", "head", 
        "society", "laboratory", "labs", "nature", "index", "ieee", "acm", "journal",
        "anthropology", "sociology", "literature", "languages", "environmental", 
        "biology", "physics", "chemistry", "mathematics", "economics", "management", 
        "civil", "energy", "electronics", "communication", "paari", "srm", "srmap",
        "leetcoder", "trajectory", "career", "choose", "would", "life", "dear", "regards",
        "fwd", "fw", "re", "subject", "paper", "published", "title", "authors", "doi"
    ]
    cleaned_lower = cleaned.lower()
    if any(kw in cleaned_lower for kw in invalid_keywords):
        return ""

    # Validate name length and word count (1 to 4 words, 3-50 chars)
    words = cleaned.split()
    if len(words) < 1 or len(words) > 4 or len(cleaned) < 3:
        return ""

    # Ensure valid personal name capitalization (e.g. Aditya Kumar Sahu)
    for w in words:
        if not (w[0].isupper() or w.isupper()):
            return ""

    return cleaned

def parse_authors_from_raw_string(authors_raw: str) -> List[str]:
    """Parses and cleans raw multi-author string into a clean list of individual faculty names."""
    if not authors_raw:
        return ["Faculty Research Team"]

    # Split by newline, comma, semicolon, or " and "
    raw_parts = re.split(r'[\n,;]|\band\b', authors_raw)
    valid_authors = []

    for part in raw_parts:
        cleaned = clean_single_author_name(part)
        if cleaned and cleaned not in valid_authors:
            valid_authors.append(cleaned)

    return valid_authors if valid_authors else ["Faculty Research Team"]

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

        text_lower = full_text.lower()
        announcement_mode = any(k in text_lower for k in ["title of the paper", "title of paper", "title:", "journal", "authors", "doi"])

        if announcement_mode:
            title_match = re.search(r'(?i)title(?:\s+of\s+the\s+paper)?[\s*\:\-\*]+([\s\S]+?)(?=\n\s*\*?(?:journal|authors?|doi|if\s+(?:and|&)\s+q|impact\s+factor)\b)', full_text)
            if title_match:
                title = re.sub(r'\s+', ' ', title_match.group(1)).strip("*_ \t\r\n")
                title = re.sub(r'^(?:\d+[\.\)]\s*)', '', title).strip("*_ \t\r\n")
            else:
                title_match_fallback = re.search(r'(?i)title(?:\s+of\s+the\s+paper)?[\s*\:\-]+([^\n]+)', full_text)
                title = title_match_fallback.group(1).strip("*_ \t\r\n") if title_match_fallback else "Untitled Research Publication"
                title = re.sub(r'^(?:\d+[\.\)]\s*)', '', title).strip("*_ \t\r\n")
            
            journal_match = re.search(r'(?i)journal[\s*\:\-\*]+([^\n]+)', full_text)
            journal = journal_match.group(1).strip("*_ \t\r\n") if journal_match else "International Journal of College Research"
            
            authors_match = re.search(r'(?i)authors?[\s*\:\-\*]+([\s\S]+?)(?=\n\s*\*?(?:journal|doi|if\s+(?:and|&)\s+q|impact\s+factor|title|\d+[\.\)]\s*\*?\s*\*?title)\b)', full_text)
            if authors_match:
                authors_raw = authors_match.group(1).strip("*_ \t\r\n")
            else:
                authors_match_fallback = re.search(r'(?i)authors?[\s*\:\-]+([^\n]+)', full_text)
                authors_raw = authors_match_fallback.group(1).strip("*_ \t\r\n") if authors_match_fallback else "Faculty Research Team"
            
            doi_match = re.search(r'(?i)doi[\s*\:\-\*]+([^\n]+)', full_text)
            doi_raw = doi_match.group(1).strip("*_ \t\r\n") if doi_match else ""

            if_q_match = re.search(r'(?i)(?:if\s+and\s+q|impact\s+factor)[\s*\:\-\*]+([^\n]+)', full_text)
            if_q_val = if_q_match.group(1).strip("*_ \t\r\n") if if_q_match else ""

            year_matches = re.findall(r'\b(19\d\d|20[0-9]\d)\b', full_text)
            publication_year = int(year_matches[0]) if year_matches else 2026
            publication_date = f"{publication_year}-01-01"
            
            doi_clean = re.search(r'(10\.\d{4,9}/[-._;()/:A-Za-z0-9]+)', doi_raw)
            if doi_clean:
                doi = doi_clean.group(1)
            else:
                import hashlib
                title_hash = hashlib.md5(title.encode('utf-8')).hexdigest()[:8]
                doi = f"10.1016/j.promptflow.{publication_year}.{title_hash}"

            # Clean authors list
            authors_list = parse_authors_from_raw_string(authors_raw)
            clean_raw_authors = ", ".join(authors_list)

            abstract_match = re.search(r'(?i)abstract[\s*\:\-]+([\s\S]+)', full_text)
            abstract = abstract_match.group(1).strip() if abstract_match else f"This publication outlines research on '{title}', accepted at '{journal}'."
            if if_q_val:
                abstract += f"\n\n[Impact Factor & Quartile: {if_q_val}]"

            ml_dept_res = ml_classifier.predict_department(f"{title} {abstract}")
            predicted_dept = ml_dept_res["department"]
            ml_confidence = ml_dept_res["confidence"]
            
            categories = ml_classifier.auto_categorize(abstract, title)

            pub_type = "Journal"
            combined_text = f"{title} {abstract} {journal}".lower()
            if "patent" in combined_text or "inventor" in combined_text or "assignee" in combined_text:
                pub_type = "Patent"
            elif any(c in combined_text for c in ["proceedings", "conference", "symposium", "workshop", "proc."]):
                pub_type = "Conference"
            elif any(p in combined_text for p in ["preprint", "arxiv", "biorxiv", "ssrn"]):
                pub_type = "Preprint"

            references = self.extract_references_list(full_text)

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
                "authors_raw": clean_raw_authors,
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

        # PDF layout fallback
        lines = [line.strip() for line in first_page_text.split('\n') if line.strip()]
        
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

        abstract = ""
        abs_match = re.search(r'(?i)(?:abstract|summary)[\s:\.\-]+([\s\S]{100,1500}?)(?:\n\s*(?:keywords|index terms|introduction|1\s*\.\s*introduction|\n\n))', full_text)
        if abs_match:
            abstract = re.sub(r'\s+', ' ', abs_match.group(1)).strip()
        else:
            abstract = re.sub(r'\s+', ' ', full_text[200:800]).strip()

        authors_list = []
        auth_section = first_page_text[:1200]
        name_matches = re.findall(r'(?i)(?:Dr\.|Prof\.)?\s*([A-Z][a-z]+(?: [A-Z]\.?)* [A-Z][a-z]+)', auth_section)
        for name in name_matches:
            clean_n = clean_single_author_name(name)
            if clean_n and clean_n not in authors_list:
                authors_list.append(clean_n)
        if not authors_list:
            authors_list = ["Faculty Research Team"]

        clean_raw_authors = ", ".join(authors_list[:5])

        year_matches = re.findall(r'\b(19\d\d|20[0-2]\d)\b', first_page_text)
        publication_year = int(year_matches[0]) if year_matches else 2026
        publication_date = f"{publication_year}-01-01"

        doi_match = re.search(r'(?i)doi:\s*(10\.\d{4,9}/[-._;()/:A-Za-z0-9]+)', full_text)
        if doi_match:
            doi = doi_match.group(1)
        else:
            import hashlib
            title_hash = hashlib.md5(title.encode('utf-8')).hexdigest()[:8]
            doi = f"10.1016/j.promptflow.{publication_year}.{title_hash}"

        journal = "International Journal of College Research"
        journal_match = re.search(r'(?i)(?:published in|journal of|proceedings of|ieee transactions on|acm conference on)\s+([A-Za-z\s]{10,80})', first_page_text)
        if journal_match:
            journal = journal_match.group(0).strip().title()

        ml_dept_res = ml_classifier.predict_department(f"{title} {abstract}")
        predicted_dept = ml_dept_res["department"]
        ml_confidence = ml_dept_res["confidence"]
        
        categories = ml_classifier.auto_categorize(abstract, title)
        
        kw_match = re.search(r'(?i)(?:keywords|index terms)[\s:\.\-]+([^\n\r]+)', full_text)
        if kw_match:
            keywords_list = [k.strip().title() for k in re.split(r'[,;]', kw_match.group(1)) if len(k.strip()) > 2][:6]
        else:
            keywords_list = categories.copy()

        pub_type = "Journal"
        combined_text = f"{title} {abstract} {journal}".lower()
        if "patent" in combined_text or "inventor" in combined_text or "assignee" in combined_text:
            pub_type = "Patent"
        elif any(c in combined_text for c in ["proceedings", "conference", "symposium", "workshop", "proc."]):
            pub_type = "Conference"
        elif any(p in combined_text for p in ["preprint", "arxiv", "biorxiv", "ssrn"]):
            pub_type = "Preprint"

        references = self.extract_references_list(full_text)

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
            "authors_raw": clean_raw_authors,
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
        ref_section_match = re.search(r'(?i)(?:references|bibliography|works cited)\s*[\n\r]+([\s\S]+)', full_text)
        if not ref_section_match:
            return []
        
        section_text = ref_section_match.group(1).strip()
        ref_items = re.split(r'\[\d+\]|\b\d+\.\s', section_text)
        cleaned_refs = []
        for item in ref_items:
            clean = re.sub(r'\s+', ' ', item).strip()
            if len(clean) > 20:
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
