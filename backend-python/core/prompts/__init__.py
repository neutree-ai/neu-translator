"""Prompt templates for the agent."""

from .system_workflow import SYSTEM_WORKFLOW
from .system_memory import SYSTEM_MEMORY
from .system_compact import SYSTEM_COMPACT, COMPACT_INSTRUCTION

__all__ = [
    "SYSTEM_WORKFLOW",
    "SYSTEM_MEMORY",
    "SYSTEM_COMPACT",
    "COMPACT_INSTRUCTION",
]
