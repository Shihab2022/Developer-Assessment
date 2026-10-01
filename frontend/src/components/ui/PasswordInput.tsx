"use client";

import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Field, Input } from "./Input";

export interface PasswordInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
  error?: string | null;
  hint?: ReactNode;
}

/**
 * Password field with a show/hide eye toggle.
 *
 * The toggle is a real `<button>` so it is keyboard reachable; it is removed
 * from the tab order to keep the form's flow natural (mouse + screen-reader
 * friendly via the label).
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ label, error, hint, className, required, id, ...props }, ref) {
    const [visible, setVisible] = useState(false);

    return (
      <Field label={label} required={required} error={error} hint={hint} htmlFor={id}>
        <div className="relative">
          <Input
            ref={ref}
            id={id}
            type={visible ? "text" : "password"}
            className={cn("pr-10", className)}
            aria-invalid={Boolean(error)}
            required={required}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((value) => !value)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            tabIndex={-1}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none"
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </Field>
    );
  },
);

export default PasswordInput;
