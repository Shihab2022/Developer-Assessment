import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Brand mark — the single source of truth for the logo.
 *
 * The mark is drawn as an inline SVG (a `</>` glyph on a rounded, gradient
 * tile) so it stays crisp at every size, inherits the theme, and never needs a
 * network request. The same artwork is exported as `src/app/icon.svg` (favicon)
 * and rasterised into the PNG/ICO assets by `scripts/generate-brand-assets.mjs`
 * — keep the three in sync when the design changes.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-violet-600 text-white shadow-glow",
        className,
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-5">
        <path
          d="M9 7 4 12l5 5"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15 7l5 5-5 5"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13.2 6.6 10.8 17.4"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

/**
 * Mark + wordmark, linked to the given route.
 *
 * `size` scales both the tile and the label so the same lockup works in the
 * marketing header, the dashboard sidebar and the auth screens.
 */
export function BrandLogo({
  href = "/",
  size = "md",
  className,
  labelClassName,
}: {
  href?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  labelClassName?: string;
}) {
  const markSize = size === "sm" ? "size-8" : size === "lg" ? "size-11" : "size-9";
  const textSize = size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : "text-base";

  return (
    <Link
      href={href}
      className={cn("flex items-center gap-2.5", className)}
      aria-label={`${APP_NAME} home`}
    >
      <BrandMark className={markSize} />
      <span
        className={cn(
          "font-semibold tracking-tight text-foreground",
          textSize,
          labelClassName,
        )}
      >
        {APP_NAME}
      </span>
    </Link>
  );
}

export default BrandLogo;
