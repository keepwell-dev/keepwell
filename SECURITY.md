# Security

Please don't report security problems in public issues.

## Reporting a vulnerability

Report it privately through GitHub: open the [Security tab](https://github.com/keepwell-dev/keepwell/security) of this repository and choose **Report a vulnerability**, or go straight to [the report form](https://github.com/keepwell-dev/keepwell/security/advisories/new). Only the maintainers can see your report.

Please include:

- what an attacker can do, and what they need first (for example an agent token, or access to the host app);
- the steps to reproduce it, with the Keepwell version or commit;
- whether you'd like to be credited, and under which name.

We aim to reply within seven days, keep you informed while we work on a fix, and agree with you when to publish.

## Supported versions

Keepwell has no release yet. Once version 0.1 ships, security fixes go into the latest minor version.

## Scope

Keepwell's guarantees cover writes that go through Keepwell. An agent that also holds the database credentials can bypass it. Give agents a Keepwell token, never your `DATABASE_URL`.
