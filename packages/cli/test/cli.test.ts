// Tests for the keepwell command before milestone 2: --version, usage and unknown input.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { main, version } from "../src/index.ts";

function run(args: string[]) {
  let out = "";
  let err = "";
  const code = main(args, { out: (text) => (out += text), err: (text) => (err += text) });
  return { code, out, err };
}

test("--version prints the version from package.json", () => {
  const pkg = JSON.parse(readFileSync(new URL("../../../package.json", import.meta.url), "utf8"));
  assert.equal(version(), pkg.version);
  assert.deepEqual(run(["--version"]), { code: 0, out: `${pkg.version}\n`, err: "" });
});

test("no arguments prints usage", () => {
  const result = run([]);
  assert.equal(result.code, 0);
  assert.match(result.out, /^Usage: keepwell/);
});

test("an unknown command or option fails with usage", () => {
  for (const args of [["migrate"], ["--force"]]) {
    const result = run(args);
    assert.equal(result.code, 1);
    assert.equal(result.out, "");
    assert.match(result.err, /Usage: keepwell/);
  }
});
