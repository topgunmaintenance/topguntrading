import { forwardRef, type LabelHTMLAttributes } from "react";
import { cn } from "./lib/cn.js";

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "text-xs font-medium uppercase tracking-wider text-text-secondary",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);
Label.displayName = "Label";
