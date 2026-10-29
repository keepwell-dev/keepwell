// Builds and packs the package, installs the tarball in an empty folder, and checks that the keepwell
// command runs, the library imports, and nothing private or unbuilt is shipped (record 0007).
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const { version } = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as { version: string };
const work = mkdtempSync(join(tmpdir(), "keepwell-pack-"));
const run = (command: string, args: string[], cwd: string) =>
  execFileSync(command, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });

function fail(message: string): never {
  console.error(`check-pack failed: ${message}`);
  process.exit(1);
}

try {
  execFileSync("npm", ["run", "build"], { cwd: root, stdio: "inherit" });
  const [packed] = JSON.parse(run("npm", ["pack", "--json", "--ignore-scripts", "--pack-destination", work], root)) as {
    filename: string;
    files: { path: string }[];
  }[];
  if (!packed) fail("npm pack returned nothing.");
  const files = packed.files.map((file) => file.path);

  const required = ["package.json", "README.md", "LICENSE", "dist/index.js", "dist/index.d.ts", "dist/cli/src/bin.js"];
  const missing = required.filter((file) => !files.includes(file));
  if (missing.length > 0) fail(`the package is missing ${missing.join(", ")}.`);
  // The private brief, notes, tests, sources and secrets must never be published.
  const unwanted = files.filter((file) => /(^|\/)(CLAUDE|\.env)|^(docs|scripts|packages|test)\/|\/test\/|(?<!\.d)\.ts$/.test(file));
  if (unwanted.length > 0) fail(`the package must not contain ${unwanted.join(", ")}.`);

  writeFileSync(join(work, "package.json"), JSON.stringify({ name: "keepwell-pack-check", private: true, type: "module" }));
  run("npm", ["install", "--no-audit", "--no-fund", "--ignore-scripts", join(work, packed.filename)], work);
  const printed = run(join(work, "node_modules/.bin/keepwell"), ["--version"], work).trim();
  if (printed !== version) fail(`keepwell --version printed "${printed}", expected "${version}".`);
  run("node", ["--input-type=module", "-e", "await import('keepwell');"], work);

  console.log(`check-pack: ${packed.filename} holds ${files.length} files; keepwell --version printed ${printed}; the library imports.`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
