import type { PlaygroundLanguage } from "./types";

/**
 * Starter snippets for the playground.
 *
 * Each snippet is a complete, runnable program that shows off the language
 * features users came for (console output, top-level await, types, real
 * Python, a live document) so the first Run always produces something useful.
 */

const JAVASCRIPT = `/**
 * JavaScript playground — everything you log shows up in the output panel.
 */

const orders = [
  { id: 1, region: "Dhaka", total: 120 },
  { id: 2, region: "Sylhet", total: 80 },
  { id: 3, region: "Dhaka", total: 260 },
  { id: 4, region: "Chattogram", total: 40 },
];

function revenueByRegion(rows) {
  const totals = new Map();
  for (const { region, total } of rows) {
    totals.set(region, (totals.get(region) ?? 0) + total);
  }
  return [...totals].sort((a, b) => b[1] - a[1]);
}

for (const [region, total] of revenueByRegion(orders)) {
  console.log(region.padEnd(12), total);
}

const grandTotal = orders.reduce((sum, order) => sum + order.total, 0);
console.log("grand total:", grandTotal);

// Top-level await works: the snippet runs inside an async scope.
const lastOrder = await Promise.resolve(orders.at(-1));
console.log("checked order", lastOrder.id);
`;

const TYPESCRIPT = `/**
 * TypeScript playground — annotations are stripped to JavaScript, so this runs
 * instantly in the same sandbox as the JavaScript tab.
 */

type Region = "Dhaka" | "Sylhet" | "Chattogram";

interface Order {
  id: number;
  region: Region;
  total: number;
}

enum Tier {
  Bronze = "bronze",
  Silver = "silver",
  Gold = "gold",
}

function tierFor(total: number): Tier {
  if (total >= 250) return Tier.Gold;
  if (total >= 100) return Tier.Silver;
  return Tier.Bronze;
}

const orders: Order[] = [
  { id: 1, region: "Dhaka", total: 120 },
  { id: 2, region: "Sylhet", total: 80 },
  { id: 3, region: "Dhaka", total: 260 },
];

const totals = orders.reduce<Record<string, number>>((acc, order) => {
  acc[order.region] = (acc[order.region] ?? 0) + order.total;
  return acc;
}, {});

for (const order of orders) {
  console.log(\`#\${order.id}\`, order.region, "→", tierFor(order.total));
}

console.log("totals:", totals);
`;

const PYTHON = `"""Python playground — stdout and stderr both land in the output panel."""

from collections import Counter
from dataclasses import dataclass


@dataclass
class Order:
    region: str
    total: int


orders = [
    Order("Dhaka", 120),
    Order("Sylhet", 80),
    Order("Dhaka", 260),
]

revenue: Counter[str] = Counter()
for order in orders:
    revenue[order.region] += order.total

for region, total in revenue.most_common():
    print(f"{region:<12} {total}")

print("grand total:", sum(order.total for order in orders))
print("regions:", sorted(revenue))
`;

const HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Playground preview</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 32px;
        background: linear-gradient(135deg, #eef2ff, #f8fafc);
        color: #0f172a;
        font-family: system-ui, sans-serif;
      }
      .card {
        width: min(420px, 100%);
        padding: 28px;
        border-radius: 20px;
        background: #ffffff;
        box-shadow: 0 24px 60px -30px rgba(15, 23, 42, 0.45);
      }
      .card__eyebrow {
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        font-size: 11px;
        color: #4f46e5;
      }
      .card__title { margin: 8px 0 12px; font-size: 24px; }
      .card__text { margin: 0 0 20px; color: #64748b; line-height: 1.6; }
      .button {
        border: 0;
        border-radius: 10px;
        padding: 10px 18px;
        background: #4f46e5;
        color: #ffffff;
        font-weight: 600;
        cursor: pointer;
      }
      .chips { display: flex; gap: 8px; padding: 0; margin: 20px 0 0; list-style: none; }
      .chip {
        padding: 4px 10px;
        border-radius: 999px;
        background: #eef2ff;
        color: #4f46e5;
        font-size: 12px;
        font-weight: 600;
      }
    </style>
  </head>
  <body>
    <article class="card">
      <p class="card__eyebrow">Live preview</p>
      <h1 class="card__title">Hello from the playground</h1>
      <p class="card__text">
        Edit the markup on the left. The preview refreshes as you type, and every
        console.log() is streamed back to the output panel.
      </p>
      <button class="button" id="ping" type="button">Ping the console</button>
      <ul class="chips">
        <li class="chip">HTML</li>
        <li class="chip">CSS</li>
        <li class="chip">JavaScript</li>
      </ul>
    </article>

    <script>
      const button = document.getElementById("ping");
      let clicks = 0;

      button.addEventListener("click", () => {
        clicks += 1;
        console.log(\`button clicked \${clicks} time(s)\`);
      });

      console.log("preview ready");
    </script>
  </body>
</html>
`;

const CSS = `/* Applied live to the sample page in the preview pane. */
:root {
  --brand: #4f46e5;
  --brand-dark: #4338ca;
  --ink: #0f172a;
  --muted: #64748b;
  --surface: #ffffff;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px;
  background: linear-gradient(135deg, #eef2ff, #f8fafc);
  color: var(--ink);
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
}

.card {
  width: min(420px, 100%);
  padding: 28px;
  border-radius: 20px;
  background: var(--surface);
  box-shadow: 0 24px 60px -30px rgba(15, 23, 42, 0.45);
}

.card__eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 11px;
  color: var(--brand);
}

.card__title {
  margin: 8px 0 12px;
  font-size: 24px;
}

.card__text {
  margin: 0 0 20px;
  color: var(--muted);
  line-height: 1.6;
}

.button {
  border: 0;
  border-radius: 10px;
  padding: 10px 18px;
  background: var(--brand);
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
}

.button:hover {
  background: var(--brand-dark);
}

.chips {
  display: flex;
  gap: 8px;
  padding: 0;
  margin: 20px 0 0;
  list-style: none;
}

.chip {
  padding: 4px 10px;
  border-radius: 999px;
  background: #eef2ff;
  color: var(--brand);
  font-size: 12px;
  font-weight: 600;
}
`;

export const PLAYGROUND_SNIPPETS: Record<PlaygroundLanguage, string> = {
  javascript: JAVASCRIPT,
  typescript: TYPESCRIPT,
  python: PYTHON,
  html: HTML,
  css: CSS,
};

/** Starter source for a language (falls back to JavaScript). */
export function snippetFor(language: PlaygroundLanguage): string {
  return PLAYGROUND_SNIPPETS[language] || PLAYGROUND_SNIPPETS.javascript;
}
