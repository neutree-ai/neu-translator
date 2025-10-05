import { type ModelMessage } from "core";

export const truncateValue = (value: any): any => {
  if (typeof value === "string" && value.length > 50) {
    return value.substring(0, 50) + "...";
  }

  if (Array.isArray(value)) {
    return value.map(truncateValue);
  }

  if (typeof value === "object" && value !== null) {
    const truncated: any = {};
    for (const [key, val] of Object.entries(value)) {
      truncated[key] = truncateValue(val);
    }
    return truncated;
  }

  return value;
};

export function unifyParts(
  content: ModelMessage["content"]
): Exclude<ModelMessage["content"], string> {
  if (typeof content === "string") {
    return [
      {
        type: "text",
        text: content,
      },
    ];
  }

  return content.slice().sort((a, b) => {
    // reasoning first
    if (a.type === "reasoning" && b.type !== "reasoning") {
      return -1;
    }
    if (a.type !== "reasoning" && b.type === "reasoning") {
      return 1;
    }
    return 0;
  });
}
