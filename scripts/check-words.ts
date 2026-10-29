// Fails on banned words in user-facing text: README, SECURITY, docs, skills and refusal messages.
// Legitimate uses go in scripts/check-words-allow.json with the file, the exact phrase and why.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "..");
const banned =
  /\b(memory|knowledge|governance platform|guardrails?|magic(?:al)?|seamless(?:ly)?|secure(?:ly)?|compliant|enterprise[- ]ready)\b/gi;
// Working notes for the author, not user-facing text.
const excluded = ["docs/decisions/", "docs/milestones/"];

type Allowed = { file: string; phrase: string; why: string };
const allowed = JSON.parse(readFileSync(join(root, "scripts/check-words-allow.json"), "utf8")) as Allowed[];

function filesIn(dir: string, keep: (file: string) => boolean): string[] {
  if (!existsSync(join(root, dir))) return [];
  return readdirSync(join(root, dir), { recursive: true, encoding: "utf8" })
    .map((file) => `${dir}/${file.split(sep).join("/")}`)
    .filter((file) => !file.includes("/node_modules/") && keep(file));
}

const files = [
  "README.md",
  "SECURITY.md",
  ...filesIn("docs", (file) => file.endsWith(".md")),
  ...filesIn("skills", (file) => file.endsWith(".md")),
  ...filesIn("packages", (file) => /\/src\/(.*\/)?refusal[^/]*\.ts$/.test(file)),
].filter((file) => existsSync(join(root, file)) && !excluded.some((prefix) => file.startsWith(prefix)));

// A hit is allowed only when it falls inside an allowed phrase on that line, not anywhere else on the line.
function isAllowed(file: string, line: string, start: number, length: number): boolean {
  const lower = line.toLowerCase();
  return allowed.some((entry) => {
    if (entry.file !== file) return false;
    const phrase = entry.phrase.toLowerCase();
    for (let at = lower.indexOf(phrase); at !== -1; at = lower.indexOf(phrase, at + 1)) {
      if (at <= start && start + length <= at + phrase.length) return true;
    }
    return false;
  });
}

const hits: string[] = [];
for (const file of files) {
  readFileSync(join(root, file), "utf8").split("\n").forEach((line, index) => {
    for (const match of line.matchAll(banned)) {
      if (!isAllowed(file, line, match.index, match[0].length)) hits.push(`${file}:${index + 1}: "${match[0]}" in: ${line.trim()}`);
    }
  });
}

if (hits.length > 0) {
  console.error(`check-words failed. Rephrase, or add the phrase to scripts/check-words-allow.json with a reason:\n- ${hits.join("\n- ")}`);
  process.exit(1);
}
console.log(`check-words: ${files.length} files checked, no banned words.`);
