#!/usr/bin/env node
/*
 * Question-bank builder: extends selected banks with parsed markdown MCQs.
 * Run from the repo root: `node frontend/scripts/build-question-banks.mjs`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { importMarkdown, DEFAULT_LEVELS } from "./lib/mcq-import.mjs";
import {
  DEVOPS_QUESTIONS,
  DEVOPS_LEVELS,
  DEVOPS_LABEL,
  DEVOPS_DESCRIPTION,
} from "./question-banks/devops.mjs";
import { AUTHORED } from "./question-banks/authored.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.join(here, "..");
const dataDir = path.join(frontendDir, "src", "data", "question-banks");
const tmpDir = path.join(frontendDir, "..", ".tmp-mcq");

function readBank(file) {
  return JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf8"));
}

function writeBank(file, bank) {
  fs.writeFileSync(path.join(dataDir, file), JSON.stringify(bank, null, 2), "utf8");
}


function recompute(bank) {
  const questions = bank.questions;
  bank.questionCount = questions.length;
  bank.topics = [...new Set(questions.map((q) => q.topic))];
  const difficultyCounts = {};
  const levelCounts = {};
  for (const q of questions) {
    difficultyCounts[q.difficulty] = (difficultyCounts[q.difficulty] ?? 0) + 1;
    levelCounts[q.level] = (levelCounts[q.level] ?? 0) + 1;
  }
  bank.difficultyCounts = difficultyCounts;
  bank.levelCounts = levelCounts;
  return bank;
}

function dedupe(questions) {
  const seen = new Set();
  const kept = [];
  for (const q of questions) {
    const key = `${q.topic}::${q.prompt.trim().toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    kept.push(q);
  }
  return kept;
}

function renumber(questions, prefix) {
  return questions.map((q, i) => ({ ...q, id: `${prefix}-q${String(i + 1).padStart(4, "0")}` }));
}

function counts(list) {
  const out = {};
  for (const q of list) out[q.difficulty] = (out[q.difficulty] ?? 0) + 1;
  return out;
}

const JS_LEVELS = {
  EASY: [
    { level: "L1", label: "Fundamental (Entry-Level / Junior)" },
    { level: "L2", label: "Intermediate (Junior-Mid / Developer)" },
  ],
  MEDIUM: [
    { level: "L3", label: "Advanced (Mid-Senior / Lead)" },
    { level: "L4", label: "Expert (Senior / Architect)" },
  ],
  HARD: [
    { level: "L5", label: "Technical Lead" },
    { level: "L6", label: "Technical Architect" },
  ],
};

function jsLevelFor(difficulty, topic) {
  const pair = JS_LEVELS[difficulty] ?? JS_LEVELS.MEDIUM;
  let hash = 0;
  for (const ch of topic) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return pair[hash % pair.length];
}

const JS_TOPIC_MAP = [
  [/variable|scope|closure|hoist|let |const |var /i, "Scope & Closures"],
  [/arrow|template literal|destructur|spread|rest |default param|optional chain|nullish|symbol|generator|iterator|proxy|reflect|curry|logical assign/i, "ES6 Features"],
  [/class|inherit|object\.|prototype|this |mutable|immutab|descriptor|enhanced object/i, "Objects & Prototypes"],
  [/array|map & set|weakmap|string |number |regex|object method|algorithm/i, "Output-Based & Coding Patterns"],
  [/module|import|export/i, "Modules"],
  [/promise|async|await|event loop|concurren/i, "Async & Await"],
  [/error|try|throw|custom error/i, "Error Handling"],
  [/perform|best practice|memory|bundle/i, "Performance Optimization"],
  [/function|callback|higher-order/i, "Functions"],
];

function titleCase(topic) {
  return topic
    .toLowerCase()
    .split(/(\s+|&|\/|\(|\))/)
    .map((part) => (/^[a-z]/.test(part) ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTopic(raw) {
  const titled = titleCase(raw)
    .replace(/^Variables$/, "ES6 Features")
    .replace(/^Hoisting & Scope$/, "Scope & Closures")
    .replace(/^Closures$/, "Scope & Closures");
  for (const [pattern, canonical] of JS_TOPIC_MAP) {
    if (pattern.test(titled)) return canonical;
  }
  return titled;
}

function finalize(file) {
  const bank = readBank(file);
  bank.generatedAt = new Date().toISOString();
  recompute(bank);
  writeBank(file, bank);
  console.log(`${file}: ${bank.questionCount} questions ${JSON.stringify(bank.difficultyCounts)} topics=${bank.topics.length}`);
  return bank;
}

function expandJavascript(es6Path, mcq2Path) {
  const bank = readBank("javascript.json");
  const before = bank.questions.length;

 const es6Md = fs.readFileSync(es6Path, "utf8");
  const es6 = importMarkdown(es6Md, { techId: "js", levels: DEFAULT_LEVELS }).map((q) => {
    const topic = normalizeTopic(q.topic);
    const level = jsLevelFor(q.difficulty, topic);
    return { ...q, topic, level: level.level, levelLabel: level.label };
  });

  const mcq2Md = fs.readFileSync(mcq2Path, "utf8");
  const mcq2 = importMarkdown(mcq2Md, { techId: "js", levels: DEFAULT_LEVELS }).map((q, i, all) => {
    const difficulty = difficultyByPosition(i, all.length);
    const level = jsLevelFor(difficulty, "Output-Based & Coding Patterns");
    return {
      ...q,
      topic: "Output-Based & Coding Patterns",
      difficulty,
      level: level.level,
      levelLabel: level.label,
    };
  });

  const merged = dedupe([...bank.questions, ...es6, ...mcq2]);
  bank.questions = renumber(merged, "js");
  bank.source = "https://github.com/Shihab2022/interview-question/blob/main/js/js-mcq_1.md + https://github.com/Shihab2022/interview-question/blob/main/js/es6-mcq.md + https://github.com/Shihab2022/interview-question/blob/main/js/jsMcq_2.md";
  writeBank("javascript.json", bank);
  const result = { file: "javascript.json", before, after: merged.length, es6: es6.length, mcq2: mcq2.length };
  console.log("expand javascript:", JSON.stringify(result), JSON.stringify(counts(merged)));
  return result;
}

function difficultyByPosition(i, total) {
  const ratio = total <= 1 ? 0 : i / (total - 1);
  if (ratio <= 0.34) return "EASY";
  if (ratio <= 0.7) return "MEDIUM";
  return "HARD";
}

function expandSql(sqlPath) {
  const bank = readBank("sql.json");
  const authored = bank.questions.filter((q) => !/^sql-imp-/.test(q.id));
  const before = authored.length;
  const md = fs.readFileSync(sqlPath, "utf8");
  const imported = importMarkdown(md, { techId: "sql", levels: DEFAULT_LEVELS });
  const merged = dedupe([...authored, ...imported]);
  bank.questions = renumber(merged, "sql");
  bank.source = "Authored for SkillGauge + https://github.com/Shihab2022/interview-question/blob/main/sql/sql-mcq.md";
  writeBank("sql.json", bank);
  const result = { file: "sql.json", before, after: merged.length, imported: imported.length };
  console.log("expand sql:", JSON.stringify(result), JSON.stringify(counts(merged)));
  return result;
}

function normalizeTopics(file, apply) {
  const bank = readBank(file);
  const used = [...new Set(bank.questions.map((q) => q.topic))];
  const stale = (bank.topics ?? []).filter((t) => !used.includes(t));
  if (stale.length > 0 && apply) {
    bank.topics = used;
    const original = fs.readFileSync(path.join(dataDir, file), "utf8");
    void original;
    // Preserve the committed compact style: rewrite via a surgical splice of
    // the "topics" array only. (Implemented by `spliceTopics`, not a rewrite.)
    spliceTopics(file, used);
  }
  return { file, stale, applied: stale.length > 0 && apply };
}

/** Replaces only the top-level "topics" array, preserving every other byte. */
function spliceTopics(file, used) {
  const raw = fs.readFileSync(path.join(dataDir, file), "utf8");
  const replacement = `"topics":${JSON.stringify(used)}`;
  const next = raw.replace(/"topics":\s*\[[\s\S]*?\]/, replacement);
  if (next === raw) throw new Error(`could not splice topics in ${file}`);
  fs.writeFileSync(path.join(dataDir, file), next, "utf8");
}

function moveReactNextjsToNextjs() {
  const react = readBank("react.json");
  const nextjs = readBank("nextjs.json");
  const moved = react.questions.filter((q) => q.topic === "Next.js");
  const misc = react.questions.filter((q) => q.topic === "MISCELLANEOUS");
  const reactKept = react.questions.filter((q) => q.topic !== "Next.js" && q.topic !== "MISCELLANEOUS");
  const retagged = moved.map((q) => {
    const level = q.difficulty === "EASY"
      ? { level: "L1", label: "Fundamental (Junior / Associate)" }
      : q.difficulty === "MEDIUM"
        ? { level: "L2", label: "Intermediate (Mid-Level)" }
        : { level: "L3", label: "Advanced (Senior)" };
    return {
      ...q,
      topic: "App Router Fundamentals",
      level: level.level,
      levelLabel: level.label,
    };
  });
  const miscKept = misc.filter((q) => /strictmode|fragment|key/i.test(q.title));
  const reactMerged = dedupe([
    ...reactKept,
    ...miscKept.map((q) => ({ ...q, topic: "React Fundamentals" })),
  ]);
  react.questions = renumber(reactMerged, "rc");
  nextjs.questions = renumber(dedupe([...nextjs.questions, ...retagged]), "nx");
  recompute(react);
  recompute(nextjs);
  writeBank("react.json", react);
  writeBank("nextjs.json", nextjs);
  const result = {
    moved: moved.length,
    miscDropped: misc.length - miscKept.length,
    reactBefore: reactKept.length + moved.length + misc.length,
    reactAfter: react.questions.length,
    nextAfter: nextjs.questions.length,
  };
  console.log("move React→Next.js:", JSON.stringify(result));
  console.log("react:", JSON.stringify(counts(react.questions)), "nextjs:", JSON.stringify(counts(nextjs.questions)));
  return result;
}

function buildDevops() {
  const byDifficulty = {
    EASY: DEVOPS_LEVELS[0],
    MEDIUM: DEVOPS_LEVELS[1],
    HARD: DEVOPS_LEVELS[2],
  };
  const questions = DEVOPS_QUESTIONS.map(([topic, difficulty, prompt, options, correctIndex, explanation], i) => {
    const level = byDifficulty[difficulty];
    if (!level) throw new Error(`devops question ${i} has bad difficulty ${difficulty}`);
    if (options.length !== 4) throw new Error(`devops question ${i} has ${options.length} options`);
    return {
      id: `dv-q${String(i + 1).padStart(4, "0")}`,
      level: level.id,
      levelLabel: level.label,
      topic,
      difficulty,
      title: prompt,
      prompt,
      content: [],
      options: options.map((text, idx) => ({ id: "ABCD"[idx], text })),
      correctOptionId: "ABCD"[correctIndex],
      explanation,
    };
  });

  const bank = {
    technology: "devops",
    label: DEVOPS_LABEL,
    description: DEVOPS_DESCRIPTION,
    source: "Authored for SkillGauge",
    generatedAt: new Date().toISOString(),
    questionCount: 0,
    levels: DEVOPS_LEVELS,
    topics: [],
    difficultyCounts: {},
    levelCounts: {},
    questions,
  };
  recompute(bank);
  writeBank("devops.json", bank);
  console.log(`devops.json: ${bank.questionCount} questions ${JSON.stringify(bank.difficultyCounts)} topics=${bank.topics.length} (${bank.topics.join(", ")})`);
  return bank;
}

const [,, command, ...args] = process.argv;

if (command === "devops") {
  buildDevops();
  process.exit(0);
}

/** Difficulty → level id per bank (matches each bank's existing levels). */
const LEVEL_MAP = {
  css: { EASY: "L1", MEDIUM: "L2", HARD: "L3" },
  html: { EASY: "L1", MEDIUM: "L2", HARD: "L3" },
  python: { EASY: "L1", MEDIUM: "L2", HARD: "L3" },
  typescript: { EASY: "L1", MEDIUM: "L2", HARD: "L3" },
  react: { EASY: "L1", MEDIUM: "L3", HARD: "L5" },
  nextjs: { EASY: "L1", MEDIUM: "L2", HARD: "L3" },
};

function buildAuthored() {
  for (const [tech, tuples] of Object.entries(AUTHORED)) {
    const file = `${tech}.json`;
    const bank = readBank(file);
    const levelMap = LEVEL_MAP[tech];
    if (!levelMap) throw new Error(`no LEVEL_MAP entry for ${tech}`);
    const prefix = bank.questions[0]?.id.replace(/\d+$/, "").replace(/q$/, "") ?? tech;
    const seen = new Set(bank.questions.map((q) => q.prompt.trim().toLowerCase()));
    let added = 0;

    for (const [topic, difficulty, prompt, options, correctIndex, explanation] of tuples) {
      const key = prompt.trim().toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const levelId = levelMap[difficulty];
      if (!levelId) throw new Error(`${tech}: bad difficulty ${difficulty} for "${prompt}"`);
      if (options.length !== 4) throw new Error(`${tech}: "${prompt}" has ${options.length} options`);
      const levelLabel = bank.levels.find((l) => l.id === levelId)?.label ?? levelId;
      bank.questions.push({
        id: `tmp-${added}`,
        level: levelId,
        levelLabel,
        topic,
        difficulty,
        title: prompt,
        prompt,
        content: [],
        options: options.map((text, idx) => ({ id: "ABCD"[idx], text })),
        correctOptionId: "ABCD"[correctIndex],
        explanation,
      });
      added += 1;
    }

    bank.questions = renumber(bank.questions, prefix);
    bank.generatedAt = new Date().toISOString();
    recompute(bank);
    writeBank(file, bank);
    console.log(`${file}: +${added} → ${bank.questionCount} ${JSON.stringify(bank.difficultyCounts)} topics=${bank.topics.length}`);
  }
}

if (command === "authored") {
  buildAuthored();
  process.exit(0);
}

if (command === "normalize-topics") {
  const apply = args.includes("--apply");
  const files = args.filter((a) => a !== "--apply");
  for (const file of files.length > 0 ? files : ["html.json", "python.json", "sql.json"]) {
    console.log("normalize:", JSON.stringify(normalizeTopics(file, apply)));
  }
  if (!apply) console.log("(dry run — pass --apply to splice the topics arrays)");
  process.exit(0);
}

if (command === "move-react-nextjs") {
  moveReactNextjsToNextjs();
  finalize("react.json");
  finalize("nextjs.json");
  process.exit(0);
}

if (command === "expand-javascript") {
  const es6 = args[0] ?? path.join(tmpDir, "js__es6-mcq.md");
  const mcq2 = args[1] ?? path.join(tmpDir, "js__jsMcq_2.md");
  expandJavascript(es6, mcq2);
  finalize("javascript.json");
  process.exit(0);
}

if (command === "expand-sql") {
  const sql = args[0] ?? path.join(tmpDir, "sql__sql-mcq.md");
  expandSql(sql);
  finalize("sql.json");
  process.exit(0);
}

console.log("usage: node scripts/build-question-banks.mjs <normalize-topics|move-react-nextjs|expand-javascript|expand-sql> [paths...]");
process.exit(1);
