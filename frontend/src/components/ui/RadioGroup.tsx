"use client";

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Field } from "./Input";

export const RadioGroup = forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(function RadioGroup({ className, ...props }, ref) {
  return <RadioGroupPrimitive.Root ref={ref} className={cn("grid gap-2.5", className)} {...props} />;
});

export const RadioGroupItem = forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(function RadioGroupItem({ className, ...props }, ref) {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "aspect-square size-4 shrink-0 rounded-full border border-input bg-card shadow-sm transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "data-[state=checked]:border-primary-600 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex h-full w-full items-center justify-center">
        <span className="size-2 rounded-full bg-primary-600" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});

export interface RadioOption {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

/**
 * Card-style radio list — used for result strategy, access level and
 * access-code / visibility choices where the copy matters.
 */
export function RadioCardGroup({
  value,
  onValueChange,
  options,
  label,
  error,
  hint,
  required,
  className,
  name,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: RadioOption[];
  label?: ReactNode;
  error?: string | null;
  hint?: ReactNode;
  required?: boolean;
  className?: string;
  name?: string;
}) {
  return (
    <Field label={label} required={required} error={error} hint={hint} className={className}>
      <RadioGroup value={value} onValueChange={onValueChange} name={name}>
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors",
              "hover:bg-muted",
              value === option.value && "border-primary-500 bg-primary-50/60 dark:bg-primary-950/30",
              option.disabled && "cursor-not-allowed opacity-60",
            )}
          >
            <RadioGroupItem value={option.value} disabled={option.disabled} className="mt-0.5" />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground">{option.label}</span>
              {option.description && (
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {option.description}
                </span>
              )}
            </span>
          </label>
        ))}
      </RadioGroup>
    </Field>
  );
}