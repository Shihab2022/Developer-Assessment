import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { PlaygroundWorkspace } from "@/components/playground/PlaygroundWorkspace";

export const metadata: Metadata = {
  title: "Online compiler",
  description:
    "Write and run JavaScript, TypeScript, Python, SQL, Go, Java, HTML, CSS, Tailwind and React + MUI in the browser: sandboxed execution, live output, SQL result tables and an instant preview — no sign-in required.",
};

/**
 * `/playground` is a full-viewport online compiler, modelled on the Programiz
 * JavaScript compiler: the site header on top, then a single workspace that
 * owns the rest of the screen — language rail, editor with a Run button, and
 * the output / preview panel across a draggable divider. No marketing cards
 * below it, so the editor always gets the whole window.
 */
export default function PlaygroundPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex min-h-0 flex-1 flex-col">
        <PlaygroundWorkspace />
      </main>
    </div>
  );
}