import fs from "node:fs";
import path from "node:path";

const files = [
  "js/js-mcq_1.md",
  "js/jsMcq_2.md",
  "js/es6-mcq.md",
  "react/react-mcq.md",
  "Next.js/next-mcq.md",
  "sql/sql-mcq.md",
  "typescript/TypeScriptInterviewQuestions.md",
  "Redis/Redis Interview Questions.md",
  "docker/docker_int_question.md",
  "node/Node.jsInterviewQuestions.md",
];

const base = "https://raw.githubusercontent.com/Shihab2022/interview-question/main/";

for (const file of files) {
  const url = base + encodeURI(file);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.log("FAIL", file, res.status);
      continue;
    }
    const text = await res.text();
    const name = path.join(".tmp-mcq", file.replace(/\//g, "__"));
    fs.writeFileSync(name, text);
    console.log("OK", name, text.length);
  } catch (error) {
    console.log("ERR", file, error.message);
  }
}
