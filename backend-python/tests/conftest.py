"""
Pytest configuration and fixtures.
"""

import pytest
import os


@pytest.fixture(autouse=True)
def setup_test_env():
    """Set up test environment variables."""
    # Set a test API key to avoid errors
    if "OPENROUTER_API_KEY" not in os.environ:
        os.environ["OPENROUTER_API_KEY"] = "test-key-for-testing"

    yield

    # Cleanup if needed
