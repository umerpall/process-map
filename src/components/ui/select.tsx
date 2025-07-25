import * as React from "react";
import { cn } from "../../lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  onValueChange?: (value: string) => void;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, onValueChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (onChange) {
        onChange(e);
      }
      if (onValueChange) {
        onValueChange(e.target.value);
      }
    };

    return (
      <select
        className={cn(
          "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        onChange={handleChange}
        {...props}
      >
        {children}
      </select>
    );
  },
);
Select.displayName = "Select";

// Simple SelectTrigger component for API compatibility
const SelectTrigger = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <Select className={className} ref={ref} {...props}>
        {children}
      </Select>
    );
  },
);
SelectTrigger.displayName = "SelectTrigger";

// Simple SelectContent component (wrapper for options)
const SelectContent = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

// Simple SelectItem component
const SelectItem = React.forwardRef<
  HTMLOptionElement,
  React.OptionHTMLAttributes<HTMLOptionElement>
>(({ className, children, ...props }, ref) => {
  return (
    <option
      className={cn("relative cursor-default select-none", className)}
      ref={ref}
      {...props}
    >
      {children}
    </option>
  );
});
SelectItem.displayName = "SelectItem";

// Simple SelectValue component (placeholder option)
const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  return (
    <option value="" disabled>
      {placeholder || "Select an option..."}
    </option>
  );
};

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue };
