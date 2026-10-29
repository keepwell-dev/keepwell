# 0008. Development dependencies

- Status: accepted (by the author, in chat, 2026-10-29)
- Date: 2026-10-28
- Cost to change later: low, but CLAUDE.md §12 treats every dependency as needing approval

## Context

CLAUDE.md §4 pre-approves runtime dependencies. Development dependencies aren't mentioned. They don't ship to users, but they run on the author's machine and in CI, so they are still a matter of trust.

## Decision

Allowed development dependencies:

| Package | Why |
| --- | --- |
| `typescript` | compiler and `tsc --noEmit` |
| `@types/node`, `@types/pg` | types |
| `ajv` | tests only: proves the core's own declaration validator and `spec/declaration.v1.json` agree (the core itself must have zero dependencies, so it can't use ajv) |

**Not needed:**
- a test framework: `node:test` covers it.
- a coverage tool: Node's built-in coverage, with `--test-coverage-lines=90` as the gate.
- a linter or formatter: `tsc` in strict mode is the lint.
- a command-line library: the `keepwell` command is product code (milestone 2), not a development tool, and Node's built-in `util.parseArgs` reads its arguments.

Changesets come with milestone 8, with its own record.

**Recommendation on `tsx`** (§4 names it for tests): leave it out. Node 24 runs `.ts` files itself through type stripping, the same mechanism §4 already requires for users' declarations. If our own code also uses only erasable syntax (enforced by TypeScript's `erasableSyntaxOnly`), then:
- tests run with plain `node --test`;
- coverage maps exactly, because type stripping keeps line positions;
- our tests load TypeScript exactly the way users' declarations will be loaded.

If a real need appears, `tsx` can come back with a one-line change.

**CI:** `actions/checkout` and `actions/setup-node`, pinned to commit hashes. Postgres runs as service containers using the official `postgres` images.

## Consequences

Three development packages plus types, and no runtime dependency beyond the pre-approved list. Leaving out `tsx` deviates from CLAUDE.md §4 and needs the author's approval.
