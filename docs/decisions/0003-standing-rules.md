# 0003. Standing rules: declaration and table shape

- Status: proposed
- Date: 2026-10-28
- Cost to change later: high (a table shape users fill by hand)

## Context

Open question 2 in CLAUDE.md §13. Standing rules are people's own decisions stored as data ("Figma invoices are a business cost"). An existing bills app has this, written by hand. Its `rules` table matches on sender, domain, vendor, a subject keyword and mailbox. Its actions are handled elsewhere, ignore, set scope, set category and auto-paid. Its guard is `typical_max_cents`, and it has `enabled` and `fired_count` columns. This record generalises that table.

## Options

1. Match conditions as one JSONB column per row: flexible, but hard to read with plain SQL.
2. One typed column per matchable field and per settable field: readable, indexable, and every column gets a `COMMENT`.

## Decision

Option 2.

**Declaration.** At most one standing-rule declaration per type in v1:

```ts
rule.standing("vendor rules", {
  match: { vendor: "equals", sender_domain: "equals", subject: "contains" },
  set: ["scope", "category"],     // fields a rule row may set
  transitions: ["not_mine"],      // transitions a rule row may choose
  guard: { field: "amount" },     // each row stores its own maximum
  on: ["create"],                 // default: create only
})
```

Match modes in v1:
- `equals`: text is compared trimmed and case-insensitively; other types exactly.
- `contains`: text only, case-insensitive.

Fields marked `.unusual()` trip the guard of every standing rule.

**Table** `keepwell_rules_<type>`, here for `invoice`:

| Column | Meaning |
| --- | --- |
| `id uuid` | primary key |
| `name text not null` | what the person calls this rule ("Figma is a business cost") |
| `match_vendor`, `match_sender_domain`, `match_subject` | one per matchable field; empty means "any" |
| `set_scope`, `set_category` | one per settable field; empty means "don't set" |
| `transition text` | one of the declared transitions, or empty |
| `max_amount bigint`, `max_amount_currency char(3)` | the guard; empty means no maximum |
| `enabled boolean not null default true` | |
| `note text` | why the person decided this |
| `created_at`, `created_by`, `updated_at`, `updated_by` | |

`CHECK` constraints require at least one match column and at least one action. How often a rule fired is not stored. It is counted from the audit log, so there is one source of truth.

**Evaluation** (pipeline step 11):
1. Disabled rows are ignored.
2. No row matches: nothing happens.
3. More than one row matches: `rule_requires_review`, with a reason naming the rows. There are no priorities in v1, so a conflict goes to a person.
4. One row matches: the guard trips when the guard field is above the row's maximum (a different currency also trips it), or when any `.unusual()` field is true. Then the outcome is `rule_requires_review` (from milestone 5: `proposed`), with a reason naming the rule and the field.
5. Otherwise the row's fields are set. They are set with the authority of the person who wrote the rule, so the actor's `setBy` doesn't limit them, and the audit entry names the rule. Then the row's transition runs, if the intent's actor kind may run it. If it may not, the outcome is `rule_requires_review`.

**Editing.** Only people can edit rules, through the library and the CLI (and the UI from milestone 5). Every edit writes an audit entry (`invoice.rules.add`, `invoice.rules.update`, `invoice.rules.disable`) with before and after values. Rows are disabled, not deleted.

## Consequences

This covers that bills app's real rules: matching on sender, domain, vendor, subject and mailbox, setting scope and category, choosing "handled elsewhere" or "ignore", and a maximum amount. An "auto-paid" rule becomes a `mark_paid` transition. When an agent creates the record, that rule correctly sends the record to a person.

Not in v1: regular expressions, ranges, priorities, rules across types, several standing-rule sets per type.
