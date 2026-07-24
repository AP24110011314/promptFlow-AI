from fastapi import APIRouter
from app.api.endpoints import auth, papers, categories, emails, analytics, export, admin, chat, notifications

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & RBAC"])
api_router.include_router(papers.router, prefix="/papers", tags=["Research Repository"])
api_router.include_router(categories.router, prefix="/categories", tags=["Categories & Tags"])
api_router.include_router(emails.router, prefix="/emails", tags=["Email Ingestion & ML Logs"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Persistent User Notifications"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Dashboard Analytics"])
api_router.include_router(export.router, prefix="/export", tags=["Data Export (.xlsx & .pdf)"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin Control Panel"])
api_router.include_router(chat.router, prefix="/chat", tags=["Research Chat Assistant"])

@api_router.get("/health", tags=["Health Check"])
def health_check():
    return {
        "status": "online",
        "system": "promptFlow-AI",
        "version": "1.0.0",
        "ml_engine": "active"
    }



