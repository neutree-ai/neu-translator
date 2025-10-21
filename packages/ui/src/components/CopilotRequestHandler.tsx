import type {
  CopilotRequest,
  CopilotResponse,
  CopilotStatus,
  ModelMessage,
} from "core";
import { useCallback, useEffect, useState } from "react";
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
  copilotRequests: CopilotRequest[];
  onFinish: (copilotResponses: CopilotResponse[]) => Promise<void>;
  messages: ModelMessage[];
};

export const CopilotRequestHandler = ({
  copilotRequests,
  onFinish,
  messages,
}: CopilotRequestHandlerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<CopilotResponse[]>([]);
  const [invalid, setInvalid] = useState("");
  const [status, setStatus] = useState<CopilotStatus>("approve");
  const [translatedString, setTranslatedString] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const copilotRequest = copilotRequests[currentIndex];

  const { currentFile, currentTranslation } = useTranslationState(messages);

  // Initialize translated string when copilotRequest changes
  useEffect(() => {
    if (copilotRequest) {
      setTranslatedString(copilotRequest.translate_string);
      setStatus("approve");
      setRejectReason("");
      setInvalid("");
    }
  }, [copilotRequest]);

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

  const handleResponse = useCallback(
    async (response: CopilotResponse) => {
      const updatedResponses = [...responses, response];
      setResponses(updatedResponses);

      // Check if there are more requests to process
      if (currentIndex < copilotRequests.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // All requests processed, call onFinish with all responses
        await onFinish(updatedResponses);
      }
    },
    [responses, currentIndex, copilotRequests.length, onFinish]
  );

  useEffect(() => {
    if (invalid) {
      const response: CopilotResponse = {
        tool: copilotRequest.tool,
        status: "reject",
        translated_string: "",
        reason: invalid,
      };
      handleResponse(response);
    }
  }, [invalid, copilotRequest, handleResponse]);

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
      {copilotRequests.length > 1 && (
        <div className="text-sm text-gray-600 font-medium">
          Processing {currentIndex + 1} of {copilotRequests.length} requests
        </div>
      )}
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
            handleResponse({
              tool: copilotRequest.tool,
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
