from pydantic import BaseModel
from typing import List, Dict, Any

class DeptStats(BaseModel):
    department: str
    count: int

class YearStats(BaseModel):
    year: int
    count: int

class CategoryStats(BaseModel):
    category: str
    count: int

class AuthorStats(BaseModel):
    author: str
    count: int
    department: str

class CollaborationNode(BaseModel):
    id: str
    group: int
    val: int

class CollaborationLink(BaseModel):
    source: str
    target: str
    value: int

class NetworkData(BaseModel):
    nodes: List[CollaborationNode]
    links: List[CollaborationLink]

class DashboardAnalyticsResponse(BaseModel):
    total_papers: int
    total_authors: int
    total_departments: int
    total_emails_processed: int
    avg_ml_confidence: float
    by_department: List[DeptStats]
    by_year: List[YearStats]
    by_category: List[CategoryStats]
    top_authors: List[AuthorStats]
    collaboration_network: NetworkData
    citation_network: NetworkData
