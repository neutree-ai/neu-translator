"""Read tool for reading files from the filesystem."""

from typing import Dict, Any, Optional

# Tool definition
read_tool = {
    "type": "function",
    "function": {
        "name": "Read",
        "description": """Reads a file from the local filesystem. You can access any file directly by using this tool.

Assume this tool is able to read all files on the machine. If the User provides a path to a file assume that path is valid. It is okay to read a file that does not exist; an error will be returned.

Usage:
- The file_path parameter must be an absolute path, not a relative path
- By default, it reads up to 2000 lines starting from the beginning of the file
- You can optionally specify a line offset and limit (especially handy for long files), but it's recommended to read the whole file by not providing these parameters
- Any lines longer than 2000 characters will be truncated
- You have the capability to call multiple tools in a single response. It is always better to speculatively read multiple files as a batch that are potentially useful.""",
        "parameters": {
            "type": "object",
            "properties": {
                "file_path": {
                    "type": "string",
                    "description": "The absolute path to the file to read",
                },
            },
            "required": ["file_path"],
        },
    },
}


async def read_executor(
    input_data: Dict[str, Any],
    options: Dict[str, Any],
    copilot_response: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Execute the read tool.

    Args:
        input_data: Tool input with file_path
        options: Tool execution options
        copilot_response: Not used for this tool

    Returns:
        Tool result with file content
    """
    try:
        file_path = input_data.get("file_path", "")

        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        return {
            "type": "tool-result",
            "payload": {"content": content},
        }
    except Exception as error:
        raise Exception(f"Failed to read file: {str(error)}")
