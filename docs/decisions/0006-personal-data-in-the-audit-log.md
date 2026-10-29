# 0006. Personal data in the audit log

- Status: proposed
- Date: 2026-10-28
- Cost to change later: high (decides the audit shape, ADR 0005)

## Context

Open question 5 in CLAUDE.md §13. The audit log is append-only and stores intent input, which can contain personal data. CLAUDE.md asks for a way to erase a person's data without breaking the log, accepted before milestone 8. But the audit shape is built in milestone 1b and can't change incompatibly later. On top of that, §4.3's trigger rejects every `UPDATE`. So erasure has to be designed now, together with the audit shape, not just before release.

## Options

1. **Allow one kind of update.** Audit rows may be updated only to replace a personal value with a marker, and a trigger checks that nothing else changed. Values stay inline, but "append-only" gets an exception, and a later hash chain gets harder.
2. **Personal values live next to the log.** They go in `keepwell_audit_personal (id, audit_id, field, part, value)`, where part is input, before or after. `keepwell_audit` holds a marker in their place and stays strictly append-only, with no exceptions. Erasure deletes rows from the side table and writes an audit entry saying what was erased, without the values.
3. **Encrypt each person's values with their own key** and erase by deleting the key. This is strong, but needs key management and makes plain-SQL reading impossible, which goes against principle 1.

## Decision

Option 2.

- **Markers:** values of `.personal()` fields never go into `keepwell_audit.input` or `.changes`. The marker is `{"$personal": "<side-row id>"}`. After erasure the marker stays, so a reader can see a value existed and find the erasure entry.
- **Records:** erasure also clears the record's personal fields (they become empty) through a person-only intent, `<type>.erase_personal`. This intent is not exposed to agents. An erased record may have empty required fields, which is documented.
- **Scope in v1:** one record, meaning all its personal fields in the record and in every audit entry about it. Finding every record about one person stays the application's job.
- **Tamper-evidence:** the side table rejects `UPDATE`. A `DELETE` is only expected through `keepwell_erase_personal(...)`, which also writes the audit entry. A database owner can still delete rows directly, which is as visible as removing the trigger. The claim stays *tamper-evident*.
- **Hash chain (later):** a future hash chain covers `keepwell_audit` rows, which hold markers rather than values, so erasure never breaks it.
- **Wording:** never "GDPR-compliant". The docs say exactly what is erased and what stays: that a change happened, who made it, when, and the non-personal fields.

## Consequences

`keepwell_audit` is append-only without exceptions, which is a simpler and stronger claim. Reading personal values takes one join, and `keepwell-schema.md` and `export` handle that. The legal fit for a given company is theirs to judge.
