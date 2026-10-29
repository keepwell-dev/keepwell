# 0012. Security reports through GitHub private vulnerability reporting

- Status: accepted (by the author, in chat, 2026-10-29)
- Date: 2026-10-29
- Cost to change later: low

## Context

CLAUDE.md §4.3 asks for a `SECURITY.md` with a disclosure address from milestone 0. The project has no email address yet.

## Decision

- Reports go through GitHub's private vulnerability reporting, switched on for this repository. Only maintainers see a report, and it needs no email address.
- `SECURITY.md` explains how to use it.
- An email address can be added next to it later.

## Consequences

A reporter needs a GitHub account. That is acceptable before release.
