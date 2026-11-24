/* Veritabanı göçlerini sırayla uygular. Kullanım: DATABASE_URL=... npm run db:migrate */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';

async function main() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error('DATABASE_URL tanımlı değil');
  const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
  const client = new Client({ connectionString: url, ssl: local ? undefined : { rejectUnauthorized: false } });
  await client.connect();
  await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
  const dir = path.join(process.cwd(), 'db', 'migrations');
  const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  for (const f of files) {
    const done = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [f]);
    if (done.rowCount) continue;
    await client.query('BEGIN');
    try {
      await client.query(readFileSync(path.join(dir, f), 'utf8'));
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [f]);
      await client.query('COMMIT');
      console.log('uygulandı:', f);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    }
  }
  await client.end();
  console.log('göçler güncel');
}
main().catch((e) => { console.error(e); process.exit(1); });
