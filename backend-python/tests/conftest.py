"""
Pytest configuration and fixtures.
"""

import pytest
import os
from unittest.mock import Mock, AsyncMock, patch


@pytest.fixture(autouse=True)
def setup_test_env():
    """Set up test environment variables."""
    # Set a test API key to avoid errors
    if "OPENROUTER_API_KEY" not in os.environ:
        os.environ["OPENROUTER_API_KEY"] = "test-key-for-testing"

    yield

    # Cleanup if needed


@pytest.fixture
def mock_llm_response():
    """Mock LLM API response."""
    mock_response = Mock()
    mock_response.choices = [
        Mock(
            message=Mock(content="Test response", tool_calls=None), finish_reason="stop"
        )
    ]
    return mock_response


@pytest.fixture
def mock_openai_client(mock_llm_response):
    """Mock OpenAI client to avoid actual API calls."""
    with patch("core.llm.OpenAI") as mock_openai:
        # Create mock client instance
        mock_client = Mock()
        mock_client.chat.completions.create = Mock(return_value=mock_llm_response)
        mock_openai.return_value = mock_client
        yield mock_client


@pytest.fixture(autouse=True)
def mock_models(mock_llm_response):
    """Auto-mock LLM models for all tests."""
    with patch("core.llm.models") as mock_models_obj:
        # Mock all model methods
        mock_models_obj.translator = Mock(return_value=mock_llm_response)
        mock_models_obj.memory = Mock(return_value=mock_llm_response)
        mock_models_obj.compactor = Mock(return_value=mock_llm_response)
        mock_models_obj.client = Mock()
        yield mock_models_obj
