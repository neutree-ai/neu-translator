"""Tool system for the agent."""

from .translate_tool import translate_tool, translate_executor
from .read_tool import read_tool, read_executor
from .ls_tool import ls_tool, ls_executor
from .thinking_tool import thinking_tool, thinking_executor

# Export all tools and executors
TOOLS = {
    "Translate": {
        "tool": translate_tool,
        "executor": translate_executor,
    },
    "Read": {
        "tool": read_tool,
        "executor": read_executor,
    },
    "LS": {
        "tool": ls_tool,
        "executor": ls_executor,
    },
    "Thinking": {
        "tool": thinking_tool,
        "executor": thinking_executor,
    },
}

__all__ = [
    "TOOLS",
    "translate_tool",
    "translate_executor",
    "read_tool",
    "read_executor",
    "ls_tool",
    "ls_executor",
    "thinking_tool",
    "thinking_executor",
]
