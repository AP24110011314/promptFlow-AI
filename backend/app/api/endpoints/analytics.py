from collections import Counter
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.paper import ResearchPaper
from app.models.email_log import EmailIngestionLog
from app.models.citation import PaperCitation
from app.schemas.analytics import DashboardAnalyticsResponse, DeptStats, YearStats, CategoryStats, AuthorStats, NetworkData, CollaborationNode, CollaborationLink

router = APIRouter()

@router.get("", response_model=DashboardAnalyticsResponse)
def get_dashboard_analytics(db: Session = Depends(get_db)):
    papers = db.query(ResearchPaper).all()
    total_papers = len(papers)
    total_emails = db.query(EmailIngestionLog).count()

    dept_counts = Counter()
    year_counts = Counter()
    category_counts = Counter()
    author_counts = Counter()
    author_dept_map = {}
    total_conf = 0.0

    # Build co-authorship collaboration graph
    nodes_map = {}
    links_list = []
    link_weights = Counter()

    for p in papers:
        dept = p.department or "General"
        dept_counts[dept] += 1
        
        year = p.publication_year or 2026
        year_counts[year] += 1
        
        total_conf += p.ml_confidence or 0.5

        for cat in (p.categories_list or ["General Research"]):
            category_counts[cat] += 1

        from app.ml_engine.extractor import clean_single_author_name

        authors = [clean_single_author_name(a) for a in (p.authors_list or []) if clean_single_author_name(a)]
        for a in authors:
            author_counts[a] += 1
            author_dept_map[a] = dept
            
            if a not in nodes_map:
                nodes_map[a] = CollaborationNode(id=a, group=abs(hash(dept)) % 8 + 1, val=1)
            else:
                nodes_map[a].val += 1


        # Co-authorship links
        for i in range(len(authors)):
            for j in range(i + 1, len(authors)):
                pair = tuple(sorted([authors[i], authors[j]]))
                link_weights[pair] += 1

    for (src, tgt), w in link_weights.items():
        links_list.append(CollaborationLink(source=src, target=tgt, value=w))

    # Build citation graph
    citations_in_db = db.query(PaperCitation).filter(PaperCitation.cited_paper_id != None).all()
    cit_nodes = {}
    cit_links = []

    for c in citations_in_db:
        citing_title = c.citing_paper.title
        cited_title = c.cited_paper.title
        
        if citing_title not in cit_nodes:
            cit_nodes[citing_title] = CollaborationNode(
                id=citing_title[:40] + "...", 
                group=abs(hash(c.citing_paper.department or "General")) % 8 + 1,
                val=1
            )
        else:
            cit_nodes[citing_title].val += 1
            
        if cited_title not in cit_nodes:
            cit_nodes[cited_title] = CollaborationNode(
                id=cited_title[:40] + "...", 
                group=abs(hash(c.cited_paper.department or "General")) % 8 + 1,
                val=1
            )
        else:
            cit_nodes[cited_title].val += 1
            
        cit_links.append(CollaborationLink(source=citing_title[:40] + "...", target=cited_title[:40] + "...", value=1))

    avg_conf = round(total_conf / total_papers, 4) if total_papers > 0 else 0.0
    total_authors = len(author_counts)
    total_depts = len(dept_counts)

    by_dept = [DeptStats(department=d, count=c) for d, c in dept_counts.most_common(10)]
    by_year = [YearStats(year=y, count=c) for y, c in sorted(year_counts.items())]
    by_cat = [CategoryStats(category=c, count=n) for c, n in category_counts.most_common(10)]
    
    top_authors = [
        AuthorStats(author=a, count=c, department=author_dept_map.get(a, "General"))
        for a, c in author_counts.most_common(10)
    ]

    network = NetworkData(nodes=list(nodes_map.values()), links=links_list)
    citation_network = NetworkData(nodes=list(cit_nodes.values()), links=cit_links)

    return DashboardAnalyticsResponse(
        total_papers=total_papers,
        total_authors=total_authors,
        total_departments=total_depts,
        total_emails_processed=total_emails,
        avg_ml_confidence=avg_conf,
        by_department=by_dept,
        by_year=by_year,
        by_category=by_cat,
        top_authors=top_authors,
        collaboration_network=network,
        citation_network=citation_network
    )
