import 'server-only';
import { Pool, type PoolClient } from 'pg';

const g = globalThis as unknown as { __panoyaPool?: Pool };

export function pool(): Pool {
  if (!g.__panoyaPool) {
    // Vercel'in Neon / Postgres entegrasyonu POSTGRES_URL de tanımlar.
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) throw new Error('DATABASE_URL tanımlı değil (.env.example dosyasına bakınız)');
    const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
    // Sunucusuz ortamda (Vercel) her işlev örneği az bağlantı açar.
    g.__panoyaPool = new Pool({ connectionString: url, max: process.env.VERCEL ? 3 : 10, ssl: local ? undefined : { rejectUnauthorized: false } });
  }
  return g.__panoyaPool;
}

export async function tx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const c = await pool().connect();
  try {
    await c.query('BEGIN');
    const r = await fn(c);
    await c.query('COMMIT');
    return r;
  } catch (e) {
    await c.query('ROLLBACK');
    throw e;
  } finally {
    c.release();
  }
}
