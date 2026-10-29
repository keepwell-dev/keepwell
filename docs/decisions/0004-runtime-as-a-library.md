# 0004. The runtime is a library; Postgres coordinates

- Status: proposed
- Date: 2026-10-28
- Cost to change later: medium

## Context

Open question 3 in CLAUDE.md §13. The host application writes through the library, and `keepwell serve` (MCP, HTTP, UI) writes too. That gives two or more writers on one database. Should all writes go through one long-running service instead?

## Options

1. **Library everywhere.** Every process embeds the same runtime and talks to the same database.
2. **One service.** A Keepwell service owns all writes, and the application calls it over HTTP.

## Decision

Option 1. Safety comes from Postgres, not from process memory:

- Every intent is one transaction with `SELECT … FOR UPDATE` on the record.
- Business keys are unique indexes. Two processes creating the same key get one `applied` and one `duplicate`.
- Idempotency keys are a unique index written in the write transaction (ADR 0009).
- Grants, token revocations and standing rules are read inside the transaction, without a cache. A revoked token or an edited rule takes effect on the next intent.
- A process refuses to start when its declarations' version (ADR 0002) differs from the version `migrate` applied. If the database moves on while the process runs, its intents are refused with `conflict` and the reason "this process runs older declarations; restart it".
- Rate limits are counted per process in 0.1. This is documented.

**Proof:** an integration test runs two runtime instances with separate connection pools and races `mark_paid` on one record, two creates with the same business key, and two intents with the same idempotency key.

## Consequences

There is no extra service to deploy. The host application keeps passing people's identity in-process, as CLAUDE.md §4.3 describes. `keepwell serve` is just another process. A central service stays possible later, because the HTTP adapter is already planned.
