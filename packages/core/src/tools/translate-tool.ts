import { tool } from "ai";
import { z } from "zod";
import type { ToolExecutor } from "../types.js";

const description = `Create translation units for documents to be translated. According to the current context's requirements, select a limited amount of text each time for translation. During translation, follow the user's requirements including target language, tone, and terminology.

- Before translating a specific file, ensure the 'Read' tool has been used in the current context to read the file with the corresponding ID so you have the latest file contents.
- The 'src_string' must be unique in the original text; if it's not unique the translation will fail. You can ensure uniqueness by expanding the 'src_string' range.
- 'src_string' should contain only the current unit's content and must not include content from previously translated units.
- 'translate_string' is the draft translation of 'src_string' but should be as accurate as possible to reduce later manual proofreading.
- The returned 'translated_string' is the final translation after human review. 'status' indicates the human review state and can be 'approve', 'reject', or 'refined' (user manually adjusted).
- If 'reject' is due to 'src_string' not existing in the original text, verify the selected unit and ensure spacing and line breaks match.
- If 'reject' is due to 'src_string' being non-unique, gradually increase its scope until you find a unique match.
`;

const inputSchema = z.object({
  file_id: z.string().describe("The ID of the file being translated"),
  src_string: z.string().describe("The PARTIAL source string to translate"),
  translate_string: z
    .string()
    .describe("The draft translation of the source string"),
});

const outputSchema = z.object({
  translated_string: z
    .string()
    .describe("The translated string, with human review applied"),
  status: z
    .string()
    .describe(
      "The status of human review, one of 'approve', 'reject', or 'refined'",
    ),
  reason: z.string().describe("The reason for the status, if applicable"),
});

export const translateTool = tool({
  name: "Translate",
  description,
  inputSchema,
  outputSchema,
});

export const translateExecutor: ToolExecutor<
  z.infer<typeof inputSchema>,
  z.infer<typeof outputSchema>
> = async (input, options): Promise<z.infer<typeof outputSchema>> => {
  // check length
  if (input.src_string.length > 300) {
    return {
      translated_string: "",
      status: "reject",
      reason: "Source string exceeds maximum length of 300 characters",
    };
  }

  if (!options.copilotHandler) {
    // auto approve
    return {
      translated_string: input.translate_string,
      status: "approve",
      reason: "",
    };
  }

  const res = await options.copilotHandler(input);

  const { translated_string, status, reason } = res;

  if (status !== "approve" && options.memory) {
    await options.memory.extractMemory({
      req: input,
      res,
    });
  }

  return {
    translated_string,
    status,
    reason,
  };
};
