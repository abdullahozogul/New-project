import 'server-only';
import ExcelJS from 'exceljs';
import { COND_LABEL } from '@/protocol/conditions';
import { FILLER_ITEMS, type Item } from '@/protocol/scales';
import { stepLabel, stepsFor } from '@/experiment/steps';
import { computeScores } from '@/lib/scoring';
import { pool } from './db';
import type { ParticipantRow } from './participants';
import { derived, flatten, type EventRow, type ResponseRow, type Scope } from './admin';

type Row = Record<string, unknown>;
export interface Table { name: string; columns: string[]; rows: Row[] }

const iso = (d: Date | null | undefined) => (d ? new Date(d).toISOString() : null);

async function load(scope: Scope, module?: string) {
  const where: string[] = [scope === 'gercek' ? 'NOT is_test' : scope === 'test' ? 'is_test' : 'TRUE'];
  const params: unknown[] = [];
  if (module === 'A' || module === 'B') { params.push(module); where.push(`module = $${params.length}`); }
  const ps = (await pool().query(`SELECT * FROM participants WHERE ${where.join(' AND ')} ORDER BY created_at`, params)).rows as ParticipantRow[];
  const ids = ps.map((p) => p.id);
  const resp = ids.length ? (await pool().query('SELECT participant_id, step_id, step_index, data, started_at, finished_at, created_at FROM responses WHERE participant_id = ANY($1) ORDER BY participant_id, step_index', [ids])).rows : [];
  const ev = ids.length ? (await pool().query('SELECT participant_id, type, step_id, payload, client_ts, created_at FROM events WHERE participant_id = ANY($1) ORDER BY participant_id, created_at, id', [ids])).rows : [];
  const group = <T extends { participant_id: string }>(rows: T[]) => {
    const m = new Map<string, T[]>();
    rows.forEach((r) => { if (!m.has(r.participant_id)) m.set(r.participant_id, []); m.get(r.participant_id)!.push(r); });
    return m;
  };
  return { ps, resp: group(resp as (ResponseRow & { participant_id: string })[]), ev: group(ev as (EventRow & { participant_id: string })[]) };
}

function metaOf(p: ParticipantRow): Row {
  const steps = stepsFor(p.module, p.round_order);
  return {
    katilimci_kodu: p.code,
    modul: p.module,
    kosul: p.condition,
    kosul_etiketi: COND_LABEL[p.condition],
    atama_yontemi: p.assignment_method,
    test_kaydi: p.is_test,
    kisaltilmis_sure: p.fast_mode,
    kayit_durumu: p.status,
    tamamlandi: p.status === 'tamamlandi',
    adim_no: p.step_index,
    adim_toplam: steps.length,
    son_adim: p.status === 'tamamlandi' ? 'tamamlandı' : steps[p.step_index]?.id ?? null,
    tur_sirasi: p.round_order ? p.round_order.join('|') : null,
    olusturma: iso(p.created_at),
    baslangic: iso(p.started_at),
    bitis: iso(p.completed_at),
    son_gorulme: iso(p.last_seen_at),
    etiket: p.label,
  };
}

/** Geniş biçim: katılımcı başına bir satır (meta + maddeler + adım alanları + puanlar + türetilmiş değişkenler). */
export async function wideTable(scope: Scope, module?: string): Promise<Table> {
  const { ps, resp, ev } = await load(scope, module);
  const rows: Row[] = [];
  const colOrder: string[] = [];
  const seen = new Set<string>();
  const add = (k: string) => { if (!seen.has(k)) { seen.add(k); colOrder.push(k); } };
  // Sütun sırası: modül zaman çizelgesine göre maddeler.
  for (const mod of ['A', 'B'] as const) {
    if (module && module !== mod) continue;
    stepsFor(mod, null).forEach((s) => { s.items.forEach((i) => add(i.id)); if (s.kind === 'behavior') FILLER_ITEMS.forEach((i) => add(i.id)); });
  }
  const itemCols = colOrder.splice(0);
  seen.clear();
  for (const p of ps) {
    const r = resp.get(p.id) ?? [];
    const e = ev.get(p.id) ?? [];
    const f = flatten(p, r);
    const scores = computeScores(f.items, p.condition);
    const row: Row = { ...metaOf(p) };
    itemCols.forEach((c) => (row[c] = f.items[c] ?? null));
    Object.entries(f.meta).forEach(([k, v]) => { row[k] = v; add(k); });
    Object.entries(scores).forEach(([k, v]) => (row[k] = v));
    Object.entries(derived(p, e, r)).forEach(([k, v]) => { row[k] = v instanceof Date ? v.toISOString() : v; add(`~${k}`); });
    rows.push(row);
  }
  const metaCols = Object.keys(metaOf({ code: '', module: 'A', condition: 'ret', round_order: null } as unknown as ParticipantRow));
  const scoreCols = Object.keys(computeScores({}, 'ret'));
  const stepCols = colOrder.filter((c) => !c.startsWith('~')).sort((a, b) => stepOrderKey(a) - stepOrderKey(b) || a.localeCompare(b));
  const derivedCols = colOrder.filter((c) => c.startsWith('~')).map((c) => c.slice(1));
  return { name: 'katilimcilar', columns: [...metaCols, ...itemCols, ...stepCols, ...scoreCols, ...derivedCols], rows };
}

function stepOrderKey(col: string): number {
  const step = col.split('.')[0];
  const a = stepsFor('A', null).findIndex((s) => s.id === step);
  const b = stepsFor('B', null).findIndex((s) => s.id === step);
  return Math.max(a, b);
}

/** Uzun biçim: adım başına bir satır (jsPsych veri satırlarına karşılık gelir; `ekran` = adım). */
export async function longTable(scope: Scope, module?: string): Promise<Table> {
  const { ps, resp } = await load(scope, module);
  const rows: Row[] = [];
  for (const p of ps) {
    for (const r of resp.get(p.id) ?? []) {
      rows.push({
        katilimci_kodu: p.code, modul: p.module, kosul: p.condition, test_kaydi: p.is_test,
        trial_index: r.step_index, ekran: r.step_id, ekran_adi: stepLabel(r.step_id),
        baslangic: iso(r.started_at), bitis: iso(r.finished_at), sure_sn: r.started_at && r.finished_at ? Math.round((+new Date(r.finished_at) - +new Date(r.started_at)) / 100) / 10 : null,
        veri_json: JSON.stringify(r.data),
      });
    }
  }
  return { name: 'adimlar', columns: ['katilimci_kodu', 'modul', 'kosul', 'test_kaydi', 'trial_index', 'ekran', 'ekran_adi', 'baslangic', 'bitis', 'sure_sn', 'veri_json'], rows };
}

export async function eventTable(scope: Scope, module?: string): Promise<Table> {
  const { ps, ev } = await load(scope, module);
  const rows: Row[] = [];
  for (const p of ps) for (const e of ev.get(p.id) ?? []) {
    rows.push({ katilimci_kodu: p.code, modul: p.module, kosul: p.condition, test_kaydi: p.is_test, olay: e.type, ekran: e.step_id, ayrinti_json: JSON.stringify(e.payload), istemci_zamani: iso(e.client_ts), sunucu_zamani: iso(e.created_at) });
  }
  return { name: 'olaylar', columns: ['katilimci_kodu', 'modul', 'kosul', 'test_kaydi', 'olay', 'ekran', 'ayrinti_json', 'istemci_zamani', 'sunucu_zamani'], rows };
}

/** Değişken sözlüğü. */
export function codebook(): Table {
  const rows: Row[] = [];
  const seen = new Set<string>();
  const addItem = (mod: string, step: string, it: Item) => {
    if (seen.has(it.id)) { const r = rows.find((x) => x.degisken === it.id); if (r && !String(r.modul).includes(mod)) r.modul += `, ${mod}`; return; }
    seen.add(it.id);
    const scale = it.type === 'likert' ? `1–${it.n} (${it.lo} … ${it.hi})` : it.type === 'choice' || it.type === 'select' ? it.options.join(' | ') : it.type === 'number' ? `sayı (${it.minv}–${it.maxv} beklenir)` : 'serbest metin';
    rows.push({ degisken: it.id, modul: mod, ekran: step, tur: it.type, soru: it.text, olcek: scale, not: it.tag ?? '' });
  };
  for (const mod of ['A', 'B'] as const) stepsFor(mod, null).forEach((s) => { s.items.forEach((i) => addItem(mod, s.id, i)); if (s.kind === 'behavior') FILLER_ITEMS.forEach((i) => addItem(mod, 'davranis (Geç yolu)', i)); });
  const fixed: [string, string][] = [
    ['katilimci_kodu', 'Anonim katılımcı kodu'], ['kosul', 'ret = Zamanında ret, sahte = Sahte ilan, ghosting = Ghosting'], ['atama_yontemi', 'blok = bloklu rastgele atama (blok büyüklüğü 3), manuel = araştırmacı seçti'],
    ['test_kaydi', 'TRUE ise araştırmacı test kaydı; analizden çıkarılmalıdır'], ['kayit_durumu', 'olusturuldu = başlamadı, devam, tamamlandi, iptal'], ['tur_sirasi', 'Modül A: dört tur ilanının katılımcıya özgü sırası'],
    ['<adim>.rt_sn', 'Sayfa süresi (sn, 0,1 hassasiyet; referans rt_sn)'], ['tur{n}_ilan.ilan_okuma_sn', 'İlan okuma süresi (sn)'], ['tur{n}_basvuru.not_uzunluk', 'Ön yazı uzunluğu (karakter, kırpılmış)'],
    ['tur{n}_basvuru.not_metni', 'Ön yazı metni (açık uçlu; kişisel bilgi içerebilir, paylaşmadan önce gözden geçiriniz)'], ['tur{n}_bekleme.bekleme_sn', 'Bekleme ekranı süresi (sn)'],
    ['tur{n}_bekleme.mesaj', 'Turda şirket mesajı geldi mi (sunucuda koşuldan türetilir)'], ['davranis.davranis', 'basvur = Başvur, gec = Geç'], ['davranis.karar_sn', 'Karar süresi (sn, ilan gösteriminden düğmeye)'],
    ['davranis.not_uzunluk', 'Başvur yolunda ön yazı uzunluğu'], ['ilan_secim.secilen_ilan', 'Modül B: seçilen ilan anahtarı'], ['basvuru.not_uzunluk', 'Modül B: ön yazı uzunluğu'],
    ['jsse_on_ort / jsse_son_ort', 'JSSE ortalaması 1–10 (referans mean(); eksik madde atlanır)'], ['prosedurel_adalet_ort', 'pa_1…7 ortalaması 1–5 (dikkat_son dahil değil)'],
    ['zamaninda_geri_bildirim_ort', 'zgb_1…2 ortalaması 1–5'], ['bilgisel_adalet_ort', 'ba_1…5 ortalaması 1–5'], ['devam_niyeti_ort', 'dn_1…3 ortalaması 1–5; dn_2 ters (6 − x). ÖLÇEK HENÜZ SEÇİLMEDİ, örnek maddeler'],
    ['*_n', 'Ortalamaya giren yanıtlanmış madde sayısı'], ['dikkat_on_dogru', 'Doğru yanıt: "Ayda bir"'], ['dikkat_son_dogru', 'Doğru yanıt: 4'],
    ['mk_olgusal_dogru', 'Türetilmiş: olgusal manipülasyon kontrolü koşulla tutarlı mı (ret→Kapandı, sahte→Yayında, ghosting→Mesaj almadım)'],
    ['yas_aralik_disi', 'Yaş 18–30 dışında (dahil etme ölçütü; katılımcı engellenmez)'], ['eposta_*', 'Modül B: simüle gelen kutusunda e-posta açılma kayıtları'], ['baglanti_tiklandi', 'Modül B: araştırma e-postasındaki bağlantı tıklandı'],
    ['tur{n}_yanit_istem_sn', 'Modül A: şirket yanıtının istendiği an (bekleme başlangıcından sn)'], ['devam_etme_sayisi', 'Kaldığı yerden devam etme sayısı'], ['sekme_gizlenme_sayisi', 'Sekme/pencere gizlenme sayısı'],
  ];
  fixed.forEach(([k, d]) => rows.push({ degisken: k, modul: 'A, B', ekran: '', tur: 'türetilmiş / meta', soru: d, olcek: '', not: '' }));
  return { name: 'sozluk', columns: ['degisken', 'modul', 'ekran', 'tur', 'soru', 'olcek', 'not'], rows };
}

function cell(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  // Hesap tablosu formül enjeksiyonuna karşı.
  const safe = /^[=+\-@\t\r]/.test(s) && !/^-?\d/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(t: Table): string {
  const lines = [t.columns.map(cell).join(',')];
  t.rows.forEach((r) => lines.push(t.columns.map((c) => cell(r[c])).join(',')));
  return '﻿' + lines.join('\r\n') + '\r\n';
}

export async function toXlsx(tables: Table[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Panoya';
  wb.created = new Date();
  for (const t of tables) {
    const ws = wb.addWorksheet(t.name);
    ws.columns = t.columns.map((c) => ({ header: c, key: c, width: Math.min(40, Math.max(10, c.length + 2)) }));
    t.rows.forEach((r) => ws.addRow(Object.fromEntries(t.columns.map((c) => {
      const v = r[c];
      if (v === null || v === undefined) return [c, null];
      if (typeof v === 'object') return [c, JSON.stringify(v)];
      if (typeof v === 'string' && /^[=+\-@]/.test(v) && !/^-?\d/.test(v)) return [c, `'${v}`];
      return [c, v];
    }))));
    ws.getRow(1).font = { bold: true };
    ws.views = [{ state: 'frozen', ySplit: 1 }];
  }
  return Buffer.from(await wb.xlsx.writeBuffer());
}
