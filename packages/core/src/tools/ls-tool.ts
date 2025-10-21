import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { tool } from "ai";
import { z } from "zod";
import type { ToolExecutor } from "../types.js";

const description = `Lists files and directories in a given path. The path parameter must be an absolute path, not a relative path. You can optionally provide an array of glob patterns to ignore with the ignore parameter. You should generally prefer the Glob and Grep tools, if you know which directories to search.`;

const inputSchema = z.object({
  path: z
    .string()
    .describe(
      "The absolute path to the directory to list (must be absolute, not relative)"
    ),
  ignore: z
    .array(z.string())
    .optional()
    .describe("List of glob patterns to ignore"),
});

const outputSchema = z.object({
  entries: z.array(
    z.object({
      name: z.string().describe("The name of the file or directory"),
      type: z
        .enum(["file", "directory"])
        .describe("Whether this is a file or directory"),
      path: z.string().describe("The full path to the entry"),
    })
  ),
});

export const lsTool = tool({
  name: "LS",
  description,
  inputSchema,
  outputSchema,
});

export const lsExecutor: ToolExecutor<
  z.infer<typeof inputSchema>,
  z.infer<typeof outputSchema>
> = async (input, options) => {
  const { path, ignore = [] } = input;

  try {
    const names = await readdir(path);
    const entries = await Promise.all(
      names.map(async (name) => {
        const fullPath = join(path, name);
        const stats = await stat(fullPath);

        return {
          name,
          type: stats.isDirectory()
            ? ("directory" as const)
            : ("file" as const),
          path: fullPath,
        };
      })
    );

    // Filter out ignored patterns if provided
    const filteredEntries =
      ignore.length > 0
        ? entries.filter(
            (entry) =>
              !ignore.some(
                (pattern) =>
                  entry.name.includes(pattern) || entry.path.includes(pattern)
              )
          )
        : entries;

    return {
      type: "tool-result",
      payload: { entries: filteredEntries },
    };
  } catch (error) {
    throw new Error(
      `Failed to list directory ${path}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};
