# Uygulama mimarisi ve geliştirme aşamaları

## 1. Katmanlar

```
src/protocol/      ARAŞTIRMA PROTOKOLÜ (bilimsel içerik, referanstan harfiyen)
  ads.ts           kurgusal şirketler ve ilanlar
  scales.ts        tüm sorular, seçenekler, uç etiketleri, değişken adları, madde sırası
  texts.ts         onam, platform geçişi, bilgilendirme, tasarım notları
  emails.ts        Modül B e-postaları, sıraları, tarihleri (yalnızca sunucuda çağrılır)
  conditions.ts    koşullar ve koşula göre şirket yanıtı
  timing.ts        süreler (deney / test)
  progress.ts      ilerleme çubuğu değerleri
src/experiment/    DENEY MOTORU
  steps.ts         iki modülün zaman çizelgesi + Zod doğrulama şemaları (istemci ve sunucu ortak)
  Runner.tsx       yürütücü: sıradaki adımı çizer, adım verisini sunucuya yazar, kaldığı yerden devam
  screens/         ekranlar: common (araştırma sayfası, davranış görevi, bilgilendirme), moduleA, moduleB
src/components/    platform (Panoya), research (anket), admin, site
src/server/        PostgreSQL erişimi, akış kuralları, atama, oturum, dışa aktarma
src/app/           Next.js sayfaları ve API uçları
db/migrations/     şema
tests/unit         puanlama, ölçek sırası, koşul içeriği, doğrulama
tests/e2e          2 modül × 3 koşul tam akış, bütünlük, devam etme, gerçek süreler, mobil
```

Protokol dosyaları yalnızca veri ve saf fonksiyon içerir; arayüz değişikliği protokole dokunmaz. Protokolde yapılacak bir değişiklik tek bir dosyada, sürüm kontrolünde görünür olur.

## 2. jsPsych modelinin korunması

Referans Çalışma 1, jsPsych'i yalnızca "sıralı ekranlar + ekran başına bir veri satırı" için kullanır; tüm görsel içerik özel bir eklentiyle çizilir. Panoya bu modeli React/TypeScript ile aynen uygular:

| jsPsych | Panoya |
|---|---|
| `timeline` dizisi | `stepsFor(modül, tur sırası)` |
| `data: { ekran: 'tur1_bekleme' }` | adım kimliği `tur1_bekleme` (aynı adlar) |
| `jsPsych.finishTrial(d)` | `done(d)` → `POST /api/p/{kod}/step` |
| `trial_index`, satır başına veri | `responses` tablosu (katılımcı + adım benzersiz) |
| `jsPsych.data.get().csv()` | Dışa aktar → "Uzun tablo" |

Tek fark: referanstaki tek `son_olcumler` ekranının beş sayfası, kaldığı yerden devam edebilmek için beş ayrı adıma (`son_pa`, `son_ba`, `son_jsse`, `son_dn`, `son_mk`) bölünmüştür. Sayfa sırası ve içerik aynıdır.

jsPsych kütüphanesi bu nedenle bağımlılık olarak eklenmedi: React'in çizdiği ekranlarla jsPsych'in DOM denetimi çakışır ve jsPsych'in hiçbir soru eklentisi referansta kullanılmıyordu.

## 3. Bilimsel bütünlük önlemleri

- **Koşul sunucuda.** Koşul adı istemciye yalnızca test kaydında ya da bilgilendirme adımında gönderilir. Şirket yanıtı (Modül A) ve gelen kutusu içeriği (Modül B) sunucudan, yalnızca ilgili adımda ve gösterileceği anda istenir.
- **Önceden üretilmiş bloklu atama.** `allocations` tablosu; blok = 3; katmanlar: modül × gerçek/test (Modül B'de ayrıca gün). Eşzamanlı kayıtlar danışma kilidiyle sıraya girer. Katılımcı yanıtları atamayı etkileyemez.
- **Sıra ve veri doğrulaması.** Sunucu yalnızca beklenen adımı kabul eder (atlama → 409), veriyi Zod şemasıyla denetler (eksik madde, aralık dışı değer, tanımsız seçenek ya da alan → 422). Aynı adımın yinelenen gönderimi çift kayıt oluşturmaz.
- **Eksik yanıt doldurulmaz.** Tüm maddeler zorunludur (referansla aynı); puanlar referans `mean()` ile hesaplanır ve yanıtlanan madde sayısı ayrıca raporlanır.
- **Süreler.** Gerçek katılımcıda süreler kısaltılamaz (veritabanı kısıtı: `is_test OR NOT fast_mode`). Bekleme turunda Devam düğmesi her koşulda aynı anda açılır.
- **Test / gerçek ayrımı.** `is_test` bayrağı; dışa aktarımda varsayılan kapsam yalnızca gerçek katılımcılar; test kayıtları ayrı atama katmanında; yalnızca test kayıtları sıfırlanabilir.
- **Kişisel veri.** Modül B ad ve e-postası `contacts` tablosunda tutulur, hiçbir dışa aktarıma girmez, panelden silinebilir. Katılımcı kodu kişisel bilgi içermez.
- **Kaldığı yerden devam.** Tamamlanan adımlar korunur; yarım kalan adım baştan gösterilir ve `resume` olayı kaydedilir.

## 4. Veri modeli

| Tablo | İçerik |
|---|---|
| `participants` | kod, modül, koşul, atama yöntemi, test bayrağı, tur sırası, seçilen ilan, adım no, durum, zaman damgaları |
| `responses` | adım başına bir satır (`data` jsonb), başlangıç/bitiş zamanı |
| `events` | `start`, `resume`, `step_view`, `company_response`, `mail_open`, `link_click`, `behavior_choice`, `page_hidden/visible` |
| `contacts` | ad, e-posta (yalnızca Modül B) |
| `allocations` | bloklu atama sırası |

## 5. Geliştirme aşamaları

1. **Analiz** – referans dosyaların teknik dökümü (`01-teknik-dokum.md`). ✔
2. **Protokol katmanı** – içeriğin harfiyen aktarılması, birim testleri. ✔
3. **Deney motoru ve sunucu** – adım şemaları, doğrulama, atama, API. ✔
4. **Katılımcı arayüzü** – Panoya platformu, araştırma ekranları, posta istemcisi, mobil uyum. ✔
5. **Araştırmacı paneli** – kayıt, izleme, ayrıntı, dışa aktarma, protokol görünümü. ✔
6. **Uçtan uca doğrulama** – 2 modül × 3 koşul, bütünlük, devam etme, gerçek süreler, mobil. ✔
7. **Yayın öncesi (ekipte)** – açık konuların kapatılması (teknik döküm §8), pilot, etik kurul metinleriyle karşılaştırma.
8. **İsteğe bağlı** – Modül B için gerçek e-posta gönderimi (zamanlanmış görevler + e-posta sağlayıcısı); şu an simülasyon modu.
