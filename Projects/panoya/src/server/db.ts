import 'server-only';
import { Pool, type PoolClient } from 'pg';

const g = globalThis as unknown as { __panoyaPool?: Pool };

export function pool(): Pool {
  if (!g.__panoyaPool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL tanımlı değil (.env.example dosyasına bakınız)');
    g.__panoyaPool = new Pool({ connectionString: url, max: 10, ssl: /supabase|sslmode=require/.test(url) ? { rejectUnauthorized: false } : undefined });
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
