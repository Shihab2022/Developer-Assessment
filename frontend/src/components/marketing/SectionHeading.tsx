import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Eyebrow + title + description block shared by every landing section. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "left";
  className?: string;
  children?: ReactNode;
}) {
  const centered = align === "center";
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        centered ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      {eyebrow && <span className="section-eyebrow">{eyebrow}</span>}
      <h2
        className={cn(
          "text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl",
          centered && "max-w-3xl",
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "text-sm leading-relaxed text-muted-foreground sm:text-base",
            centered ? "max-w-2xl" : "max-w-xl",
          )}
        >
          {description}
        </p>
      )}
      {children}
    </div>
  );
}

export default SectionHeading;