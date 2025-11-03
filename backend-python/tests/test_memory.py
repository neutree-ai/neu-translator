"""
Tests for the Memory system.
"""

import pytest
import os
import sys
import tempfile
import json
from unittest.mock import Mock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from core.memory import Memory, MemoryItem, extract_json


def test_memory_item_creation():
    """Test creating a memory item."""
    item = MemoryItem(index=0, text="Test memory", tags=["test"])
    assert item.index == 0
    assert item.text == "Test memory"
    assert item.tags == ["test"]


def test_memory_item_to_dict():
    """Test converting memory item to dict."""
    item = MemoryItem(index=0, text="Test", tags=["tag"])
    data = item.to_dict()
    assert data["index"] == 0
    assert data["text"] == "Test"
    assert data["tags"] == ["tag"]


def test_memory_item_from_dict():
    """Test creating memory item from dict."""
    data = {"index": 1, "text": "Test", "tags": ["tag1", "tag2"]}
    item = MemoryItem.from_dict(data)
    assert item.index == 1
    assert item.text == "Test"
    assert item.tags == ["tag1", "tag2"]


@pytest.mark.asyncio
async def test_memory_init_empty():
    """Test initializing memory with no file."""
    with tempfile.NamedTemporaryFile(delete=True) as f:
        temp_path = f.name

    # File doesn't exist
    memory = Memory(temp_path)
    await memory.init()
    assert memory.current == []


@pytest.mark.asyncio
async def test_memory_init_with_existing_file():
    """Test initializing memory with existing file."""
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as f:
        json.dump([
            {"index": 0, "text": "Test memory", "tags": ["test"]}
        ], f)
        temp_path = f.name

    try:
        memory = Memory(temp_path)
        await memory.init()
        assert len(memory.current) == 1
        assert memory.current[0].text == "Test memory"
    finally:
        os.unlink(temp_path)


def test_memory_provide_memory():
    """Test providing memory as formatted string."""
    memory = Memory()
    memory.current = [
        MemoryItem(0, "Use formal language", ["style"]),
        MemoryItem(1, "Translate AI as 人工智能", ["terminology"])
    ]

    result = memory.provide_memory()
    assert "Use formal language (style)" in result
    assert "Translate AI as 人工智能 (terminology)" in result


def test_extract_json_from_plain():
    """Test extracting JSON from plain text."""
    text = '{"key": "value"}'
    result = extract_json(text)
    assert result["key"] == "value"


def test_extract_json_from_markdown():
    """Test extracting JSON from markdown code block."""
    text = """
    ```json
    {"key": "value"}
    ```
    """
    result = extract_json(text)
    assert result["key"] == "value"


def test_extract_json_with_surrounding_text():
    """Test extracting JSON when surrounded by other text."""
    text = "Here is the result: {\"key\": \"value\"} and that's it."
    result = extract_json(text)
    assert result["key"] == "value"


@pytest.mark.asyncio
@patch('core.memory.models')
async def test_memory_extract_with_add_operation(mock_models):
    """Test memory extraction with add operation."""
    # Mock LLM response
    mock_response = Mock()
    mock_response.choices = [
        Mock(
            message=Mock(
                content='{"ops": [{"action": "add", "index": -1, "text": "New preference", "tags": ["preference"]}]}'
            )
        )
    ]
    mock_models.memory.return_value = mock_response

    with tempfile.NamedTemporaryFile(delete=False, suffix='.json') as f:
        temp_path = f.name

    try:
        memory = Memory(temp_path)
        await memory.init()

        req = {"file_id": "test.md", "src_string": "source", "translate_string": "translation"}
        res = {"status": "reject", "translated_string": "final", "reason": "test reason"}

        await memory.extract_memory(req, res)

        # Check that memory was added
        assert len(memory.current) == 1
        assert memory.current[0].text == "New preference"
    finally:
        if os.path.exists(temp_path):
            os.unlink(temp_path)
