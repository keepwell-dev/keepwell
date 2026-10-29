// Integration test: a round trip against the Postgres in DATABASE_URL_TEST.
import assert from "node:assert/strict";
import { test } from "node:test";
import pg from "pg";

const url = process.env.DATABASE_URL_TEST;
// Locally a missing database skips the test; in CI it fails.
const skip =
  url || process.env.CI === "true"
    ? false
    : "DATABASE_URL_TEST is not set. Run `docker compose up -d` and set it to postgres://keepwell:keepwell@localhost:5432/keepwell";

test("connects to Postgres 15 or newer and writes and reads a row", { skip }, async (t) => {
  assert.ok(url, "DATABASE_URL_TEST must be set in CI");
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    const version = await client.query<{ server_version: string; server_version_num: string }>(
      "select current_setting('server_version') as server_version, current_setting('server_version_num') as server_version_num",
    );
    const row = version.rows[0];
    assert.ok(row);
    t.diagnostic(`Postgres ${row.server_version}`);
    assert.ok(Number(row.server_version_num) >= 150000, `Postgres 15 or newer, got ${row.server_version}`);

    await client.query("create temporary table keepwell_m0_check (id integer primary key, note text not null)");
    await client.query("insert into keepwell_m0_check (id, note) values ($1, $2)", [1, "hello"]);
    const read = await client.query<{ note: string }>("select note from keepwell_m0_check where id = $1", [1]);
    assert.deepEqual(read.rows, [{ note: "hello" }]);
    await client.query("drop table keepwell_m0_check");
  } finally {
    await client.end();
  }
});
