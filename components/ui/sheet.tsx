import * as React from "react";
import { createPortal } from "react-dom";
import { CloseOutlined } from "@ant-design/icons";
import { cn } from "@/lib/utils";

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Sheet: React.FC<SheetProps> = ({ isOpen, onClose, children }) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />
      {/* Sheet Content Panel */}
      <div className="relative w-full max-w-lg md:max-w-xl h-full border-l border-zinc-200 bg-white p-6 shadow-2xl transition-transform duration-300 ease-in-out dark:border-zinc-800 dark:bg-zinc-950 flex flex-col animate-in slide-in-from-right">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:pointer-events-none dark:focus:ring-zinc-300 text-zinc-500 dark:text-zinc-400"
        >
          <CloseOutlined className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
};

const SheetHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left border-b border-zinc-150 pb-4 dark:border-zinc-800",
      className
    )}
    {...props}
  />
);
SheetHeader.displayName = "SheetHeader";

const SheetTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  ...props
}) => (
  <h2
    className={cn(
      "text-lg font-semibold text-zinc-900 dark:text-zinc-50",
      className
    )}
    {...props}
  />
);
SheetTitle.displayName = "SheetTitle";

const SheetDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  ...props
}) => (
  <p
    className={cn("text-sm text-zinc-500 dark:text-zinc-400", className)}
    {...props}
  />
);
SheetDescription.displayName = "SheetDescription";

const SheetContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex-1 overflow-y-auto pt-4 space-y-6", className)}
    {...props}
  />
);
SheetContent.displayName = "SheetContent";

const SheetFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 border-t border-zinc-150 pt-4 dark:border-zinc-800",
      className
    )}
    {...props}
  />
);
SheetFooter.displayName = "SheetFooter";

export { Sheet, SheetHeader, SheetTitle, SheetDescription, SheetContent, SheetFooter };
