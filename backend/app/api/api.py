from fastapi import APIRouter
from app.api.endpoints import auth, papers, categories, emails, analytics, export, admin

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & RBAC"])
api_router.include_router(papers.router, prefix="/papers", tags=["Research Repository"])
api_router.include_router(categories.router, prefix="/categories", tags=["Categories & Tags"])
api_router.include_router(emails.router, prefix="/emails", tags=["Email Ingestion & ML Logs"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Dashboard Analytics"])
api_router.include_router(export.router, prefix="/export", tags=["Data Export (.xlsx & .pdf)"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin Control Panel"])
