# 0011. Test on Postgres 15 to 18

- Status: accepted (by the author, in chat, 2026-10-29)
- Date: 2026-10-29
- Cost to change later: low

## Context

CLAUDE.md §4 tests Postgres 15, 16 and 17. Postgres 18 is the current major release, and the large hosts offer it. "Works on any Postgres host" should include it.

## Decision

- CI runs the integration tests on Postgres 15, 16, 17 and 18, each in a service container with the official `postgres` image.
- Each new major version joins the matrix when it ships. A version leaves the matrix only through a decision record.
- The local `docker-compose.yml` uses the newest version, currently 18.

## Consequences

Four integration jobs instead of three. Features newer than Postgres 15 can't be used without a decision record.
