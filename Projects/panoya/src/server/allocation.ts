import 'server-only';
import type { PoolClient } from 'pg';
import { CONDITIONS, type Condition, type ModuleId } from '@/protocol/conditions';
import { cryptoShuffle } from './codes';

/**
 * Bloklu rastgele atama (blok büyüklüğü 3 = her blokta her koşul bir kez, sırası rastgele).
 * Katman: modül + gerçek/test; Modül B için ayrıca gün (referans notu: "günlük üçerli bloklar").
 * Sıra önceden üretilir ve `allocations` tablosunda saklanır; katılımcı yanıtları atamayı etkileyemez.
 * Test kayıtları ayrı katmandadır, gerçek sırayı tüketmez.
 */
export function stratumFor(module: ModuleId, isTest: boolean, now = new Date()): string {
  const base = `${module}:${isTest ? 'test' : 'gercek'}`;
  if (module === 'B') {
    const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(now);
    return `${base}:${day}`;
  }
  return base;
}

export async function drawCondition(c: PoolClient, stratum: string): Promise<{ allocationId: number; condition: Condition }> {
  // Aynı katmanda eşzamanlı atamaları sıraya sokmak için işlem düzeyinde kilit.
  await c.query('SELECT pg_advisory_xact_lock(hashtext($1))', [stratum]);
  let row = (await c.query('SELECT id, condition FROM allocations WHERE stratum = $1 AND used_by IS NULL ORDER BY seq LIMIT 1', [stratum])).rows[0];
  if (!row) {
    const last = (await c.query('SELECT COALESCE(MAX(seq),0) AS seq, COALESCE(MAX(block_no),0) AS block FROM allocations WHERE stratum = $1', [stratum])).rows[0];
    const block = cryptoShuffle(CONDITIONS);
    for (let i = 0; i < block.length; i++) {
      await c.query('INSERT INTO allocations (stratum, seq, block_no, condition) VALUES ($1,$2,$3,$4)', [stratum, Number(last.seq) + i + 1, Number(last.block) + 1, block[i]]);
    }
    row = (await c.query('SELECT id, condition FROM allocations WHERE stratum = $1 AND used_by IS NULL ORDER BY seq LIMIT 1', [stratum])).rows[0];
  }
  return { allocationId: Number(row.id), condition: row.condition as Condition };
}

export async function markAllocationUsed(c: PoolClient, allocationId: number, participantId: string) {
  await c.query('UPDATE allocations SET used_by = $1, used_at = now() WHERE id = $2', [participantId, allocationId]);
}
