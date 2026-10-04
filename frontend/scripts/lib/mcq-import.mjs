/**
 * Markdown → MCQ parser for the upstream interview-question bank.
 *
 * Two source dialects are supported, both of which appear in
 * `Shihab2022/interview-question`:
 *
 *   1. `## Q.` + `* A) …` + `<details>**Answer: B)**</details>`   (react, next, es6)
 *   2. `**Q.**` + `- A) …` + `> **Answer: B**`                    (sql)
 *
 * The parser is intentionally forgiving: anything it cannot confidently read
 * (wrong option count, missing answer) is dropped rather than guessed at.
 */

const TOPIC_RE = /^##\s+#?\s*\d+\.\s*(.+?)\s*$/;
const QUESTION_MD_RE = /^##\s+Q\.\s*(.*)$/i;
const QUESTION_BOLD_RE = /^\*\*Q\.?\*\*\s*(.*)$/i;
/** Numbered deep-heading prompts (`###### 12. …`) used by the jsMcq_2 dialect. */
const NUMBERED_Q_RE = /^#{4,6}\s+\d+\.\s*(.*)$/;
const OPTION_RE = /^\s*[-*]\s*\*{0,2}([A-D])[).:\-]\s*(.+?)\s*\*{0,2}$/;
const ANSWER_RE = /\*{0,2}Answer:?\*{0,2}\s*([A-D])\b/i;
const EXPLANATION_RE = /\*{0,2}Explanation:?\*{0,2}\s*([\s\S]*)$/i;
const FENCE_RE = /^\s*```(.*)$/;

const NOISE_RE =
  /^(<div[^>]*>|<\/div>|<p[^>]*>|<\/p>|<br\s*\/?>|<\/?summary[^>]*>.*|<\/?details[^>]*>|---+|\*{3,}|_{3,}|back to top|↥.*back to top.*)$/i;

export function slugTopic(raw) {
  return raw
    .replace(/&amp;/g, "&")
    .replace(/[`*_]/g, "")
    .replace(/^#+\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Split the document into question records with their section topic. */
export function splitQuestions(markdown) {
  const lines = markdown.split(/\r?\n/);
  const records = [];
  let topic = "General";
  let sectionIndex = 0;
  let current = null;

  const flush = () => {
    if (current) records.push(current);
    current = null;
  };

  for (const line of lines) {
    const topicMatch = line.match(TOPIC_RE);
    if (topicMatch && !/^Q\./i.test(topicMatch[1])) {
      flush();
      topic = slugTopic(topicMatch[1]);
      sectionIndex += 1;
      continue;
    }

    const qMatch =
      line.match(QUESTION_MD_RE) || line.match(QUESTION_BOLD_RE) || line.match(NUMBERED_Q_RE);
    if (qMatch) {
      flush();
      current = { topic, sectionIndex, promptLine: qMatch[1].trim(), lines: [] };
      continue;
    }

    if (current) current.lines.push(line);
  }
  flush();
  return records;
}

/** Turn the raw body lines of one question into a `BankQuestion` (or null). */
export function buildQuestion(record, options) {
  const { techId, index, difficulty, level, levelLabel } = options;
  const { promptLine, topic, lines } = record;

  const bodyLines = [];
  const optionsFound = [];
  const answerLines = [];
  let answerLetter = null;
  let phase = "body";
  let inFence = false;

  for (const line of lines) {
    const fence = line.match(FENCE_RE);
    if (fence) {
      inFence = !inFence;
      bodyLines.push(line);
      continue;
    }
    if (inFence) {
      bodyLines.push(line);
      continue;
    }

    // The answer block is fenced by <details> in the React/Next/ES6 dialect.
    if (phase !== "answer" && /<details/i.test(line)) {
      phase = "answer";
      continue;
    }

    if (phase !== "answer") {
      const optionMatch = line.match(OPTION_RE);
      if (optionMatch) {
        optionsFound.push({ letter: optionMatch[1].toUpperCase(), text: optionMatch[2].trim() });
        phase = "options";
        continue;
      }
    }

    if (!answerLetter) {
      const answerMatch = line.match(ANSWER_RE);
      if (answerMatch) {
        answerLetter = answerMatch[1].toUpperCase();
        answerLines.push(line);
        phase = "answer";
        continue;
      }
    }

    if (phase === "answer") {
      answerLines.push(line);
      continue;
    }

    bodyLines.push(line);
  }

  const letters = optionsFound.map((option) => option.letter).join("");
  if (optionsFound.length !== 4 || letters !== "ABCD" || !answerLetter) return null;

  const prompt = promptLine.replace(/^\*\*|\*\*$/g, "").trim();
  if (!prompt) return null;

  const content = toContentBlocks(bodyLines);
  const explanation = toExplanation(answerLines);
  if (!explanation) return null;

  return {
    id: `${techId}-imp-${String(index).padStart(4, "0")}`,
    level,
    levelLabel,
    topic,
    difficulty,
    title: prompt,
    prompt,
    content,
    options: optionsFound.map((option) => ({ id: option.letter, text: option.text })),
    correctOptionId: answerLetter,
    explanation,
  };
}

/** Prose + fenced code (in source order) → `QuestionBlock[]`. */
function toContentBlocks(lines) {
  const blocks = [];
  let buffer = [];
  let code = null;

  const flushText = () => {
    const value = buffer
      .map((line) => line.replace(/^>\s?/, "").trimEnd())
      .filter((line) => !NOISE_RE.test(line.trim()))
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if (value) blocks.push({ type: "text", value });
    buffer = [];
  };

  for (const line of lines) {
    const fence = line.match(FENCE_RE);
    if (fence && !code) {
      flushText();
      code = { language: fence[1].trim() || undefined, lines: [] };
      continue;
    }
    if (fence && code) {
      const value = code.lines.join("\n").replace(/\s+$/g, "");
      if (value) blocks.push({ type: "code", value, language: code.language });
      code = null;
      continue;
    }
    if (code) {
      code.lines.push(line);
      continue;
    }
    buffer.push(line);
  }
  flushText();

  return blocks;
}

/** Pull the explanation out of the answer block. */
function toExplanation(lines) {
  const joined = lines
    .map((line) => line.replace(/^>\s?/, ""))
    .filter((line) => !NOISE_RE.test(line.trim()))
    .join("\n");

  const answerIndex = joined.search(/\*{0,2}Answer:?\*{0,2}\s*[A-D]\b/i);
  let body = answerIndex >= 0 ? joined.slice(answerIndex) : joined;

  // Drop everything up to (and including) the answer line itself.
  const newlineAfterAnswer = body.indexOf("\n");
  if (newlineAfterAnswer >= 0) body = body.slice(newlineAfterAnswer + 1);

  const explanationMatch = body.match(EXPLANATION_RE);
  if (explanationMatch) body = explanationMatch[1];

  return body
    .replace(/<[^>]+>/g, "")
    .replace(/\*\*/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !/^back to top$/i.test(line) && !/^↥.*back to top.*/i.test(line))
    .join("\n")
    .trim();
}

export const DEFAULT_LEVELS = {
  EASY: { level: "L1", label: "Fundamental" },
  MEDIUM: { level: "L2", label: "Intermediate" },
  HARD: { level: "L3", label: "Advanced" },
};

function difficultyBySection(record, totalSections) {
  const ratio = totalSections <= 0 ? 0 : (record.sectionIndex - 1) / totalSections;
  if (ratio <= 0.34) return "EASY";
  if (ratio <= 0.7) return "MEDIUM";
  return "HARD";
}

/**
 * Runs when the numbered-heading dialect has no sections: buckets questions by
 * their position into the bank's three levels (`levelByIndex`).
 */
function difficultyByIndex(record, total, levels) {
  const ratio = total <= 1 ? 0 : record.questionIndex / Math.max(1, total - 1);
  if (ratio <= 0.34) return "EASY";
  if (ratio <= 0.7) return "MEDIUM";
  return "HARD";
}

/** Convenience wrapper: markdown → `BankQuestion[]` (invalid questions dropped). */
export function importMarkdown(markdown, options) {
  const records = splitQuestions(markdown);
  const total = records.length;
  const totalSections = records.reduce((max, record) => Math.max(max, record.sectionIndex), 0);
  const results = [];
  let index = 0;

  for (const record of records) {
    const difficulty =
      options.difficultyFor?.(record, totalSections) ?? difficultyBySection(record, totalSections);
    const levels = options.levels ?? DEFAULT_LEVELS;
    const meta = levels[difficulty] ?? levels.MEDIUM ?? { level: "L2", label: "Intermediate" };

    const question = buildQuestion(record, {
      techId: options.techId,
      index,
      difficulty,
      level: meta.level,
      levelLabel: meta.label,
    });

    if (question) {
      results.push(question);
      index += 1;
    }
  }

  return results;
}
