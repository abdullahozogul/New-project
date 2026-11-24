# Panoya – Akademik işe alım deneyi platformu

Gerçek bir iş ilanı sitesi görünümünde, iki deney modülünü (laboratuvar ve e-posta takipli çevrimiçi deney) ve üç deneysel koşulu (zamanında ret, sahte ilan, ghosting) uygulayan araştırma platformu. Bilimsel içerik, "Çalışma 1 Laboratuvar Demosu" ve "Çalışma 2 E-posta Demosu" referans dosyalarından harfiyen aktarılmıştır.

- `docs/01-teknik-dokum.md` – referans dosyaların eksiksiz teknik dökümü ve raporlanan açık konular
- `docs/02-mimari.md` – mimari, bilimsel bütünlük önlemleri, geliştirme aşamaları

## Teknolojiler

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · PostgreSQL (Supabase uyumlu) · Zod · ExcelJS · Vitest · Playwright

## Kurulum

```bash
cp .env.example .env.local      # DATABASE_URL, ADMIN_PASSWORD, SESSION_SECRET
npm install
DATABASE_URL=... npm run db:migrate
npm run build && npm start      # http://localhost:3000
```

Supabase için `DATABASE_URL` olarak projenin bağlantı adresini (Settings → Database) kullanın; göçler aynı komutla uygulanır.

## Kullanım

| Adres | Kim için |
|---|---|
| `/` , `/ilanlar` | Panoya vitrin sitesi |
| `/katilim` | Katılımcı: davet koduyla giriş |
| `/katilim/PNY-XXXX-XXXX` | Katılımcıya verilen doğrudan bağlantı |
| `/arastirmaci` | Araştırmacı paneli (parola: `ADMIN_PASSWORD`) |

Araştırmacı paneli → **Katılımcı kaydı**: modül, koşul (bloklu rastgele ya da elle), kayıt türü (gerçek / test) seçilip kod üretilir. Test kayıtlarında süreler kısaltılabilir ve sarı tasarım notları gösterilebilir; gerçek katılımcılarda süreler daima protokoldeki gibidir.

**Dışa aktar**: geniş tablo (katılımcı başına satır, maddeler + puanlar + türetilmiş değişkenler), uzun tablo (adım başına satır, jsPsych biçimine karşılık), olaylar ve değişken sözlüğü; CSV ya da çok sayfalı Excel.

## Testler

```bash
npm test                         # birim testleri
npm start &                      # sunucu çalışırken
ADMIN_PASSWORD=... npm run e2e   # uçtan uca: 2 modül × 3 koşul, bütünlük, devam etme, gerçek süreler, mobil
```

Uçtan uca testler test kayıtları ve "e2e" etiketli gerçek kayıtlar oluşturur; üretim veritabanında çalıştırmayın.

## Protokolü değiştirme

Sorular, ilanlar, e-postalar, süreler ve koşul davranışı yalnızca `src/protocol/` altındadır. Bu dosyalardaki her değişiklik araştırma protokolü değişikliğidir; danışman onayı olmadan yapılmamalıdır.
