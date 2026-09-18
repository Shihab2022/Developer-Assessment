"use client";

import { useState } from "react";
import { ExternalLink, Monitor, RefreshCw, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/**
 * Live preview pane for the HTML and CSS tabs.
 *
 * The document is rendered in a sandboxed iframe: scripts inside the user's
 * snippet run (that is the point of an HTML/CSS playground) but the frame has
 * no access to the app's origin, cookies or DOM. `srcDoc` is used instead of a
 * blob URL so the browser reloads the frame whenever the document changes.
 */

export interface PreviewPaneProps {
  /** Complete HTML document to render. */
  srcDoc: string;
  /** Bumped by the workspace to force a hard reload of the same document. */
  frameKey: number;
  onRefresh: () => void;
  className?: string;
}

export function PreviewPane({ srcDoc, frameKey, onRefresh, className }: PreviewPaneProps) {
  const [viewport, setViewport] = useState<"responsive" | "mobile">("responsive");

  const openInNewTab = () => {
    const blob = new Blob([srcDoc], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    // Give the new tab time to load before releasing the object URL.
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Monitor className="size-3.5" />
          Preview
          <span className="hidden text-[11px] font-normal normal-case text-muted-foreground sm:inline">
            sandboxed iframe
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant={viewport === "responsive" ? "subtle" : "ghost"}
            size="iconSm"
            onClick={() => setViewport("responsive")}
            aria-pressed={viewport === "responsive"}
            title="Fill the pane"
          >
            <Monitor />
          </Button>
          <Button
            variant={viewport === "mobile" ? "subtle" : "ghost"}
            size="iconSm"
            onClick={() => setViewport("mobile")}
            aria-pressed={viewport === "mobile"}
            title="390 px viewport"
          >
            <Smartphone />
          </Button>
          <Button variant="ghost" size="sm" className="h-7" onClick={openInNewTab}>
            <ExternalLink />
            <span className="hidden sm:inline">Open</span>
          </Button>
          <Button variant="outline" size="sm" className="h-7" onClick={onRefresh}>
            <RefreshCw />
            Reload
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto bg-slate-200/70 p-3 dark:bg-slate-900/60">
        <div
          className={cn(
            "mx-auto h-full overflow-hidden rounded-lg border border-border bg-white shadow-sm transition-[width]",
            viewport === "mobile" ? "w-[390px] max-w-full" : "w-full",
          )}
        >
          <iframe
            key={frameKey}
            title="Playground preview"
            srcDoc={srcDoc}
            sandbox="allow-scripts allow-modals allow-forms allow-popups"
            className="h-full min-h-[240px] w-full border-0"
          />
        </div>
      </div>
    </div>
  );
}

export default PreviewPane;