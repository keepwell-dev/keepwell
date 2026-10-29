# 0005. Audit table shape

- Status: proposed
- Date: 2026-10-28
- Cost to change later: high (frozen at 1.0; only additive changes after that)

## Context

Open question 4 in CLAUDE.md §13. The audit entry must hold everything §3.1 lists, be readable with plain SQL, and never change incompatibly after 1.0.

## Options

1. **Columns only.** The variable parts (input, changed fields, rules) don't fit.
2. **One JSONB document per row.** Flexible, but hard to query and index, and easy to let drift.
3. **Columns for what you filter or join on; JSONB for the variable parts.**

## Decision

Option 3.

```sql
create table keepwell_audit (
  id              bigint generated always as identity primary key,
  at              timestamptz not null default now(),
  spec            text not null default 'audit.v1',
  actor_kind      text not null,          -- person | agent | job | unknown (unknown or revoked token)
  actor_id        text,                   -- opaque string; empty when unknown
  actor_name      text,                   -- the name at that moment
  via             text not null,          -- library | mcp | http | cli | ui
  intent          text not null,          -- invoice.mark_paid
  record_type     text not null,
  record_id       uuid,                   -- empty when a create was refused
  outcome         text not null,          -- applied | refused | proposed | duplicate
  code            text,                   -- refusal code
  reason          text,
  input           jsonb not null,         -- personal fields replaced by markers (ADR 0006)
  evidence        jsonb,
  changes         jsonb not null default '{}',  -- {"status": {"before": "open", "after": "paid"}}
  rules           jsonb not null default '[]',  -- [{"rule": "...", "kind": "constraint", "result": "passed"}]
  declaration     text not null,          -- version hash, see keepwell_declarations
  idempotency_key text,
  proposal_id     uuid,                   -- from milestone 5
  proposer_kind   text,                   -- from milestone 5: who proposed an approved intent
  proposer_id     text
);
```

- `keepwell_declarations (version text primary key, spec jsonb, applied_at, applied_by)` holds every declaration version ever applied.
- Values inside the JSON use the spec's encoding (money as `{ "minor": …, "currency": … }`). `spec/audit.v1.json` describes the JSON parts.
- Indexes: `(record_type, record_id, at)`, `(actor_id, at)`, `(outcome, at)`, `(at)`.
- **Append-only:** `BEFORE UPDATE OR DELETE` row triggers and a `BEFORE TRUNCATE` statement trigger raise an error. Row triggers alone don't stop `TRUNCATE`.
- Every column has a `COMMENT`.
- The proposal columns exist from the start, so milestone 5 adds no columns.

## Consequences

Common questions are one plain query. For example, "what did agent X change yesterday" is `where actor_id = … and at > …`, and per-field changes are read with JSONB operators. The query in CLAUDE.md §8 (`select * from keepwell_audit order by at desc limit 10`) works as written.
