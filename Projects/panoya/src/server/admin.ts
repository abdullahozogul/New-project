import 'server-only';
import { ADS, isAdKey } from '@/protocol/ads';
import { COND_LABEL, type Condition, type ModuleId } from '@/protocol/conditions';
import { FILLER_ITEMS } from '@/protocol/scales';
import { stepLabel, stepsFor, type StepDef } from '@/experiment/steps';
import { computeScores } from '@/lib/scoring';
import { pool } from './db';
import { getByCode, stepsOf, type ParticipantRow } from './participants';

export type Scope = 'gercek' | 'test' | 'tumu';
const scopeSql = (s: Scope) => (s === 'gercek' ? 'NOT p.is_test' : s === 'test' ? 'p.is_test' : 'TRUE');

export interface ResponseRow { step_id: string; step_index: number; data: Record<string, unknown>; started_at: Date | null; finished_at: Date | null; created_at: Date }
export interface EventRow { type: string; step_id: string | null; payload: Record<string, unknown>; client_ts: Date | null; created_at: Date }

/* ---------------- Gösterge paneli ---------------- */
export async function dashboardStats(scope: Scope) {
  const r = await pool().query(
    `SELECT module, condition, status, count(*)::int AS n FROM participants p WHERE ${scopeSql(scope)} GROUP BY module, condition, status`,
  );
  const recent = await pool().query(
    `SELECT code, module, status, step_index, round_order, is_test, last_seen_at FROM participants p
     WHERE ${scopeSql(scope)} AND status = 'devam' ORDER BY last_seen_at DESC NULLS LAST LIMIT 8`,
  );
  return {
    cells: r.rows as { module: ModuleId; condition: Condition; status: string; n: number }[],
    active: recent.rows.map((p) => ({ code: p.code as string, module: p.module as ModuleId, isTest: p.is_test as boolean, lastSeen: p.last_seen_at as Date | null, step: stepLabel(stepsFor(p.module, p.round_order)[p.step_index]?.id ?? '') })),
  };
}

/* ---------------- Liste ---------------- */
export interface ListFilter { scope: Scope; module?: ModuleId | ''; status?: string; q?: string }

export async function listParticipants(f: ListFilter) {
  const where = [scopeSql(f.scope)];
  const params: unknown[] = [];
  if (f.module) { params.push(f.module); where.push(`p.module = $${params.length}`); }
  if (f.status) { params.push(f.status); where.push(`p.status = $${params.length}`); }
  if (f.q) { params.push(`%${f.q.toUpperCase()}%`); where.push(`(p.code ILIKE $${params.length} OR p.label ILIKE $${params.length})`); }
  const r = await pool().query(`SELECT p.* FROM participants p WHERE ${where.join(' AND ')} ORDER BY p.created_at DESC LIMIT 1000`, params);
  return (r.rows as ParticipantRow[]).map((p) => {
    const steps = stepsOf(p);
    return { ...p, total: steps.length, stepName: p.status === 'tamamlandi' ? 'Tamamlandı' : stepLabel(steps[p.step_index]?.id ?? '') };
  });
}

/* ---------------- Ayrıntı ---------------- */
export async function participantDetail(code: string) {
  const p = await getByCode(code);
  if (!p) return null;
  const [resp, ev, ct] = await Promise.all([
    pool().query('SELECT step_id, step_index, data, started_at, finished_at, created_at FROM responses WHERE participant_id = $1 ORDER BY step_index', [p.id]),
    pool().query('SELECT type, step_id, payload, client_ts, created_at FROM events WHERE participant_id = $1 ORDER BY created_at, id', [p.id]),
    pool().query('SELECT 1 FROM contacts WHERE participant_id = $1', [p.id]),
  ]);
  const responses = resp.rows as ResponseRow[];
  const events = ev.rows as EventRow[];
  const flat = flatten(p, responses);
  return { p, steps: stepsOf(p), responses, events, hasContact: (ct.rowCount ?? 0) > 0, scores: computeScores(flat.items, p.condition), derived: derived(p, events, responses) };
}

/* ---------------- Düzleştirme (geniş biçim) ---------------- */
/** Madde kimlikleri çakışmayacak biçimde tasarlanmıştır; madde dışı alanlar `adim.alan` biçiminde önek alır. */
export function flatten(p: ParticipantRow, responses: ResponseRow[]) {
  const steps = stepsOf(p);
  const byId = new Map(steps.map((s) => [s.id, s]));
  const items: Record<string, unknown> = {};
  const meta: Record<string, unknown> = {};
  for (const r of responses) {
    const s = byId.get(r.step_id);
    const itemIds = new Set(itemIdsOf(s));
    for (const [k, v] of Object.entries(r.data)) {
      if (itemIds.has(k)) items[k] = v;
      else meta[`${r.step_id}.${k}`] = v;
    }
  }
  return { items, meta };
}

function itemIdsOf(s: StepDef | undefined): string[] {
  if (!s) return [];
  const ids = s.items.map((i) => i.id);
  if (s.kind === 'behavior') ids.push(...FILLER_ITEMS.map((i) => i.id));
  return ids;
}

/** Olaylardan türetilen değişkenler: e-posta açma/tıklama, şirket yanıtı zamanlaması, devam etme ve sekme değişimi. */
export function derived(p: ParticipantRow, events: EventRow[], responses: ResponseRow[]) {
  const first = (pred: (e: EventRow) => boolean) => events.find(pred)?.created_at ?? null;
  const count = (pred: (e: EventRow) => boolean) => events.filter(pred).length;
  const out: Record<string, unknown> = {
    devam_etme_sayisi: count((e) => e.type === 'resume'),
    sekme_gizlenme_sayisi: count((e) => e.type === 'page_hidden'),
    toplam_sure_dk: p.started_at && p.completed_at ? Math.round(((+new Date(p.completed_at) - +new Date(p.started_at)) / 60000) * 10) / 10 : null,
  };
  if (p.module === 'A') {
    for (let i = 1; i <= 4; i++) {
      const e = events.find((x) => x.type === 'company_response' && x.step_id === `tur${i}_bekleme`);
      out[`tur${i}_sirket_yaniti_gonderildi`] = e ? Boolean(e.payload.delivered) : null;
      out[`tur${i}_yanit_istem_sn`] = e ? (e.payload.gecen_sn as number) : null;
    }
  } else {
    const open = (id: string) => (e: EventRow) => e.type === 'mail_open' && e.payload.mailId === id;
    out.secilen_ilan = p.chosen_ad;
    out.secilen_sirket = p.chosen_ad && isAdKey(p.chosen_ad) ? ADS[p.chosen_ad].co : null;
    out.sirket_epostasi_11_30 = p.condition === 'ghosting' ? 'gönderilmedi' : 'gönderildi';
    out.eposta_onay_acildi = count(open('conf')) > 0;
    out.eposta_onay_ilk_acilis = first(open('conf'));
    out.eposta_ret_acildi = p.condition === 'ghosting' ? null : count(open('rej')) > 0;
    out.eposta_ret_ilk_acilis = first(open('rej'));
    out.eposta_ret_acilis_sayisi = count(open('rej'));
    out.eposta_arastirma_acildi = count(open('res')) > 0;
    out.eposta_arastirma_ilk_acilis = first(open('res'));
    out.baglanti_tiklandi = count((e) => e.type === 'link_click') > 0;
    out.baglanti_tiklama_zamani = first((e) => e.type === 'link_click');
    out.eposta_toplam_acilis = count((e) => e.type === 'mail_open');
    const d1 = responses.find((r) => r.step_id === 'basvuru');
    out.basvuru_zamani = d1?.finished_at ?? null;
  }
  return out;
}

export function conditionLabel(c: Condition) { return COND_LABEL[c]; }
