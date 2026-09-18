import { cn } from "@/lib/utils";

/**
 * Minimal renderer for problem descriptions.
 *
 * The bank stores markdown-ish text (inline `code`, **bold**, `-` bullets,
 * blank-line paragraphs). We render it with React elements instead of
 * `dangerouslySetInnerHTML`, so problem data can never inject markup.
 */

/** Splits a line into plain text, `code` spans and **bold** spans. */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

  return tokens.filter(Boolean).map((token, index) => {
    const key = `${keyPrefix}-${index}`;
    if (token.startsWith("`") && token.endsWith("`") && token.length > 2) {
      return (
        <code key={key} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith("**") && token.endsWith("**") && token.length > 4) {
      return (
        <strong key={key} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>
      );
    }
    return <span key={key}>{token}</span>;
  });
}

export function RichText({ text, className }: { text: string; className?: string }) {
  const blocks = text.split("\n\n");

  return (
    <div className={cn("space-y-3 text-sm leading-relaxed text-muted-foreground", className)}>
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n");

        // Bullet or numbered list.
        if (lines.every((line) => /^\s*[-*]\s+/.test(line) || !line.trim())) {
          return (
            <ul key={blockIndex} className="list-disc space-y-1 pl-5">
              {lines
                .filter((line) => line.trim())
                .map((line, index) => (
                  <li key={index} className="marker:text-muted-foreground/60">
                    {renderInline(line.replace(/^\s*[-*]\s+/, ""), `${blockIndex}-${index}`)}
                  </li>
                ))}
            </ul>
          );
        }

        if (lines.every((line) => /^\s*\d+\.\s+/.test(line) || !line.trim())) {
          return (
            <ol key={blockIndex} className="list-decimal space-y-1 pl-5">
              {lines
                .filter((line) => line.trim())
                .map((line, index) => (
                  <li key={index} className="marker:text-muted-foreground/60">
                    {renderInline(line.replace(/^\s*\d+\.\s+/, ""), `${blockIndex}-${index}`)}
                  </li>
                ))}
            </ol>
          );
        }

        return (
          <p key={blockIndex} className="whitespace-pre-wrap">
            {renderInline(block, String(blockIndex))}
          </p>
        );
      })}
    </div>
  );
}

export default RichText;