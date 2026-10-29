// The keepwell command. Before milestone 2 it only prints its version and usage.
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";

const usage = `Usage: keepwell --version

Keepwell is pre-release. Commands such as init, check and migrate arrive in a later version.
`;

export type Output = { out: (text: string) => void; err: (text: string) => void };

export function version(): string {
  // Same relative path from packages/cli/src and from dist/cli/src.
  const file = new URL("../../../package.json", import.meta.url);
  return (JSON.parse(readFileSync(file, "utf8")) as { version: string }).version;
}

export function main(args: string[], output: Output): number {
  let parsed;
  try {
    parsed = parseArgs({
      args,
      options: { version: { type: "boolean" }, help: { type: "boolean", short: "h" } },
      allowPositionals: true,
    });
  } catch (error) {
    output.err(`${(error as Error).message}\n\n${usage}`);
    return 1;
  }
  if (parsed.values.version) {
    output.out(`${version()}\n`);
    return 0;
  }
  const [command] = parsed.positionals;
  if (command !== undefined) {
    output.err(`Unknown command: ${command}\n\n${usage}`);
    return 1;
  }
  output.out(usage);
  return 0;
}
