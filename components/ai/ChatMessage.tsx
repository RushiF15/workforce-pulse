import * as React from "react";
import { RobotOutlined, UserOutlined } from "@ant-design/icons";
import { cn } from "@/lib/utils";

export interface ChatMessageProps {
  role: "user" | "assistant" | "system";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isBot = role === "assistant" || role === "system";

  const renderFormattedText = (text: string) => {
    // 1. Check for markdown tables
    if (text.includes("|")) {
      const lines = text.split("\n");
      const tableLines = lines.filter((line) => line.trim().startsWith("|") && line.trim().endsWith("|"));
      
      if (tableLines.length >= 3) {
        // Parse table header, separator, and rows
        const parsedRows = tableLines.map((line) =>
          line
            .split("|")
            .map((cell) => cell.trim())
            .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
        );

        const headers = parsedRows[0];
        const rows = parsedRows.slice(2);

        return (
          <div className="overflow-x-auto my-3 border border-zinc-200 dark:border-zinc-800 rounded-lg">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-left text-[11px]">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  {headers.map((h, i) => (
                    <th key={i} className="px-3 py-2 font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-zinc-950 divide-y divide-zinc-150 dark:divide-zinc-900">
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-2 text-zinc-650 dark:text-zinc-300 font-medium">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
    }

    // 2. Render standard paragraphs with bold text replacement and bullet lists
    return text.split("\n").map((line, lineIdx) => {
      let trimmed = line.trim();
      if (!trimmed) return <div key={lineIdx} className="h-2" />;

      if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
        const textVal = trimmed.substring(2);
        return (
          <ul key={lineIdx} className="list-disc pl-5 my-1 text-xs">
            <li>{parseBoldText(textVal)}</li>
          </ul>
        );
      }

      // Check if it's a heading
      if (trimmed.startsWith("### ")) {
        return (
          <h4 key={lineIdx} className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-3 mb-1">
            {parseBoldText(trimmed.substring(4))}
          </h4>
        );
      }

      return (
        <p key={lineIdx} className="my-1.5 leading-relaxed text-xs">
          {parseBoldText(trimmed)}
        </p>
      );
    });
  };

  const parseBoldText = (text: string) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="font-extrabold text-zinc-900 dark:text-zinc-100">{part}</strong>;
      }
      return part;
    });
  };

  return (
    <div
      className={cn(
        "flex w-full gap-3 items-start",
        isBot ? "justify-start" : "justify-end animate-in fade-in duration-200"
      )}
    >
      {isBot && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 border border-zinc-250 dark:bg-zinc-900 dark:border-zinc-800 text-zinc-700 dark:text-zinc-355 shadow-xs">
          <RobotOutlined className="text-[14px]" />
        </div>
      )}

      <div
        className={cn(
          "rounded-2xl px-4 py-2.5 max-w-[85%] sm:max-w-[78%] shadow-xs leading-relaxed break-words text-xs border",
          isBot
            ? "bg-white border-zinc-200 text-zinc-800 dark:bg-zinc-900 dark:border-zinc-800/80 dark:text-zinc-200 rounded-tl-xs"
            : "bg-zinc-900 border-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:border-zinc-50 dark:text-zinc-950 rounded-tr-xs font-medium"
        )}
      >
        {renderFormattedText(content)}
      </div>

      {!isBot && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 border border-zinc-850 text-zinc-50 dark:bg-zinc-100 dark:border-zinc-200 dark:text-zinc-950 shadow-xs">
          <UserOutlined className="text-[14px]" />
        </div>
      )}
    </div>
  );
}
