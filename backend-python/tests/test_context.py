"""
Tests for the Context management system.
"""

import pytest
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from core.context import Context, parse_analysis_summary


def test_context_creation_empty():
    """Test creating an empty context."""
    context = Context()
    assert context.get_messages() == []
    assert context.to_model_messages() == []


def test_context_creation_with_messages():
    """Test creating context with initial messages."""
    messages = [{"role": "user", "content": "Hello"}]
    context = Context(messages)
    assert len(context.get_messages()) == 1
    assert context.get_messages()[0]["role"] == "user"


def test_context_add_messages():
    """Test adding messages to context."""
    context = Context()
    messages = [
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "Hi"},
    ]
    context.add_messages(messages)
    assert len(context.get_messages()) == 2


def test_context_add_copilot_responses():
    """Test adding copilot responses."""
    context = Context()
    responses = [{"tool_call_id": "id1", "status": "approve"}]
    context.add_copilot_responses(responses)

    # Should be able to retrieve them
    result = context.get_copilot_responses(["id1"])
    assert len(result) == 1
    assert result[0]["status"] == "approve"


def test_context_get_copilot_responses_filtering():
    """Test filtering copilot responses by tool call IDs."""
    context = Context()
    responses = [
        {"tool_call_id": "id1", "status": "approve"},
        {"tool_call_id": "id2", "status": "reject"},
        {"tool_call_id": "id3", "status": "refined"},
    ]
    context.add_copilot_responses(responses)

    # Get only specific IDs
    result = context.get_copilot_responses(["id1", "id3"])
    assert len(result) == 2
    assert all(r["tool_call_id"] in ["id1", "id3"] for r in result)


def test_parse_analysis_summary_with_tags():
    """Test parsing analysis and summary from tagged text."""
    text = """
    <analysis>
    This is the analysis section.
    </analysis>

    <summary>
    This is the summary section.
    </summary>
    """
    result = parse_analysis_summary(text)
    assert "analysis section" in result["analysis"]
    assert "summary section" in result["summary"]


def test_parse_analysis_summary_without_tags():
    """Test parsing when tags are missing."""
    text = "Just plain text without tags"
    result = parse_analysis_summary(text)
    assert result["analysis"] == ""
    assert result["summary"] == text


def test_parse_analysis_summary_partial_tags():
    """Test parsing with only summary tag."""
    text = """
    <summary>
    Summary content
    </summary>
    """
    result = parse_analysis_summary(text)
    assert result["analysis"] == ""
    assert "Summary content" in result["summary"]


def test_context_to_model_messages():
    """Test converting context to model messages."""
    messages = [
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "Hi there"},
    ]
    context = Context(messages)
    model_messages = context.to_model_messages()

    assert len(model_messages) == 2
    assert model_messages[0]["role"] == "user"
    assert model_messages[1]["role"] == "assistant"
