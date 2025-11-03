"""
FastAPI application for the Python translation backend.

This provides API endpoints compatible with the existing Next.js frontend:
- POST /api/next: Main agent loop endpoint
- GET /api/sessions: List all sessions
- GET /api/sessions/{id}: Get specific session data
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from .session_manager import session_manager

# Create FastAPI app
app = FastAPI(
    title="Neu Translator Python Backend",
    description="Python backend for the neu-translator application",
    version="1.0.0",
)

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response models
class NextRequest(BaseModel):
    """Request model for /api/next endpoint."""

    sessionId: Optional[str] = None
    userInput: Optional[str] = None
    copilotResponses: Optional[List[Dict[str, Any]]] = None


class NextResponse(BaseModel):
    """Response model for /api/next endpoint."""

    sessionId: str
    agentResponse: Dict[str, Any]


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Neu Translator Python Backend",
        "version": "1.0.0",
        "endpoints": [
            "POST /api/next",
            "GET /api/sessions",
            "GET /api/sessions/{id}",
        ],
    }


# Health check
@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}


# Main agent endpoint
@app.post("/api/next", response_model=NextResponse)
async def api_next(request: NextRequest):
    """
    Main agent loop endpoint.

    Handles:
    1. User input -> Agent response
    2. Copilot responses -> Continue agent loop

    Args:
        request: NextRequest with sessionId, userInput, or copilotResponses

    Returns:
        NextResponse with sessionId and agentResponse
    """
    try:
        # Get or create session
        session_id = request.sessionId

        if not session_id:
            # Create new session
            session_id = session_manager.create_session()

        session = session_manager.get_session(session_id)

        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        # Initialize memory if not done yet
        if session.memory and not hasattr(session.memory, "_initialized"):
            await session.memory.init()
            session.memory._initialized = True

        # Handle user input
        if request.userInput:
            user_message = {
                "role": "user",
                "content": request.userInput,
            }
            await session.agent.user_input([user_message])
            session_manager.add_messages(session_id, [user_message])

        # Handle copilot responses
        if request.copilotResponses:
            await session.agent.add_copilot_responses(request.copilotResponses)
            session_manager.add_copilot_responses(
                session_id, request.copilotResponses
            )

        # Execute agent loop iteration
        result = await session.agent.next()

        # Add new messages to session
        if result.get("messages"):
            session_manager.add_messages(session_id, result["messages"])

        # Prepare response
        agent_response = {
            "actor": result["actor"],
            "messages": result["messages"],
            "unprocessedToolCalls": result["unprocessedToolCalls"],
            "copilotRequests": result["copilotRequests"],
            "finishReason": result.get("finishReason"),
        }

        return NextResponse(
            sessionId=session_id,
            agentResponse=agent_response,
        )

    except Exception as error:
        print(f"Error in /api/next: {error}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(error))


# List sessions
@app.get("/api/sessions")
async def list_sessions():
    """
    List all sessions.

    Returns:
        List of session objects with metadata
    """
    try:
        sessions = session_manager.list_sessions()
        return {"sessions": sessions}
    except Exception as error:
        print(f"Error in /api/sessions: {error}")
        raise HTTPException(status_code=500, detail=str(error))


# Get specific session
@app.get("/api/sessions/{session_id}")
async def get_session(session_id: str):
    """
    Get specific session data.

    Args:
        session_id: Session ID

    Returns:
        Session data with messages and metadata
    """
    try:
        session_data = session_manager.get_session_data(session_id)

        if not session_data:
            raise HTTPException(status_code=404, detail="Session not found")

        return session_data
    except HTTPException:
        raise
    except Exception as error:
        print(f"Error in /api/sessions/{session_id}: {error}")
        raise HTTPException(status_code=500, detail=str(error))


# Run with: uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
