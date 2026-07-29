import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 dark:focus:ring-zinc-300",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200",
        secondary:
          "border-transparent bg-zinc-100 text-zinc-900 hover:bg-zinc-250 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700",
        destructive:
          "border-transparent bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400",
        outline: "text-zinc-950 dark:text-zinc-50 border-zinc-200 dark:border-zinc-800",
        success:
          "border-transparent bg-emerald-100 text-emerald-700 hover:bg-emerald-250 dark:bg-emerald-950/30 dark:text-emerald-400",
        warning:
          "border-transparent bg-amber-100 text-amber-700 hover:bg-amber-250 dark:bg-amber-950/30 dark:text-amber-400",
        info:
          "border-transparent bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
