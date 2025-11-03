"""
Session manager for handling multiple translation sessions.
"""

import uuid
from datetime import datetime
from typing import Dict, List, Any, Optional

from core.agent import AgentLoop
from core.memory import Memory


class Session:
    """Represents a translation session."""

    def __init__(self, session_id: str):
        self.id = session_id
        self.messages: List[Dict[str, Any]] = []
        self.copilot_responses: List[Dict[str, Any]] = []
        self.created_at = datetime.utcnow().isoformat()
        self.agent: Optional[AgentLoop] = None
        self.memory: Optional[Memory] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert session to dictionary."""
        return {
            "id": self.id,
            "messages": self.messages,
            "copilotResponses": self.copilot_responses,
            "created_at": self.created_at,
        }


class SessionManager:
    """
    Manages translation sessions in memory.
    """

    def __init__(self):
        self.sessions: Dict[str, Session] = {}

    def create_session(self) -> str:
        """
        Create a new session.

        Returns:
            New session ID
        """
        session_id = str(uuid.uuid4())
        session = Session(session_id)

        # Initialize memory for this session
        session.memory = Memory(f"./memory-{session_id}.json")

        # Initialize agent loop
        session.agent = AgentLoop(
            options={
                "memory": session.memory,
                "cwd": "/",
            },
            messages=[],
        )

        self.sessions[session_id] = session
        return session_id

    def get_session(self, session_id: str) -> Optional[Session]:
        """
        Get session by ID.

        Args:
            session_id: Session ID

        Returns:
            Session object or None if not found
        """
        return self.sessions.get(session_id)

    def add_messages(self, session_id: str, messages: List[Dict[str, Any]]):
        """
        Add messages to a session.

        Args:
            session_id: Session ID
            messages: List of messages to add
        """
        session = self.get_session(session_id)
        if session:
            session.messages.extend(messages)

    def add_copilot_responses(self, session_id: str, responses: List[Dict[str, Any]]):
        """
        Add copilot responses to a session.

        Args:
            session_id: Session ID
            responses: List of copilot responses
        """
        session = self.get_session(session_id)
        if session:
            session.copilot_responses.extend(responses)

    def list_sessions(self) -> List[Dict[str, Any]]:
        """
        List all sessions.

        Returns:
            List of session dictionaries
        """
        return [session.to_dict() for session in self.sessions.values()]

    def get_session_data(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Get session data including messages and metadata.

        Args:
            session_id: Session ID

        Returns:
            Session data dictionary or None if not found
        """
        session = self.get_session(session_id)
        if session:
            return session.to_dict()
        return None


# Global session manager instance
session_manager = SessionManager()
