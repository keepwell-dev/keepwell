# 0002. Declaration builder and expression language

- Status: proposed
- Date: 2026-10-28
- Cost to change later: high (users' declarations and `spec/declaration.v1` depend on it)

## Context

Open question 1 in CLAUDE.md §13. Section 3.3 sketches the builder and §3.1 fixes the semantics. Before writing `spec/declaration.v1.json` and `spec/expressions.v1.md`, the exact syntax must be settled.

## Options

For the builder: (a) the chained builder from §3.3, (b) plain JSON objects only. For expressions: (a) a small language of our own, (b) CEL, (c) JSON-logic objects, (d) SQL fragments.

CEL is well specified but needs a parser dependency and is much larger than we need. JSON-logic is easy for machines and hard for people to read. SQL fragments are not portable and not safe.

## Decision

### Builder

Keep §3.3 almost as it is. Every builder call returns a plain JSON-serialisable object that already has the spec's shape, so `check` can print the JSON and other languages can read it.

| Builder | Spec type | Value in JSON |
| --- | --- | --- |
| `field.text()` | `text` | string |
| `field.integer()` | `integer` | integer within JavaScript's safe range |
| `field.money()`, `field.money("EUR")` | `money` | `{ "minor": 480000, "currency": "EUR" }` (minor units per ISO 4217) |
| `field.date()` | `date` | `"2026-10-28"` |
| `field.timestamp()` | `timestamp` | `"2026-10-28T21:09:03Z"` (UTC) |
| `field.boolean()` | `boolean` | `true` / `false` |
| `field.enum(["a", "b"])` | `enum` | one of the listed strings |
| `field.json()` | `json` | any JSON |
| `field.ref("customer")` | `ref` | the id of a `customer` record |

Field modifiers: `.required()`, `.default(value)`, `.setBy(...writers)`, `.immutable()`, `.derived(expression)`, `.unique()` (the business key; at most one per type in v1), `.unusual()` (boolean fields only; trips standing-rule guards), `.personal()` (ADR 0006), `.describe("plain text")` (used by `check`, the `describe` tool and the Postgres `COMMENT`).

Writers are `"person"`, `"agent"`, `"job"`, or `"kind:id"` for one named actor (`"agent:mail-agent"`). A field without `setBy` may be set by `person` and `job` only.

Record: `record(name, { describe?, fields, create: { by }, update?: { by }, delete?: { by }, status: { initial, transitions }, rules })`. `delete` is a soft delete. Without it, the type has no delete intent.

Transition: `{ from, to, by, requires?, guards? }`, where `guards` is a list of `rule.guard(name, expression)`.

Rules: `rule.constraint(name, expression)` and `rule.standing(name, options)` (ADR 0003).

### Names

- Types, fields, states and transitions match `^[a-z][a-z0-9_]{0,39}$`.
- An intent id is `type.intent` (`invoice.mark_paid`). Its MCP tool name replaces the dot with `_` (`invoice_mark_paid`).
- `check` refuses a declaration when two intents get the same tool name (type `bank_account` with intent `x`, and type `bank` with intent `account_x`), or when a tool name is longer than 64 characters.
- `check` also refuses a transition that has a reserved name: `create`, `update`, `delete`, `get`, `search`, `describe`, `propose`, `approve`, `reject`, `revert`, `explain`, `rules`.

### Version

There is no hand-kept version number. A declaration's version is the SHA-256 of its canonical JSON (keys sorted). `migrate` stores every applied version in `keepwell_declarations`, and every audit entry refers to the version it was evaluated against.

### Expressions

The full grammar goes in `spec/expressions.v1.md`. In summary:

- **Literals:** integers, `"double-quoted strings"`, `true`, `false`, `null`, `date("2026-01-31")`, `money("50.00 EUR")`, `days(30)`.
- **References:** field names. Guards can also use `actor.kind`, `actor.id` and `evidence`.
- **Operators:**
  - comparison: `==` `!=` `<` `<=` `>` `>=`
  - membership: `x in ["a", "b"]`
  - logic: `and`, `or`, `not`, parentheses
  - dates: `due_date <= issue_date + days(60)`. Days are the only unit, because months are ambiguous.
- **Not in v1:** arithmetic on numbers, other functions, `today`. Rules must give the same answer when re-run at approval time. Rules about other records or about the current date stay in the application until v2.
- **Empty fields:** a comparison with an empty field is *unknown*, and a constraint or guard passes unless it is *false*. These are the same semantics as a Postgres `CHECK`. `x == null` and `x != null` test whether a value is present and are always true or false.
- **Money:** compared in minor units. A plain number counts as minor units (`amount > 0` means more than zero cents). Comparing different currencies is *false*, so the rule fails closed, and the reason says the currencies differ.
- **Types:** `check` type-checks every expression. Comparing a date with a string is an error at `check` time, not a surprise at write time.
- **Limits:** 500 characters, nesting depth 16.
- **Plain language:** every node has a fixed phrase. For example, `due_date >= issue_date` prints as "due date is on or after issue date", and `actor.kind != "job" or evidence != null` as "the actor is not a job, or evidence is given". A rule prints as `<name>: <phrase>`.
- **Database:** constraints that only use the record's own fields are also generated as Postgres `CHECK` constraints, as a second line of defence. The core's evaluation is what produces the refusal with a reason.

## Consequences

The language is small, so printing, type-checking and SQL generation stay simple, and a second implementation is realistic. Some business rules can't be expressed in v1: sums, rules across records, rules about today's date. Those stay in the application and end in an intent.
