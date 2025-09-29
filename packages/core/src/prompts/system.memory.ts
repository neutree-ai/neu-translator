import { CopilotRequest, CopilotResponse } from "../types.js";

export const SYSTEM_MEMORY = ({
  req,
  res,
  currentMemory,
}: {
  req: CopilotRequest;
  res: CopilotResponse;
  currentMemory: string;
}) =>
  `
You are a memory engine that extracts durable user preferences from the current feedback
and updates the memory base in one pass (extract → decide → upsert).

Input
<feedback>
Status: ${res.status}
FileID: ${req.file_id}
${
  res.status === "refined"
    ? `User adjusted the LLM input.
<from>
${req.translate_string}
</from>
<to>
${res.translated_string}
</to>`
    : ""
}
${
  res.status === "reject"
    ? `User rejected the LLM output. Reason: ${res.reason}`
    : ""
}
</feedback>

<previous_profile>
${currentMemory}
</previous_profile>

Rules
- Extract only durable, reusable preferences (terminology mapping, style/tone rules, stable choices).
- Ignore temporary or one-off details.
- For each memory item, write the 'text' as a full instruction sentence
  that already includes when/where this rule applies, and give a short inline example.
- Keep the text concise but self-contained (≤120 chars).
- Tags: use a small fixed set to reduce options:
  ["terminology","style","preference"].

Output
Return strict JSON:
{
  "ops": [
    {
      "action": "add" | "update" | "delete",
      "index": number,            // index of the existing memory item to update/delete; for add use -1
      "text": "string",           // for add or update: the new or updated memory text
      "tags": ["terminology"|"style"|"preference"] // for add or update
    }
  ]
}

Rules for actions
- "add": for a new stable preference not in current_memory (index = -1).
- "update": when a current memory needs refinement or correction.
- "delete": when a current memory is invalid or contradicted.
- Do not output anything else except the JSON above.

Return strict JSON only, no commentary.
`;
