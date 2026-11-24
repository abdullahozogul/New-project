/**
 * Süreler (saniye). KAYNAK: referans dosyalar.
 * Normal deney modunda daima `normal` değerleri kullanılır; `fast` yalnızca araştırmacı test kayıtlarında açılabilir.
 * BU DOSYA ARAŞTIRMA PROTOKOLÜNÜN PARÇASIDIR.
 */
export const TIMING = {
  /** Modül A bekleme turu: şirket yanıtının geldiği an (WAIT) ve Devam düğmesinin açılması için ek okuma süresi (READ). */
  roundWait: { normal: 60, fast: 8 },
  roundRead: { normal: 6, fast: 2 },
  /** Davranış görevi: Başvur ve Geç yollarının en kısa süresi (referans: "gerçek süre danışmanla"). */
  behaviorMin: { normal: 90, fast: 6 },
} as const;

export function t(key: keyof typeof TIMING, fast: boolean): number {
  return fast ? TIMING[key].fast : TIMING[key].normal;
}
