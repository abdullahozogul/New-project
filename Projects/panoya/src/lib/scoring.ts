/**
 * Ölçek puanları. Referans `mean()` fonksiyonuyla birebir uyumlu:
 *  - mevcut maddelerin ortalaması; eksik madde atlanır, DOLDURULMAZ;
 *  - ters madde 6 − v (5'li ölçek);
 *  - iki ondalığa yuvarlama.
 * Ek olarak yanıtlanan madde sayısı da raporlanır (analizde eksiklik kuralı uygulanabilsin diye).
 */
import { ATTENTION_POST_CORRECT, ATTENTION_PRE_CORRECT, AGE_RANGE, CONT_REVERSED, MK_EXPECTED } from '@/protocol/scales';
import type { Condition } from '@/protocol/conditions';

type Obj = Record<string, unknown>;

export function mean(obj: Obj, prefix: string, n: number, reverse: number[] = []): number | null {
  let s = 0;
  let c = 0;
  for (let i = 1; i <= n; i++) {
    let v = obj[prefix + i];
    if (v === null || v === undefined) continue;
    if (typeof v !== 'number') continue;
    if (reverse.includes(i)) v = 6 - v;
    s += v as number;
    c++;
  }
  return c ? Math.round((s / c) * 100) / 100 : null;
}

export function answered(obj: Obj, prefix: string, n: number): number {
  let c = 0;
  for (let i = 1; i <= n; i++) if (typeof obj[prefix + i] === 'number') c++;
  return c;
}

export interface Scores {
  jsse_on_ort: number | null; jsse_on_n: number;
  jsse_son_ort: number | null; jsse_son_n: number;
  prosedurel_adalet_ort: number | null; prosedurel_adalet_n: number;
  zamaninda_geri_bildirim_ort: number | null; zamaninda_geri_bildirim_n: number;
  bilgisel_adalet_ort: number | null; bilgisel_adalet_n: number;
  devam_niyeti_ort: number | null; devam_niyeti_n: number;
  dikkat_on_dogru: boolean | null;
  dikkat_son_dogru: boolean | null;
  mk_olgusal_beklenen: string;
  mk_olgusal_dogru: boolean | null;
  yas_aralik_disi: boolean | null;
}

/** `flat`: katılımcının tüm madde yanıtları tek nesnede (madde kimlikleri çakışmaz). */
export function computeScores(flat: Obj, condition: Condition): Scores {
  const yas = flat.yas;
  return {
    jsse_on_ort: mean(flat, 'jsse_on_', 8), jsse_on_n: answered(flat, 'jsse_on_', 8),
    jsse_son_ort: mean(flat, 'jsse_son_', 8), jsse_son_n: answered(flat, 'jsse_son_', 8),
    prosedurel_adalet_ort: mean(flat, 'pa_', 7), prosedurel_adalet_n: answered(flat, 'pa_', 7),
    zamaninda_geri_bildirim_ort: mean(flat, 'zgb_', 2), zamaninda_geri_bildirim_n: answered(flat, 'zgb_', 2),
    bilgisel_adalet_ort: mean(flat, 'ba_', 5), bilgisel_adalet_n: answered(flat, 'ba_', 5),
    devam_niyeti_ort: mean(flat, 'dn_', 3, CONT_REVERSED), devam_niyeti_n: answered(flat, 'dn_', 3),
    dikkat_on_dogru: flat.dikkat_on == null ? null : flat.dikkat_on === ATTENTION_PRE_CORRECT,
    dikkat_son_dogru: flat.dikkat_son == null ? null : flat.dikkat_son === ATTENTION_POST_CORRECT,
    mk_olgusal_beklenen: MK_EXPECTED[condition],
    mk_olgusal_dogru: flat.mk_olgusal == null ? null : flat.mk_olgusal === MK_EXPECTED[condition],
    yas_aralik_disi: typeof yas === 'number' ? yas < AGE_RANGE.min || yas > AGE_RANGE.max : null,
  };
}
