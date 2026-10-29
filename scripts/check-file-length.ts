// Fails when a source file is longer than 400 lines, unless a decision record allows it (principle 5).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "..");
const limit = 400;
// File path -> the decision record that allows it to be longer.
const exceptions: Record<string, string> = {};
const sourceFile = /\.(ts|js|mjs|cjs|sql)$/;

const files = ["packages", "scripts", "test", "examples"]
  .filter((dir) => existsSync(join(root, dir)))
  .flatMap((dir) =>
    readdirSync(join(root, dir), { recursive: true, encoding: "utf8" }).map((file) => `${dir}/${file.split(sep).join("/")}`),
  )
  .filter((file) => sourceFile.test(file) && !file.includes("/node_modules/") && !file.includes("/dist/"));

const problems: string[] = [];
for (const [file, record] of Object.entries(exceptions)) {
  if (!existsSync(join(root, record))) problems.push(`${file}: the exception points to ${record}, which doesn't exist.`);
}
for (const file of files) {
  const text = readFileSync(join(root, file), "utf8");
  const lines = text.split("\n").length - (text.endsWith("\n") ? 1 : 0);
  if (lines > limit && !exceptions[file]) problems.push(`${file} has ${lines} lines; the limit is ${limit}. Split it, or write a decision record.`);
}

if (problems.length > 0) {
  console.error(`check-file-length failed:\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log(`check-file-length: ${files.length} source files, none over ${limit} lines.`);
