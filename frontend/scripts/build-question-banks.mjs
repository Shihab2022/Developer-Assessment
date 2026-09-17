#!/usr/bin/env node
/**
 * Builds a technology question bank (`src/data/question-banks/<id>.json`) from a
 * markdown MCQ source, e.g.
 * https://github.com/Shihab2022/interview-question/blob/main/js/js-mcq_1.md
 *
 * The source format this parser understands:
 *
 *   ## L3: Advanced (Mid-Senior / Lead)     <- level heading
 *   ## # 17. Event Loop                     <- topic heading
 *   ## Q. What is logged to the console?    <- question
 *
 *   ```javascript
 *   console.log(1);
 *   ```
 *
 *   - A) `1`
 *   - B) `2`
 *
 *   **Answer: A) `1`**
 *   **Explanation:** Because ...
 *
 * Usage:
 *   node scripts/build-question-banks.mjs                      # every bank in SOURCES
 *   node scripts/build-question-banks.mjs --technology javascript [--source <path|url>]
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const OUT_DIR = "src/data/question-banks";

/** Levels L1-L2 are entry level, L3-L4 mid, L5-L6 senior. */
const LEVEL_DIFFICULTY = {
  L1: "EASY",
  L2: "EASY",
  L3: "MEDIUM",
  L4: "MEDIUM",
  L5: "HARD",
  L6: "HARD",
};

/** Default sources: regeneration without a local copy of the markdown. */
const SOURCES = {
  javascript: {
    label: "JavaScript",
    url: "https://raw.githubusercontent.com/Shihab2022/interview-question/main/js/js-mcq_1.md",
    repo: "https://github.com/Shihab2022/interview-question/blob/main/js/js-mcq_1.md",
    description:
      "Scenario-based MCQ across six levels: fundamentals, ES6+, async and the event loop, engine internals, team standards and architecture.",
  },
};

const FENCE_RE = /^```(\w+)?\s*$/;
const LEVEL_RE = /^##\s+(L\d+):\s*(.+?)\s*$/;
const TOPIC_RE = /^##\s+#\s*\d+\.\s*(.+?)\s*$/;
const QUESTION_RE = /^##\s+Q\.\s*(.+?)\s*$/;
const OPTION_RE = /^\s*[-*]\s*([A-Z])\)\s*(.*)$/;
const ANSWER_RE = /^\*\*Answer:\s*([A-Z])\)/;
const EXPLANATION_RE = /^\*\*Explanation:\*\*\s*([\s\S]*)$/;
const DETAILS_END_RE = /^<\/details>/;
const HEADING_RE = /^##\s+/;

function appendText(blocks, value) {
  const text = value.trim();
  if (!text) return;
  const last = blocks[blocks.length - 1];
  if (last && last.type === "text") last.value = `${last.value}\n\n${text}`;
  else blocks.push({ type: "text", value: text });
}

/**
 * Parses the markdown into bank questions.
 * Returns `{ questions, skipped }` where `skipped` lists malformed entries.
 */
export function parseMarkdown(markdown) {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");

  const questions = [];
  const skipped = [];

  let level = null;
  let levelLabel = null;
  let topic = null;

  let current = null;
  /** "content" (before the options) | "options" | "explanation" */
  let mode = "content";
  let inFence = false;
  let fenceLang = "";
  let fenceLines = [];
  let explanationLines = [];

  const closeFence = () => {
    const code = fenceLines.join("\n").replace(/\s+$/, "");
    if (current && code) {
      if (mode === "options" && current.options.length > 0) {
        current.options[current.options.length - 1].code = code;
      } else {
        current.content.push({ type: "code", language: fenceLang || undefined, value: code });
      }
    }
    fenceLines = [];
    fenceLang = "";
    inFence = false;
  };

  const finishExplanation = () => {
    if (!current) return;
    const explanation = explanationLines.join("\n").trim();
    if (explanation) current.explanation = explanation;
    explanationLines = [];
  };

  const flush = () => {
    if (!current) return;
    finishExplanation();
    const { options } = current;
    let problem = null;
    if (!current.correctOptionId || options.length < 2) {
      problem = "missing answer key or fewer than two options";
    } else if (!options.some((option) => option.id === current.correctOptionId)) {
      problem = "answer key does not match any option";
    }

    if (problem) {
      skipped.push({ title: current.title, problem });
    } else {
      // The `## Q.` line is the question itself; `content` holds the extra
      // prose and code blocks shown underneath it. Guard against a source that
      // repeats the question line inside the body.
      const content = current.content.map((block) => ({ ...block }));
      if (content.length > 0 && content[0].type === "text") {
        const lines = content[0].value.split("\n");
        if (lines[0].trim() === current.title.trim()) {
          const remainder = lines.slice(1).join("\n").trim();
          if (remainder) content[0].value = remainder;
          else content.shift();
        }
      }

      questions.push({
        id: "",
        level: current.level,
        levelLabel: current.levelLabel,
        topic: current.topic,
        difficulty: LEVEL_DIFFICULTY[current.level] ?? "MEDIUM",
        title: current.title,
        prompt: current.title,
        content,
        options: options.map((option) => ({
          id: option.id,
          text: option.text,
          ...(option.code ? { code: option.code } : {}),
        })),
        correctOptionId: current.correctOptionId,
        explanation: current.explanation ?? "",
      });
    }
    current = null;
    mode = "content";
  };

  for (const line of lines) {
    // ---- fenced code ------------------------------------------------------
    if (inFence) {
      if (FENCE_RE.test(line)) closeFence();
      else fenceLines.push(line);
      continue;
    }
    const fence = line.match(FENCE_RE);
    if (fence) {
      inFence = true;
      fenceLang = fence[1] ?? "";
      continue;
    }

    // ---- section headings (outside a question) ----------------------------
    const levelMatch = line.match(LEVEL_RE);
    if (levelMatch && !current) {
      level = levelMatch[1];
      levelLabel = levelMatch[2];
      continue;
    }
    const topicMatch = line.match(TOPIC_RE);
    if (topicMatch && !current) {
      topic = topicMatch[1];
      continue;
    }

    // ---- question start ---------------------------------------------------
    const questionMatch = line.match(QUESTION_RE);
    if (questionMatch) {
      flush();
      current = {
        title: questionMatch[1],
        level: level ?? "L1",
        levelLabel: levelLabel ?? "Unclassified",
        topic: topic ?? "General",
        content: [],
        options: [],
        correctOptionId: null,
        explanation: "",
      };
      mode = "content";
      continue;
    }

    if (!current) continue;

    // ---- end of a question block -----------------------------------------
    if (DETAILS_END_RE.test(line) || HEADING_RE.test(line)) {
      flush();
      continue;
    }

    // ---- options ----------------------------------------------------------
    const optionMatch = line.match(OPTION_RE);
    if (optionMatch) {
      mode = "options";
      current.options.push({ id: optionMatch[1], text: optionMatch[2].trim() });
      continue;
    }

    // ---- answer key -------------------------------------------------------
    const answerMatch = line.match(ANSWER_RE);
    if (answerMatch) {
      current.correctOptionId = answerMatch[1];
      mode = "explanation";
      continue;
    }

    // ---- explanation / trailing prose ------------------------------------
    const explanationMatch = line.match(EXPLANATION_RE);
    if (explanationMatch) {
      mode = "explanation";
      explanationLines.push(explanationMatch[1]);
      continue;
    }

    if (mode === "explanation") {
      if (line.trim()) explanationLines.push(line);
      continue;
    }
    if (mode === "content") {
      appendText(current.content, line);
      continue;
    }
    // Between the options and the answer key: ignore stray markup.
  }

  flush();
  return { questions, skipped };
}

/* ------------------------------------------------------------------ output */

function buildBank(technology, meta, markdown) {
  const { questions, skipped } = parseMarkdown(markdown);

  const withIds = questions.map((question, index) => ({
    ...question,
    id: `${technology === "javascript" ? "js" : technology.slice(0, 2)}-q${String(index + 1).padStart(4, "0")}`,
  }));

  const countBy = (key) =>
    withIds.reduce((acc, question) => {
      acc[question[key]] = (acc[question[key]] ?? 0) + 1;
      return acc;
    }, {});

  const levels = [...new Set(withIds.map((question) => `${question.level}|${question.levelLabel}`))]
    .map((entry) => {
      const [id, label] = entry.split("|");
      return { id, label };
    })
    .sort((a, b) => a.id.localeCompare(b.id));

  const bank = {
    technology,
    label: meta.label,
    description: meta.description,
    source: meta.repo,
    generatedAt: new Date().toISOString(),
    questionCount: withIds.length,
    levels,
    topics: [...new Set(withIds.map((question) => question.topic))],
    difficultyCounts: countBy("difficulty"),
    levelCounts: countBy("level"),
    questions: withIds,
  };

  return { bank, skipped };
}

async function readSource(source) {
  if (/^https?:\/\//.test(source)) {
    const response = await fetch(source);
    if (!response.ok) throw new Error(`Failed to download ${source}: ${response.status}`);
    return response.text();
  }
  return readFile(source, "utf8");
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const [flag, inlineValue] = token.slice(2).split("=");
    args[flag] = inlineValue ?? argv[i + 1];
    if (inlineValue === undefined) i += 1;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const ids = args.technology ? [args.technology] : Object.keys(SOURCES);

  await mkdir(OUT_DIR, { recursive: true });

  for (const technology of ids) {
    const meta = SOURCES[technology];
    if (!meta) {
      console.error(`Unknown technology "${technology}". Known: ${Object.keys(SOURCES).join(", ")}`);
      process.exitCode = 1;
      continue;
    }

    const source = args.source ?? meta.url;
    const markdown = await readSource(source);
    const { bank, skipped } = buildBank(technology, meta, markdown);
    const outPath = args.out ?? path.join(OUT_DIR, `${technology}.json`);
    await writeFile(outPath, `${JSON.stringify(bank, null, 2)}\n`, "utf8");

    console.log(`${bank.label}: ${bank.questionCount} questions -> ${outPath}`);
    console.log(`  by level:      ${JSON.stringify(bank.levelCounts)}`);
    console.log(`  by difficulty: ${JSON.stringify(bank.difficultyCounts)}`);
    console.log(`  topics:        ${bank.topics.length}`);
    if (skipped.length > 0) {
      console.warn(`  skipped ${skipped.length} malformed question(s):`);
      for (const entry of skipped.slice(0, 5)) console.warn(`    - ${entry.title} (${entry.problem})`);
    }
  }
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export { buildBank, parseArgs };

