"""Thinking tool for outputting thought processes."""

from typing import Dict, Any, Optional

# Tool definition
thinking_tool = {
    "type": "function",
    "function": {
        "name": "Thinking",
        "description": """Use this tool to output your thoughts step by step, which can be used to generate a plan or outline.""",
        "parameters": {
            "type": "object",
            "properties": {
                "content": {
                    "type": "string",
                    "description": "your thoughts",
                },
            },
            "required": ["content"],
        },
    },
}


async def thinking_executor(
    input_data: Dict[str, Any],
    options: Dict[str, Any],
    copilot_response: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Execute the thinking tool.

    Args:
        input_data: Tool input with content (the thought)
        options: Tool execution options
        copilot_response: Not used for this tool

    Returns:
        Tool result with status
    """
    return {
        "type": "tool-result",
        "payload": {"status": "done"},
    }
