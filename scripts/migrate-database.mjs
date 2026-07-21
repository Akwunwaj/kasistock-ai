import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) {
  console.error("DATABASE_URL is required to run database migrations.");
  process.exit(1);
}

const schema = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
const migrationId = `001_initial_${createHash("sha256").update(schema).digest("hex").slice(0, 16)}`;
const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 5_000 });
const client = await pool.connect();

try {
  await client.query("BEGIN");
  await client.query(`create table if not exists schema_migrations (
    id text primary key,
    applied_at timestamptz not null default now()
  )`);
  const existing = await client.query("select id from schema_migrations where id = $1", [
    migrationId,
  ]);
  if (existing.rowCount === 0) {
    await client.query(schema);
    await client.query("insert into schema_migrations (id) values ($1)", [migrationId]);
  }
  await client.query("COMMIT");
  console.log(JSON.stringify({ status: "ok", migrationId, applied: existing.rowCount === 0 }));
} catch (error) {
  await client.query("ROLLBACK");
  const name = error instanceof Error ? error.name : "UnknownError";
  console.error(JSON.stringify({ status: "failed", migrationId, error: name }));
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
