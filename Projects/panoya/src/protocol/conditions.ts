/** Deneysel koşullar (referans: COND_LABEL). BU DOSYA ARAŞTIRMA PROTOKOLÜNÜN PARÇASIDIR. */
export const CONDITIONS = ['ret', 'sahte', 'ghosting'] as const;
export type Condition = (typeof CONDITIONS)[number];
export const COND_LABEL: Record<Condition, string> = { ret: 'Zamanında ret', sahte: 'Sahte ilan', ghosting: 'Ghosting' };

export type ModuleId = 'A' | 'B';
export const MODULE_LABEL: Record<ModuleId, string> = {
  A: 'Modül A · Laboratuvar deneyi (Çalışma 1)',
  B: 'Modül B · E-posta takipli çevrimiçi deney (Çalışma 2)',
};

/** Şirket yanıtı: ret ve sahte ilanda metin birebir aynı; tek fark ilan durumu satırı. Ghosting'de yanıt yok. */
export type CompanyResponse = { deliver: false } | { deliver: true; adStatus: 'closed' | 'open' };
export function companyResponseFor(cond: Condition): CompanyResponse {
  if (cond === 'ghosting') return { deliver: false };
  return { deliver: true, adStatus: cond === 'sahte' ? 'open' : 'closed' };
}
/** Referans adStatusLine(). */
export const AD_STATUS_TEXT = {
  open: 'Yayında – başvurular devam ediyor',
  closed: 'Kapandı',
} as const;
