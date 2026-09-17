import {
  Braces,
  Code2,
  Database,
  FileCode2,
  Library,
  Palette,
  Terminal,
  type LucideIcon,
} from "lucide-react";

/**
 * Resolves the string icon name stored on `TechnologyMeta` (produced by
 * `registry.ts`) into the actual `lucide-react` component. Falls back to a
 * generic icon for unknown entries so the grid never throws.
 */

const TECH_ICONS: Record<string, LucideIcon> = {
  Braces,
  Code2,
  Database,
  FileCode2,
  Palette,
  Terminal,
};

export function iconForTech(technologyId: string): LucideIcon {
  const metaNames: Record<string, string> = {
    javascript: "Braces",
    typescript: "FileCode2",
    python: "Terminal",
    css: "Palette",
    html: "Code2",
    sql: "Database",
  };
  const name = metaNames[technologyId] ?? "Library";
  return TECH_ICONS[name] ?? Library;
}
