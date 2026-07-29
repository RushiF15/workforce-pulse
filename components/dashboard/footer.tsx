import * as React from "react";
import { SafetyCertificateOutlined, ControlOutlined } from "@ant-design/icons";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-zinc-200/80 bg-zinc-50/50 py-6 px-4 md:px-8 dark:border-zinc-800/80 dark:bg-zinc-950/20 mt-auto transition-colors duration-250 select-none">
      <div className="mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-semibold text-zinc-500 dark:text-zinc-500">
        {/* Left: Brand info */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
          <span>
            &copy; {currentYear} Workforce Pulse. All rights reserved.
          </span>
          <span className="hidden sm:inline text-zinc-350 dark:text-zinc-800">|</span>
          <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500">
            <SafetyCertificateOutlined className="text-emerald-600 dark:text-emerald-450 text-[14px]" />
            <span>SOC2 Compliant</span>
          </div>
        </div>

        {/* Center: System status/details */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-150/40 dark:bg-zinc-900/40 text-3xs border border-zinc-200/30 dark:border-zinc-800/30">
          <ControlOutlined className="text-zinc-400 text-[12px]" />
          <span>Pulse Engine v1.0.4 • Uptime 99.98%</span>
        </div>

        {/* Right: Policy Links */}
        <div className="flex items-center justify-center gap-5 sm:gap-6 font-semibold">
          <a
            href="#"
            className="hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors"
          >
            System Status
          </a>
          <a
            href="#"
            className="hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors"
          >
            Security Policy
          </a>
          <a
            href="#"
            className="hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors"
          >
            Privacy Policy
          </a>
          <a
            href="#"
            className="hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors"
          >
            Support Docs
          </a>
        </div>
      </div>
    </footer>
  );
}
