"""
Core type definitions for the Python backend.
These types mirror the TypeScript types to maintain API compatibility.
"""

from typing import Literal, Optional, List, Dict, Any, Union
from dataclasses import dataclass, field
from enum import Enum


# Basic enums
class NextActor(str, Enum):
    USER = "user"
    AGENT = "agent"


class FinishReason(str, Enum):
    STOP = "stop"
    LENGTH = "length"
    CONTENT_FILTER = "content-filter"
    TOOL_CALLS = "tool-calls"
    ERROR = "error"
    OTHER = "other"
    UNKNOWN = "unknown"


class CopilotStatus(str, Enum):
    APPROVE = "approve"
    REJECT = "reject"
    REFINED = "refined"


class ToolCallOptions(str, Enum):
    TRANSLATE = "Translate"
    READ = "Read"
    LS = "LS"
    THINKING = "Thinking"


# Message-related types
@dataclass
class TextPart:
    type: Literal["text"] = "text"
    text: str = ""


@dataclass
class ToolCallPart:
    type: Literal["tool-call"] = "tool-call"
    toolCallId: str = ""
    toolName: str = ""
    args: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ToolResultPart:
    type: Literal["tool-result"] = "tool-result"
    toolCallId: str = ""
    toolName: str = ""
    result: Any = None
    isError: bool = False


# Union type for all message parts
MessagePart = Union[TextPart, ToolCallPart, ToolResultPart]


@dataclass
class CoreMessage:
    role: Literal["user", "assistant", "system"]
    content: List[MessagePart] = field(default_factory=list)


@dataclass
class UserModelMessage:
    role: Literal["user"] = "user"
    content: List[Union[TextPart]] = field(default_factory=list)


@dataclass
class AssistantModelMessage:
    role: Literal["assistant"] = "assistant"
    content: List[MessagePart] = field(default_factory=list)


@dataclass
class SystemModelMessage:
    role: Literal["system"] = "system"
    content: str = ""


# Union type for all model messages
ModelMessage = Union[UserModelMessage, AssistantModelMessage, SystemModelMessage]


# Copilot-related types
@dataclass
class CopilotRequest:
    tool: str
    src_string: str
    translate_string: str
    file_id: str


@dataclass
class CopilotResponse:
    tool: str
    status: str  # "approve" | "reject" | "refined"
    translated_string: str
    reason: str
    tool_call_id: Optional[str] = None


# Memory-related types
@dataclass
class MemoryItem:
    label: str
    tags: List[str]
    content: str


@dataclass
class Memory:
    terms: List[MemoryItem] = field(default_factory=list)
    styles: List[MemoryItem] = field(default_factory=list)
    preferences: List[MemoryItem] = field(default_factory=list)


# Tool execution result types
@dataclass
class ToolResult:
    type: Literal["tool-result"] = "tool-result"
    payload: Any = None


@dataclass
class CopilotRequestResult:
    type: Literal["copilot-request"] = "copilot-request"
    payload: CopilotRequest = None


# Agent response types
@dataclass
class AgentResponse:
    actor: str  # "user" | "agent"
    messages: List[Dict[str, Any]]
    unprocessedToolCalls: List[Dict[str, Any]]
    copilotRequests: List[Dict[str, Any]]
    finishReason: Optional[str] = None


# Session types
@dataclass
class Session:
    id: str
    messages: List[Dict[str, Any]] = field(default_factory=list)
    copilotResponses: List[Dict[str, Any]] = field(default_factory=list)
    created_at: Optional[str] = None


# API request/response types
@dataclass
class NextRequest:
    sessionId: Optional[str] = None
    userInput: Optional[str] = None
    copilotResponses: Optional[List[Dict[str, Any]]] = None


@dataclass
class NextResponse:
    sessionId: str
    agentResponse: Dict[str, Any]


# Tool options
@dataclass
class ToolOptions:
    memory: Optional[Any] = None
    cwd: str = "/"
