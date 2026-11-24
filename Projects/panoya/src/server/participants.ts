import 'server-only';
import type { PoolClient } from 'pg';
import { ADS, CHOICE_ADS, ROUND_AD_POOL, isAdKey, type AdKey } from '@/protocol/ads';
import { CONDITIONS, companyResponseFor, type CompanyResponse, type Condition, type ModuleId } from '@/protocol/conditions';
import { buildMailbox, type MailboxStage, type Mail } from '@/protocol/emails';
import { stepsFor, validateStepData, type StepDef } from '@/experiment/steps';
import type { ParticipantView, AppRow } from '@/experiment/types';
import { pool, tx } from './db';
import { cryptoShuffle, newParticipantCode } from './codes';
import { drawCondition, markAllocationUsed, stratumFor } from './allocation';

export interface ParticipantRow {
  id: string;
  code: string;
  module: ModuleId;
  condition: Condition;
  assignment_method: 'blok' | 'manuel';
  allocation_id: number | null;
  is_test: boolean;
  fast_mode: boolean;
  show_notes: boolean;
  round_order: AdKey[] | null;
  chosen_ad: AdKey | null;
  step_index: number;
  status: 'olusturuldu' | 'devam' | 'tamamlandi' | 'iptal';
  label: string | null;
  created_at: Date;
  started_at: Date | null;
  completed_at: Date | null;
  last_seen_at: Date | null;
}

export class FlowError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export function stepsOf(p: Pick<ParticipantRow, 'module' | 'round_order'>): StepDef[] {
  return stepsFor(p.module, p.round_order);
}

/* ---------------- Oluşturma ---------------- */
export interface CreateInput {
  module: ModuleId;
  /** 'blok' = önceden üretilmiş bloklu rastgele sıra; aksi halde elle seçilen koşul. */
  condition: 'blok' | Condition;
  isTest: boolean;
  fastMode: boolean;
  showNotes: boolean;
  label?: string | null;
}

export async function createParticipant(input: CreateInput): Promise<ParticipantRow> {
  return tx(async (c) => {
    let condition: Condition;
    let allocationId: number | null = null;
    if (input.condition === 'blok') {
      const d = await drawCondition(c, stratumFor(input.module, input.isTest));
      condition = d.condition;
      allocationId = d.allocationId;
    } else {
      if (!CONDITIONS.includes(input.condition)) throw new FlowError('Geçersiz koşul');
      condition = input.condition;
    }
    const roundOrder = input.module === 'A' ? cryptoShuffle(ROUND_AD_POOL) : null;
    let row: ParticipantRow | undefined;
    for (let attempt = 0; attempt < 5 && !row; attempt++) {
      const r = await c.query(
        `INSERT INTO participants (code, module, condition, assignment_method, allocation_id, is_test, fast_mode, show_notes, round_order, label)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (code) DO NOTHING RETURNING *`,
        [newParticipantCode(), input.module, condition, input.condition === 'blok' ? 'blok' : 'manuel', allocationId, input.isTest,
          input.isTest && input.fastMode, input.isTest && input.showNotes, roundOrder, input.label?.slice(0, 120) || null],
      );
      row = r.rows[0];
    }
    if (!row) throw new FlowError('Kod üretilemedi', 500);
    if (allocationId) await markAllocationUsed(c, allocationId, row.id);
    return row;
  });
}

export async function getByCode(code: string, c?: PoolClient, forUpdate = false): Promise<ParticipantRow | null> {
  const q = `SELECT * FROM participants WHERE code = $1${forUpdate ? ' FOR UPDATE' : ''}`;
  const r = await (c ?? pool()).query(q, [code]);
  return r.rows[0] ?? null;
}

/* ---------------- Katılımcı görünümü (istemciye giden durum) ---------------- */
function fmtClock(d: Date): string {
  return new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit' }).format(d);
}

/**
 * İstemciye gönderilen durum. Koşul adı yalnızca test kayıtlarında ya da bilgilendirme adımına gelindiğinde gönderilir.
 * Önceki turların başvuru durumları (katılımcının zaten gördüğü bilgi) sunucuda koşuldan türetilir.
 */
export async function viewOf(p: ParticipantRow, c?: PoolClient): Promise<ParticipantView> {
  const db = c ?? pool();
  const steps = stepsOf(p);
  const current = steps[p.step_index];
  const reveal = p.is_test || p.status === 'tamamlandi' || current?.kind === 'debrief';
  const resp = (await db.query('SELECT step_id, data, started_at, finished_at FROM responses WHERE participant_id = $1 ORDER BY step_index', [p.id])).rows as { step_id: string; data: Record<string, unknown>; started_at: Date | null; finished_at: Date | null }[];
  const byStep = new Map(resp.map((r) => [r.step_id, r]));

  const apps: AppRow[] = [];
  if (p.module === 'A' && p.round_order) {
    p.round_order.forEach((key, i) => {
      const w = byStep.get(`tur${i + 1}_bekleme`);
      if (!w) return;
      const when = w.started_at ? `Bugün ${fmtClock(new Date(w.started_at))}` : 'Bugün';
      apps.unshift({ key, when, status: companyResponseFor(p.condition).deliver ? 'rejected' : 'pending' });
    });
  }
  let recipient: { name: string; email: string } | null = null;
  if (p.module === 'B') {
    const ct = (await db.query('SELECT full_name, email FROM contacts WHERE participant_id = $1', [p.id])).rows[0];
    if (ct) recipient = { name: ct.full_name ?? '', email: ct.email ?? '' };
  }
  return {
    code: p.code,
    module: p.module,
    isTest: p.is_test,
    fastMode: p.is_test && p.fast_mode,
    showNotes: p.is_test && p.show_notes,
    status: p.status,
    stepIndex: p.step_index,
    stepIds: steps.map((s) => s.id),
    roundOrder: p.round_order,
    chosenAd: p.chosen_ad,
    apps,
    recipient,
    condition: reveal ? p.condition : null,
    assignment: p.is_test ? p.assignment_method : null,
  };
}

/* ---------------- Akış ---------------- */
export async function startParticipant(code: string): Promise<ParticipantView> {
  return tx(async (c) => {
    const p = await getByCode(code, c, true);
    if (!p) throw new FlowError('Katılımcı bulunamadı', 404);
    if (p.status === 'iptal') throw new FlowError('Bu katılımcı kodu iptal edilmiştir', 403);
    if (p.status === 'olusturuldu') {
      await c.query("UPDATE participants SET status = 'devam', started_at = now(), last_seen_at = now() WHERE id = $1", [p.id]);
      await c.query("INSERT INTO events (participant_id, type, step_id) VALUES ($1, 'start', $2)", [p.id, stepsOf(p)[0].id]);
    } else if (p.status === 'devam') {
      await c.query("INSERT INTO events (participant_id, type, step_id) VALUES ($1, 'resume', $2)", [p.id, stepsOf(p)[p.step_index]?.id ?? null]);
      await c.query('UPDATE participants SET last_seen_at = now() WHERE id = $1', [p.id]);
    }
    return viewOf((await getByCode(code, c))!, c);
  });
}

function parseTs(v: unknown): Date | null {
  if (typeof v !== 'string') return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function submitStep(code: string, stepId: string, data: unknown, startedAt?: unknown, finishedAt?: unknown): Promise<ParticipantView> {
  return tx(async (c) => {
    const p = await getByCode(code, c, true);
    if (!p) throw new FlowError('Katılımcı bulunamadı', 404);
    if (p.status === 'iptal') throw new FlowError('Bu katılımcı kodu iptal edilmiştir', 403);
    if (p.status === 'olusturuldu') throw new FlowError('Çalışma henüz başlatılmadı', 409);
    const steps = stepsOf(p);
    const expected = steps[p.step_index];
    if (!expected || expected.id !== stepId) {
      // Ağ hatası sonrası yinelenen gönderim: kayıt zaten varsa durumu döndür (çift kayıt yok).
      const dup = await c.query('SELECT 1 FROM responses WHERE participant_id = $1 AND step_id = $2', [p.id, stepId]);
      if (dup.rowCount) return viewOf(p, c);
      throw new FlowError(`Beklenen adım ${expected?.id ?? '(yok)'}, gelen ${stepId}`, 409);
    }
    const v = validateStepData(expected, data);
    if (!v.ok) throw new FlowError(`Doğrulama hatası: ${v.error}`, 422);
    const rec: Record<string, unknown> = { ...v.data };

    const updates: string[] = [];
    const params: unknown[] = [];
    if (expected.kind === 'roundWait') {
      // Referanstaki tur kaydı: kosul ve mesaj alanları (sunucuda, koşuldan türetilir).
      rec.kosul = p.condition;
      rec.mesaj = companyResponseFor(p.condition).deliver;
    }
    if (expected.kind === 'chooseAds') {
      const key = CHOICE_ADS.find((k) => String(rec.secim).startsWith(ADS[k].co));
      if (!key) throw new FlowError('Seçilen ilan çözümlenemedi', 422);
      rec.secilen_ilan = key;
      params.push(key);
      updates.push(`chosen_ad = $${params.length + 1}`);
    }
    if (expected.kind === 'applyB') {
      // Kişisel veriler yanıt tablosuna yazılmaz; ayrı tabloda tutulur ve dışa aktarıma girmez.
      await c.query(
        `INSERT INTO contacts (participant_id, full_name, email) VALUES ($1,$2,$3)
         ON CONFLICT (participant_id) DO UPDATE SET full_name = EXCLUDED.full_name, email = EXCLUDED.email`,
        [p.id, String(rec.ad_soyad).trim(), String(rec.eposta).trim()],
      );
      delete rec.ad_soyad;
      delete rec.eposta;
    }
    await c.query(
      'INSERT INTO responses (participant_id, step_id, step_index, data, started_at, finished_at) VALUES ($1,$2,$3,$4,$5,$6)',
      [p.id, stepId, p.step_index, JSON.stringify(rec), parseTs(startedAt), parseTs(finishedAt) ?? new Date()],
    );
    const isLast = p.step_index === steps.length - 1;
    const sets = ['step_index = step_index + 1', 'last_seen_at = now()', ...updates];
    if (isLast) sets.push("status = 'tamamlandi'", 'completed_at = now()');
    await c.query(`UPDATE participants SET ${sets.join(', ')} WHERE id = $1`, [p.id, ...params]);
    return viewOf((await getByCode(code, c))!, c);
  });
}

/* ---------------- Koşula bağlı içerik (yalnızca gösterileceği anda) ---------------- */
async function currentStep(code: string) {
  const p = await getByCode(code);
  if (!p) throw new FlowError('Katılımcı bulunamadı', 404);
  if (p.status !== 'devam') throw new FlowError('Çalışma etkin değil', 409);
  return { p, step: stepsOf(p)[p.step_index] };
}

export async function companyResponse(code: string, stepId: string, elapsedSec: number): Promise<CompanyResponse> {
  const { p, step } = await currentStep(code);
  if (!step || step.id !== stepId || step.kind !== 'roundWait') throw new FlowError('Bu adımda şirket yanıtı yok', 409);
  const resp = companyResponseFor(p.condition);
  await pool().query("INSERT INTO events (participant_id, type, step_id, payload) VALUES ($1, 'company_response', $2, $3)", [
    p.id, stepId, JSON.stringify({ delivered: resp.deliver, gecen_sn: Math.round(elapsedSec * 10) / 10 }),
  ]);
  return resp;
}

export async function mailbox(code: string, stage: MailboxStage): Promise<{ mails: Mail[]; fresh: string | null; clock: string; recipient: string }> {
  const { p, step } = await currentStep(code);
  if (!step || step.kind !== 'inbox' || step.mailbox !== stage) throw new FlowError('Bu aşamada gelen kutusu yok', 409);
  if (!p.chosen_ad || !isAdKey(p.chosen_ad)) throw new FlowError('Başvuru bulunamadı', 409);
  const ct = (await pool().query('SELECT full_name, email FROM contacts WHERE participant_id = $1', [p.id])).rows[0] ?? {};
  const opened = (await pool().query("SELECT payload FROM events WHERE participant_id = $1 AND type = 'mail_open'", [p.id])).rows
    .map((r) => r.payload as { mailId: string; stage: MailboxStage });
  const box = buildMailbox(stage, { condition: p.condition, chosenAd: p.chosen_ad, name: ct.full_name ?? '', opened });
  return { ...box, recipient: ct.email ?? '' };
}

/* ---------------- Olaylar ---------------- */
const EVENT_TYPES = new Set(['step_view', 'mail_open', 'link_click', 'behavior_choice', 'page_hidden', 'page_visible']);

export async function logEvent(code: string, type: string, stepId: string | null, payload: Record<string, unknown>, clientTs?: unknown) {
  if (!EVENT_TYPES.has(type)) throw new FlowError('Geçersiz olay türü', 422);
  const p = await getByCode(code);
  if (!p) throw new FlowError('Katılımcı bulunamadı', 404);
  if (p.status !== 'devam') return;
  const step = stepsOf(p)[p.step_index];
  if (stepId && step?.id !== stepId) return; // eski sekmeden gelen olaylar yok sayılır
  if (type === 'mail_open' || type === 'link_click') {
    if (step?.kind !== 'inbox') throw new FlowError('Gelen kutusu dışında e-posta olayı', 409);
    payload = { mailId: String(payload.mailId ?? '').slice(0, 20), stage: step.mailbox };
  }
  const safe = JSON.stringify(payload).slice(0, 2000);
  await pool().query('INSERT INTO events (participant_id, type, step_id, payload, client_ts) VALUES ($1,$2,$3,$4,$5)', [p.id, type, stepId, safe, parseTs(clientTs)]);
}

/* ---------------- Yönetim ---------------- */
export async function resetTestParticipant(code: string) {
  await tx(async (c) => {
    const p = await getByCode(code, c, true);
    if (!p) throw new FlowError('Katılımcı bulunamadı', 404);
    if (!p.is_test) throw new FlowError('Gerçek katılımcı verisi sıfırlanamaz', 403);
    await c.query('DELETE FROM responses WHERE participant_id = $1', [p.id]);
    await c.query('DELETE FROM events WHERE participant_id = $1', [p.id]);
    await c.query('DELETE FROM contacts WHERE participant_id = $1', [p.id]);
    await c.query("UPDATE participants SET step_index = 0, status = 'olusturuldu', started_at = NULL, completed_at = NULL, chosen_ad = NULL, round_order = CASE WHEN module = 'A' THEN $2::text[] ELSE NULL END WHERE id = $1", [p.id, cryptoShuffle(ROUND_AD_POOL)]);
  });
}

export async function setCancelled(code: string, cancelled: boolean) {
  const p = await getByCode(code);
  if (!p) throw new FlowError('Katılımcı bulunamadı', 404);
  if (cancelled) await pool().query("UPDATE participants SET status = 'iptal' WHERE id = $1", [p.id]);
  else await pool().query("UPDATE participants SET status = CASE WHEN completed_at IS NOT NULL THEN 'tamamlandi' WHEN started_at IS NOT NULL THEN 'devam' ELSE 'olusturuldu' END WHERE id = $1", [p.id]);
}

export async function purgeContact(code: string) {
  const p = await getByCode(code);
  if (!p) throw new FlowError('Katılımcı bulunamadı', 404);
  await pool().query('DELETE FROM contacts WHERE participant_id = $1', [p.id]);
}
