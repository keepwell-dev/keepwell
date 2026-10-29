# 0007. Packaging: one npm package, no workspaces

- Status: accepted (by the author, in chat, 2026-10-29)
- Date: 2026-10-28
- Cost to change later: high for the public surface; low for the internal layout

## Context

CLAUDE.md §4 says "npm workspaces; `tsc` builds each package to `dist/`", and §11 says one published package, `keepwell`, bundles them all. Workspaces are made for publishing or linking *several* packages. Shipping several workspace packages inside *one* npm package needs either a bundler, which is a build tool we don't want, or npm's `bundleDependencies` with linked workspaces, which is fragile.

## Options

1. **Workspaces with `bundleDependencies`.** Internal packages are named `@keepwell/*` and kept private, and are shipped inside `keepwell` through `bundleDependencies`.
2. **A bundler** (esbuild) builds one file per entry point.
3. **One `package.json` at the repo root, and that is the published `keepwell`.**
   - `packages/*` are folders, each with its own source and tests.
   - They import each other only through each package's index, using relative paths (`../../core/src/index.ts`).
   - One `tsc` build mirrors the tree into `dist/`.
   - A check script enforces the boundaries: core imports nothing outside core, and packages only import each other's index.

## Decision

Option 3. There are no workspaces and nothing to bundle, and tests run directly on the source. The boundary check runs in CI next to the forbidden-imports check that principle 6 already needs.

**Public surface** (the part that is costly to change):
- `import { record, field, rule } from "keepwell"`: the declaration builder.
- `import { createKeepwell } from "keepwell"`: the library API. `const kw = await createKeepwell({ databaseUrl, declarations })`, then `kw.invoice.create(...)`.
- The `keepwell` command.
- `keepwell/spec/declaration.v1.json` and `keepwell/spec/audit.v1.json`, for editors and other tools.

Everything else is internal and may move.

**package.json:**
- `"type": "module"`
- `"engines": { "node": ">=24" }`
- `files`: `dist`, `spec`, `skills`, `README.md`, `LICENSE`

**Proof in CI from milestone 0:** run `npm pack`, install the tarball in an empty folder, run `npx keepwell --version` and import the library.

## Consequences

This deviates from CLAUDE.md §4 ("npm workspaces"). Splitting into scoped packages later (`@keepwell/core`, …) stays possible through a decision record. The `@keepwell` npm organisation is already reserved.
