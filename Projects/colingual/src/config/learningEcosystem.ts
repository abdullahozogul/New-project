/**
 * Positioning notes from bj36272/language-learning-apps (2025 compilation)
 * and the GitHub ai-education topic — how Colingual complements other tools.
 */
export type EcosystemApp = {
  name: string
  focus: string
  colingualRole: string
}

export const colingualEcosystemNotes: EcosystemApp[] = [
  {
    name: 'Duolingo / Babbel',
    focus: 'Gamified drills & structured courses',
    colingualRole: 'Gerçek haber metni + CEFR seviye geçişi; kelimeyi bağlamda öğrenme',
  },
  {
    name: 'FluentU / LingQ',
    focus: 'Video / okuma ile immersion',
    colingualRole: 'Canlı RSS + aynı hikâyenin A1–C1 sürümleri',
  },
  {
    name: 'italki / Lingoda',
    focus: 'Canlı öğretmen',
    colingualRole: 'Koç sohbeti ve senaryo dersleri ile günlük hazırlık',
  },
  {
    name: 'Busuu',
    focus: 'CEFR sertifikası & topluluk düzeltmesi',
    colingualRole: 'CEFR-SP tarzı metin tahmini + müfredat ilerlemesi',
  },
  {
    name: 'ClassroomIO / ACCG',
    focus: 'Kurs & içerik üretimi',
    colingualRole: 'Ünite akışı + AI müfredat taslağı (İlerleme sekmesi)',
  },
  {
    name: 'ScholarShelf',
    focus: 'Kişisel kütüphane + SchoBot',
    colingualRole: 'Raf + okuma/koç entegrasyonu',
  },
]
