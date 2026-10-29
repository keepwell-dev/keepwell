// Enforces import boundaries: core imports nothing outside itself, core and runtime import no model, hosting or
// protocol SDK (principle 6), packages reach each other only through their index (record 0007), and every npm
// import is a declared dependency.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "..");
const packages = join(root, "packages");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const runtimeDeps = Object.keys({ ...pkg.dependencies, ...pkg.optionalDependencies, ...pkg.peerDependencies });
const devDeps = Object.keys(pkg.devDependencies ?? {});
const forbiddenInCoreAndRuntime = [
  /^openai$/, /^@anthropic-ai\//, /^@google\//, /^@google-cloud\//, /^@mistralai\//, /^cohere-ai$/, /^ollama$/,
  /^ai$/, /^@ai-sdk\//, /^langchain$/, /^@langchain\//, /^@aws-sdk\//, /^@azure\//, /^@neondatabase\//,
  /^@supabase\//, /^@vercel\//, /^firebase(-admin)?$/, /^@modelcontextprotocol\//, /^hono$/, /^@hono\//,
];
// Matches `from "x"`, `import "x"`, `import("x")` and `require("x")`. Text in comments can match too; that errs on the strict side.
const specifiers = /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)["']([^"']+)["']/g;

const problems: string[] = [];
let count = 0;
const files = readdirSync(packages, { recursive: true, encoding: "utf8" })
  .filter((file) => file.endsWith(".ts") && !file.endsWith(".d.ts") && !file.split(sep).includes("node_modules"));

for (const file of files) {
  const [owner = "", area] = file.split(sep);
  const isEntry = file === "index.ts";
  const isCoreSource = owner === "core" && area === "src";
  for (const match of readFileSync(join(packages, file), "utf8").matchAll(specifiers)) {
    const spec = match[1] ?? "";
    const where = `packages/${file.split(sep).join("/")}: "${spec}"`;
    count++;
    if (spec.startsWith(".")) {
      const target = relative(packages, resolve(dirname(join(packages, file)), spec)).split(sep).join("/");
      const targetOwner = target.split("/")[0];
      if (!spec.endsWith(".ts")) problems.push(`${where} must end in .ts so Node can run the source.`);
      if (target.startsWith("..")) problems.push(`${where} reaches outside packages/.`);
      else if (target === "index.ts") problems.push(`${where} imports the public entry; import a package index instead.`);
      else if (isEntry || targetOwner !== owner) {
        if (isCoreSource) problems.push(`${where}: the core imports nothing outside packages/core.`);
        else if (target !== `${targetOwner}/src/index.ts`) problems.push(`${where}: import another package only through its src/index.ts.`);
      }
    } else if (spec.startsWith("node:")) {
      if (isCoreSource) problems.push(`${where}: the core does no I/O and imports no Node modules.`);
    } else {
      const name = spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : (spec.split("/")[0] ?? spec);
      if ((owner === "core" || owner === "runtime") && forbiddenInCoreAndRuntime.some((re) => re.test(name))) {
        problems.push(`${where}: ${owner} must not import model, hosting or protocol SDKs.`);
      } else if (isCoreSource) problems.push(`${where}: the core has no runtime dependencies.`);
      else if (!runtimeDeps.includes(name) && !(area === "test" && devDeps.includes(name))) {
        problems.push(`${where} is not a declared dependency (Node built-ins need the node: prefix).`);
      }
    }
  }
}

if (problems.length > 0) {
  console.error(`check-imports failed:\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log(`check-imports: ${count} imports in ${files.length} files, all within the boundaries.`);
