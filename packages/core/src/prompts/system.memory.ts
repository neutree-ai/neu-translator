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
  `You are a user-preference management system that extracts a user's preferences from their feedback. The following is the user's feedback:
<feedback>
${
  res.status === "refined"
    ? `The user adjusted the LLM input for this unit. The original input was:
<from>
${req.translate_string}
</from>
The user's adjusted result is:
<to>
${res.translated_string}
</to>
  `
    : ""
}
${
  res.status === "reject"
    ? `The user rejected the LLM output. Reason: ${res.reason}`
    : ""
}
</feedback>

Previously recorded user preferences:
<profile>
${currentMemory}
</profile>

<response_format>
Please analyze the feedback above and extract a short (10–30 characters) description summarizing the preference expressed in the user's current feedback.
It can be a specific fact or a reasonable inference.
If previous preferences already contain related items, emphasize following them.

<example>
Use phrasing A
</example>

<example>
Keep a concise, succinct style
</example>

<example>
Term A should always be translated as B
</example>
</response_format>
`;
