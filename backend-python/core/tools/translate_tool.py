"""Translate tool for creating translation units."""

from typing import Dict, Any, Optional

# Tool definition
translate_tool = {
    "type": "function",
    "function": {
        "name": "Translate",
        "description": """Create translation units for documents to be translated. According to the current context's requirements, select a limited amount of text each time for translation. During translation, follow the user's requirements including target language, tone, and terminology.

- Before translating a specific file, ensure the 'Read' tool has been used in the current context to read the file with the corresponding ID so you have the latest file contents.
- The 'src_string' must be unique in the original text; if it's not unique the translation will fail. You can ensure uniqueness by expanding the 'src_string' range.
- 'src_string' should contain only the current unit's content and must not include content from previously translated units.
- 'translate_string' is the draft translation of 'src_string' but should be as accurate as possible to reduce later manual proofreading.
- The returned 'translated_string' is the final translation after human review. 'status' indicates the human review state and can be 'approve', 'reject', or 'refined' (user manually adjusted).
- If 'reject' is due to 'src_string' not existing in the original text, verify the selected unit and ensure spacing and line breaks match.
- If 'reject' is due to 'src_string' being non-unique, gradually increase its scope until you find a unique match.""",
        "parameters": {
            "type": "object",
            "properties": {
                "file_id": {
                    "type": "string",
                    "description": "The ID of the file being translated",
                },
                "src_string": {
                    "type": "string",
                    "description": "The PARTIAL source string to translate",
                },
                "translate_string": {
                    "type": "string",
                    "description": "The draft translation of the source string",
                },
            },
            "required": ["file_id", "src_string", "translate_string"],
        },
    },
}


async def translate_executor(
    input_data: Dict[str, Any],
    options: Dict[str, Any],
    copilot_response: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Execute the translate tool.

    Args:
        input_data: Tool input with file_id, src_string, translate_string
        options: Tool execution options (memory, name, callId)
        copilot_response: User's response if this is a second-round execution

    Returns:
        Either a copilot-request or tool-result
    """
    # Check length constraint
    if len(input_data.get("src_string", "")) > 300:
        return {
            "type": "tool-result",
            "payload": {
                "translated_string": "",
                "status": "reject",
                "reason": "Source string exceeds maximum length of 300 characters",
            },
        }

    # Prepare copilot request
    copilot_req = {
        "tool": options.get("name", "Translate"),
        "file_id": input_data.get("file_id", ""),
        "src_string": input_data.get("src_string", ""),
        "translate_string": input_data.get("translate_string", ""),
        "tool_call_id": options.get("callId", ""),
    }

    # First round: no copilot response yet, return copilot-request
    if not copilot_response:
        return {
            "type": "copilot-request",
            "payload": copilot_req,
        }

    # Second round: we have copilot response, extract memory if needed
    translated_string = copilot_response.get("translated_string", "")
    status = copilot_response.get("status", "")
    reason = copilot_response.get("reason", "")

    # Extract memory if user rejected or refined the translation
    if status != "approve" and options.get("memory"):
        await options["memory"].extract_memory(copilot_req, copilot_response)

    # Return the final tool result
    return {
        "type": "tool-result",
        "payload": {
            "translated_string": translated_string,
            "status": status,
            "reason": reason,
        },
    }
