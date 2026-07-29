import * as React from "react";
import { SendOutlined, EnterOutlined } from "@ant-design/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatInputProps {
  onSend: (text: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, isLoading, placeholder = "Ask your assistant..." }: ChatInputProps) {
  const [value, setValue] = React.useState("");

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!value.trim() || isLoading) return;
    onSend(value);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
      <div className="relative flex-1">
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          className="pr-14 text-xs rounded-full border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 focus:bg-white dark:bg-zinc-900/30 dark:focus:bg-zinc-950 h-9"
        />
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-zinc-400 dark:text-zinc-500 hidden sm:flex items-center gap-0.5 border border-zinc-200 dark:border-zinc-800 px-1 rounded-sm bg-white dark:bg-zinc-900 select-none">
          <span>Enter</span>
          <EnterOutlined className="text-[9px]" />
        </span>
      </div>
      <Button
        type="submit"
        size="icon"
        disabled={!value.trim() || isLoading}
        className="h-9 w-9 rounded-full shrink-0 bg-zinc-900 hover:bg-zinc-800 text-zinc-50 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 cursor-pointer transition-transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
      >
        <SendOutlined className="text-[14px]" />
      </Button>
    </form>
  );
}
