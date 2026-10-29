# 0010. At most six direct runtime dependencies

- Status: accepted (by the author, in chat, 2026-10-29)
- Date: 2026-10-29
- Cost to change later: low

## Context

CLAUDE.md gives two ceilings for direct runtime dependencies: 6 in principle 5 (§2.6) and 8 in §4 and §6. The pre-approved list has five: `pg`, `hono`, `@hono/node-server`, `@modelcontextprotocol/sdk` and `zod`. Node 24 covers the rest: `util.parseArgs` for the CLI, `--env-file` for `.env` files, `node:crypto` for hashing tokens.

## Decision

The ceiling is 6, everywhere. `packages/core` has none. Dependencies, optional dependencies and peer dependencies all count. `scripts/check-deps.ts` fails CI above the ceiling, or on any runtime dependency that isn't on the approved list. Adding one needs an accepted decision record and an edit of that list.

## Consequences

One slot is free beyond the pre-approved five. §4 and §6 of CLAUDE.md read 6 instead of 8.
