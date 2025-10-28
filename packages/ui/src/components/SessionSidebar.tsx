"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";

type SessionListItem = {
  id: string;
  messageCount: number;
  copilotResponseCount: number;
};

type SessionSidebarProps = {
  currentSessionId: string | null;
  onSelectSession: (sessionId: string | null) => void;
};

export const SessionSidebar = ({
  currentSessionId,
  onSelectSession,
}: SessionSidebarProps) => {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/sessions");
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  return (
    <div className="w-64 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <Button
          onClick={() => onSelectSession(null)}
          className="w-full"
          variant={currentSessionId === null ? "default" : "outline"}
        >
          New Session
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {loading ? (
            <div className="text-center text-sm text-gray-500 py-4">
              Loading...
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center text-sm text-gray-500 py-4">
              No sessions yet
            </div>
          ) : (
            <div className="space-y-1">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    currentSessionId === session.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="font-medium truncate">
                    Session {session.id.slice(0, 8)}
                  </div>
                  <div className="text-xs opacity-70 mt-1">
                    {session.messageCount} messages
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-2 border-t border-gray-200 dark:border-gray-800">
        <Button
          onClick={loadSessions}
          variant="ghost"
          className="w-full text-xs"
          size="sm"
        >
          Refresh
        </Button>
      </div>
    </div>
  );
};
