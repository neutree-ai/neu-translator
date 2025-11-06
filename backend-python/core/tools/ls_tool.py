"""LS tool for listing directory contents."""

import os
from typing import Dict, Any, Optional, List

# Tool definition
ls_tool = {
    "type": "function",
    "function": {
        "name": "LS",
        "description": """Lists files and directories in a given path. The path parameter must be an absolute path, not a relative path. You can optionally provide an array of glob patterns to ignore with the ignore parameter. You should generally prefer the Glob and Grep tools, if you know which directories to search.""",
        "parameters": {
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "The absolute path to the directory to list (must be absolute, not relative)",
                },
                "ignore": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of glob patterns to ignore",
                },
            },
            "required": ["path"],
        },
    },
}


async def ls_executor(
    input_data: Dict[str, Any],
    options: Dict[str, Any],
    copilot_response: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Execute the LS tool.

    Args:
        input_data: Tool input with path and optional ignore patterns
        options: Tool execution options
        copilot_response: Not used for this tool

    Returns:
        Tool result with directory entries
    """
    try:
        path = input_data.get("path", "")
        ignore_patterns = input_data.get("ignore", [])

        # List directory contents
        names = os.listdir(path)

        entries = []
        for name in names:
            full_path = os.path.join(path, name)
            is_dir = os.path.isdir(full_path)

            entry = {
                "name": name,
                "type": "directory" if is_dir else "file",
                "path": full_path,
            }

            # Filter out ignored patterns
            should_ignore = False
            for pattern in ignore_patterns:
                if pattern in name or pattern in full_path:
                    should_ignore = True
                    break

            if not should_ignore:
                entries.append(entry)

        return {
            "type": "tool-result",
            "payload": {"entries": entries},
        }
    except Exception as error:
        raise Exception(f"Failed to list directory {path}: {str(error)}")
