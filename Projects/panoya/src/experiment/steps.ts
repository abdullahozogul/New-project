/**
 * Deney zaman çizelgeleri. Referans Çalışma 1'deki jsPsych modeli korunur: sıralı ekranlar, her ekran
 * tamamlandığında tek bir veri satırı (`ekran` = adım kimliği). Bu dosya istemci ve sunucuda ortaktır;
 * sunucu her gönderimi buradaki sıraya ve şemalara göre doğrular (adım atlama / tekrar gönderme engellenir).
 */
import { z } from 'zod';
import { ADS, CHOICE_ADS, ROUND_AD_POOL, type AdKey } from '@/protocol/ads';
import type { ModuleId } from '@/protocol/conditions';
import {
  CONSENT_ACCEPT, CONSENT_ITEM, COVER_LETTER_MIN, DEMOGRAPHICS_A, DEMOGRAPHICS_B, FILLER_ITEMS, FINAL_B, SUSPICION_A,
  choiceItems, contItems, infoItems, jsseItems, manipItems, procItems, roundEvalItems, type Item,
} from '@/protocol/scales';

export type StepKind =
  | 'research' // araştırma anketi sayfası
  | 'intro' // Modül A platforma geçiş
  | 'roundAd' | 'roundApply' | 'roundWait' // Modül A başvuru turu
  | 'chooseAds' | 'applyB' | 'confirmB' | 'inbox' | 'jump' // Modül B
  | 'behavior' | 'debrief';

export type StageB = 'd1' | 'd1b' | 'd14a' | 'd14b' | 'son' | 'bilgi';

export interface StepDef {
  id: string;
  kind: StepKind;
  items: Item[];
  round?: number;
  adKey?: AdKey;
  mailbox?: 'd1' | 'd14a' | 'd14b';
  stage?: StageB;
  /** Adıma özgü ek alanların şeması (madde dışı). */
  extra: z.ZodRawShape;
}

const sec = z.number().finite().min(0).max(86400);
const rt = { rt_sn: sec.optional() };

function S(id: string, kind: StepKind, items: Item[], extra: z.ZodRawShape = {}, more: Partial<StepDef> = {}): StepDef {
  return { id, kind, items, extra, ...more };
}

/** Son ölçüm sayfaları: referanstaki postMeasures() 5 sayfa; kaldığı yerden devam için ayrı adımlar. */
function postSteps(sing: boolean, stage?: StageB): StepDef[] {
  return [
    S('son_pa', 'research', procItems(), rt, { stage }),
    S('son_ba', 'research', infoItems(), rt, { stage }),
    S('son_jsse', 'research', jsseItems('son', false), rt, { stage }),
    S('son_dn', 'research', contItems(), rt, { stage }),
    S('son_mk', 'research', manipItems(sing), rt, { stage }),
  ];
}

const behaviorExtra = {
  davranis: z.enum(['basvur', 'gec']),
  karar_sn: sec,
  not_uzunluk: z.number().int().min(COVER_LETTER_MIN).max(20000).optional(),
  ...rt,
};

export function stepsFor(module: ModuleId, roundOrder: AdKey[] | null): StepDef[] {
  if (module === 'A') {
    const order = roundOrder ?? ROUND_AD_POOL;
    const steps: StepDef[] = [
      S('onam', 'research', [CONSENT_ITEM], rt),
      S('demografi', 'research', DEMOGRAPHICS_A, rt),
      S('on_jsse', 'research', jsseItems('on', true), rt),
      S('platform_giris', 'intro', [], rt),
    ];
    order.forEach((key, i) => {
      const round = i + 1;
      steps.push(S(`tur${round}_ilan`, 'roundAd', [], { tur: z.literal(round), sirket: z.literal(ADS[key].co), ilan_okuma_sn: sec }, { round, adKey: key }));
      steps.push(S(`tur${round}_basvuru`, 'roundApply', [], { tur: z.literal(round), not_uzunluk: z.number().int().min(COVER_LETTER_MIN), not_metni: z.string().max(20000) }, { round, adKey: key }));
      steps.push(S(`tur${round}_bekleme`, 'roundWait', roundEvalItems(round), { tur: z.literal(round), sirket: z.literal(ADS[key].co), bekleme_sn: sec }, { round, adKey: key }));
    });
    steps.push(S('davranis', 'behavior', [], behaviorExtra));
    steps.push(...postSteps(false));
    steps.push(S('suphe', 'research', SUSPICION_A, rt));
    steps.push(S('bilgilendirme', 'debrief', [], rt));
    return steps;
  }
  const choice = choiceItems(CHOICE_ADS.map((k) => ADS[k]));
  return [
    S('onam', 'research', [CONSENT_ITEM], rt, { stage: 'd1' }),
    S('demografi', 'research', DEMOGRAPHICS_B, rt, { stage: 'd1' }),
    S('on_jsse', 'research', jsseItems('on', true), rt, { stage: 'd1' }),
    S('ilan_secim', 'chooseAds', choice, rt, { stage: 'd1b' }),
    S('basvuru', 'applyB', [], { not_uzunluk: z.number().int().min(COVER_LETTER_MIN), ad_soyad: z.string().trim().min(1).max(200), eposta: z.string().trim().min(3).max(320) }, { stage: 'd1b' }),
    S('basvuru_onay', 'confirmB', [], rt, { stage: 'd1b' }),
    S('posta_gun1', 'inbox', [], rt, { stage: 'd1b', mailbox: 'd1' }),
    S('zaman_atlama', 'jump', [], rt, { stage: 'd1b' }),
    S('posta_gun14_1130', 'inbox', [], rt, { stage: 'd14a', mailbox: 'd14a' }),
    S('posta_gun14_1400', 'inbox', [], { ...rt, baglanti_tiklandi: z.literal(true) }, { stage: 'd14b', mailbox: 'd14b' }),
    S('davranis', 'behavior', [], behaviorExtra, { stage: 'son' }),
    ...postSteps(true, 'son'),
    S('son_sorular', 'research', FINAL_B, rt, { stage: 'son' }),
    S('bilgilendirme', 'debrief', [], rt, { stage: 'bilgi' }),
  ];
}

/* ---------------- Doğrulama ---------------- */
export function itemSchema(it: Item): z.ZodTypeAny {
  switch (it.type) {
    case 'likert': return z.number().int().min(1).max(it.n);
    case 'choice':
    case 'select': return z.enum(it.options as [string, ...string[]]);
    case 'number': return z.number().finite().min(0).max(200);
    case 'text': return z.string().trim().min(1).max(10000);
    case 'line': return z.string().trim().min(1).max(500);
  }
}

export function stepSchema(step: StepDef, data: Record<string, unknown>): z.ZodTypeAny {
  const shape: Record<string, z.ZodTypeAny> = { ...(step.extra as Record<string, z.ZodTypeAny>) };
  step.items.forEach((it) => { shape[it.id] = itemSchema(it); });
  if (step.kind === 'behavior' && data.davranis === 'gec') {
    FILLER_ITEMS.forEach((it) => { shape[it.id] = itemSchema(it); });
  }
  type D = Record<string, unknown>;
  return z.object(shape).strict()
    .refine((d: D) => step.id !== 'onam' || d.onam === CONSENT_ACCEPT, { message: 'Onam verilmeden devam edilemez' })
    .refine((d: D) => step.kind !== 'roundApply' || String(d.not_metni).trim().length === d.not_uzunluk, { message: 'Ön yazı uzunluğu tutarsız' })
    .refine((d: D) => step.kind !== 'behavior' || (d.davranis === 'basvur') === (typeof d.not_uzunluk === 'number'), { message: 'Başvur yolunda ön yazı uzunluğu zorunludur' });
}

export function validateStepData(step: StepDef, data: unknown): { ok: true; data: Record<string, unknown> } | { ok: false; error: string } {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return { ok: false, error: 'Geçersiz veri' };
  const r = stepSchema(step, data as Record<string, unknown>).safeParse(data);
  if (!r.success) return { ok: false, error: r.error.issues.map((i) => `${i.path.join('.') || '-'}: ${i.message}`).join('; ') };
  return { ok: true, data: r.data as Record<string, unknown> };
}

/** Adım kimliğinden Modül B'deki aşama etiketi (referans zaman çizelgesi STAGES). */
export const STAGES_B: [StageB, string][] = [
  ['d1', '1. gün · Onam ve ön ölçüm'], ['d1b', '1. gün · Başvuru'], ['d14a', '14. gün · 11:30'], ['d14b', '14. gün · 14:00'], ['son', 'Son bölüm'], ['bilgi', 'Bilgilendirme'],
];

export function stepLabel(id: string): string {
  const map: Record<string, string> = {
    onam: 'Onam', demografi: 'Demografi', on_jsse: 'Ön ölçüm (JSSE)', platform_giris: 'Platforma geçiş', davranis: 'Davranış görevi',
    son_pa: 'Son ölçüm: prosedürel adalet', son_ba: 'Son ölçüm: bilgisel adalet', son_jsse: 'Son ölçüm: JSSE', son_dn: 'Son ölçüm: devam niyeti',
    son_mk: 'Son ölçüm: manipülasyon kontrolleri', suphe: 'Şüphe sorusu', son_sorular: 'Son sorular', bilgilendirme: 'Bilgilendirme',
    ilan_secim: 'İlan değerlendirme ve seçim', basvuru: 'Başvuru formu', basvuru_onay: 'Başvuru onayı', posta_gun1: 'Gelen kutusu · 1. gün',
    zaman_atlama: 'Zaman atlaması (14 gün)', posta_gun14_1130: 'Gelen kutusu · 14. gün 11:30', posta_gun14_1400: 'Gelen kutusu · 14. gün 14:00',
  };
  const m = /^tur(\d)_(ilan|basvuru|bekleme)$/.exec(id);
  if (m) return `Tur ${m[1]}: ${{ ilan: 'ilan', basvuru: 'başvuru', bekleme: 'bekleme ve yanıt' }[m[2] as 'ilan' | 'basvuru' | 'bekleme']}`;
  return map[id] ?? id;
}
