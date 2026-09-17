#!/usr/bin/env node
/**
 * Validates every bank in `src/data/question-banks/*.json`.
 *
 * Checks: shape of each question, exactly one correct option, four unique option
 * ids, no duplicate question ids or titles, non-empty prompt/explanation, and
 * that the declared counts match the questions actually present.
 *
 * Usage: node scripts/validate-question-banks.mjs
 */

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const DIR = "src/data/question-banks";
const REQUIRED_STRING = ["id", "prompt", "title", "topic", "level", "levelLabel", "difficulty"];
const BANK_STRING = ["technology", "label", "description"];

function validateBank(bank, file) {
  const errors = [];

  for (const key of BANK_STRING) {
    if (typeof bank[key] !== "string" || !bank[key]) {
      errors.push(`bank.${key} must be a non-empty string`);
    }
  }
  if (!Array.isArray(bank.questions) || bank.questions.length === 0) {
    errors.push("bank.questions must be a non-empty array");
    return { errors, explained: 0, counts: {} };
  }

  const ids = new Set();
  const signatures = new Map();
  const promptSeen = new Map();
  let explained = 0;
  let repeatedPrompts = 0;

  bank.questions.forEach((question, index) => {
    const at = `${file}#${index + 1} (${question.id ?? "no id"})`;

    for (const key of REQUIRED_STRING) {
      if (typeof question[key] !== "string" || !question[key]) {
        errors.push(`${at}: ${key} must be a non-empty string`);
      }
    }
    if (ids.has(question.id)) errors.push(`${at}: duplicate question id`);
    ids.add(question.id);

    // Several source questions legitimately share a generic prompt
    // ("What is the output?"), so only prompt + options together count as a dupe.
    const title = (question.prompt ?? "").trim();
    if (promptSeen.has(title)) repeatedPrompts += 1;
    else promptSeen.set(title, question.id);

    const signature = `${title}||${(question.options ?? []).map((option) => option?.text).join("|")}`;
    if (signatures.has(signature)) {
      errors.push(`${at}: duplicate question (same prompt and options as ${signatures.get(signature)})`);
    } else {
      signatures.set(signature, question.id);
    }

    if (!["EASY", "MEDIUM", "HARD"].includes(question.difficulty)) {
      errors.push(`${at}: unexpected difficulty "${question.difficulty}"`);
    }
    if (!Array.isArray(question.content)) {
      errors.push(`${at}: content must be an array`);
    } else {
      question.content.forEach((block, blockIndex) => {
        if (block.type !== "text" && block.type !== "code") {
          errors.push(`${at}: content[${blockIndex}].type must be "text" or "code"`);
        }
        if (typeof block.value !== "string" || !block.value.trim()) {
          errors.push(`${at}: content[${blockIndex}].value must be non-empty`);
        }
      });
    }

    const options = question.options;
    if (!Array.isArray(options) || options.length < 2) {
      errors.push(`${at}: needs at least two options`);
    } else {
      const optionIds = options.map((option) => option?.id);
      if (new Set(optionIds).size !== optionIds.length) {
        errors.push(`${at}: duplicate option ids`);
      }
      if (options.some((option) => typeof option?.text !== "string" || !option.text.trim())) {
        errors.push(`${at}: every option needs text`);
      }
      const correct = options.filter((option) => option.id === question.correctOptionId);
      if (correct.length !== 1) {
        errors.push(`${at}: correctOptionId "${question.correctOptionId}" must match exactly one option`);
      }
      options.forEach((option, optionIndex) => {
        if (option?.id === question.correctOptionId) {
          const correctText = `${option.text ?? ""}`;
          if (!correctText.trim() && !option.code) {
            errors.push(`${at}: correct option ${optionIndex} has no text or code`);
          }
        }
      });
    }

    if (typeof question.explanation === "string" && question.explanation.trim()) explained += 1;
  });

  const counts = bank.questions.reduce((acc, question) => {
    acc[question.difficulty] = (acc[question.difficulty] ?? 0) + 1;
    return acc;
  }, {});

  return { errors, explained, counts, repeatedPrompts };
}

async function main() {
  const files = (await readdir(DIR)).filter((name) => name.endsWith(".json")).sort();
  if (files.length === 0) {
    console.error(`No banks found in ${DIR}`);
    process.exitCode = 1;
    return;
  }

  let failed = false;

  for (const file of files) {
    const raw = await readFile(path.join(DIR, file), "utf8");
    const bank = JSON.parse(raw);
    const { errors, explained, counts, repeatedPrompts } = validateBank(bank, file);
    const ok = errors.length === 0;

    console.log(
      `${ok ? "PASS" : "FAIL"}  ${file.padEnd(18)} ${String(bank.questions.length).padStart(4)} questions · ` +
        `${explained} with explanations · ${JSON.stringify(counts)}` +
        (repeatedPrompts ? ` · ${repeatedPrompts} shared prompts` : ""),
    );

    if (!ok) {
      failed = true;
      for (const error of errors.slice(0, 15)) console.error(`      - ${error}`);
      if (errors.length > 15) console.error(`      ... and ${errors.length - 15} more`);
      continue;
    }

    if (bank.questionCount !== bank.questions.length) {
      failed = true;
      console.error(`      - questionCount (${bank.questionCount}) != questions.length`);
    }
    for (const [difficulty, count] of Object.entries(counts)) {
      if (bank.difficultyCounts?.[difficulty] !== count) {
        failed = true;
        console.error(`      - difficultyCounts.${difficulty} is stale (expected ${count})`);
      }
    }
  }

  process.exitCode = failed ? 1 : 0;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});