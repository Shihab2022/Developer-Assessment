import Link from "next/link";
import { Code2, Github } from "lucide-react";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";
import { LANDING_FOOTER_GROUPS } from "@/lib/marketing";

/** Marketing footer: brand blurb, anchor link groups and the legal strip. */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-sky-500 text-white">
                <Code2 className="size-5" strokeWidth={2.2} />
              </span>
              <span className="text-base font-semibold tracking-tight text-foreground">
                {APP_NAME}
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{APP_DESCRIPTION}</p>
            <p className="mt-4 text-xs text-muted-foreground">
              Built on a multi-role REST API with server-timed attempts, sandboxed code execution and
              full audit logging.
            </p>
          </div>

          {LANDING_FOOTER_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={`${group.title}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {year} {APP_NAME}. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Assessment API v1</span>
            <a
              href="https://github.com/Shihab2022/Developer-Assessment"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <Github className="size-3.5" />
              Source
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;