import { describe, expect, it } from 'vitest';
import { mean, computeScores } from '@/lib/scoring';
import { buildMailbox } from '@/protocol/emails';
import { companyResponseFor } from '@/protocol/conditions';
import { procItems, jsseItems, manipItems } from '@/protocol/scales';
import { stepsFor, validateStepData } from '@/experiment/steps';
import { FILLER_ITEMS } from '@/protocol/scales';

describe('puanlama (referans mean())', () => {
  it('eksik maddeyi atlar, doldurmaz; iki ondalık', () => {
    expect(mean({ pa_1: 1, pa_2: 2, pa_3: null }, 'pa_', 3)).toBe(1.5);
    expect(mean({}, 'pa_', 3)).toBeNull();
    expect(mean({ x1: 1, x2: 2, x3: 2 }, 'x', 3)).toBe(1.67);
  });
  it('dn_2 ters puanlanır (6 − v)', () => {
    expect(computeScores({ dn_1: 5, dn_2: 1, dn_3: 5 }, 'ret').devam_niyeti_ort).toBe(5);
  });
  it('dikkat_son prosedürel adalete girmez; dikkat ve manipülasyon doğruluğu', () => {
    const s = computeScores({ pa_1: 1, pa_2: 1, pa_3: 1, pa_4: 1, pa_5: 1, pa_6: 1, pa_7: 1, dikkat_son: 4, dikkat_on: 'Ayda bir', mk_olgusal: 'Yayında', yas: 31 }, 'sahte');
    expect(s.prosedurel_adalet_ort).toBe(1);
    expect(s.dikkat_son_dogru).toBe(true);
    expect(s.dikkat_on_dogru).toBe(true);
    expect(s.mk_olgusal_dogru).toBe(true);
    expect(s.yas_aralik_disi).toBe(true);
  });
});

describe('ölçek sırası', () => {
  it('dikkat maddesi pa_5 ile pa_6 arasında; zgb 8 ve 9 numara', () => {
    const ids = procItems().map((i) => i.id);
    expect(ids).toEqual(['pa_1', 'pa_2', 'pa_3', 'pa_4', 'pa_5', 'dikkat_son', 'pa_6', 'pa_7', 'zgb_1', 'zgb_2']);
    expect(procItems().find((i) => i.id === 'zgb_2')!.num).toBe(9);
  });
  it('JSSE 10 basamaklı, ön ölçümde dikkat maddesi sonda', () => {
    const on = jsseItems('on', true);
    expect(on).toHaveLength(9);
    expect(on[8].id).toBe('dikkat_on');
    expect(jsseItems('son', false)).toHaveLength(8);
  });
  it('olgusal kontrol metni modüle göre', () => {
    expect(manipItems(true)[0].text).toBe('Şirketten aldığınız mesaja göre ilan şu an:');
    expect(manipItems(false)[0].text).toBe('Şirketlerden aldığınız mesajlara göre ilanlar şu an:');
  });
});

describe('koşullar', () => {
  it('ret ve sahte aynı mesaj, yalnızca ilan durumu farklı; ghosting yanıtsız', () => {
    expect(companyResponseFor('ret')).toEqual({ deliver: true, adStatus: 'closed' });
    expect(companyResponseFor('sahte')).toEqual({ deliver: true, adStatus: 'open' });
    expect(companyResponseFor('ghosting')).toEqual({ deliver: false });
  });
  it('e-posta kutusu: ret ve sahte metinleri birebir aynı; ghosting\'de şirket e-postası yok; araştırma e-postası üç koşulda aynı', () => {
    const ctx = (condition: 'ret' | 'sahte' | 'ghosting') => ({ condition, chosenAd: 'nehirsu' as const, name: 'Ada Kaya', opened: [] });
    const r = buildMailbox('d14a', ctx('ret')).mails.find((m) => m.id === 'rej')!;
    const s = buildMailbox('d14a', ctx('sahte')).mails.find((m) => m.id === 'rej')!;
    expect(r.body).toBe(s.body);
    expect(r.subj).toBe(s.subj);
    expect(r.adstatus).toContain('Kapandı');
    expect(s.adstatus).toContain('Yayında – başvurular devam ediyor');
    expect(buildMailbox('d14a', ctx('ghosting')).mails.some((m) => m.kind.startsWith('company_reject'))).toBe(false);
    const res = (['ret', 'sahte', 'ghosting'] as const).map((c) => buildMailbox('d14b', ctx(c)).mails.find((m) => m.id === 'res')!);
    expect(new Set(res.map((m) => m.body + m.subj + m.addr)).size).toBe(1);
    expect(res[0].addr).not.toBe(r.addr);
  });
  it('14. gün 11:30\'da önceki e-postalar okunmuş sayılır', () => {
    const box = buildMailbox('d14a', { condition: 'ret', chosenAd: 'tirhan', name: 'Ada', opened: [] });
    expect(box.mails.find((m) => m.id === 'conf')!.unread).toBe(false);
    expect(box.mails.find((m) => m.id === 'rej')!.unread).toBe(true);
    expect(box.mails.find((m) => m.id === 'conf')!.addr).toBe('ik@tirhan.example');
  });
});

describe('adım doğrulama', () => {
  const A = stepsFor('A', ['kekik', 'nehirsu', 'tirhan', 'selvigol']);
  it('Modül A: 4 tur × 3 ekran, toplam adım sayısı', () => {
    expect(A.filter((s) => s.id.startsWith('tur'))).toHaveLength(12);
    expect(A[0].id).toBe('onam');
    expect(A.at(-1)!.id).toBe('bilgilendirme');
  });
  it('likert aralık dışı ve tanımsız seçenek reddedilir', () => {
    const jsse = A.find((s) => s.id === 'on_jsse')!;
    const ok: Record<string, unknown> = { dikkat_on: 'Ayda bir' };
    for (let i = 1; i <= 8; i++) ok[`jsse_on_${i}`] = 5;
    expect(validateStepData(jsse, ok).ok).toBe(true);
    expect(validateStepData(jsse, { ...ok, jsse_on_1: 11 }).ok).toBe(false);
    expect(validateStepData(jsse, { ...ok, dikkat_on: 'Bazen' }).ok).toBe(false);
  });
  it('davranış: Geç yolu dolgu maddeleri zorunlu, Başvur yolu ön yazı uzunluğu zorunlu', () => {
    const b = A.find((s) => s.id === 'davranis')!;
    expect(validateStepData(b, { davranis: 'gec', karar_sn: 3 }).ok).toBe(false);
    expect(validateStepData(b, { davranis: 'gec', karar_sn: 3, rt_sn: 90, dolgu_cekicilik: 2, dolgu_uygunluk: 3, dolgu_anlasilirlik: 4 }).ok).toBe(true);
    expect(validateStepData(b, { davranis: 'basvur', karar_sn: 3 }).ok).toBe(false);
    expect(validateStepData(b, { davranis: 'basvur', karar_sn: 3, not_uzunluk: 120 }).ok).toBe(true);
  });
  it('madde kimlikleri modül içinde benzersiz ve dışa aktarım meta sütunlarıyla çakışmaz', () => {
    const META = ['katilimci_kodu', 'modul', 'kosul', 'kosul_etiketi', 'atama_yontemi', 'test_kaydi', 'kisaltilmis_sure', 'kayit_durumu', 'tamamlandi', 'adim_no', 'adim_toplam', 'son_adim', 'tur_sirasi', 'olusturma', 'baslangic', 'bitis', 'son_gorulme', 'etiket'];
    const SCORES = Object.keys(computeScores({}, 'ret'));
    for (const m of ['A', 'B'] as const) {
      const ids = stepsFor(m, null).flatMap((s) => [...s.items.map((i) => i.id), ...(s.kind === 'behavior' ? FILLER_ITEMS.map((i) => i.id) : [])]);
      expect(new Set(ids).size).toBe(ids.length);
      ids.forEach((id) => { expect(META).not.toContain(id); expect(SCORES).not.toContain(id); });
    }
  });
});
