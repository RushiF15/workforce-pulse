"use client";

import * as React from "react";
import { SearchOutlined, DownloadOutlined } from "@ant-design/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";

import Link from "next/link";

interface NavbarProps {
  onSearchChange?: (val: string) => void;
  onExportClick?: () => void;
  title?: string;
}

export function Navbar({ onSearchChange, onExportClick, title = "Workforce Pulse" }: NavbarProps) {
  const [searchVal, setSearchVal] = React.useState("");

  // Force light theme
  React.useEffect(() => {
    localStorage.setItem("theme", "light");
    document.documentElement.classList.remove("dark");
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchVal(value);
    onSearchChange?.(value);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/80 backdrop-blur-md transition-colors duration-250">
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left: Brand and Logo */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <img
              src="/logo.png"
              alt="Workforce Pulse Logo"
              className="h-8 md:h-9 w-auto object-contain rounded-xs"
            />
            <div>
              <h1 className="text-lg font-bold tracking-tight text-zinc-900 sm:text-xl">
                {title}
              </h1>
              {/* <span className="hidden sm:inline text-2xs font-semibold uppercase tracking-wider text-zinc-400">
                Executive Analytics
              </span> */}
            </div>
          </div>

        {/* Right: Actions and Avatar */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Export Button (UI only) */}
          <Button
            variant="outline"
            size="sm"
            onClick={onExportClick}
            className="h-9 px-3 gap-1.5 hover:bg-zinc-50 border-zinc-200 rounded-lg text-xs md:text-sm font-medium"
          >
            <DownloadOutlined className="text-[14px]" />
            <span className="hidden sm:inline">Export Data</span>
          </Button>

          {/* User Profile */}
          <div className="h-6 w-px bg-zinc-200 hidden xs:block" />

          {/* <div className="flex items-center gap-2.5 pl-1.5">
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                User
              </span>
            </div>
            <Avatar fallback="U" src="" className="h-9 w-9 hover:opacity-85 cursor-pointer ring-2 ring-offset-2 ring-zinc-900/10 dark:ring-white/10" />
          </div> */}
        </div>
      </div>
    </div>
  </header>
  );
}
