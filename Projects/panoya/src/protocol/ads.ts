/**
 * Kurgusal şirketler ve ilanlar.
 * KAYNAK: referans HTML dosyalarındaki `ADS` nesnesi (her iki çalışmada ortak). Metinler harfiyen aktarılmıştır.
 * Referans notu: "Adların gerçek şirketlerle karışmadığı ekipçe ayrıca kontrol edilecek."
 * BU DOSYADAKİ DENEY İLANLARI ARAŞTIRMA PROTOKOLÜNÜN PARÇASIDIR; İZİNSİZ DEĞİŞTİRMEYİNİZ.
 */

export type AdKey = 'nehirsu' | 'tirhan' | 'selvigol' | 'kekik' | 'ardicli' | 'akcaagac';

export interface Ad {
  key: string;
  co: string;
  ini: string;
  color: string;
  code: string;
  title: string;
  area: string;
  about: string;
  duties: string[];
  reqs: string[];
}

export const ADS: Record<AdKey, Ad> = {
  nehirsu: {
    key: 'nehirsu', co: 'Nehirsu Yayınevi', ini: 'N', color: '#2f6f8f', code: 'NY', title: 'Editör Yardımcısı', area: 'Yayıncılık',
    about: "Nehirsu Yayınevi, 2004'ten bu yana çağdaş Türk edebiyatı ve çeviri kurmaca alanında yayın yapan bağımsız bir yayınevidir. Yılda yaklaşık 40 yeni kitap yayımlıyoruz.",
    duties: ['Yayın sürecindeki dosyaların editoryal takibini yapmak', 'Çeviri metinlerin kaynak metinle karşılaştırmalı ilk okumasını yapmak', 'Yazar ve çevirmenlerle yazışmaları yürütmek', 'Arka kapak ve tanıtım metinlerinin taslaklarını hazırlamak'],
    reqs: ['Edebiyat, dil veya çeviri bölümlerinden mezun ya da son sınıf öğrencisi', 'Türkçe dil bilgisi ve yazım kurallarına hâkim', 'İyi düzeyde İngilizce bilen', 'Deneyim: 0–2 yıl (staj deneyimi tercih sebebidir)'],
  },
  tirhan: {
    key: 'tirhan', co: 'Tirhan Kitap', ini: 'T', color: '#7a4b2a', code: 'TK', title: 'Redaksiyon Asistanı', area: 'Yayıncılık',
    about: 'Tirhan Kitap, eğitim ve popüler bilim alanlarında yayın yapan 60 kişilik bir yayın grubudur. Kitaplarımızın baskı öncesi süreçlerini kendi ekibimizle yürütüyoruz.',
    duties: ['Dosyaların redaksiyon ve düzeltisini yapmak', 'Metinlerin yazım kurallarına uygunluğunu denetlemek', 'Dizin ve kaynakçaları düzenlemek', 'Baskı öncesi son okumaya katılmak'],
    reqs: ['Edebiyat, dil veya dilbilim bölümlerinden mezun ya da son sınıf öğrencisi', 'Uzun metinlerde dikkatini koruyabilen', 'Ofis programlarını iyi kullanan', 'Deneyim: 0–2 yıl'],
  },
  selvigol: {
    key: 'selvigol', co: 'Selvigöl Yayınları', ini: 'S', color: '#4f6b3a', code: 'SY', title: 'İçerik Editörü Yardımcısı', area: 'Yayıncılık',
    about: 'Selvigöl Yayınları, çocuk ve gençlik edebiyatı ile dijital okuma içerikleri hazırlayan bir yayınevidir. Basılı kitaplarımızın yanında okul kütüphaneleri için dijital içerikler üretiyoruz.',
    duties: ['Dijital okuma platformu için metinleri hazırlamak ve düzenlemek', 'Metinlerin yaş grubuna uygun dil düzeyini kontrol etmek', 'Görsel tasarım ekibiyle iş takibini yürütmek', 'Okur geri bildirimlerini derlemek ve raporlamak'],
    reqs: ['Edebiyat, dil veya dilbilim bölümlerinden mezun ya da son sınıf öğrencisi', 'Çocuk ve gençlik edebiyatına ilgi duyan', 'Ekip içinde düzenli çalışabilen', 'Deneyim: 0–2 yıl'],
  },
  kekik: {
    key: 'kekik', co: 'Kekik Dijital İletişim', ini: 'K', color: '#8a3b52', code: 'KD', title: 'Metin Yazarı (Yeni Mezun)', area: 'İletişim ve içerik',
    about: 'Kekik Dijital İletişim, kültür-sanat kurumlarına ve yayınevlerine dijital iletişim hizmeti veren 25 kişilik bir ajanstır.',
    duties: ['Web sitesi ve e-bülten metinlerini yazmak', 'Sosyal medya gönderilerinin metinlerini hazırlamak', 'Markalar için dil ve üslup rehberlerinin hazırlanmasına katılmak', 'Ekipte yazılan metinlerin düzeltisini yapmak'],
    reqs: ['Edebiyat, dil, çeviri veya dilbilim bölümlerinden mezun ya da son sınıf öğrencisi', 'Farklı okur kitlelerine göre yazabilen', 'Teslim tarihlerine uyan', 'Deneyim: 0–2 yıl'],
  },
  ardicli: {
    key: 'ardicli', co: 'Ardıçlı Dil Hizmetleri', ini: 'A', color: '#36577f', code: 'AD', title: 'Yerelleştirme Asistanı', area: 'Çeviri ve yerelleştirme',
    about: 'Ardıçlı Dil Hizmetleri, yazılım, uygulama ve oyunların Türkçeye yerelleştirilmesi alanında çalışan bir dil hizmetleri şirketidir.',
    duties: ['Arayüz ve yardım metinlerini Türkçeye çevirmek', 'Terim veri tabanını güncel tutmak', 'Çeviri sonrası kalite kontrol adımlarına katılmak', 'Proje yöneticileriyle iş takibini yürütmek'],
    reqs: ['Çeviri, dil veya dilbilim bölümlerinden mezun ya da son sınıf öğrencisi', 'İyi düzeyde İngilizce bilen', 'Çeviri araçlarını öğrenmeye açık', 'Deneyim: 0–2 yıl'],
  },
  akcaagac: {
    key: 'akcaagac', co: 'Akçaağaç Medya', ini: 'A', color: '#6a5a2b', code: 'AM', title: 'Sosyal Medya İçerik Asistanı', area: 'İletişim ve içerik',
    about: 'Akçaağaç Medya, kitap ve kültür odaklı dijital yayınlar hazırlayan bir içerik şirketidir.',
    duties: ['Kitap tanıtımları için kısa içerikler hazırlamak', 'Yayın takvimini takip etmek', 'Okur yorumlarını derlemek', 'Video altyazılarının düzeltisini yapmak'],
    reqs: ['Edebiyat, dil veya iletişim bölümlerinden mezun ya da son sınıf öğrencisi', 'Kısa ve anlaşılır yazabilen', 'Sosyal medya araçlarına hâkim', 'Deneyim: 0–2 yıl'],
  },
};

/** Tüm ilanlarda sabit meta bilgi (referans `jobMeta`, `jobDetail`). */
export const AD_FIXED = {
  location: 'Şirket merkezi: İstanbul · Çalışma şekli: Uzaktan',
  type: 'Tam zamanlı',
  posted: '2 gün önce yayınlandı',
  tags: ['Yeni mezun', '0–2 yıl deneyim'],
  conditions: 'Tam zamanlı, uzaktan çalışma. Ekip toplantıları çevrim içi yapılır.',
  sideMeta: 'İstanbul · Uzaktan',
  applyMeta: 'İstanbul · Uzaktan',
};

/** Modül A: dört başvuru turunda kullanılan ilanlar (katılımcı başına karıştırılır). */
export const ROUND_AD_POOL: AdKey[] = ['nehirsu', 'tirhan', 'selvigol', 'kekik'];
/** Modül B: değerlendirilen üç ilan (sabit sıra). */
export const CHOICE_ADS: AdKey[] = ['nehirsu', 'tirhan', 'selvigol'];
/** Davranış görevi: önerilen ilan, Geç yolundaki dolgu ilanı ve yan liste. */
export const BEHAVIOR_AD: AdKey = 'ardicli';
export const FILLER_AD: AdKey = 'akcaagac';
export const BEHAVIOR_SIDE: AdKey[] = ['akcaagac', 'kekik'];

export function isAdKey(k: string): k is AdKey {
  return Object.prototype.hasOwnProperty.call(ADS, k);
}
