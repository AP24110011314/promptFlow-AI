from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.schemas.paper import ResearchPaperCreate, ResearchPaperResponse, PaperSearchFilter
from app.schemas.category import CategoryCreate, CategoryResponse
from app.schemas.email import SimulateEmailRequest, EmailLogResponse
from app.schemas.analytics import DashboardAnalyticsResponse, DeptStats, YearStats, CategoryStats, AuthorStats, NetworkData
from app.schemas.notification import NotificationCreate, NotificationResponse

__all__ = [
    "UserCreate", "UserLogin", "UserResponse", "Token",
    "ResearchPaperCreate", "ResearchPaperResponse", "PaperSearchFilter",
    "CategoryCreate", "CategoryResponse",
    "SimulateEmailRequest", "EmailLogResponse",
    "DashboardAnalyticsResponse", "DeptStats", "YearStats", "CategoryStats", "AuthorStats", "NetworkData",
    "NotificationCreate", "NotificationResponse"
]

