import { Code2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuestionBlock } from "@/lib/question-banks/types";

/**
 * Minimal, dependency-free renderer for bank content.
 *
 * Bank text is markdown-ish (inline `code`, fenced blocks were split out at
 * generation time). We render inline backticks as <code> and never inject HTML,
 * so question data cannot introduce markup.
 */

const INLINE_RE = /`([^`]+)`/g;

export function InlineText({ value, className }: { value: string; className?: string }) {
  const parts = value.split(INLINE_RE);
  return (
    <span className={cn("whitespace-pre-wrap", className)}>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <code
            key={index}
            className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground"
          >
            {part}
          </code>
        ) : (
          part
        ),
      )}
    </span>
  );
}

function CodeBlock({ value, language, className }: { value: string; language?: string; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-lg border border-slate-800 bg-slate-950", className)}>
      {language && (
        <div className="flex items-center gap-1.5 border-b border-slate-800 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">
          <Code2 className="size-3" />
          {language}
        </div>
      )}
      <pre className="thin-scrollbar overflow-x-auto px-3 py-2.5 font-mono text-[12.5px] leading-relaxed text-emerald-100">
        {value}
      </pre>
    </div>
  );
}

export function QuestionContent({
  blocks,
  className,
}: {
  blocks: QuestionBlock[];
  className?: string;
}) {
  if (!blocks?.length) return null;
  return (
    <div className={cn("space-y-3", className)}>
      {blocks.map((block, index) =>
        block.type === "code" ? (
          <CodeBlock key={index} value={block.value} language={block.language} />
        ) : (
          <p key={index} className="text-sm leading-relaxed text-foreground">
            <InlineText value={block.value} />
          </p>
        ),
      )}
    </div>
  );
}

export default QuestionContent;