"use client";

import * as React from "react";
import { RobotOutlined } from "@ant-design/icons";
import { Button } from "@/components/ui/button";
import { ChatWindow } from "@/components/ai/ChatWindow";
import type { WorkforceDataset } from "@/data-pipeline";
import { computeDashboardData } from "./dashboard-view";

interface AiAssistantProps {
  dataset: WorkforceDataset;
  filteredData: ReturnType<typeof computeDashboardData>;
}

export function AiAssistant({ dataset, filteredData }: AiAssistantProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-2xl relative group transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          title="Open AI Assistant"
        >
          {/* Pulsing indicator ring */}
          <span className="absolute inset-0 rounded-full bg-zinc-900 dark:bg-zinc-50 opacity-20 animate-ping group-hover:animate-none" />
          <RobotOutlined className="text-[22px] text-emerald-450 dark:text-emerald-400 animate-pulse" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <ChatWindow
          onClose={() => setIsOpen(false)}
          dataset={dataset}
          filteredData={filteredData}
        />
      )}
    </div>
  );
}
