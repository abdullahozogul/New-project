/**
 * Modül B e-posta simülasyonu: e-postaların içeriği, sırası ve tarihleri.
 * KAYNAK: Çalışma 2 referans dosyası (filler, companyConfirm, companyReject, researchMail, day14a, day14b).
 * Bu modül YALNIZCA SUNUCUDA çağrılır; koşula bağlı içerik istemciye ancak gösterileceği anda gönderilir.
 * BU DOSYA ARAŞTIRMA PROTOKOLÜNÜN PARÇASIDIR; İZİNSİZ DEĞİŞTİRMEYİNİZ.
 */
import { ADS, type AdKey } from './ads';
import { AD_STATUS_TEXT, companyResponseFor, type Condition } from './conditions';
import { esc } from './texts';

export const DATES = {
  DAY1: '24 Kasım 2026 Salı',
  DAY14: '7 Aralık 2026 Pazartesi',
  DAY14_SHORT: '7 Aralık 2026',
  appsWhen: '24 Kas 2026, 16:41',
  clockD1: '24 Kasım 2026 Salı, 16:43',
  clockD14a: '7 Aralık 2026 Pazartesi, 11:30',
  clockD14b: '7 Aralık 2026 Pazartesi, 14:00',
  /** Takvim: 23 Kasım 2026 Pazartesi'den itibaren 21 gün; 1. gün 24 Kasım, 14. gün 7 Aralık. */
  calendarStart: { y: 2026, m: 10, d: 23 },
};

export const RESEARCH_FROM = { name: 'Aday Deneyimi Araştırması (İÜ)', addr: 'aday-deneyimi@arastirma.example', color: '#35614c', ini: 'İÜ' };

/** Referans demodaki örnek katılımcı (yalnızca test kayıtlarında forma önceden yazılır). */
export const SAMPLE_CONTACT = { name: 'Deniz Yılmaz', email: 'deniz.yilmaz@posta.example' };

export type MailboxStage = 'd1' | 'd14a' | 'd14b';
export type MailKind = 'filler' | 'company_confirm' | 'company_reject' | 'research';

export interface Mail {
  id: string;
  kind: MailKind;
  name: string;
  addr: string;
  color: string;
  ini: string;
  subj: string;
  snip: string;
  time: string;
  date?: string;
  body: string; // sabit şablondan üretilmiş HTML
  sig?: string;
  adstatus?: string;
  foot?: string;
  hasResearchLink?: boolean;
  unread: boolean;
}

export function appNoFor(ad: AdKey): string {
  return `${ADS[ad].code}-2026-0417`;
}

export function companyAddr(ad: AdKey): string {
  const first = ADS[ad].co.split(' ')[0].toLowerCase().replace('ö', 'o').replace('ı', 'i');
  return `ik@${first}.example`;
}

function filler(id: string, name: string, addr: string, subj: string, snip: string, time: string): Mail {
  return {
    id, kind: 'filler', name, addr, subj, snip, time, unread: false, color: '#7b8390', ini: name[0],
    body: `<p>${esc(snip.replace('…', ''))}.</p><p>Ayrıntılar için bağlantıya göz atabilirsiniz.</p>`, sig: '',
  };
}

const FILLERS_D1 = () => [
  filler('kampus', 'Kampüs Kulüpleri Birliği', 'bulten@kulupler.example', 'Kasım etkinlik takvimi', 'Bu hafta söyleşi, film gösterimi ve çeviri atölyesi var…', '22 Kas'),
  filler('bulut', 'Bulut Depo', 'destek@bulutdepo.example', "Depolama alanınızın %85'i dolu", 'Dosyalarınızı düzenlemek için birkaç öneri…', '23 Kas'),
];
const FILLERS_D14 = () => [
  filler('bolum', 'Bölüm Sekreterliği', 'sekreterlik@bolum.example', 'Final sınav takvimi yayımlandı', 'Güz yarıyılı final sınav takvimi bölüm sayfasında…', '1 Ara'),
  filler('bulut2', 'Bulut Depo', 'destek@bulutdepo.example', 'Haftalık özetiniz', 'Bu hafta 12 dosya yedeklendi…', '4 Ara'),
];

function companyConfirm(ad: AdKey, name: string): Mail {
  const a = ADS[ad];
  const appNo = appNoFor(ad);
  const first = name.split(' ')[0];
  return {
    id: 'conf', kind: 'company_confirm', name: `${a.co} İnsan Kaynakları`, addr: companyAddr(ad), color: a.color, ini: a.ini, unread: true,
    subj: `Başvurunuz alındı – ${a.title} (${appNo})`, snip: `Merhaba ${first}, ${a.title} pozisyonuna yaptığınız başvuru tarafımıza ulaşmıştır…`, time: '16:43', date: '24 Kas 2026 16:43',
    body: `<p>Merhaba ${esc(first)},</p>
      <p>${esc(a.co)} bünyesindeki <b>${esc(a.title)}</b> pozisyonuna yaptığınız başvuru tarafımıza ulaşmıştır. Başvuru numaranız: ${appNo}.</p>
      <p>Başvurunuza en geç <b>${DATES.DAY14_SHORT} saat 12:00'ye</b> kadar dönüş yapılacaktır.</p>
      <p>İlginiz için teşekkür ederiz.</p>`,
    sig: `Saygılarımızla,<br>İnsan Kaynakları<br>${esc(a.co)}<br>Şirket merkezi: İstanbul`,
    foot: 'Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.',
  };
}

/** Ret e-postası: ret ve sahte koşulda birebir aynı; yalnızca ilan durumu satırı farklı (referans companyReject). */
function companyReject(ad: AdKey, adStatus: 'open' | 'closed'): Mail {
  const a = ADS[ad];
  const appNo = appNoFor(ad);
  return {
    id: 'rej', kind: 'company_reject', name: `${a.co} İnsan Kaynakları`, addr: companyAddr(ad), color: a.color, ini: a.ini, unread: true,
    subj: `${a.title} başvurunuz hakkında (${appNo})`, snip: `Sayın Aday, ${a.title} pozisyonuna gösterdiğiniz ilgi için teşekkür ederiz…`, time: '11:30', date: '7 Ara 2026 11:30',
    body: rejectionParagraphs(a.title),
    sig: `Saygılarımızla,<br>İnsan Kaynakları<br>${esc(a.co)}`,
    adstatus: `<b>İlan durumu:</b> ${AD_STATUS_TEXT[adStatus]}`,
  };
}

/** Referans rejectionBody() – imza hariç paragraflar. Modül A platform mesajında imza ile birlikte kullanılır. */
export function rejectionParagraphs(title: string): string {
  return `<p>Sayın Aday,</p>
  <p>${esc(title)} pozisyonuna gösterdiğiniz ilgi için teşekkür ederiz. Başvurunuzu değerlendirdik; ancak bu aşamada sürece sizinle devam etmeyeceğimizi bildirmek isteriz.</p>
  <p>Gelecekteki kariyer adımlarınızda başarılar dileriz.</p>`;
}
export function rejectionSignature(co: string): string {
  return `<p>Saygılarımızla,<br>İnsan Kaynakları<br>${esc(co)}</p>`;
}

function researchMail(): Mail {
  return {
    id: 'res', kind: 'research', name: RESEARCH_FROM.name, addr: RESEARCH_FROM.addr, color: RESEARCH_FROM.color, ini: RESEARCH_FROM.ini, unread: true,
    subj: 'Araştırmanın ikinci bölümü: bağlantınız hazır', snip: 'Merhaba, "Dijital işe alım platformlarında aday deneyimi" araştırmasının ikinci bölümü…', time: '14:00', date: '7 Ara 2026 14:00',
    body: `<p>Merhaba,</p>
      <p>"Dijital işe alım platformlarında aday deneyimi" araştırmasının ilk bölümüne katıldığınız için teşekkür ederiz. İkinci ve son bölüm yaklaşık 15 dakika sürmektedir.</p>
      <p>Aşağıdaki bağlantı size özeldir. Lütfen başkalarıyla paylaşmayınız.</p>
      <p data-research-link></p>
      <p>Sorularınız için bu e-postayı yanıtlayabilirsiniz.</p>`,
    sig: 'Araştırma ekibi<br>İstanbul Üniversitesi Psikoloji Bölümü',
    hasResearchLink: true,
  };
}

export interface MailboxCtx {
  condition: Condition;
  chosenAd: AdKey;
  name: string;
  /** Açılmış e-postalar ve açıldıkları aşama. */
  opened: { mailId: string; stage: MailboxStage }[];
}

/**
 * Bir aşamadaki gelen kutusu (gönderim sırasıyla; arayüz en yeniyi üstte gösterir).
 * Okunmamış durumu referanstaki gibi: 14. gün 11:30'da önceki tüm e-postalar okunmuş sayılır.
 */
export function buildMailbox(stage: MailboxStage, ctx: MailboxCtx): { mails: Mail[]; fresh: string | null; clock: string } {
  const openedAt = (id: string, stages: MailboxStage[]) => ctx.opened.some((o) => o.mailId === id && stages.includes(o.stage));
  const mails: Mail[] = [...FILLERS_D1(), companyConfirm(ctx.chosenAd, ctx.name)];
  if (stage === 'd1') {
    mails.forEach((m) => { if (openedAt(m.id, ['d1'])) m.unread = false; });
    return { mails, fresh: 'conf', clock: DATES.clockD1 };
  }
  mails.forEach((m) => (m.unread = false));
  mails.push(...FILLERS_D14());
  const resp = companyResponseFor(ctx.condition);
  let fresh: string | null = null;
  if (resp.deliver) {
    const rej = companyReject(ctx.chosenAd, resp.adStatus);
    if (openedAt('rej', ['d14a', 'd14b'])) rej.unread = false;
    mails.push(rej);
    fresh = 'rej';
  }
  if (stage === 'd14a') return { mails, fresh, clock: DATES.clockD14a };
  const res = researchMail();
  if (openedAt('res', ['d14b'])) res.unread = false;
  mails.push(res);
  return { mails, fresh: 'res', clock: DATES.clockD14b };
}
