import * as React from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback: string;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, ...props }, ref) => {
    const [hasError, setHasError] = React.useState(false);

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800/85",
          className
        )}
        {...props}
      >
        {src && !hasError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt || "Avatar"}
            className="aspect-square h-full w-full object-cover"
            onError={() => setHasError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            {fallback}
          </div>
        )}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";

export { Avatar };
