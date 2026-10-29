#!/usr/bin/env node
// Entry point of the keepwell command.
import { main } from "./index.ts";

process.exitCode = main(process.argv.slice(2), {
  out: (text) => process.stdout.write(text),
  err: (text) => process.stderr.write(text),
});
