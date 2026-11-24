/**
 * Ölçek maddeleri ve araştırma sayfalarındaki tüm sorular.
 * KAYNAK: referans HTML dosyaları (ortak çekirdek + çalışmaya özgü bölümler). Metinler, seçenekler,
 * uç etiketleri, değişken adları ve madde sırası harfiyen aktarılmıştır.
 * BU DOSYA ARAŞTIRMA PROTOKOLÜNÜN PARÇASIDIR; İZİNSİZ DEĞİŞTİRMEYİNİZ.
 */

export type Item =
  | { type: 'likert'; id: string; num?: number | string; text: string; n: number; lo: string; hi: string; tag?: string }
  | { type: 'choice'; id: string; num?: number | string; text: string; options: string[]; tag?: string }
  | { type: 'select'; id: string; num?: number | string; text: string; options: string[]; tag?: string }
  | { type: 'number'; id: string; num?: number | string; text: string; minv: number; maxv: number; tag?: string }
  | { type: 'text'; id: string; num?: number | string; text: string; rows?: number; tag?: string }
  | { type: 'line'; id: string; num?: number | string; text: string; tag?: string };

/* ---------- JSSE: Dixon ve Tiernan (2024); Türkçe form Çıtak, Akyazı ve Abanuzoğlu (2025). 1–10 ---------- */
export const JSSE = [
  'Nasıl iş bulacağınızı bilmek konusunda kendinize ne kadar güveniyorsunuz?',
  'İyi bir mülakat performansı sergileyebileceğinizden ne kadar eminsiniz?',
  'Öz geçmişinizin kalitesini/etkililiğini göz önünde bulundurduğunuzda öz geçmişinize ne kadar güveniyorsunuz?',
  'Bir işverene tüm becerilerinizi sunabileceğinizden ne kadar eminsiniz?',
  'Başvurduğunuz işin seviyesinin yeteneklerinizle gerçekten örtüştüğünü görmek sizi mutlu ediyor mu?',
  'Makul bir ulaşım bölgesi içerisinde iş bulabileceğinizden ne kadar eminsiniz?',
  'İş bulma konusunda gerçekten ne kadar umutlu hissediyorsunuz?',
  'Gelecekte işinizi sürdürme olasılığınızdan ne kadar eminsiniz?',
];
export const JSSE_INSTR =
  'Aşağıda yer alan her bir ifadeyi, kendinize duyduğunuz güven veya emin olma düzeyinizi dikkate alarak, 1 (Düşük/Az) ile 10 (Yüksek/Çok) arasında derecelendiriniz.';

/* ---------- Colquitt (2001), Türkçe: Bağcı (2013), işlemsel adalet 1–7 ---------- */
export const PROC = [
  'Bu süreçler sırasında görüş ve duygularınızı ifade etmeniz mümkün mü?',
  'Bu süreçler ile elde edilen kazanımlar üzerinde etkiniz oldu mu?',
  'Bu süreçler sürekli uygulanıyor mu?',
  'Bu süreçler önyargılardan uzak uygulanabiliyor mu?',
  'Bu süreçleri doğru bilgiye dayalı buluyor musunuz?',
  'Bu süreçler sonucu elde edilen kazanımlara itiraz edebiliyor musunuz?',
  'Bu süreçler etik ve ahlaki standartlara uygun mudur?',
];
/* ---------- Bauer vd. (2001) zamanında geri bildirim; Türkçe ifade taslak ---------- */
export const TIMELY = [
  'Başvurumun sonucuna ilişkin bilgiyi makul bir sürede aldım.',
  'Başvurumla ilgili geri bildirimin zamanlamasından memnunum.',
];
/* ---------- Colquitt (2001), Türkçe: Bağcı (2013), bilgisel adalet 16–20; keşifsel ---------- */
export const INFO = [
  'Sizinle olan diyaloglarında samimi midir?',
  'Süreçleri size iyice açıklar mı?',
  'Süreçler ile ilgili açıklamaları mantıklı mıdır?',
  'Süreçlere ilişkin ayrıntıları zamanında açıklar mı?',
  'İletişim esnasında bireylerin özel ihtiyaçlarına uygun olarak anlaşılır bir dil kullanır mı?',
];
/* ---------- Devam niyeti: ölçek henüz seçilmedi, örnek maddeler (2. madde ters puanlanır) ---------- */
export const CONT = [
  'Önümüzdeki günlerde yeni iş ilanlarına başvurmaya devam etmeyi düşünüyorum.',
  'Bir süre iş aramaya ara vermeyi düşünüyorum.',
  'Bana uygun bir ilan görürsem başvurmak için zaman ayırırım.',
];
/** Devam niyeti ters puanlanan madde numaraları (referans: mean(R,'dn_',3,[2])). */
export const CONT_REVERSED = [2];

const AGREE_LO = '1 = Kesinlikle katılmıyorum';
const AGREE5_HI = '5 = Tamamen katılıyorum';
const AGREE7_HI = '7 = Tamamen katılıyorum';

export function likertItems(list: string[], prefix: string, n: number, lo: string, hi: string, tag?: string): Item[] {
  return list.map((t, i) => ({ type: 'likert', id: `${prefix}${i + 1}`, num: i + 1, text: t, n, lo, hi, tag }));
}

/* ---------- Onam ---------- */
export const CONSENT_ITEM: Item = {
  type: 'choice', id: 'onam', text: 'Yukarıdaki bilgileri okudum ve çalışmaya katılmayı kabul ediyorum.', options: ['Kabul ediyorum', 'Kabul etmiyorum'],
};
export const CONSENT_ACCEPT = 'Kabul ediyorum';

/* ---------- Demografi ---------- */
export const DEMOGRAPHICS_A: Item[] = [
  { type: 'number', id: 'yas', num: 1, text: 'Yaşınız', minv: 18, maxv: 30 },
  { type: 'choice', id: 'cinsiyet', num: 2, text: 'Cinsiyetiniz', options: ['Kadın', 'Erkek', 'Belirtmek istemiyorum'] },
  { type: 'select', id: 'bolum', num: 3, text: 'Bölümünüz', options: ['Türk Dili ve Edebiyatı', 'İngiliz Dili ve Edebiyatı', 'Alman Dili ve Edebiyatı', 'Fransız Dili ve Edebiyatı', 'Mütercim-Tercümanlık / Çeviribilim', 'Dilbilim', 'Karşılaştırmalı Edebiyat', 'Diğer edebiyat / dil bölümü'] },
  { type: 'choice', id: 'durum', num: 4, text: 'Şu anki durumunuz', options: ['4. sınıf öğrencisiyim', 'Son 12 ay içinde mezun oldum'] },
];
export const DEMOGRAPHICS_B: Item[] = [
  { type: 'number', id: 'yas', num: 1, text: 'Yaşınız', minv: 18, maxv: 30 },
  { type: 'choice', id: 'cinsiyet', num: 2, text: 'Cinsiyetiniz', options: ['Kadın', 'Erkek', 'Belirtmek istemiyorum'] },
  { type: 'line', id: 'universite', num: 3, text: 'Üniversiteniz' },
  { type: 'line', id: 'sehir', num: 4, text: 'Yaşadığınız şehir' },
  { type: 'select', id: 'bolum', num: 5, text: 'Bölümünüz', options: ['Türk Dili ve Edebiyatı', 'Batı dilleri ve edebiyatları', 'Mütercim-Tercümanlık / Çeviribilim', 'Dilbilim', 'Karşılaştırmalı Edebiyat', 'Diğer edebiyat / dil bölümü'] },
  { type: 'choice', id: 'durum', num: 6, text: 'Şu anki durumunuz', options: ['4. sınıf öğrencisiyim', 'Son 12 ay içinde mezun oldum'] },
  { type: 'choice', id: 'onceki', num: 7, text: 'Daha önce bu araştırma ekibinin bir çalışmasına katıldınız mı?', options: ['Hayır', 'Evet'] },
];
/** Dahil etme ölçütü (referans tasarım notu): 18–30 yaş. Değer engellenmez, panelde işaretlenir. */
export const AGE_RANGE = { min: 18, max: 30 };

/* ---------- JSSE sayfası (ön / son) ---------- */
export const ATTENTION_PRE: Item = {
  type: 'choice', id: 'dikkat_on',
  text: 'Ne sıklıkla iş ilanlarına bakıyorsunuz? Bu soruda dikkatinizi kontrol ediyoruz: lütfen yanıt olarak "Ayda bir" seçeneğini işaretleyiniz.',
  options: ['Her gün', 'Haftada birkaç kez', 'Haftada bir', 'Ayda bir', 'Hiç bakmıyorum'],
};
export const ATTENTION_PRE_CORRECT = 'Ayda bir';

export function jsseItems(when: 'on' | 'son', withAttention: boolean): Item[] {
  const items = likertItems(JSSE, `jsse_${when}_`, 10, '1 = Düşük / Az', '10 = Yüksek / Çok');
  return withAttention ? items.concat([ATTENTION_PRE]) : items;
}

/* ---------- Son ölçümler ---------- */
export const ATTENTION_POST: Item = {
  type: 'likert', id: 'dikkat_son', num: '', text: "Bu madde dikkat kontrolüdür: lütfen 4'ü işaretleyiniz.", n: 5, lo: AGREE_LO, hi: AGREE5_HI,
};
export const ATTENTION_POST_CORRECT = 4;

/** Prosedürel adalet + zamanında geri bildirim; dikkat maddesi 5. maddeden sonra (referans: procItems.splice(5,0,…)). */
export function procItems(): Item[] {
  const items: Item[] = likertItems(PROC, 'pa_', 5, AGREE_LO, AGREE5_HI, 'Taslak uyarlama').concat(
    TIMELY.map((t, i) => ({ type: 'likert' as const, id: `zgb_${i + 1}`, num: PROC.length + i + 1, text: t, n: 5, lo: AGREE_LO, hi: AGREE5_HI, tag: 'Taslak çeviri' })),
  );
  items.splice(5, 0, ATTENTION_POST);
  return items;
}
export function infoItems(): Item[] {
  return likertItems(INFO, 'ba_', 5, AGREE_LO, AGREE5_HI, 'Taslak uyarlama');
}
export function contItems(): Item[] {
  return likertItems(CONT, 'dn_', 5, AGREE_LO, AGREE5_HI, 'Örnek madde');
}
/** sing = tek şirket (Modül B), aksi çok şirket (Modül A). */
export function manipItems(sing: boolean): Item[] {
  return [
    { type: 'choice', id: 'mk_olgusal', num: 1, text: sing ? 'Şirketten aldığınız mesaja göre ilan şu an:' : 'Şirketlerden aldığınız mesajlara göre ilanlar şu an:', options: ['Kapandı', 'Yayında', 'Mesaj almadım'] },
    { type: 'likert', id: 'mk_algi', num: 2, text: 'Bu süreçte şirketin bu pozisyonu gerçekten doldurmaya çalıştığını ne kadar düşündünüz?', n: 7, lo: '1 = Hiç', hi: '7 = Tamamen' },
    { type: 'likert', id: 'gercekcilik_1', num: 3, text: 'Bu süreçte kendimi başvuran rolünde hayal etmek kolaydı.', n: 7, lo: AGREE_LO, hi: AGREE7_HI, tag: 'Taslak çeviri' },
    { type: 'likert', id: 'gercekcilik_2', num: 4, text: 'Yaşadığım başvuru süreci gerçekçiydi.', n: 7, lo: AGREE_LO, hi: AGREE7_HI, tag: 'Taslak çeviri' },
  ];
}
/** Olgusal manipülasyon kontrolünde koşula göre beklenen yanıt (türetilmiş değişken için). */
export const MK_EXPECTED: Record<'ret' | 'sahte' | 'ghosting', string> = { ret: 'Kapandı', sahte: 'Yayında', ghosting: 'Mesaj almadım' };

export function whoText(sing: boolean): string {
  return sing ? 'başvurduğunuz şirketin işe alım sürecini' : 'bu oturumda başvurduğunuz şirketlerin işe alım sürecini';
}

/* ---------- İlan değerlendirme ---------- */
export function roundEvalItems(round: number): Item[] {
  return [
    { type: 'likert', id: `t${round}_cekicilik`, num: 1, text: 'Bu ilan size ne kadar çekici geldi?', n: 7, lo: '1 = Hiç', hi: '7 = Çok' },
    { type: 'likert', id: `t${round}_uygunluk`, num: 2, text: 'Bu ilan becerilerinize ne kadar uygun?', n: 7, lo: '1 = Hiç', hi: '7 = Çok' },
    { type: 'likert', id: `t${round}_niyet`, num: 3, text: 'Gerçek hayatta bu ilana başvurmayı ne kadar düşünürdünüz?', n: 7, lo: '1 = Hiç', hi: '7 = Çok' },
  ];
}
export const FILLER_ITEMS: Item[] = [
  { type: 'likert', id: 'dolgu_cekicilik', num: 1, text: 'Bu ilan size ne kadar çekici geldi?', n: 7, lo: '1 = Hiç', hi: '7 = Çok' },
  { type: 'likert', id: 'dolgu_uygunluk', num: 2, text: 'Bu ilan becerilerinize ne kadar uygun?', n: 7, lo: '1 = Hiç', hi: '7 = Çok' },
  { type: 'likert', id: 'dolgu_anlasilirlik', num: 3, text: 'İlan metni ne kadar açık ve anlaşılır?', n: 7, lo: '1 = Hiç', hi: '7 = Çok' },
];
/** Modül B ilan seçimi: her ilan için çekicilik + uygunluk, ardından seçim. */
export function choiceItems(ads: { key: string; co: string; title: string }[]): Item[] {
  const items: Item[] = [];
  ads.forEach((a) => {
    items.push({ type: 'likert', id: `ilan_${a.key}_cekicilik`, text: `${a.co} · ${a.title}: Bu ilan size ne kadar çekici geldi?`, n: 7, lo: '1 = Hiç', hi: '7 = Çok' });
    items.push({ type: 'likert', id: `ilan_${a.key}_uygunluk`, text: `${a.co} · ${a.title}: Bu ilan becerilerinize ne kadar uygun?`, n: 7, lo: '1 = Hiç', hi: '7 = Çok' });
  });
  items.push({ type: 'choice', id: 'secim', text: 'Hangi ilana başvurmak istersiniz? (Yalnızca birini seçiniz.)', options: ads.map((a) => `${a.co} · ${a.title}`) });
  return items;
}

/* ---------- Şüphe ve son sorular ---------- */
export const SUSPICION_A: Item[] = [{ type: 'text', id: 'suphe', text: 'Sizce bu çalışmanın amacı neydi?', rows: 4 }];
export const FINAL_B: Item[] = [
  { type: 'choice', id: 'is_teklifi', num: 1, text: 'Son iki haftada bir iş teklifi kabul ettiniz mi?', options: ['Hayır', 'Evet'] },
  { type: 'choice', id: 'konustu', num: 2, text: 'Bu çalışmayı başka biriyle konuştunuz mu?', options: ['Hayır', 'Evet'] },
  { type: 'text', id: 'suphe', num: 3, text: 'Sizce bu çalışmanın amacı neydi?', rows: 4 },
];

/** Başvuru formu ön yazı alt sınırı (karakter, boşluklar kırpılarak). */
export const COVER_LETTER_MIN = 100;
