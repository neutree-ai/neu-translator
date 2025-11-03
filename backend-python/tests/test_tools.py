"""
Tests for the tool implementations.
"""

import pytest
import os
import tempfile
from core.tools.read_tool import read_executor
from core.tools.ls_tool import ls_executor
from core.tools.thinking_tool import thinking_executor
from core.tools.translate_tool import translate_executor


@pytest.mark.asyncio
async def test_thinking_tool():
    """Test the thinking tool."""
    result = await thinking_executor(
        {"content": "Test thought"},
        {},
        None
    )
    assert result["type"] == "tool-result"
    assert result["payload"]["status"] == "done"


@pytest.mark.asyncio
async def test_read_tool():
    """Test the read tool."""
    # Create a temporary file
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as f:
        f.write("Test content")
        temp_path = f.name

    try:
        result = await read_executor(
            {"file_path": temp_path},
            {},
            None
        )
        assert result["type"] == "tool-result"
        assert result["payload"]["content"] == "Test content"
    finally:
        os.unlink(temp_path)


@pytest.mark.asyncio
async def test_read_tool_nonexistent_file():
    """Test reading a file that doesn't exist."""
    with pytest.raises(Exception) as exc_info:
        await read_executor(
            {"file_path": "/nonexistent/file.txt"},
            {},
            None
        )
    assert "Failed to read file" in str(exc_info.value)


@pytest.mark.asyncio
async def test_ls_tool():
    """Test the LS tool."""
    # Use current directory
    current_dir = os.getcwd()
    result = await ls_executor(
        {"path": current_dir},
        {},
        None
    )
    assert result["type"] == "tool-result"
    assert "entries" in result["payload"]
    assert isinstance(result["payload"]["entries"], list)


@pytest.mark.asyncio
async def test_ls_tool_with_ignore():
    """Test LS tool with ignore patterns."""
    current_dir = os.getcwd()
    result = await ls_executor(
        {
            "path": current_dir,
            "ignore": ["node_modules", ".git"]
        },
        {},
        None
    )
    assert result["type"] == "tool-result"
    entries = result["payload"]["entries"]

    # Check that ignored patterns are filtered
    for entry in entries:
        assert "node_modules" not in entry["name"]
        assert ".git" not in entry["name"]


@pytest.mark.asyncio
async def test_translate_tool_first_round():
    """Test translate tool first round (returns copilot request)."""
    result = await translate_executor(
        {
            "file_id": "test.md",
            "src_string": "Hello world",
            "translate_string": "你好世界"
        },
        {"name": "Translate", "callId": "test-call-id"},
        None  # No copilot response yet
    )

    assert result["type"] == "copilot-request"
    assert "payload" in result
    assert result["payload"]["tool"] == "Translate"
    assert result["payload"]["src_string"] == "Hello world"


@pytest.mark.asyncio
async def test_translate_tool_second_round():
    """Test translate tool second round (with copilot response)."""
    copilot_response = {
        "status": "approve",
        "translated_string": "你好世界",
        "reason": ""
    }

    result = await translate_executor(
        {
            "file_id": "test.md",
            "src_string": "Hello world",
            "translate_string": "你好世界"
        },
        {"name": "Translate", "callId": "test-call-id"},
        copilot_response
    )

    assert result["type"] == "tool-result"
    assert result["payload"]["status"] == "approve"
    assert result["payload"]["translated_string"] == "你好世界"


@pytest.mark.asyncio
async def test_translate_tool_length_limit():
    """Test translate tool with string exceeding length limit."""
    long_string = "a" * 301  # Exceeds 300 character limit

    result = await translate_executor(
        {
            "file_id": "test.md",
            "src_string": long_string,
            "translate_string": "translation"
        },
        {"name": "Translate", "callId": "test-call-id"},
        None
    )

    assert result["type"] == "tool-result"
    assert result["payload"]["status"] == "reject"
    assert "exceeds maximum length" in result["payload"]["reason"]
