import * as React from "react";
import { CloseOutlined, RobotOutlined, DeleteOutlined } from "@ant-design/icons";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChatMessage, ChatMessageProps } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { SuggestedQuestions } from "./SuggestedQuestions";
import { getAssistantResponse } from "@/lib/ai/assistant";
import type { WorkforceDataset } from "@/data-pipeline";
import { computeDashboardData } from "@/components/dashboard/dashboard-view";

interface ChatWindowProps {
  onClose: () => void;
  dataset: WorkforceDataset;
  filteredData: ReturnType<typeof computeDashboardData>;
}

const INITIAL_MESSAGES: ChatMessageProps[] = [
  {
    role: "assistant",
    content: "Hello! I am **Pulse Copilot**, your local business intelligence assistant. Ask me any analytical question about labor leakages, department waste, weekly trends, or automation candidates, and I will calculate the metrics from the active dashboard filters.",
  },
];

export function ChatWindow({ onClose, dataset, filteredData }: ChatWindowProps) {
  const [messages, setMessages] = React.useState<ChatMessageProps[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of conversation
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = (text: string) => {
    if (!text.trim() || isLoading) return;

    // Add user message immediately
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setIsLoading(true);

    // Simulate standard assistant network delay for premium feel
    setTimeout(() => {
      try {
        const response = getAssistantResponse(text, filteredData, dataset);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: response.content },
        ]);
      } catch (err) {
        console.error("Local Assistant error:", err);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "I'm sorry, I encountered an error while analyzing that query from the active dataset." },
        ]);
      } finally {
        setIsLoading(false);
      }
    }, 900);
  };

  const handleClear = () => {
    setMessages(INITIAL_MESSAGES);
    setIsLoading(false);
  };

  return (
    <Card className="w-[calc(100vw-32px)] sm:w-[420px] h-[550px] flex flex-col shadow-2xl border-zinc-200 dark:border-zinc-800 bg-white/98 dark:bg-zinc-950/98 backdrop-blur-md rounded-2xl overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200">
      {/* Header */}
      <CardHeader className="p-4 bg-zinc-900 dark:bg-zinc-900 text-zinc-50 flex flex-row items-center justify-between space-y-0 select-none">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-emerald-400">
            <RobotOutlined className="text-[18px]" />
          </div>
          <div className="flex flex-col">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-zinc-50">
              <span>Pulse Copilot</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </CardTitle>
            <span className="text-[10px] text-zinc-400 font-semibold">Local Productivity Advisor</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              title="Clear Conversation"
              className="h-8 w-8 rounded-full text-zinc-400 hover:text-zinc-50 hover:bg-white/10 cursor-pointer"
            >
              <DeleteOutlined className="text-[14px]" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            title="Close Assistant"
            className="h-8 w-8 rounded-full text-zinc-400 hover:text-zinc-50 hover:bg-white/10 cursor-pointer"
          >
            <CloseOutlined className="text-[14px]" />
          </Button>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50 dark:bg-zinc-950/30"
      >
        {messages.map((msg, index) => (
          <ChatMessage key={index} role={msg.role} content={msg.content} />
        ))}

        {isLoading && (
          <div className="flex gap-3 items-start justify-start w-full animate-pulse">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-700 text-zinc-400">
              <RobotOutlined className="text-[14px] opacity-40" />
            </div>
            <div className="flex-1 space-y-2.5 max-w-[80%] bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 rounded-2xl rounded-tl-xs p-3.5 shadow-xs">
              <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded-full w-2/3" />
              <div className="h-3 bg-zinc-100 dark:bg-zinc-850 rounded-full w-full" />
              <div className="h-3 bg-zinc-100 dark:bg-zinc-850 rounded-full w-5/6" />
              <div className="h-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-full w-1/2" />
            </div>
          </div>
        )}
      </CardContent>

      {/* Clickable Predefined Suggested Questions */}
      <SuggestedQuestions onSelectQuestion={handleSend} disabled={isLoading} />

      {/* Input Field */}
      <CardFooter className="p-3 bg-white dark:bg-zinc-950 border-t border-zinc-150 dark:border-zinc-900">
        <ChatInput onSend={handleSend} isLoading={isLoading} />
      </CardFooter>
    </Card>
  );
}
