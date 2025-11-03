"""
Memory system for storing user preferences and learning from feedback.
"""

import json
import os
import re
from typing import List, Dict, Any, Optional

from .llm import models
from .prompts import SYSTEM_MEMORY


def extract_json(text: str) -> Dict[str, Any]:
    """Extract JSON from text, handling markdown code blocks."""
    # Try to extract JSON from markdown code blocks
    json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
    if json_match:
        return json.loads(json_match.group(1))

    # Try to parse the entire text as JSON
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Try to find JSON object in text
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(0))
        raise ValueError("No valid JSON found in text")


class MemoryItem:
    """Represents a single memory item."""

    def __init__(self, index: int, text: str, tags: List[str]):
        self.index = index
        self.text = text
        self.tags = tags

    def to_dict(self) -> Dict[str, Any]:
        return {
            "index": self.index,
            "text": self.text,
            "tags": self.tags,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "MemoryItem":
        return cls(
            index=data.get("index", 0),
            text=data.get("text", ""),
            tags=data.get("tags", []),
        )


class Memory:
    """
    Memory system that extracts and persists user preferences.
    """

    def __init__(self, persistent_file: str = "./memory.json"):
        self.persistent_file = persistent_file
        self.current: List[MemoryItem] = []

    async def init(self):
        """Initialize memory from persistent file."""
        try:
            if os.path.exists(self.persistent_file):
                with open(self.persistent_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.current = [MemoryItem.from_dict(item) for item in data]
        except Exception as error:
            print(f"Failed to load memory: {error}")
            self.current = []

    async def extract_memory(
        self, req: Dict[str, Any], res: Dict[str, Any]
    ):
        """
        Extract memory from copilot request/response pair.

        Args:
            req: The copilot request (with src_string, translate_string, file_id)
            res: The copilot response (with status, translated_string, reason)
        """
        # Generate memory extraction prompt
        current_memory = json.dumps([item.to_dict() for item in self.current], indent=2)
        prompt = SYSTEM_MEMORY(req, res, current_memory)

        try:
            # Call LLM to extract memory operations
            response = models.memory(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
            )

            text = response.choices[0].message.content

            # Parse the JSON response
            output = extract_json(text)
            ops = output.get("ops", [])

            # Apply memory operations
            for op in ops:
                action = op.get("action")

                if action == "add":
                    self.current.append(
                        MemoryItem(
                            index=len(self.current),
                            text=op.get("text", ""),
                            tags=op.get("tags", []),
                        )
                    )

                elif action == "delete":
                    op_index = op.get("index")
                    self.current = [
                        item for item in self.current if item.index != op_index
                    ]

                elif action == "update":
                    op_index = op.get("index")
                    for i, item in enumerate(self.current):
                        if item.index == op_index:
                            self.current[i] = MemoryItem(
                                index=op_index,
                                text=op.get("text", ""),
                                tags=op.get("tags", []),
                            )
                            break

            # Persist to file
            await self._save()

        except Exception as error:
            print(f"Failed to extract memory: {error}")

    async def _save(self):
        """Save memory to persistent file."""
        try:
            with open(self.persistent_file, "w", encoding="utf-8") as f:
                json.dump(
                    [item.to_dict() for item in self.current],
                    f,
                    indent=2,
                    ensure_ascii=False,
                )
        except Exception as error:
            print(f"Failed to save memory: {error}")

    def provide_memory(self) -> str:
        """
        Provide memory as a formatted string for inclusion in prompts.

        Returns:
            Formatted memory string with each item and its tags.
        """
        return "\n".join(
            f"{item.text} ({','.join(item.tags)})" for item in self.current
        )
