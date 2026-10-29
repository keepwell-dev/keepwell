// Fails when the package has more than six direct runtime dependencies, or any dependency that isn't approved (records 0008 and 0010).
import { readFileSync } from "node:fs";

const ceiling = 6;
// Adding a name to either list needs an accepted decision record.
const approvedRuntime = ["pg", "hono", "@hono/node-server", "@modelcontextprotocol/sdk", "zod"];
const approvedDev = ["typescript", "@types/node", "@types/pg", "ajv"];

type Deps = Record<string, string> | undefined;
type Manifest = { dependencies?: Deps; optionalDependencies?: Deps; peerDependencies?: Deps; devDependencies?: Deps };

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as Manifest;
// Optional and peer dependencies run in users' apps too, so they count.
const runtime = [
  ...new Set([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.optionalDependencies ?? {}),
    ...Object.keys(pkg.peerDependencies ?? {}),
  ]),
];
const dev = Object.keys(pkg.devDependencies ?? {});

const problems: string[] = [];
if (runtime.length > ceiling) {
  problems.push(`There are ${runtime.length} direct runtime dependencies; the ceiling is ${ceiling}.`);
}
for (const name of runtime) {
  if (!approvedRuntime.includes(name)) problems.push(`Runtime dependency "${name}" is not on the approved list.`);
}
for (const name of dev) {
  if (!approvedDev.includes(name)) problems.push(`Development dependency "${name}" is not on the approved list.`);
}

if (problems.length > 0) {
  console.error(`check-deps failed:\n- ${problems.join("\n- ")}\nA new dependency needs an accepted decision record in docs/decisions/.`);
  process.exit(1);
}
console.log(`check-deps: ${runtime.length} of at most ${ceiling} runtime dependencies (${runtime.join(", ") || "none"}), ${dev.length} development dependencies, all approved.`);
