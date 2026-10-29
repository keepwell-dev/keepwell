// Tests for the list of stable refusal codes.
import assert from "node:assert/strict";
import { test } from "node:test";
import { isRefusalCode, refusalCodes } from "../src/index.ts";

test("the ten stable refusal codes are listed, each once", () => {
  // Changing this list is a breaking change; it needs a decision record.
  assert.deepEqual(refusalCodes, [
    "invalid_input",
    "constraint_failed",
    "transition_not_allowed",
    "actor_not_permitted",
    "field_not_writable",
    "guard_failed",
    "rule_requires_review",
    "not_found",
    "conflict",
    "rate_limited",
  ]);
  assert.equal(new Set(refusalCodes).size, refusalCodes.length);
});

test("isRefusalCode accepts listed codes only", () => {
  for (const code of refusalCodes) assert.equal(isRefusalCode(code), true);
  assert.equal(isRefusalCode("applied"), false);
  assert.equal(isRefusalCode("Invalid_Input"), false);
  assert.equal(isRefusalCode(undefined), false);
});
