# Vercel'de yayınlama

Proje Vercel'e hazırdır: derleme sırasında veritabanı göçleri otomatik uygulanır (`vercel-build`), sunucu bölgesi Frankfurt'tur (`fra1`), Vercel'in Neon/Postgres entegrasyonunun tanımladığı `DATABASE_URL` ya da `POSTGRES_URL` doğrudan kullanılır.

## Adımlar (bir kez, yaklaşık 5 dakika)

1. https://vercel.com/new → GitHub ile giriş → **abdullahozogul/New-project** deposunu **Import** edin.
2. **Root Directory**: `Projects/panoya` (Edit → klasörü seçin). Framework otomatik olarak Next.js algılanır.
3. **Environment Variables** bölümüne ekleyin:
   | Ad | Değer |
   |---|---|
   | `ADMIN_PASSWORD` | Araştırmacı paneli parolası (en az 12 karakter) |
   | `SESSION_SECRET` | En az 32 karakterlik rastgele dize (ör. `openssl rand -hex 32`) |
4. **Deploy**'a basın. İlk derleme veritabanı olmadığı için başarısız olabilir; sonraki adımdan sonra yeniden deneyin.
5. Proje sayfası → **Storage** → **Create Database** → **Neon (Serverless Postgres)** → bölge **Frankfurt (eu-central-1)** → projeye bağlayın. Bu, `DATABASE_URL`'yi tüm ortamlar için otomatik ekler.
   (Supabase kullanacaksanız: Supabase → Project Settings → Database → Connection string (Session pooler) değerini `DATABASE_URL` olarak ekleyin.)
6. **Deployments** → son yayın → **Redeploy**. Derleme günlüğünde `göçler güncel` satırı tabloların kurulduğunu gösterir.
7. Yayın adresinde `/arastirmaci` sayfasına `ADMIN_PASSWORD` ile girin, bir test kaydı oluşturup akışı deneyin.

Varsayılan dal dışındaki dallara her gönderim bir önizleme adresi, varsayılan dala (main) birleştirme ise canlı yayını günceller.

## Notlar

- **Önizleme ve canlı veri ayrımı:** Neon entegrasyonu önizleme yayınları için ayrı veritabanı dalı açabilir (Storage → ayarlar). Gerçek katılımcı verisini yalnızca canlı (Production) veritabanında toplayın.
- **Alan adı:** Settings → Domains. Katılımcı bağlantıları `https://ALAN-ADI/katilim/KOD` biçimindedir.
- **Uçtan uca testleri** canlı veritabanına karşı çalıştırmayın (test ve "e2e" etiketli gerçek kayıtlar oluşturur).
- **Giriş hatası "Sunucu ayarı eksik"** görürseniz 3. adımdaki değişkenleri kontrol edip yeniden yayınlayın.
