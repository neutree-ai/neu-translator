"""
Agent loop implementation - the core of the translation assistant.
"""

import time
import random
import json
from typing import Dict, Any, List, Optional

from .context import Context
from .llm import models
from .prompts import SYSTEM_WORKFLOW
from .tools import TOOLS


class AgentLoop:
    """
    Main agent loop that orchestrates the translation workflow.

    This class handles:
    - Message management through Context
    - Tool execution with copilot request/response flow
    - LLM interaction for generating responses
    """

    def __init__(
        self,
        options: Optional[Dict[str, Any]] = None,
        messages: Optional[List[Dict[str, Any]]] = None,
    ):
        """
        Initialize the agent loop.

        Args:
            options: Configuration options (memory, cwd, etc.)
            messages: Initial message history
        """
        self.options = options or {}
        self.context = Context(messages or [])

        # Store tool definitions and executors
        self.tool_defs = [TOOLS[name]["tool"] for name in TOOLS]
        self.tool_executors = {
            name: TOOLS[name]["executor"] for name in TOOLS
        }

    async def next(self) -> Dict[str, Any]:
        """
        Execute one iteration of the agent loop.

        Returns:
            Dictionary with:
            - actor: "user" or "agent"
            - unprocessedToolCalls: List of tool calls without results
            - copilotRequests: List of translation requests for user approval
            - messages: New messages generated in this iteration
            - finishReason: Optional finish reason
        """
        result = await self._next()

        # Add new messages to context
        if result["messages"]:
            self.context.add_messages(result["messages"])

        # Get unprocessed tool calls
        unprocessed_tool_calls = await self.get_unprocessed_tool_calls()

        return {
            "actor": result["actor"],
            "unprocessedToolCalls": unprocessed_tool_calls,
            "copilotRequests": result["copilotRequests"],
            "messages": result["messages"],
            "finishReason": result.get("finishReason"),
        }

    async def user_input(self, messages: List[Dict[str, Any]]):
        """
        Add user input messages to the context.

        Args:
            messages: List of user messages
        """
        self.context.add_messages(messages)

    async def add_copilot_responses(self, responses: List[Dict[str, Any]]):
        """
        Add copilot responses (user's approval/rejection of translations).

        Args:
            responses: List of copilot responses
        """
        self.context.add_copilot_responses(responses)

    async def get_messages(self) -> List[Dict[str, Any]]:
        """Get all messages from context."""
        return self.context.get_messages()

    async def compact(self) -> Dict[str, str]:
        """Compact message history to save tokens."""
        return await self.context.compact()

    async def _next(self) -> Dict[str, Any]:
        """
        Internal next iteration logic.

        Returns:
            Dictionary with messages, copilotRequests, actor, and optional finishReason
        """
        actor = "agent"

        # Get current messages
        model_messages = self.context.to_model_messages()

        # If no messages, return user actor
        if not model_messages:
            return {
                "messages": [],
                "copilotRequests": [],
                "actor": "user",
            }

        # Check for unprocessed tool calls
        unprocessed_tool_calls = await self.get_unprocessed_tool_calls()

        if unprocessed_tool_calls:
            # Get copilot responses for these tool calls
            tool_call_ids = [tc["toolCallId"] for tc in unprocessed_tool_calls]
            copilot_responses = self.context.get_copilot_responses(tool_call_ids)

            # Create response map
            copilot_response_map = {
                resp["tool_call_id"]: resp for resp in copilot_responses
            }

            # Execute tools
            tool_results = []
            for call in unprocessed_tool_calls:
                result = await self.execute_tool(
                    call, copilot_response_map.get(call["toolCallId"])
                )
                tool_results.append(result)

            # Separate tool results and copilot requests
            tool_result_parts = []
            copilot_requests = []

            for result in tool_results:
                if result["type"] == "tool-result-part":
                    tool_result_parts.append(result["payload"])
                else:  # copilot-request
                    copilot_requests.append(result["payload"])

            # If there are copilot requests, return them
            if copilot_requests:
                return {
                    "messages": [],
                    "copilotRequests": copilot_requests,
                    "actor": "agent",
                }

            # Return tool results
            return {
                "messages": [
                    {
                        "role": "tool",
                        "content": tool_result_parts,
                    }
                ],
                "copilotRequests": [],
                "actor": "agent",
            }

        # No unprocessed tool calls, call LLM
        try:
            # Get current memory
            current_memory = ""
            if self.options.get("memory"):
                current_memory = self.options["memory"].provide_memory()

            # Prepare system message
            system_message = SYSTEM_WORKFLOW(current_memory)

            # Prepare messages for API call
            api_messages = self._convert_to_api_format(model_messages)

            # Call LLM
            response = models.translator(
                messages=[
                    {"role": "system", "content": system_message},
                    *api_messages,
                ],
                tools=self.tool_defs,
                temperature=0.7,
            )

            # Parse response
            assistant_message = response.choices[0].message
            finish_reason = response.choices[0].finish_reason

            # Build response messages
            response_messages = []

            # Check if there are tool calls
            tool_calls = assistant_message.tool_calls or []

            # Build content array
            content = []

            # Add text content if present
            if assistant_message.content:
                content.append({
                    "type": "text",
                    "text": assistant_message.content,
                })

            # Add tool calls if present
            for tool_call in tool_calls:
                # Generate unique tool call ID
                tool_call_id = f"{int(time.time() * 1000)}-{random.randint(10000, 99999)}"

                # Parse arguments safely
                try:
                    args = json.loads(tool_call.function.arguments) if tool_call.function.arguments else {}
                except json.JSONDecodeError:
                    args = {}

                content.append({
                    "type": "tool-call",
                    "toolCallId": tool_call_id,
                    "toolName": tool_call.function.name,
                    "args": args,
                })

            # Add assistant message if there's content
            if content:
                response_messages.append({
                    "role": "assistant",
                    "content": content,
                })

            # Determine next actor
            if tool_calls:
                actor = "agent"
            else:
                actor = "user"

            return {
                "messages": response_messages,
                "copilotRequests": [],
                "actor": actor,
                "finishReason": finish_reason,
            }

        except Exception as error:
            print(f"Error in agent loop: {error}")
            return {
                "messages": [],
                "copilotRequests": [],
                "actor": "user",
                "finishReason": "error",
            }

    async def get_unprocessed_tool_calls(self) -> List[Dict[str, Any]]:
        """
        Get tool calls that haven't been executed yet.

        Returns:
            List of unprocessed tool call parts
        """
        messages = self.context.get_messages()
        parts: Dict[str, Dict[str, Any]] = {}

        for message in messages:
            role = message.get("role")
            content = message.get("content")

            # Find tool calls in assistant messages
            if role == "assistant" and isinstance(content, list):
                for part in content:
                    if part.get("type") == "tool-call":
                        tool_call_id = part.get("toolCallId")
                        if tool_call_id and tool_call_id not in parts:
                            parts[tool_call_id] = part

            # Remove tool calls that have results
            if role == "tool":
                for part in content:
                    if part.get("type") == "tool-result":
                        tool_call_id = part.get("toolCallId")
                        if tool_call_id in parts:
                            del parts[tool_call_id]

        return list(parts.values())

    async def execute_tool(
        self,
        part: Dict[str, Any],
        copilot_response: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Execute a tool with optional copilot response.

        Args:
            part: Tool call part with toolName, toolCallId, and args
            copilot_response: Optional user response for copilot requests

        Returns:
            Either a tool-result-part or copilot-request
        """
        tool_name = part.get("toolName")
        tool_call_id = part.get("toolCallId")
        input_data = part.get("args", {})

        # Get tool executor
        if tool_name not in self.tool_executors:
            raise Exception(f"Tool executor not found for: {tool_name}")

        # Prepare options
        options = {
            **self.options,
            "name": tool_name,
            "callId": tool_call_id,
        }

        # Execute tool
        result = await self.tool_executors[tool_name](
            input_data, options, copilot_response
        )

        # If it's a copilot request, return it
        if result["type"] == "copilot-request":
            return result

        # Otherwise, return tool result part
        return {
            "type": "tool-result-part",
            "payload": {
                "type": "tool-result",
                "toolCallId": tool_call_id,
                "toolName": tool_name,
                "result": result["payload"],
                "isError": False,
            },
        }

    def _convert_to_api_format(
        self, messages: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Convert internal message format to OpenAI API format.

        Args:
            messages: Internal format messages

        Returns:
            OpenAI API format messages
        """
        api_messages = []

        for message in messages:
            role = message.get("role")
            content = message.get("content")

            # Handle different message types
            if role == "user":
                api_messages.append({
                    "role": "user",
                    "content": content if isinstance(content, str) else self._format_content(content),
                })

            elif role == "assistant":
                # Check if content contains tool calls
                if isinstance(content, list):
                    text_parts = [p["text"] for p in content if p.get("type") == "text"]
                    tool_calls = [p for p in content if p.get("type") == "tool-call"]

                    msg = {
                        "role": "assistant",
                        "content": " ".join(text_parts) if text_parts else None,
                    }

                    # Add tool calls if present
                    if tool_calls:
                        msg["tool_calls"] = [
                            {
                                "id": tc["toolCallId"],
                                "type": "function",
                                "function": {
                                    "name": tc["toolName"],
                                    "arguments": str(tc["args"]),
                                },
                            }
                            for tc in tool_calls
                        ]

                    api_messages.append(msg)
                else:
                    api_messages.append({
                        "role": "assistant",
                        "content": content,
                    })

            elif role == "tool":
                # Convert tool results
                if isinstance(content, list):
                    for part in content:
                        if part.get("type") == "tool-result":
                            api_messages.append({
                                "role": "tool",
                                "tool_call_id": part["toolCallId"],
                                "content": str(part.get("result", "")),
                            })

        return api_messages

    def _format_content(self, content: Any) -> str:
        """Format content to string."""
        if isinstance(content, str):
            return content
        elif isinstance(content, list):
            text_parts = [p.get("text", "") for p in content if p.get("type") == "text"]
            return " ".join(text_parts)
        else:
            return str(content)
