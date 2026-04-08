import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "./lib/cn.js";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-border-subtle bg-bg-sunken px-3",
          "text-sm text-text-primary placeholder:text-text-muted",
          "transition-colors duration-150",
          "focus-visible:border-accent-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-primary",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
