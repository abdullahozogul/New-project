/**
 * VİTRİN İLANLARI – yalnızca herkese açık iş ilanı sayfalarında (/ilanlar) platformun gerçekçi görünmesi için.
 * DENEY AKIŞINDA KULLANILMAZ; araştırma protokolünün parçası değildir. Şirketler kurgusaldır; deney ilanlarında
 * olduğu gibi adların gerçek şirketlerle karışmadığı ekipçe kontrol edilmelidir.
 */
import { ADS, type Ad } from '@/protocol/ads';

export interface ListingAd extends Ad { city: string; mode: string; posted: string; mark?: string; experimental: boolean }

const SHOWCASE: ListingAd[] = [
  { key: 'karacam-yayin-editoru', co: 'Karaçam Yayın Grubu', ini: 'K', color: '#3d5a6c', code: 'KY', title: 'Yayın Editörü', area: 'Yayıncılık', city: 'İstanbul', mode: 'Hibrit', posted: '1 gün önce', experimental: false,
    about: 'Karaçam Yayın Grubu, edebiyat ve deneme alanında yayın yapan orta ölçekli bir yayın grubudur.',
    duties: ['Yayın programındaki dosyaların editoryal sürecini yönetmek', 'Yazarlarla metin geliştirme görüşmeleri yapmak', 'Redaksiyon ve düzelti ekibini koordine etmek', 'Baskı takvimini takip etmek'],
    reqs: ['Edebiyat veya dil bölümlerinden mezun', 'En az 3 yıl yayınevi deneyimi', 'Türkçe yazım kurallarına hâkim', 'İyi düzeyde İngilizce'] },
  { key: 'lalezar-ceviri-editoru', co: 'Lalezar Çeviri Evi', ini: 'L', color: '#7b3f61', code: 'LÇ', title: 'Çeviri Editörü', area: 'Çeviri ve yerelleştirme', city: 'Ankara', mode: 'Uzaktan', posted: '3 gün önce', experimental: false,
    about: 'Lalezar Çeviri Evi, akademik ve edebi metinlerin çevirisi ve çeviri editörlüğü alanında hizmet verir.',
    duties: ['Çeviri metinleri kaynak metinle karşılaştırarak düzenlemek', 'Terim tutarlılığını denetlemek', 'Çevirmenlere geri bildirim vermek', 'Teslim takvimini yönetmek'],
    reqs: ['Mütercim-Tercümanlık veya dil bölümlerinden mezun', 'En az 2 yıl çeviri editörlüğü deneyimi', 'İleri düzeyde İngilizce', 'Çeviri araçlarını kullanabilen'] },
  { key: 'ilgin-icerik-uzmani', co: 'Ilgın Eğitim Teknolojileri', ini: 'I', color: '#2d6a5a', code: 'IE', title: 'İçerik Uzmanı', area: 'İletişim ve içerik', city: 'İzmir', mode: 'Ofiste', posted: '5 gün önce', experimental: false,
    about: 'Ilgın Eğitim Teknolojileri, ortaokul öğrencileri için dijital öğrenme içerikleri geliştirir.',
    duties: ['Dijital ders içeriklerinin metinlerini yazmak', 'İçeriklerin dil düzeyini kontrol etmek', 'Görsel tasarım ekibiyle birlikte çalışmak', 'Öğretmen geri bildirimlerini derlemek'],
    reqs: ['Dil, edebiyat veya eğitim bölümlerinden mezun', '1–3 yıl içerik deneyimi', 'Düzenli ve dikkatli çalışan', 'Ekip çalışmasına yatkın'] },
  { key: 'sedir-duzeltmen', co: 'Sedir Akademik Yayınlar', ini: 'S', color: '#5a4a7a', code: 'SA', title: 'Düzeltmen (Yarı Zamanlı)', area: 'Yayıncılık', city: 'İstanbul', mode: 'Uzaktan', posted: '1 hafta önce', experimental: false,
    about: 'Sedir Akademik Yayınlar, sosyal bilimler alanında akademik kitap ve dergiler yayımlar.',
    duties: ['Akademik metinlerin düzeltisini yapmak', 'Kaynakça biçimini denetlemek', 'Dizin hazırlığına katılmak', 'Baskı öncesi son okumayı yapmak'],
    reqs: ['Dil veya edebiyat bölümlerinden mezun ya da son sınıf öğrencisi', 'APA biçimine aşina', 'Uzun metinlerde dikkatini koruyabilen', 'Haftada 20 saat ayırabilen'] },
];

/** Vitrin listesi: deney ilanları (metinleri değiştirilmeden) + vitrin ilanları. */
export const LISTINGS: ListingAd[] = [
  ...Object.values(ADS).map((a) => ({ ...a, city: 'İstanbul', mode: 'Uzaktan', posted: '2 gün önce', mark: a.key, experimental: true })),
  ...SHOWCASE,
];

export function listingBySlug(slug: string) { return LISTINGS.find((l) => l.key === slug) ?? null; }
