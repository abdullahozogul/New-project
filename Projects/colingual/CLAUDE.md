# Colingual — Mobil Geçiş Bağlamı

## Stack
- Vite + React 18 + TypeScript
- Zustand (persist middleware, localStorage)
- Supabase (Auth: Google OAuth + email, Database)
- AI: Gemini, OpenAI TTS, ElevenLabs
- IndexedDB (TTS cache, 7 gün TTL)
- Lemon Squeezy (ödeme)
- Hash-based routing (korunacak)

## Mobil Hedef
- Capacitor 6
- App ID: com.colingual.app
- App Name: Colingual
- Android 7.0+ (API 24+)
- iOS 14+

## Backend Stratejisi
- Supabase Edge Functions kullanılacak
- VITE_API_BASE_URL env'i: https://<project>.supabase.co/functions/v1
- Tüm /api/* çağrıları src/lib/apiClient.ts üzerinden geçer
- API anahtarları SADECE server-side (Edge Function secrets)

## Auth Stratejisi
- Web: window.location.origin redirect (mevcut)
- Mobil: com.colingual.app://auth/callback deep link
- @capacitor/app ile appUrlOpen listener
- Platform detection: Capacitor.isNativePlatform()

## Kurallar
1. Web tarafı asla bozulmayacak — her değişiklik hem web hem mobilde çalışmalı
2. Platform-specific kod için Capacitor.isNativePlatform() kullan
3. Yeni fetch çağrısı yazma — sadece apiClient kullan
4. External link'ler için src/lib/openExternalLink.ts kullan (oluşturulacak)
5. localStorage anahtarlarının prefix'i: colingual-* (mevcut convention)
6. Her PR/commit küçük ve odaklı olsun
7. Mevcut TypeScript tiplerini koru, any kullanma
8. Build hatası kalmayacak şekilde teslim et

## Yapılmayacaklar
- API anahtarlarını client'a gömme (mevcut VITE_*_API_KEY'leri kaldıracağız)
- Hash routing'i değiştirme
- Zustand store şemalarını breaking şekilde değiştirme (migration gerekirse versionla)
- Web Speech API / MediaRecorder'ı silmeden, native fallback eklenene kadar
