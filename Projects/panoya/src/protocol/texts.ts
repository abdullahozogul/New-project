/**
 * Onam, yönerge, bilgilendirme ve tasarım notu metinleri.
 * KAYNAK: referans HTML dosyaları. Metinler harfiyen aktarılmıştır. HTML parçaları yalnızca bu dosyada
 * yazılmış sabit metinlerdir; dinamik kısımlar `esc()` ile kaçırılır.
 * BU DOSYA ARAŞTIRMA PROTOKOLÜNÜN PARÇASIDIR; İZİNSİZ DEĞİŞTİRMEYİNİZ.
 */
import type { Condition } from './conditions';
import { COND_LABEL } from './conditions';

export function esc(s: unknown): string {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);
}

export const STUDY_HEADER = { name: 'Dijital işe alım platformlarında aday deneyimi', institution: 'İstanbul Üniversitesi · Psikoloji Bölümü' };

/* ---------------- Onam ---------------- */
export const CONSENT_A_HTML = `
<h3>Çalışmanın konusu</h3><p>Bu çalışma, dijital işe alım platformlarında adayların başvuru deneyimini incelemektedir. Çalışma İstanbul Üniversitesi Psikoloji Bölümü'nde yürütülmektedir.</p>
<h3>Ne yapacaksınız?</h3><p>Bilgisayarda bir iş ilanı platformunun benzetimini kullanacaksınız. Birkaç ilana kısa notlarla başvuracak, ardından bazı soruları yanıtlayacaksınız. Ekranda göreceğiniz şirketler ve ilanlar araştırma amacıyla hazırlanmıştır. Çalışma yaklaşık 35 dakika sürer.</p>
<h3>Gönüllülük ve gizlilik</h3><p>Katılım gönüllüdür. İstediğiniz anda gerekçe göstermeden çalışmadan ayrılabilirsiniz. Yanıtlarınız isimsiz olarak saklanır ve yalnızca bilimsel amaçla kullanılır.</p>
<h3>İletişim</h3><p>Sorularınız için: [araştırma e-posta adresi]. Danışman: Prof. Dr. İlknur Özalp Türetgen.</p>`;

export const CONSENT_B_HTML = `
<h3>Çalışmanın konusu</h3><p>Bu çalışma, dijital işe alım platformlarında adayların başvuru deneyimini incelemektedir. Çalışma İstanbul Üniversitesi Psikoloji Bölümü'nde yürütülmektedir.</p>
<h3>Ne yapacaksınız?</h3><p>Çalışma iki bölümden oluşur. Bugünkü ilk bölümde birkaç soruyu yanıtlayacak, üç iş ilanını inceleyecek ve birine başvuracaksınız (yaklaşık 15 dakika). İkinci bölümün bağlantısı yaklaşık iki hafta sonra e-posta adresinize gönderilecektir (yaklaşık 15 dakika).</p>
<h3>İlanlar hakkında</h3><p><b>Bu çalışmadaki şirketler ve iş ilanları kurgusaldır; araştırma amacıyla hazırlanmıştır.</b> Başvurunuz gerçek bir işe alım sürecine dahil edilmez. Yine de lütfen başvurunuzu gerçek bir başvuru yapıyormuş gibi hazırlayınız.</p>
<h3>Gönüllülük ve gizlilik</h3><p>Katılım gönüllüdür; istediğiniz anda ayrılabilirsiniz. E-posta adresiniz yalnızca çalışma iletileri için kullanılır ve yanıtlarınızdan ayrı saklanır.</p>
<h3>İletişim</h3><p>Sorularınız için: aday-deneyimi@arastirma.example. Danışman: Prof. Dr. İlknur Özalp Türetgen.</p>`;

/* ---------------- Modül A: platforma geçiş ---------------- */
export const PLATFORM_INTRO_HTML = `<p>Şimdi <b>panoya</b> adlı iş ilanı platformunda size uygun bulunan ilanlara sırayla başvuracaksınız. Her ilanı okuyun ve kısa bir ön yazıyla başvurun. Şirketlerin başvurunuza yanıtı platform üzerinden iletilir.</p>
<p>Başvurudan sonra bekleme süresinde birkaç kısa soru göreceksiniz. Bu sorular araştırma ekibine aittir ve ekranın altında gri bir kutuda yer alır.</p>`;

/* ---------------- Bilgilendirme ---------------- */
export function debriefHtml(extra: string): string {
  return `<p>Katılımınız için teşekkür ederiz. Bu çalışma, iş başvurusu sonrasında şirketlerin adaylarla nasıl iletişim kurduğunun adayların algılarını ve iş arama davranışlarını nasıl etkilediğini incelemektedir.</p>
  <p>Çalışmada katılımcılar rastgele üç gruptan birine atanmıştır:</p>
  <ul><li><b>Zamanında ret:</b> Şirket söz verdiği zamanda standart bir ret mesajı gönderir ve ilan kapanır.</li>
  <li><b>Sahte ilan:</b> Aynı ret mesajı gelir, ancak ilan yayında kalmaya ve başvuru almaya devam eder. Gerçek hayatta bu durum, işe alım niyeti taşımadan yayında tutulan ilanlar için kullanılan "hayalet ilan" (ghost job) kavramıyla anılır.</li>
  <li><b>Ghosting:</b> Şirket dönüş sözü verir ama hiçbir yanıt göndermez. Buna işveren sessizliği (ghosting) denir.</li></ul>
  <p>${extra}Gördüğünüz şirketler, ilanlar ve şirket mesajları araştırma için hazırlanmıştır. Aldığınız yanıtlar sizin başvurunuzla ya da yazdığınız notla ilgili herhangi bir değerlendirmeye dayanmamaktadır; hangi yanıtı alacağınız çalışma başlamadan önce belirlenmişti.</p>
  <p>Çalışmanın amacını baştan tam olarak açıklamamamızın nedeni, katılımcıların gerçek bir başvuru sürecindeki tepkilerini ölçebilmektir. Bu nedenle çalışmanın ayrıntılarını henüz katılmamış olabilecek kişilerle paylaşmamanızı rica ederiz.</p>
  <p>Verilerinizin çalışmadan çıkarılmasını isterseniz ya da sorularınız olursa araştırma ekibine yazabilirsiniz. Verileriniz isimsiz olarak saklanır.</p>
  <p class="small">Araştırma ekibi: İstanbul Üniversitesi Psikoloji Bölümü · Danışman: Prof. Dr. İlknur Özalp Türetgen · İletişim: [araştırma e-posta adresi]</p>`;
}
export function debriefExtraA(cond: Condition): string {
  return `Siz <b>${esc(COND_LABEL[cond])}</b> grubundaydınız. `;
}
export function debriefExtraB(cond: Condition, company: string): string {
  return `Siz <b>${esc(COND_LABEL[cond])}</b> grubundaydınız. ${esc(company)} adına gelen e-postalar araştırma ekibi tarafından hazırlanmıştır. `;
}
export const THANKS_A = 'Çalışma tamamlandı. Lütfen araştırmacıya haber veriniz.';
export const THANKS_B = 'Çalışma tamamlandı. Bu sayfayı kapatabilirsiniz.';

/* ---------------- Modül B: araştırma paneli metinleri ---------------- */
export const PART1_DONE = { title: 'Çalışmanın ilk bölümü tamamlandı.', sub: 'İkinci bölümün bağlantısı yaklaşık iki hafta sonra e-posta adresinize gönderilecektir.' };

/* ---------------- Akış özetleri (referans kurulum ekranı, yalnızca test modunda) ---------------- */
export const FLOW_A = {
  title: 'Çalışma 1 · Laboratuvar deneyi',
  sub: 'jsPsych ile hazırlanmış e-işe alım simülasyonu. Katılımcı aynı sonucu art arda dört başvuruda yaşar. Koşulu seçip katılımcı gibi ilerleyebilirsiniz.',
  steps: ['Onam', 'Hakkınızda (yaş, cinsiyet, bölüm)', 'Ön ölçüm: JSSE + talimatlı dikkat maddesi', '4 zorunlu başvuru turu (her turda 60 sn bekleme ve ilan değerlendirme)', 'Davranış: platformda yeni ilan, Başvur / Geç', 'Son ölçümler: prosedürel adalet, bilgisel adalet, JSSE, devam niyeti, manipülasyon kontrolleri, ikinci dikkat maddesi', 'Şüphe sorusu', 'Bilgilendirme ve kaydedilen veri özeti'],
};
export const FLOW_B = {
  title: 'Çalışma 2 · E-posta takipli çevrimiçi deney',
  sub: 'Gerçek uygulama değil, akışı gösteren bir simülasyondur. 1. gün başvuru yapılır; 14. gün şirketin e-postası (koşula göre) ve araştırma ekibinin e-postası gelir. Gelen kutusu görünümü katılımcının kendi e-posta kutusunu temsil eder.',
  steps: ['1. gün: Onam (ilanların kurgusal olduğu açıkça belirtilir)', '1. gün: Hakkınızda + ön ölçüm (JSSE + talimatlı dikkat maddesi)', '1. gün: 3 ilanı değerlendirme ve birine başvuru (form onayı)', '1. gün: Şirketten onay e-postası, dönüş sözü: "en geç 7 Aralık 2026 saat 12:00"', '14 gün sonrasına atlama', "14. gün 11:30: Şirket e-postası (ret ya da sahte ilan; ghosting'de e-posta yok)", '14. gün 14:00: Araştırma ekibinin e-postası (üç koşulda aynı metin)', 'Bağlantı: önce yeni ilan Başvur / Geç, sonra son ölçümler', 'Sonda iş teklifi, başkasıyla konuşma ve şüphe soruları', 'Bilgilendirme'],
};

/* ---------------- Sarı tasarım notları (yalnızca test modunda, "notlar açık" iken) ---------------- */
export const NOTES = {
  consentA: 'Onamda çalışma genel çerçeveyle tanıtılır; ghosting ve sahte ilan kavramları bilgilendirmede açıklanır. Aldatma ilan düzeyinde değil, yalnızca sürecin işleyişi düzeyindedir.',
  consentB: "Çalışma 2'de ilanların kurgusal olduğu baştan açıkça söylenir. Aldatma yalnızca sürecin işleyişi düzeyindedir; ghosting ve sahte ilan kavramları bilgilendirmede açıklanır.",
  demoA: 'Kovaryatlar: cinsiyet ve bölüm. Dahil etme ölçütleri: 4. sınıf ya da en fazla 12 aylık mezun, 18–30 yaş.',
  demoB: "Çalışma 2 Türkiye genelinde yürütülür; şehir ve üniversite kaydedilir. Çalışma 1'e ya da ilan pilotuna katılanlar ve iş teklifi kabul etmiş olanlar dışlanır.",
  jsse: (withAttention: boolean) =>
    'JSSE: Dixon ve Tiernan (2024), Türkçe form Çıtak vd. (2025), 8 madde, 1–10. Ön ve son ölçümde aynı form.' +
    (withAttention ? ' Sondaki madde ön ölçümdeki talimatlı dikkat maddesidir (Meade ve Craig, 2012); son ölçümdeki dikkat maddesi farklı türdedir.' : ''),
  platformIntro: 'Şirket ve platform ekranları (beyaz, mavi vurgu) ile araştırma ekranları (gri kâğıt, koyu yeşil) bilerek farklı görünür.',
  roundAd: 'Her turda farklı bir kurgusal şirketin ilanı gösterilir; sıralama katılımcıya göre karıştırılır. Gerçek ilanlar dilbilimci tarafından tek şablonla 180–220 kelime olarak yazılacak (Koçak vd., 2023); burada kısaltılmış örnekler var.',
  roundApply: 'Çaba maliyeti: 2–3 cümlelik not, en az 100 karakter. Gönder düğmesi 100 karaktere ulaşınca açılır.',
  roundWait: (wait: number, read: number, fast: boolean) =>
    `Herkes tam ${wait} sn bekler (demoda ${fast ? 'kısaltılmış' : 'gerçek süre'}). Bekleme süresince ilan 3 soruyla değerlendirilir. ${wait}. saniyede ret ve sahte ilan koşullarında mesaj gelir; ghosting koşulunda hiçbir şey gelmez ve durum "Başvurunuz alındı" olarak kalır. Devam düğmesi her koşulda ${wait + read}. saniyede açılır, böylece süre koşullar arasında eşittir.`,
  behavior: (where: string, min: number) =>
    `Davranış ölçümü (Zizzamia, 2026; McCarthy vd., 2017). ${where}. Başvur ve Geç yolları aynı en kısa süreyi alır (demoda ${min} sn; gerçek süre danışmanla). Başvurunun sonucu gösterilmez; geçen katılımcı aynı sürede ilan değerlendirme görevi yapar.`,
  behaviorWhereA: 'Son turun hemen ardından, ölçeklerden önce gösterilir',
  behaviorWhereB: 'Bağlantı açılınca ilk ekran budur; adalet sorularından önce alınır',
  filler: 'Geç seçildiğinde gösterilen eşit süreli dolgu görevi. Oturum kısalmaz.',
  proc: 'Prosedürel adalet (birincil sonuç): Colquitt (2001), Türkçe Bağcı (2013), 7 madde; ardından Bauer vd. (2001) zamanında geri bildirim maddeleri. Aday bağlamına uyarlama ifadeleri danışmanla netleştirilecek; maddeler taslaktır. Talimatlı dikkat maddesi araya yerleştirildi.',
  info: 'Keşifsel: bilgisel adalet, Colquitt (2001), Türkçe Bağcı (2013), 5 madde. Taslak uyarlama.',
  cont: 'Devam niyeti ölçeği henüz seçilmedi; aşağıdakiler yalnızca örnek maddedir (2. madde ters puanlanır). Ölçme biçimi danışmanla netleştirilecek.',
  manip: "Manipülasyon kontrolleri: olgusal soru (Wood vd., 2023'ten uyarlanmıştır), algı sorusu (Emre, 2026 tanımı + Wood vd. yaklaşımı), gerçekçilik (Lee vd., 2020, 2 madde).",
  suspicionA: 'Şüphe sorusu bilgilendirmeden önce sorulur. Amacı doğru tahmin edenler ana analizde tutulur, duyarlılık analiziyle ayrıca değerlendirilir.',
  finalB: 'Teklif kabul edenler ve amacı doğru tahmin edenler duyarlılık analiziyle ayrıca değerlendirilir.',
  chooseAds: 'Koşul, seçilen ilandan bağımsız olarak önceden rastgele atanır (günlük üçerli bloklar); seçilen şirket analizde kovaryattır. Her şirketin kendi alan adı olur; hiçbiri gerçek bir şirketi taklit etmez.',
  applyB: 'Demoda ad ve e-posta örnek olarak dolduruldu. Gerçek çalışmada e-posta adresi yanıtlardan ayrı bir tabloda tutulur.',
  confirmB: 'Çift onayın birincisi: form ekranı. İkincisi: şirketin onay e-postası (sonraki ekran). Şirketin işe alım süreci ile araştırma ayrı adreslerden yürür.',
  inboxD1: 'Şirketin onay e-postası. Dönüş sözü belirli bir tarih ve saate bağlıdır; ghosting koşulunda bu sözün bozulduğu açıkça görünür.',
  jump: 'Bu sürede şirket ve araştırma ekibi hiç e-posta göndermez. Araştırma adresine gelen sorulara üç koşulda da aynı standart yanıt verilir: "Başvuru süreci şirket tarafından yürütülmektedir."',
  d14aGhosting: "Ghosting koşulu: 11:30'da hiçbir e-posta gelmez. Söz verilen saat (12:00) da sessizce geçer.",
  d14aRet: 'Zamanında ret koşulu: standart ret e-postası. Altında "İlan durumu: Kapandı" yazar. Kişisel geri bildirim verilmez (Wood vd., 2023).',
  d14aSahte: 'Sahte ilan koşulu: standart ret e-postası. Ret koşuluyla birebir aynı metin; tek fark alttaki satır: "İlan durumu: Yayında – başvurular devam ediyor".',
  d14b: 'Araştırma ekibinin e-postası üç koşula aynı anda ve aynı metinle gider. Katılımcıdan bir şey isteyen tek e-posta budur. Gönderen adres, şirketin adresinden açıkça farklıdır. Devam etmek için e-postayı açıp bağlantıya tıklayın.',
};
