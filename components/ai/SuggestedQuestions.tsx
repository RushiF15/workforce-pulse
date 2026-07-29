import * as React from "react";

interface SuggestedQuestionsProps {
  onSelectQuestion: (question: string) => void;
  disabled: boolean;
}

const QUESTIONS = [
  "Which department wastes the most time?",
  "Who spends the most time on repetitive work?",
  "Which task should be automated first?",
  "Which app consumes the most employee time?",
  "Show Finance department insights.",
  "Show Sales department insights.",
  "What are the estimated recoverable hours?",
  "What are the estimated monthly cost savings?",
];

export function SuggestedQuestions({ onSelectQuestion, disabled }: SuggestedQuestionsProps) {
  return (
    <div className="px-4 py-2 bg-zinc-50/50 dark:bg-zinc-950/30 flex flex-wrap gap-1.5 border-t border-zinc-150/40 dark:border-zinc-900/40 select-none max-h-[85px] overflow-y-auto">
      {QUESTIONS.map((question, idx) => (
        <button
          key={idx}
          onClick={() => onSelectQuestion(question)}
          disabled={disabled}
          className="text-[10px] font-bold text-zinc-650 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none text-left"
        >
          {question}
        </button>
      ))}
    </div>
  );
}
