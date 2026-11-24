# Referans HTML dosyalarının teknik dökümü

Bu belge, Panoya platformunun bilimsel referansı olan iki demo dosyasının satır satır incelenmesiyle hazırlanmıştır. Uygulamadaki her ekran, soru, süre ve koşul davranışı bu dökümle eşleştirilmiştir. Kaynak dosyalar:

| Dosya | `<title>` | Boyut | Not |
|---|---|---|---|
| `…isinden_belge_1.html` | Çalışma 1 Laboratuvar Demosu | 145 KB, 898 satır | jsPsych 8.2.3 (minified, satır 276–285) gömülü |
| `…isinden_belge.html` | Çalışma 2 E-posta Demosu | 75 KB, 948 satır | jsPsych yok, saf JavaScript |

## 0. Genel mimari

İki dosya **birebir aynı** üç parçayı paylaşır (diff ile doğrulandı):

1. **CSS** (satır 9–273): üç görsel dünya
   - *Demo şeridi* (koyu `#23262b`, yalnızca ekip görür) ve sarı tasarım notları (`#fff7d6`).
   - *panoya iş platformu*: beyaz yüzey, açık gri zemin `#f2f4f7`, tek kurumsal mavi `#0b5cad` (koyu `#084a8c`, yumuşak `#e7f0fa`), metin `#1c2330`, ikincil `#5c6576`, çizgi `#dce1e8`.
   - *Araştırma ekranı*: gri kâğıt zemin `#e9ebea`, beyaz kart, koyu yeşil vurgu `#35614c` (yumuşak `#e6efe9`), üst şerit `#2f3437`.
   - *Posta istemcisi*: `#f6f8fb` zemin, seçili `#e3ecf8`, okunmamış metin `#0f1d33`, vurgu `#1a62c4`.
   - Durum renkleri: olumlu `#1b7743`, olumsuz `#b0281f`, beklemede `#5c6576`.
   - Kırılımlar: 860 px (tek sütun, posta klasörleri gizlenir), 520 px (arama ve gezinme alt satıra iner).
2. **Ortak JS çekirdeği** (Ç1 satır 288–687 = Ç2 satır 278–677): kurgusal ilanlar, ölçek maddeleri, ekran yardımcıları, davranış görevi, son ölçümler, bilgilendirme.
3. **Çalışmaya özgü akış**: Ç1 jsPsych zaman çizelgesi (satır 689–896), Ç2 elle zincirlenmiş fonksiyonlar (satır 679–946).

### 0.1 jsPsych kullanımı (Çalışma 1)

jsPsych yalnızca **zaman çizelgesi yürütücüsü ve veri kaydedici** olarak kullanılır. Tek bir özel eklenti vardır:

```js
class ScreenPlugin { trial(display_element, trial){ trial.render(display_element, d => { ...; jsPsych.finishTrial(d || {}); }); } }
ScreenPlugin.info = { name: 'ekran', parameters: { render: FUNCTION } };
function screen(name, render){ return { type: ScreenPlugin, render, data: { ekran: name } }; }
initJsPsych({ display_element: 'app', override_safe_mode: true });
```

Her ekran bir jsPsych denemesidir; tüm görsel içerik ortak çekirdeğin HTML üreten fonksiyonlarıyla çizilir. jsPsych'in kendi soru eklentileri (survey-likert vb.) **kullanılmaz**. Kaydedilen her satırda `ekran` alanı bulunur; jsPsych ayrıca `rt`, `time_elapsed`, `trial_index` ekler. Bilgilendirme ekranı ön ölçüm satırını `jsPsych.data.get().filter({ekran:'on_jsse'})` ile okur.

**Sonuç:** jsPsych'in deney mantığına katkısı "sıralı ekranlar + ekran başına bir veri satırı" modelidir. Panoya bu modeli TypeScript ile birebir korur (bkz. `02-mimari.md`): aynı ekran adları (`ekran`), aynı sıra, ekran başına bir veri satırı, jsPsych uyumlu uzun biçimli dışa aktarım.

## 1. Deneysel koşullar

```js
const COND_LABEL = { ret: 'Zamanında ret', sahte: 'Sahte ilan', ghosting: 'Ghosting' };
```

| Kod | Şirket mesajı | Mesaj metni | İlan durumu satırı | Başvuru durumu (Ç1 tablo) |
|---|---|---|---|---|
| `ret` | Gelir | `rejectionBody(ad)` | **İlan durumu:** Kapandı | Olumsuz sonuçlandı |
| `sahte` | Gelir | `rejectionBody(ad)` (birebir aynı) | **İlan durumu:** Yayında – başvurular devam ediyor | Olumsuz sonuçlandı |
| `ghosting` | Gelmez | — | — | Başvurunuz alındı (değişmez) |

Ret metni (her iki çalışmada ortak, `rejectionBody`):

> Sayın Aday,
> {Pozisyon} pozisyonuna gösterdiğiniz ilgi için teşekkür ederiz. Başvurunuzu değerlendirdik; ancak bu aşamada sürece sizinle devam etmeyeceğimizi bildirmek isteriz.
> Gelecekteki kariyer adımlarınızda başarılar dileriz.
> Saygılarımızla, İnsan Kaynakları, {Şirket}

**Atama (demo):** Kurulum ekranında `ret | sahte | ghosting | rastgele`; rastgele = `Math.floor(Math.random()*3)` (basit rastgele). Ç2 tasarım notu gerçek çalışmada "koşul, seçilen ilandan bağımsız olarak önceden rastgele atanır (günlük üçerli bloklar); seçilen şirket analizde kovaryattır" der. Panoya bunu bloklu rastgele atama olarak uygular.

## 2. Kurgusal şirketler ve ilanlar (`ADS`)

Ortak alanlar: `co, ini, color, code, title, area, about, duties[4], reqs[4]`. Tüm ilanlarda sabit: "Şirket merkezi: İstanbul · Çalışma şekli: Uzaktan", "Tam zamanlı", "2 gün önce yayınlandı"; etiketler `{area}`, "Yeni mezun", "0–2 yıl deneyim"; "Çalışma koşulları: Tam zamanlı, uzaktan çalışma. Ekip toplantıları çevrim içi yapılır."

| Anahtar | Şirket | Pozisyon | Kod | Renk | Alan | Kullanım |
|---|---|---|---|---|---|---|
| `nehirsu` | Nehirsu Yayınevi | Editör Yardımcısı | NY | #2f6f8f | Yayıncılık | Ç1 tur, Ç2 seçim |
| `tirhan` | Tirhan Kitap | Redaksiyon Asistanı | TK | #7a4b2a | Yayıncılık | Ç1 tur, Ç2 seçim |
| `selvigol` | Selvigöl Yayınları | İçerik Editörü Yardımcısı | SY | #4f6b3a | Yayıncılık | Ç1 tur, Ç2 seçim |
| `kekik` | Kekik Dijital İletişim | Metin Yazarı (Yeni Mezun) | KD | #8a3b52 | İletişim ve içerik | Ç1 tur, davranış yan listesi |
| `ardicli` | Ardıçlı Dil Hizmetleri | Yerelleştirme Asistanı | AD | #36577f | Çeviri ve yerelleştirme | Davranış görevi (her iki çalışma) |
| `akcaagac` | Akçaağaç Medya | Sosyal Medya İçerik Asistanı | AM | #6a5a2b | İletişim ve içerik | Geç yolundaki dolgu ilanı, yan liste |

Metinlerin tamamı `src/protocol/ads.ts` dosyasına harfiyen aktarılmıştır.

## 3. Ölçüm araçları (harfiyen)

### 3.1 JSSE – İş arama öz yeterliği (1–10)
Kaynak notu: Dixon ve Tiernan (2024); Türkçe form Çıtak, Akyazı ve Abanuzoğlu (2025). Değişkenler `jsse_on_1…8`, `jsse_son_1…8`. Uçlar: "1 = Düşük / Az", "10 = Yüksek / Çok".
Yönerge: "Aşağıda yer alan her bir ifadeyi, kendinize duyduğunuz güven veya emin olma düzeyinizi dikkate alarak, 1 (Düşük/Az) ile 10 (Yüksek/Çok) arasında derecelendiriniz."

1. Nasıl iş bulacağınızı bilmek konusunda kendinize ne kadar güveniyorsunuz?
2. İyi bir mülakat performansı sergileyebileceğinizden ne kadar eminsiniz?
3. Öz geçmişinizin kalitesini/etkililiğini göz önünde bulundurduğunuzda öz geçmişinize ne kadar güveniyorsunuz?
4. Bir işverene tüm becerilerinizi sunabileceğinizden ne kadar eminsiniz?
5. Başvurduğunuz işin seviyesinin yeteneklerinizle gerçekten örtüştüğünü görmek sizi mutlu ediyor mu?
6. Makul bir ulaşım bölgesi içerisinde iş bulabileceğinizden ne kadar eminsiniz?
7. İş bulma konusunda gerçekten ne kadar umutlu hissediyorsunuz?
8. Gelecekte işinizi sürdürme olasılığınızdan ne kadar eminsiniz?

Ön ölçüm sayfası bölüm başlığı "Ön ölçüm", son ölçümde "Son ölçüm"; sayfa başlığı "İş arama konusundaki güveniniz".

### 3.2 Dikkat kontrolleri
- **`dikkat_on`** (yalnızca ön JSSE sayfasının sonunda, seçmeli): "Ne sıklıkla iş ilanlarına bakıyorsunuz? Bu soruda dikkatinizi kontrol ediyoruz: lütfen yanıt olarak "Ayda bir" seçeneğini işaretleyiniz." Seçenekler: Her gün · Haftada birkaç kez · Haftada bir · Ayda bir · Hiç bakmıyorum. **Doğru: "Ayda bir".** (Meade ve Craig, 2012)
- **`dikkat_son`** (prosedürel adalet sayfasında, `pa_5` ile `pa_6` arasına, numarasız): "Bu madde dikkat kontrolüdür: lütfen 4'ü işaretleyiniz." 1–5. **Doğru: 4.**

### 3.3 Prosedürel adalet `pa_1…7` (1–5) – birincil sonuç
Colquitt (2001), Türkçe Bağcı (2013), işlemsel adalet. Etiket: "Taslak uyarlama". Uçlar: "1 = Kesinlikle katılmıyorum", "5 = Tamamen katılıyorum".
1. Bu süreçler sırasında görüş ve duygularınızı ifade etmeniz mümkün mü?
2. Bu süreçler ile elde edilen kazanımlar üzerinde etkiniz oldu mu?
3. Bu süreçler sürekli uygulanıyor mu?
4. Bu süreçler önyargılardan uzak uygulanabiliyor mu?
5. Bu süreçleri doğru bilgiye dayalı buluyor musunuz?
6. Bu süreçler sonucu elde edilen kazanımlara itiraz edebiliyor musunuz?
7. Bu süreçler etik ve ahlaki standartlara uygun mudur?

### 3.4 Zamanında geri bildirim `zgb_1…2` (1–5)
Bauer vd. (2001). Etiket: "Taslak çeviri". Aynı sayfada numara 8 ve 9.
1. Başvurumun sonucuna ilişkin bilgiyi makul bir sürede aldım.
2. Başvurumla ilgili geri bildirimin zamanlamasından memnunum.

**Sayfa sırası:** pa_1, pa_2, pa_3, pa_4, pa_5, dikkat_son, pa_6, pa_7, zgb_1, zgb_2. Başlık "İşe alım süreci"; yönerge "Aşağıdaki soruları {who} düşünerek yanıtlayınız."

### 3.5 Bilgisel adalet `ba_1…5` (1–5) – keşifsel
Colquitt (2001), Türkçe Bağcı (2013). Etiket: "Taslak uyarlama". Başlık "Şirketin sizinle iletişimi"; yönerge "Aşağıdaki soruları {who} yürüten kişileri düşünerek yanıtlayınız."
1. Sizinle olan diyaloglarında samimi midir?
2. Süreçleri size iyice açıklar mı?
3. Süreçler ile ilgili açıklamaları mantıklı mıdır?
4. Süreçlere ilişkin ayrıntıları zamanında açıklar mı?
5. İletişim esnasında bireylerin özel ihtiyaçlarına uygun olarak anlaşılır bir dil kullanır mı?

`{who}`: Ç1 (çok şirket) "bu oturumda başvurduğunuz şirketlerin işe alım sürecini"; Ç2 (tek şirket) "başvurduğunuz şirketin işe alım sürecini".

### 3.6 Devam niyeti `dn_1…3` (1–5) – **ölçek henüz seçilmedi, örnek maddeler**
Etiket: "Örnek madde". Başlık "İş aramaya ilişkin planlarınız"; yönerge "Aşağıdaki ifadelere ne ölçüde katıldığınızı belirtiniz."
1. Önümüzdeki günlerde yeni iş ilanlarına başvurmaya devam etmeyi düşünüyorum.
2. Bir süre iş aramaya ara vermeyi düşünüyorum. **(ters puanlanır: 6 − x)**
3. Bana uygun bir ilan görürsem başvurmak için zaman ayırırım.

### 3.7 Manipülasyon kontrolleri ve gerçekçilik
Sayfa başlığı "Yaşadığınız süreç".
1. `mk_olgusal` (seçmeli): Ç1 "Şirketlerden aldığınız mesajlara göre ilanlar şu an:", Ç2 "Şirketten aldığınız mesaja göre ilan şu an:". Seçenekler: Kapandı · Yayında · Mesaj almadım. (Wood vd., 2023'ten uyarlama)
   Beklenen yanıt: ret → Kapandı, sahte → Yayında, ghosting → Mesaj almadım.
2. `mk_algi` (1–7, "1 = Hiç", "7 = Tamamen"): "Bu süreçte şirketin bu pozisyonu gerçekten doldurmaya çalıştığını ne kadar düşündünüz?"
3. `gercekcilik_1` (1–7, Taslak çeviri): "Bu süreçte kendimi başvuran rolünde hayal etmek kolaydı."
4. `gercekcilik_2` (1–7, Taslak çeviri): "Yaşadığım başvuru süreci gerçekçiydi." (Lee vd., 2020)

### 3.8 İlan değerlendirme maddeleri (1–7, "1 = Hiç", "7 = Çok")
- Ç1 bekleme panelinde her tur: `t{n}_cekicilik` "Bu ilan size ne kadar çekici geldi?", `t{n}_uygunluk` "Bu ilan becerilerinize ne kadar uygun?", `t{n}_niyet` "Gerçek hayatta bu ilana başvurmayı ne kadar düşünürdünüz?"
- Ç2 ilan seçiminde her ilan için: `ilan_{anahtar}_cekicilik` "{Şirket} · {Pozisyon}: Bu ilan size ne kadar çekici geldi?", `ilan_{anahtar}_uygunluk` "{Şirket} · {Pozisyon}: Bu ilan becerilerinize ne kadar uygun?"; ardından `secim` "Hangi ilana başvurmak istersiniz? (Yalnızca birini seçiniz.)"
- Davranış görevi Geç yolu dolgu: `dolgu_cekicilik`, `dolgu_uygunluk` (aynı metinler), `dolgu_anlasilirlik` "İlan metni ne kadar açık ve anlaşılır?"

### 3.9 Şüphe ve son sorular
- Ç1 (başlık "Son bir soru"): `suphe` (açık uçlu) "Sizce bu çalışmanın amacı neydi?"
- Ç2 (başlık "Son sorular", bölüm "Son ölçüm"): `is_teklifi` "Son iki haftada bir iş teklifi kabul ettiniz mi?" (Hayır/Evet), `konustu` "Bu çalışmayı başka biriyle konuştunuz mu?" (Hayır/Evet), `suphe`.

### 3.10 Demografi
| Değişken | Ç1 | Ç2 |
|---|---|---|
| `yas` | Sayı (min 18, max 30 HTML özniteliği) | Aynı |
| `cinsiyet` | Kadın · Erkek · Belirtmek istemiyorum | Aynı |
| `universite` | — | Serbest metin |
| `sehir` | — | Serbest metin |
| `bolum` | Türk Dili ve Edebiyatı · İngiliz Dili ve Edebiyatı · Alman Dili ve Edebiyatı · Fransız Dili ve Edebiyatı · Mütercim-Tercümanlık / Çeviribilim · Dilbilim · Karşılaştırmalı Edebiyat · Diğer edebiyat / dil bölümü | Türk Dili ve Edebiyatı · Batı dilleri ve edebiyatları · Mütercim-Tercümanlık / Çeviribilim · Dilbilim · Karşılaştırmalı Edebiyat · Diğer edebiyat / dil bölümü |
| `durum` | 4. sınıf öğrencisiyim · Son 12 ay içinde mezun oldum | Aynı |
| `onceki` | — | "Daha önce bu araştırma ekibinin bir çalışmasına katıldınız mı?" Hayır/Evet |

Not: Ç2'de `universite` ve `sehir` 3. ve 4. sırada; `bolum` 5. sırada.

### 3.11 Onam
Tek madde `onam`: "Yukarıdaki bilgileri okudum ve çalışmaya katılmayı kabul ediyorum." (Kabul ediyorum / Kabul etmiyorum). "Kabul etmiyorum" seçilirse sayfa ilerlemez (doğrulama hatası). Ç1 ve Ç2 onam metinleri farklıdır (Ç2'de "ilanlar kurgusaldır" kalın vurgulu; süre Ç1 35 dk, Ç2 2×15 dk).

## 4. Ortak ekran davranışları

### 4.1 `researchPage` (araştırma anketi sayfası)
- Gri şerit: "Dijital işe alım platformlarında aday deneyimi" · "İstanbul Üniversitesi · Psikoloji Bölümü"; altında ilerleme çubuğu (`progress` 0–1).
- Tüm maddeler zorunludur (`optional` hiçbir maddede kullanılmaz). Eksik varsa: "Lütfen işaretlenmemiş soruları yanıtlayınız.", eksik maddeler kırmızı, ilk eksiğe kaydırma.
- `minSec` varsa düğme o süre dolana kadar pasif, "Lütfen bekleyiniz…".
- Her sayfa sonucu `rt_sn` (sayfa süresi, 0,1 sn) ekler.
- Likert gösterimi: 1…n numaralı düğmeler, altta iki uç etiketi; genişlik n≤5: 420 px, n≤7: 540 px, aksi tam genişlik.
- Sayı alanı boşsa `null`, değilse sayıya çevrilir; aralık **doğrulanmaz** (form `novalidate`).

### 4.2 Başvuru formu (`applyForm` / `wireApplyForm`)
- Öz geçmiş: "Profil öz geçmişi eklendi (ozgecmis.pdf)" çipi (gerçek yükleme yok).
- "Kısa ön yazı", yer tutucu "Bu pozisyona neden başvurduğunuzu 2–3 cümleyle yazınız.", sayaç "n / 100", **en az 100 karakter** (boşluklar kırpılarak); "Başvuruyu gönder" o zamana kadar pasif.
- Ç2'de ek alanlar: Ad soyad, E-posta (ipucu: "Başvurunuzla ilgili bildirimler bu adrese gönderilir."), "Bilgilerimin doğru olduğunu onaylıyorum." onay kutusu.

### 4.3 Davranış görevi (`behaviorTask`) – her iki çalışmada aynı
- Önerilen ilan kutusu: "Platformda size uygun yeni bir ilan var." / "Profilinize ve önceki başvurularınıza göre önerildi."
- İlan: `ardicli` (Yerelleştirme Asistanı); yan liste: `akcaagac`, `kekik`. Düğmeler **Başvur** / **Geç**.
- `MIN` = 90 sn (hızlı modda 6 sn). Karar anı `tChoice`.
- **Başvur yolu:** başvuru formu (≥100 karakter) → başarı uyarısı + Başvurularım tablosu (durum "Başvurunuz alındı") → araştırma paneli "Devam" düğmesi `tChoice + MIN` anına kadar pasif. Kayıt: `davranis='basvur'`, `karar_sn`, `not_uzunluk`.
- **Geç yolu:** dolgu ilanı (`akcaagac`) + 3 değerlendirme maddesi, sayfa `minSec = MIN`. Kayıt: `davranis='gec'`, `karar_sn`, `dolgu_*`, `rt_sn`.
- Başvurunun sonucu gösterilmez. İki yol eşit en kısa süreyi alır.

### 4.4 Bilgilendirme (`debriefHtml`)
Üç koşulun açıklaması, "Siz **{koşul}** grubundaydınız." cümlesi (Ç2'de ek: "{Şirket} adına gelen e-postalar araştırma ekibi tarafından hazırlanmıştır."), paylaşmama ricası, veri çekme hakkı. İletişim satırında **yer tutucu**: "[araştırma e-posta adresi]". Düğme "Çalışmayı bitir" → "Teşekkür ederiz" (Ç1: "Lütfen araştırmacıya haber veriniz.", Ç2: "Bu sayfayı kapatabilirsiniz.").

### 4.5 Puanlama (`mean`)
```js
function mean(obj, prefix, n, reverse){ let s=0,c=0; for (i=1..n){ v=obj[prefix+i]; if (v==null) continue; if (reverse?.includes(i)) v = 6 - v; s+=v; c++; } return c ? round2(s/c) : null; }
```
- Mevcut maddelerin ortalaması; eksik madde atlanır (doldurma yok); 2 ondalık.
- Ters puanlama `6 − v` (yalnızca 5'li ölçekler için doğru). Kullanılan tek ters madde `dn_2`.
- Hesaplanan özetler: `prosedurel_adalet_ort = mean(pa_,7)`, `zamaninda_geri_bildirim_ort = mean(zgb_,2)`, `bilgisel_adalet_ort = mean(ba_,5)`, `jsse_on_ort = mean(jsse_on_,8)`, `jsse_son_ort = mean(jsse_son_,8)`, `devam_niyeti_ort = mean(dn_,3,[2])`, `gercekcilik` (iki madde ayrı raporlanır), `dikkat_on` doğruluk ("Ayda bir"), `dikkat_son` doğruluk (4).
- `dikkat_son` prosedürel adalet ortalamasına **girmez** (öneki `pa_` değil).

## 5. Modül A – Çalışma 1 Laboratuvar akışı

Kurulum: koşul, hız ("bekleme 60 sn yerine 8 sn; davranış görevi 90 sn yerine 6 sn"), not gösterimi.
Tur ilanları: `ROUND_ADS = shuffle(['nehirsu','tirhan','selvigol','kekik'])` – katılımcı başına karıştırılır, 4 tur.

| # | `ekran` | İlerleme | İçerik | Kaydedilen |
|---|---|---|---|---|
| 1 | `onam` | 0.02 | Onam metni (35 dk) | `onam`, `rt_sn` |
| 2 | `demografi` | 0.06 | yas, cinsiyet, bolum, durum | + `rt_sn` |
| 3 | `on_jsse` | 0.10 | JSSE 8 madde + `dikkat_on` | `jsse_on_1…8`, `dikkat_on`, `rt_sn` |
| 4 | `platform_giris` | 0.14 | "İlan platformuna geçiyorsunuz", düğme "Platforma geç" | `rt_sn` |
| 5–16 | `tur{n}_ilan` | — | İlan ayrıntısı, Başvur (Kaydet pasif), yan liste: diğer 2 tur ilanı | `tur`, `sirket`, `ilan_okuma_sn` |
| | `tur{n}_basvuru` | — | Başvuru formu ≥100 karakter | `tur`, `not_uzunluk`, `not_metni` |
| | `tur{n}_bekleme` | — | Başarı uyarısı "60 saniye içinde yanıt verilecektir." + geri sayım; Başvurularım tablosu; araştırma paneli 3 madde | `tur`, `sirket`, `kosul`, `mesaj`, `bekleme_sn`, `t{n}_*` |
| 17 | `davranis` | 0.6 | Davranış görevi | `davranis`, `karar_sn`, … |
| 18 | `son_olcumler` | 0.64… | Son ölçümler (5 sayfa, bkz. 3.3–3.7, `sing:false`) | pa, zgb, dikkat_son, ba, jsse_son, dn, mk, gercekcilik |
| 19 | `suphe` | 0.94 | Şüphe sorusu | `suphe` |
| 20 | `bilgilendirme` | 1 | Bilgilendirme | — |

**Bekleme turu zamanlaması (`roundWait`):** `WAIT = 60 sn` (hızlı 8), `READ = 6 sn` (hızlı 2).
- t = WAIT: koşul ghosting değilse şirket mesajı platform içi "Mesajlar" kutusu olarak gelir (logo, "{Şirket} · İnsan Kaynakları", "Yeni mesaj · {saat} · {Pozisyon} başvurunuz hakkında", ret metni, ilan durumu satırı); tablo durumu "Olumsuz sonuçlandı"; "Mesajlar" rozetinde 1.
- Ghosting: hiçbir şey olmaz, durum "Başvurunuz alındı" kalır.
- t = WAIT + READ: "Devam" düğmesi her koşulda açılır (süre eşitliği).
- Başvurularım tablosu tur boyunca birikir (en yeni üstte); önceki turların durumu korunur.
- Son ölçüm son sayfasının ilerleme değerleri: base, +0.06, +0.12, +0.18, +0.24.

## 6. Modül B – Çalışma 2 E-posta takipli akış

Sabitler: `DAY1 = '24 Kasım 2026 Salı'`, `DAY14 = '7 Aralık 2026 Pazartesi'`; söz verilen dönüş "en geç 7 Aralık 2026 saat 12:00". Araştırma gönderen: "Aday Deneyimi Araştırması (İÜ)" `<aday-deneyimi@arastirma.example>`, renk #35614c, baş harf "İÜ". Şirket adresi `ik@{şirket ilk kelime, ö→o, ı→i}.example`. Başvuru no `{kod}-2026-0417`.

| # | Aşama (`stage`) | Ekran | İlerleme | Kaydedilen |
|---|---|---|---|---|
| 1 | d1 | Onam (Ç2 metni) | 0.03 | `onam` |
| 2 | d1 | Hakkınızda (7 madde) | 0.08 | demografi |
| 3 | d1 | Ön JSSE + `dikkat_on` | 0.14 | `jsse_on_*`, `dikkat_on` |
| 4 | d1b | Arama sonuçları: 3 ilan (`nehirsu, tirhan, selvigol`, sabit sıra), "İlan ayrıntılarını göster" açılır; altında araştırma paneli 6 değerlendirme + `secim`, düğme "Seçtiğim ilana başvur" | — | `ilan_*`, `secim` |
| 5 | d1b | Başvuru formu (ad, e-posta, ön yazı ≥100, onay kutusu) | — | `not_uzunluk` |
| 6 | d1b | Onay: "Başvurunuz alındı… Başvuru numaranız… Onay e-postası {e-posta} adresine gönderildi." + Başvurularım + araştırma paneli "Çalışmanın ilk bölümü tamamlandı." | — | — |
| 7 | d1b | Gelen kutusu 24 Kas 16:43: dolgu (22 Kas Kampüs Kulüpleri Birliği, 23 Kas Bulut Depo, okunmuş) + şirket onay e-postası (okunmamış, vurgulu) | — | — |
| 8 | — | Zaman atlaması: takvim (23 Kas–13 Ara), 1. ve 14. gün işaretli, düğme "14. gün, saat 11:30'a geç" | — | — |
| 9 | d14a | Gelen kutusu 7 Ara 11:30: tüm eski e-postalar okunmuş; yeni dolgu (1 Ara Bölüm Sekreterliği, 4 Ara Bulut Depo); **ret/sahte: şirket ret e-postası 11:30** (ret metni + ilan durumu satırı); **ghosting: e-posta yok** | — | — |
| 10 | d14b | Gelen kutusu 14:00: araştırma ekibi e-postası (üç koşulda aynı) + "İkinci bölüme başla" bağlantısı | — | (demoda kayıt yok) |
| 11 | son | Davranış görevi (ilerleme 0.5) | 0.5 | `davranis`, `karar_sn`, … |
| 12 | son | Son ölçümler `sing:true`, base 0.58 | 0.58… | pa, zgb, dikkat_son, ba, jsse_son, dn, mk, gercekcilik |
| 13 | son | Son sorular: is_teklifi, konustu, suphe | 0.92 | |
| 14 | bilgi | Bilgilendirme (+ şirket e-postalarının araştırma ekibince hazırlandığı) | 1 | |

E-posta içerikleri `src/protocol/emails.ts` dosyasına harfiyen aktarılmıştır. Ret e-postası: konu "{Pozisyon} başvurunuz hakkında ({başvuru no})", gövde ret metni (imza ayrı), altında ilan durumu kutusu. Onay e-postası: "Başvurunuz alındı – {Pozisyon} ({no})", gövde "…Başvurunuza en geç **7 Aralık 2026 saat 12:00'ye** kadar dönüş yapılacaktır…", altbilgi "Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız." Araştırma e-postası: konu "Araştırmanın ikinci bölümü: bağlantınız hazır".

## 7. Demoda olup gerçek uygulamada karar gerektiren noktalar

| # | Konu | Demodaki durum | Panoya'daki uygulama |
|---|---|---|---|
| D1 | Ç2'de zamanı ilerletme ("E-posta kutusuna bak", "14 gün ileri sar", "Saat 14:00'e ilerle") | Yalnızca ekibe görünen demo şeridindeki düğmeler | Simülasyon modunda katılımcıya nötr bir "Simülasyon" denetimi olarak gösterilir; metinler koşuldan bağımsız. Gerçek e-posta modunda gerçek zamana bağlanmalı (bkz. açık sorular). |
| D2 | Zaman atlaması ekranındaki açıklama ("Araştırma adresine gelen sorulara…") | Ekip notu niteliğinde | Yalnızca test modunda not olarak gösterilir. |
| D3 | Ç2 tarihleri | 24 Kas / 7 Ara 2026 sabit | Referans tarihler korunur (yönetici ayarından değiştirilebilir değil, protokol sabiti). |
| D4 | Ç2 zaman çizelgesi şeridi | Demo şeridinin parçası | Yalnızca test modunda gösterilir. |
| D5 | Koşul atama | `Math.random` | Bloklu rastgele atama (blok = 3; Modül B için günlük bloklar), test kayıtları gerçek sırayı tüketmez. |
| D6 | Koşulun istemcide görünmesi | Global `DEMO.cond` | Koşul sunucuda tutulur; şirket yanıtı içeriği yalnızca gösterileceği anda sunucudan istenir; koşul adı bilgilendirmeye kadar istemciye gönderilmez. |
| D7 | Ç1 tur sırası | Sayfa yüklemede `shuffle` | Katılımcı oluşturulurken sunucuda karıştırılıp kaydedilir (tekrar girişte aynı sıra). |
| D8 | Ad / e-posta | Örnek değerlerle dolu | Gerçek katılımcıda boş; ayrı tabloda saklanır, dışa aktarıma girmez. Test modunda örnek değerler. |
| D9 | Platform gezinme bağlantıları | Görsel, işlevsiz | Deney akışında işlevsiz (akış dışına çıkılmasın diye); vitrin sayfalarında çalışır. |

## 8. Raporlanan eksik / belirsiz ölçümler (değiştirilmedi)

1. **Devam niyeti ölçeği seçilmemiş.** Referansta "ölçek henüz seçilmedi; aşağıdakiler yalnızca örnek maddedir" notu var. 3 örnek madde harfiyen korundu; nihai ölçek belirlenince `src/protocol/scales.ts` güncellenmeli.
2. **Taslak uyarlamalar.** Prosedürel ve bilgisel adalet maddeleri "Taslak uyarlama", zamanında geri bildirim ve gerçekçilik maddeleri "Taslak çeviri" olarak işaretli. Metinler değiştirilmedi; etiketler test modunda görünür.
3. **Bilgisel adalet maddelerinde özne eksik.** "Sizinle olan diyaloglarında samimi midir?" gibi maddeler öznesizdir (Colquitt formunda özne "yetkili kişi"). Yönergedeki "…yürüten kişileri düşünerek" ifadesi özneyi sağlıyor; danışman onayı gerekir.
4. **Yaş aralığı doğrulanmıyor.** 18–30 yalnızca HTML özniteliği. Panoya değeri olduğu gibi kaydeder ve araştırmacı panelinde "dahil etme ölçütü dışı" bayrağı gösterir; katılımcıyı engellemez.
5. **Bilgilendirme iletişim adresi yer tutucu**: "[araştırma e-posta adresi]". Harfiyen korundu; yayından önce doldurulmalı.
6. **Ters puanlama formülü `6 − v`** yalnızca 5'li ölçek için geçerli. Şu an yalnızca `dn_2` (5'li) ters; devam niyeti ölçeği değişirse formül de güncellenmeli.
7. **Ç2 araştırma e-postası açma/tıklama kaydı** demoda yok; Panoya `mail_open` ve `link_click` olaylarını kaydeder (yeni veri, protokolü değiştirmez).
8. **Ç1'de iş teklifi / konuştu soruları yok**, yalnızca Ç2'de var. Bu fark korunmuştur.
9. **Davranış görevindeki 90 sn** için not: "gerçek süre danışmanla". Varsayılan 90 sn korundu, `src/protocol/timing.ts` içinde tek yerde tanımlı.
10. **Şirket adı benzerliği**: referans notu "adların gerçek şirketlerle karışmadığı ekipçe ayrıca kontrol edilecek" der; kontrol ekipte.
11. **Vitrin ilanları (deney dışı).** İstekte geçen "Yayın Editörü", "Çeviri Editörü", "İçerik Uzmanı" pozisyonları referans dosyalarda yok. Yalnızca herkese açık `/ilanlar` sayfalarında görünen, deney akışında hiç kullanılmayan dört kurgusal vitrin ilanı eklendi (`src/platform/showcase.ts`). Şirket adları için referanstaki ad kontrolü bunlara da uygulanmalı.
12. **Modül B simülasyon denetimi metinleri.** Referansta yalnızca demo şeridinde olan "E-posta kutusuna bak", "14 gün ileri sar", "Saat 14:00'e ilerle" düğmeleri, katılımcıya nötr bir "Simülasyon" çubuğunda gösterilir; yanlarındaki tek cümlelik açıklama ("Bu sürümde zaman uygulama içinde ilerletilir.") yeni metindir ve üç koşulda aynıdır. Gerçek e-posta modunda bu çubuk kalkmalıdır.
13. **Deney başlangıç ekranı.** Referansta katılımcıya dönük bir karşılama ekranı yoktu (kurulum ekranı ekip içindi). Panoya'da çalışma adını, katılımcı kodunu ve "Çalışmayı başlat / Devam et" düğmesini gösteren kısa bir ekran eklendi; ölçüm içermez.
