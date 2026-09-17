import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SiteHeader } from "@/components/marketing/SiteHeader";

/** Marketing chrome (header + footer) reused by the public exam pages. */
export function ExamShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 pb-20">{children}</main>
      <SiteFooter />
    </div>
  );
}

export default ExamShell;