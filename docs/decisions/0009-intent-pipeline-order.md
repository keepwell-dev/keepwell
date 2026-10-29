# 0009. Intent pipeline: permission first, idempotency per actor, people's grants

- Status: proposed
- Date: 2026-10-28
- Cost to change later: high (security)

## Context

Three gaps in CLAUDE.md §4.1 and §3.1:

1. **Permission comes after load.** Step 6 (permission) runs after step 5 (load). For `create`, load returns `duplicate` *with the existing record* before permission is checked. An actor without permission, even one that may not read that type, can read a record by guessing its business key. In the same way, `not_found` and `conflict` tell actors that may not use the intent whether an id exists.
2. **Idempotency has a race, and keys have no owner.**
   - Step 3 checks the key before the transaction, and step 16 stores it after the commit. Two concurrent retries with the same key both miss the check, and both run.
   - §4 doesn't say whose keys they are. If keys are global, one actor can read another's outcome by reusing their key.
3. **Grants for people are undefined.** Deny-by-default is clear for agents and jobs, which have token scopes. People acting in-process have no token and no grant, and person tokens' scopes aren't defined. Read literally, deny-by-default blocks every person.

## Decision

1. **New order:**
   - Before the transaction: authenticate, rate limit, **permission for the intent (declaration ∩ grant)**, idempotency.
   - Inside the transaction: begin, load, transition, fields, types, after-state, standing rules, constraints, guards, write.

   Permission doesn't need the record, so moving it costs nothing. A `duplicate` returns the full existing record only when the actor may also `get` that type. Otherwise it returns only the id.
2. **Idempotency:**
   - Keys are scoped to (actor id, intent).
   - The key row is inserted inside the write transaction under a unique index, so a concurrent retry waits on the index and then returns the stored outcome.
   - Refusals store their outcome in the same short transaction as their audit entry.
   - Keys expire after 24 hours.
3. **People:**
   - Grants apply to agents and jobs.
   - People in-process may do whatever the declaration allows people.
   - A person token may carry a scope. Without one, it allows what the declaration allows people.

**Tests:**
- An agent without `get` receives only the id on `duplicate`.
- Two concurrent intents with the same key run once.
- Another actor's identical key doesn't return the first actor's outcome.
- A person in-process can run a person-only intent with no grant.

## Consequences

Steps 5 and 6 of CLAUDE.md §4.1 swap. The core still makes the pure permission decision. It is only called earlier.
