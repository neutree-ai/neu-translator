"""
LLM client configuration using OpenRouter API.
Compatible with OpenAI API format.
"""

import os
from openai import OpenAI
from typing import Optional


def get_env_variable(name: str, default: Optional[str] = None) -> str:
    """Get environment variable or raise error if not found."""
    value = os.getenv(name, default)
    if value is None:
        raise ValueError(f"Environment variable {name} is required")
    return value


class LLMModels:
    """LLM model configuration for different purposes."""

    def __init__(self):
        # Initialize OpenRouter client
        api_key = get_env_variable("OPENROUTER_API_KEY")
        base_url = "https://openrouter.ai/api/v1"

        self.client = OpenAI(
            api_key=api_key,
            base_url=base_url,
        )

        # Model names
        self.translator_model = "google/gemini-2.0-flash-exp:free"
        self.memory_model = "google/gemini-2.0-flash-exp:free"
        self.compactor_model = "google/gemini-2.0-flash-exp:free"

    def create_chat_completion(self, model: str, messages: list, **kwargs):
        """Create a chat completion using the specified model."""
        return self.client.chat.completions.create(
            model=model, messages=messages, **kwargs
        )

    def translator(self, messages: list, **kwargs):
        """Use the translator model (main agent model)."""
        return self.create_chat_completion(
            model=self.translator_model, messages=messages, **kwargs
        )

    def memory(self, messages: list, **kwargs):
        """Use the memory extraction model."""
        return self.create_chat_completion(
            model=self.memory_model, messages=messages, **kwargs
        )

    def compactor(self, messages: list, **kwargs):
        """Use the message compaction model."""
        return self.create_chat_completion(
            model=self.compactor_model, messages=messages, **kwargs
        )


# Global instance
models = LLMModels()
