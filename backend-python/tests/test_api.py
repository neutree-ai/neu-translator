"""
Tests for the FastAPI endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)


def test_root_endpoint():
    """Test the root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "version" in data
    assert data["version"] == "1.0.0"


def test_health_endpoint():
    """Test the health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_list_sessions_endpoint():
    """Test listing sessions."""
    response = client.get("/api/sessions")
    assert response.status_code == 200
    data = response.json()
    assert "sessions" in data
    assert isinstance(data["sessions"], list)


def test_create_new_session():
    """Test creating a new session through /api/next."""
    response = client.post(
        "/api/next",
        json={"userInput": "Hello"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "sessionId" in data
    assert "agentResponse" in data
    assert data["sessionId"] is not None


def test_get_nonexistent_session():
    """Test getting a session that doesn't exist."""
    response = client.get("/api/sessions/nonexistent-id")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_api_next_with_session():
    """Test /api/next with existing session."""
    # First create a session
    response1 = client.post(
        "/api/next",
        json={"userInput": "Test message"}
    )
    assert response1.status_code == 200
    session_id = response1.json()["sessionId"]

    # Continue with the same session
    response2 = client.post(
        "/api/next",
        json={
            "sessionId": session_id,
            "userInput": "Another message"
        }
    )
    assert response2.status_code == 200
    data = response2.json()
    assert data["sessionId"] == session_id


def test_api_response_structure():
    """Test that API response has correct structure."""
    response = client.post(
        "/api/next",
        json={"userInput": "Test"}
    )
    assert response.status_code == 200
    data = response.json()

    # Check response structure
    assert "sessionId" in data
    assert "agentResponse" in data

    agent_response = data["agentResponse"]
    assert "actor" in agent_response
    assert "messages" in agent_response
    assert "unprocessedToolCalls" in agent_response
    assert "copilotRequests" in agent_response

    # Check types
    assert isinstance(agent_response["messages"], list)
    assert isinstance(agent_response["unprocessedToolCalls"], list)
    assert isinstance(agent_response["copilotRequests"], list)
