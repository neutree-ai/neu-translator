import type {
  CopilotRequest,
  CopilotResponse,
  CopilotStatus,
  ModelMessage,
} from "core";
import type React from "react";
import { useEffect, useState } from "react";
import {
  countOccurrences,
  getContextualDisplay,
  useTranslationState,
} from "react-shared";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Input } from "./ui/input";

type CopilotRequestHandlerProps = {
  copilotRequest: CopilotRequest;
  onFinish: (copilotResponse: CopilotResponse) => Promise<void>;
  messages: ModelMessage[];
};

export const CopilotRequestHandler = ({
  copilotRequest,
  onFinish,
  messages,
}: CopilotRequestHandlerProps) => {
  const [invalid, setInvalid] = useState("");
  const [status, setStatus] = useState<CopilotStatus>("approve");
  const [translatedString, setTranslatedString] = useState(
    copilotRequest.translate_string
  );
  const [rejectReason, setRejectReason] = useState("");

  const { currentFile, currentTranslation } = useTranslationState(messages);

  useEffect(() => {
    if (!currentFile) {
      setInvalid("No file selected");
      return;
    }

    const matches = countOccurrences(currentFile, copilotRequest.src_string);

    if (matches === 0) {
      setInvalid("Source string not found in file");
      return;
    }

    if (matches > 1) {
      setInvalid("Source string is not unique in file");
      return;
    }
  }, [currentFile, copilotRequest]);

  useEffect(() => {
    if (invalid) {
      onFinish({
        status: "reject",
        translated_string: "",
        reason: invalid,
      });
    }
  }, [invalid, onFinish]);

  if (!currentFile) {
    return <div className="text-red-500">No file selected</div>;
  }

  if (invalid) {
    return (
      <div className="text-red-500">Invalid copilot request: {invalid}</div>
    );
  }

  const contextDisplay = getContextualDisplay(
    currentFile,
    copilotRequest.src_string,
    currentTranslation.src
  );

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex gap-1 flex-1">
        <pre className="border border-solid w-1/2 flex flex-col p-2 rounded-lg wrap-break-word whitespace-break-spaces">
          {contextDisplay.beforeText && (
            <span className="text-gray-500">{contextDisplay.beforeText}</span>
          )}
          {contextDisplay.hasGap && (
            <span className="text-red-600">{contextDisplay.gapText}</span>
          )}
          <span className="text-blue-600">{contextDisplay.srcText}</span>
          {contextDisplay.afterText && (
            <span className="text-gray-500">{contextDisplay.afterText}</span>
          )}
        </pre>
        <Textarea
          className={cn(
            "text-green-600 border border-solid w-1/2 p-2 md:text-lg",
            status === "reject" && "bg-gray-200 text-gray-400"
          )}
          value={translatedString}
          onChange={(e) => {
            const translatedString = e.target.value;
            setTranslatedString(translatedString);

            if (translatedString !== copilotRequest.translate_string) {
              setStatus("refined");
            }
          }}
          disabled={status === "reject"}
        ></Textarea>
      </div>
      <div className="gap-1 flex-col flex">
        <div className="flex gap-2">
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as CopilotStatus);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Theme" />
            </SelectTrigger>
            <SelectContent>
              {[
                {
                  label: "Approve",
                  value: "approve",
                },
                {
                  label: "Reject",
                  value: "reject",
                },
                {
                  label: "Refine",
                  value: "refined",
                },
              ].map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {status === "reject" && (
            <Input
              placeholder="Please provide a reason for rejection:"
              className="bg-red-100"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          )}
        </div>
        <Button
          onClick={() => {
            onFinish({
              status,
              translated_string: translatedString,
              reason: status === "reject" ? rejectReason : "",
            });
          }}
        >
          Confirm
        </Button>
      </div>
    </div>
  );
};
