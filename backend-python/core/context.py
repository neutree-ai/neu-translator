"""
Context manager for handling message history and compression.
"""

import re
from typing import List, Dict, Any

from .llm import models
from .prompts import SYSTEM_COMPACT, COMPACT_INSTRUCTION


def parse_analysis_summary(text: str) -> Dict[str, str]:
    """
    Parse analysis and summary from compacted text.

    Args:
        text: The text containing analysis and summary tags

    Returns:
        Dictionary with 'analysis' and 'summary' keys
    """
    analysis_match = re.search(
        r'<analysis>(.*?)</analysis>', text, re.DOTALL | re.IGNORECASE
    )
    summary_match = re.search(
        r'<summary>(.*?)</summary>', text, re.DOTALL | re.IGNORECASE
    )

    analysis = analysis_match.group(1).strip() if analysis_match else ""
    summary = summary_match.group(1).strip() if summary_match else text

    return {
        "analysis": analysis,
        "summary": summary,
    }


class Context:
    """
    Manages conversation context including messages and copilot responses.
    """

    def __init__(self, messages: List[Dict[str, Any]] = None):
        """Initialize context with optional initial messages."""
        self.messages: List[Dict[str, Any]] = (
            messages.copy() if messages else []
        )
        self.copilot_responses: List[Dict[str, Any]] = []
        self.active_messages: List[Dict[str, Any]] = (
            messages.copy() if messages else []
        )

    def add_messages(self, messages: List[Dict[str, Any]]):
        """Add new messages to the context."""
        self.messages.extend(messages)
        self.active_messages.extend(messages)

    def add_copilot_responses(self, responses: List[Dict[str, Any]]):
        """Add copilot responses to the context."""
        self.copilot_responses.extend(responses)

    def get_messages(self) -> List[Dict[str, Any]]:
        """Get all messages."""
        return self.messages

    def get_copilot_responses(self, tool_call_ids: List[str]) -> List[Dict[str, Any]]:
        """
        Get copilot responses matching the given tool call IDs.

        Args:
            tool_call_ids: List of tool call IDs to match

        Returns:
            List of matching copilot responses
        """
        return [
            resp
            for resp in self.copilot_responses
            if resp.get("tool_call_id") in tool_call_ids
        ]

    def to_model_messages(self) -> List[Dict[str, Any]]:
        """
        Convert context to model messages format.

        Returns:
            List of messages in OpenAI format
        """
        return self.active_messages

    async def compact(self) -> Dict[str, str]:
        """
        Compact the message history using the compactor model.

        Returns:
            Dictionary with 'analysis' and 'summary' keys
        """
        # Prepare messages for compaction
        messages = self.to_model_messages() + [
            {"role": "user", "content": COMPACT_INSTRUCTION()}
        ]

        # Call compactor model
        response = models.compactor(
            messages=[
                {"role": "system", "content": SYSTEM_COMPACT()},
                *messages,
            ],
            temperature=0.2,
        )

        text = response.choices[0].message.content

        # Parse analysis and summary
        result = parse_analysis_summary(text)

        # Replace active messages with the summary
        self.active_messages = [
            {
                "role": "assistant",
                "content": result["summary"].strip(),
            }
        ]

        return result
