# 0001. Record architecture decisions

- Status: proposed
- Date: 2026-10-28
- Cost to change later: low

## Context

CLAUDE.md, the build brief, settles most choices. It is kept outside the public repository, so records quote what they need from it. For the rest we need a short written record that a later session, or a reviewer who wasn't there, can find, and a clear rule for which records bind us.

## Options

1. Decisions live in commit messages and chat.
2. One file per decision in `docs/decisions/`.

## Decision

Option 2. One file per decision, `docs/decisions/NNNN-short-title.md`, numbered in order and never renumbered. Each record has: Status, Date, Cost to change later, Context, Options, Decision, Consequences. Ten lines is fine.

- `Status: proposed`: written by Claude or anyone else. Not binding.
- `Status: accepted`: set only by the author. Overrides CLAUDE.md.
- `Status: superseded by NNNN`: a later record replaces it. Records are never deleted.
- **Cost low:** work continues while the record is proposed.
- **Cost high** (formats, public names, table shapes, dependencies, security): work that depends on it stops until the author accepts it.

## Consequences

Every deviation from CLAUDE.md has a record. Each milestone report lists the records still at `proposed`.
