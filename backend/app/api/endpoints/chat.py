from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat_service import chat_agent_service
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()

@router.post("/query", response_model=ChatResponse)
def handle_chat_query(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Handles natural language queries from professors.
    1. Interprets query to extract structured filters & check guardrails.
    2. Retrieves matching publications from the database.
    3. Synthesizes a structured response on screen.
    """
    try:
        # Pass 1: Parse the user's natural language query
        parsed = chat_agent_service.parse_query(payload.message)
        
        is_academic = parsed.get("is_academic_query", False)
        rejection_reason = parsed.get("rejection_reason", "")
        
        if not is_academic:
            return ChatResponse(
                is_academic_query=False,
                rejection_reason=rejection_reason or "I only handle questions related to publications and research papers.",
                filters=None,
                papers=[],
                response_text=rejection_reason or "I only handle questions related to publications and research papers."
            )
            
        filters = parsed.get("filters", {})
        
        # Database call using the structured filters
        papers = chat_agent_service.query_papers(db, filters)
        
        # Pass 2: Generate natural language response summarizing the findings
        response_text = chat_agent_service.generate_response(payload.message, filters, papers)
        
        return ChatResponse(
            is_academic_query=True,
            rejection_reason="",
            filters=filters,
            papers=papers,
            response_text=response_text
        )
    except Exception as e:
        # Graceful error response
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while processing your chat request: {str(e)}"
        )
