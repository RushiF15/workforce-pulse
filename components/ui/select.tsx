"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { DownOutlined } from "@ant-design/icons";

export interface SelectProps {
  label?: string;
  value?: string;
  onChange?: (e: { target: { value: string } }) => void;
  children?: React.ReactNode;
  className?: string;
}

export function Select({ label, value, onChange, children, className }: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Parse React children (expecting option tags) into structured lists
  const options = React.useMemo(() => {
    const list: { value: string; label: string }[] = [];
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        const element = child as React.ReactElement<{ value?: any; children?: React.ReactNode }>;
        if (element.props.value !== undefined) {
          list.push({
            value: String(element.props.value),
            label: String(element.props.children || element.props.value),
          });
        }
      }
    });
    return list;
  }, [children]);

  // Handle clicking outside to close the dropdown
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  const handleSelect = (val: string) => {
    if (onChange) {
      onChange({ target: { value: val } });
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full select-none">
      {label && (
        <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1 block">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-1 text-sm shadow-xs transition-colors hover:bg-zinc-50/50 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900/50 dark:focus-visible:ring-zinc-300 text-left cursor-pointer",
            className
          )}
        >
          <span className="truncate text-zinc-800 dark:text-zinc-200 font-medium">
            {selectedOption ? selectedOption.label : "Select..."}
          </span>
          <DownOutlined className={cn("h-2.5 w-2.5 text-zinc-400 transition-transform duration-200", isOpen && "rotate-180")} />
        </button>

        {isOpen && (
          <div className="absolute left-0 z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950 animate-in fade-in slide-in-from-top-1 duration-150">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900 transition-colors font-medium",
                    isSelected && "bg-zinc-100 text-zinc-900 font-bold dark:bg-zinc-900 dark:text-zinc-100"
                  )}
                >
                  {opt.label}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
