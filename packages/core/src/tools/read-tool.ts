import { tool } from "ai";
import { z } from "zod";
import { readFile } from "fs/promises";
import type { ToolExecutor } from "../types.js";

const description = `Reads a file from the local filesystem. You can access any file directly by using this tool.

Assume this tool is able to read all files on the machine. If the User provides a path to a file assume that path is valid. It is okay to read a file that does not exist; an error will be returned.

Usage:
- The file_path parameter must be an absolute path, not a relative path
- By default, it reads up to 2000 lines starting from the beginning of the file
- You can optionally specify a line offset and limit (especially handy for long files), but it's recommended to read the whole file by not providing these parameters
- Any lines longer than 2000 characters will be truncated
- This tool allows Claude Code to read images (eg PNG, JPG, etc). When reading an image file the contents are presented visually as Claude Code is a multimodal LLM.
- This tool can read PDF files (.pdf). PDFs are processed page by page, extracting both text and visual content for analysis.
- For Jupyter notebooks (.ipynb files), use the NotebookRead instead
- You have the capability to call multiple tools in a single response. It is always better to speculatively read multiple files as a batch that are potentially useful.
- You will regularly be asked to read screenshots. If the user provides a path to a screenshot ALWAYS use this tool to view the file at the path. This tool will work with all temporary file paths like /var/folders/123/abc/T/TemporaryItems/NSIRD_screencaptureui_ZfB1tD/Screenshot.png
- If you read a file that exists but has empty contents you will receive a system reminder warning in place of file contents.`;

const inputSchema = z.object({
  file_path: z.string().describe("The absolute path to the file to read"),
});

const outputSchema = z.object({
  content: z.string().describe("The content of the file"),
});

export const readTool = tool({
  name: "Read",
  description,
  inputSchema,
  outputSchema,
});

export const readExecutor: ToolExecutor<
  z.infer<typeof inputSchema>,
  z.infer<typeof outputSchema>
> = async (input) => {
  try {
    const content = await readFile(input.file_path, "utf-8");
    return { content };
  } catch (error) {
    throw new Error(
      `Failed to read file: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
};
