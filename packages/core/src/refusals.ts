// The stable refusal codes. Adding or renaming one needs an accepted decision record.

export const refusalCodes = [
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
] as const;

export type RefusalCode = (typeof refusalCodes)[number];

export function isRefusalCode(value: unknown): value is RefusalCode {
  return typeof value === "string" && (refusalCodes as readonly string[]).includes(value);
}
