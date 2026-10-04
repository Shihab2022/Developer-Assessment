#!/usr/bin/env node
/* Verifier scaffold. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, "..", "src", "data", "question-banks");

let failures = 0;
function fail(message) {
  failures += 1;
  console.error(`FAIL  ${message}`);
}
function ok(message) {
  console.log(`ok    ${message}`);
}

const VALID_DIFFICULTIES = new Set(["EASY", "MEDIUM", "HARD"]);

for (const file of fs.readdirSync(dataDir).filter((f) => f.endsWith(".json"))) {
  const bank = JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf8"));
  const questions = bank.questions ?? [];
  const ids = new Set();
  let bad = 0;

  for (const q of questions) {
    if (!q.id || ids.has(q.id)) { fail(`${file}: duplicate/missing id ${q.id}`); bad += 1; }
    ids.add(q.id);
    if (!VALID_DIFFICULTIES.has(q.difficulty)) { fail(`${file} ${q.id}: bad difficulty`); bad += 1; }
    if (!Array.isArray(q.options) || q.options.length !== 4) { fail(`${file} ${q.id}: options != 4`); bad += 1; }
    if (!q.options.some((o) => o.id === q.correctOptionId)) { fail(`${file} ${q.id}: correctOptionId missing`); bad += 1; }
    if (!q.prompt || !q.explanation || !q.topic || !q.level) { fail(`${file} ${q.id}: missing field`); bad += 1; }
  }

  const diff = {};
  for (const q of questions) diff[q.difficulty] = (diff[q.difficulty] ?? 0) + 1;
  if (JSON.stringify(diff) !== JSON.stringify(bank.difficultyCounts)) {
    fail(`${file}: difficultyCounts mismatch ${JSON.stringify(diff)} vs ${JSON.stringify(bank.difficultyCounts)}`);
    bad += 1;
  }
  if (bank.questionCount !== questions.length) {
    fail(`${file}: questionCount ${bank.questionCount} != ${questions.length}`);
    bad += 1;
  }
  const topics = [...new Set(questions.map((q) => q.topic))].sort();
  const declared = [...(bank.topics ?? [])].sort();
  const missing = topics.filter((t) => !declared.includes(t));
  const extra = declared.filter((t) => !topics.includes(t));
  if (missing.length > 0 || extra.length > 0) {
    fail(`${file}: topics mismatch (missing in bank.topics: ${missing.join("; ") || "—"}; stale: ${extra.join("; ") || "—"})`);
    bad += 1;
  }
  if (bad === 0) ok(`${file}: ${questions.length} questions, ${JSON.stringify(diff)}`);
}

if (failures > 0) {
  console.error(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log("\nall question banks valid");
