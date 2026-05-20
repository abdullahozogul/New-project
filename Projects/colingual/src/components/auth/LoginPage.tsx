import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Clock, Languages, Loader2 } from 'lucide-react'
import { sendPasswordReset, signInWithEmail, signUpWithEmail } from '../../lib/auth'
import { handleExternalLinkClick } from '../../lib/openExternalLink'
import './LoginPage.css'

type AuthMode = 'login' | 'signup' | 'forgot'

type LoginPageProps = {
  supabaseConfigured: boolean
  onGoogleSignIn: () => void | Promise<void>
  onContinueAsGuest: () => void
}

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as const },
})

export function LoginPage({
  supabaseConfigured,
  onGoogleSignIn,
  onContinueAsGuest,
}: LoginPageProps) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const title =
    mode === 'login' ? 'Giriş' : mode === 'signup' ? 'Kayıt ol' : 'Şifre sıfırla'

  const submitLabel =
    mode === 'login' ? 'Giriş yap' : mode === 'signup' ? 'Hesap oluştur' : 'Bağlantı gönder'

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setMessage(null)

    if (!supabaseConfigured) {
      setError('Hesap için Supabase anahtarlarını .env.local dosyasına ekleyin.')
      return
    }

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('E-posta gerekli.')
      return
    }

    if (mode !== 'forgot' && password.length < 6) {
      setError('Şifre en az 6 karakter olmalı.')
      return
    }

    setBusy(true)
    try {
      if (mode === 'forgot') {
        const result = await sendPasswordReset(trimmedEmail)
        if (!result.ok) {
          setError(result.message)
          return
        }
        setMessage('Şifre sıfırlama bağlantısı e-postanıza gönderildi.')
        return
      }

      if (mode === 'signup') {
        const result = await signUpWithEmail(trimmedEmail, password)
        if (!result.ok) {
          setError(result.message)
          return
        }
        setMessage('Kayıt başarılı. Gerekirse e-postanızdaki onay bağlantısına tıklayın.')
        setMode('login')
        return
      }

      const result = await signInWithEmail(trimmedEmail, password)
      if (!result.ok) {
        setError(result.message)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.div
      className="login-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <div className="login-page__scroll">
        <header className="login-hero" aria-hidden={false}>
          <div className="login-hero__bg" />
          <motion.div
            className="login-hero__glow login-hero__glow--1"
            {...fadeUp(0.15)}
            aria-hidden="true"
          />
          <motion.div
            className="login-hero__glow login-hero__glow--2"
            {...fadeUp(0.35)}
            aria-hidden="true"
          />
          <motion.div className="login-hero__clock" {...fadeUp(0.45)} aria-hidden="true">
            <Clock size={72} strokeWidth={1.25} />
          </motion.div>
          <motion.div className="login-hero__brand" {...fadeUp(0.55)}>
            <Languages size={28} aria-hidden="true" />
            <span>Colingual</span>
          </motion.div>
          <motion.h1 className="login-hero__title" {...fadeUp(0.65)}>
            {title}
          </motion.h1>
        </header>

        <section className="login-body" aria-labelledby="login-form-title">
          <motion.form
            className="login-card"
            onSubmit={(event) => void handleSubmit(event)}
            {...fadeUp(0.75)}
          >
            <h2 id="login-form-title" className="visually-hidden">
              {title}
            </h2>

            <label className="login-field">
              <span className="visually-hidden">E-posta</span>
              <input
                type="email"
                autoComplete="email"
                placeholder="E-posta veya telefon"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={busy}
                required
              />
            </label>

            {mode !== 'forgot' ? (
              <label className="login-field login-field--password">
                <span className="visually-hidden">Şifre</span>
                <input
                  type="password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  placeholder="Şifre"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={busy}
                  required
                  minLength={6}
                />
              </label>
            ) : null}

            {error ? (
              <p className="login-feedback login-feedback--error" role="alert">
                {error}
              </p>
            ) : null}
            {message ? (
              <p className="login-feedback login-feedback--ok" role="status">
                {message}
              </p>
            ) : null}

            <button type="submit" className="login-submit" disabled={busy}>
              {busy ? <Loader2 size={20} className="login-spin" aria-hidden="true" /> : submitLabel}
            </button>
          </motion.form>

          <motion.div className="login-extra" {...fadeUp(0.9)}>
            {mode === 'login' ? (
              <button
                type="button"
                className="login-link"
                onClick={() => {
                  setMode('forgot')
                  setError(null)
                  setMessage(null)
                }}
              >
                Şifremi unuttum?
              </button>
            ) : (
              <button
                type="button"
                className="login-link"
                onClick={() => {
                  setMode('login')
                  setError(null)
                  setMessage(null)
                }}
              >
                Girişe dön
              </button>
            )}

            <p className="login-switch">
              {mode === 'signup' ? 'Zaten hesabın var mı?' : 'Hesabın yok mu?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'signup' ? 'login' : 'signup')
                  setError(null)
                  setMessage(null)
                }}
              >
                {mode === 'signup' ? 'Giriş yap' : 'Kayıt ol'}
              </button>
            </p>

            <motion.div className="login-divider" {...fadeUp(1)}>
              <span>veya</span>
            </motion.div>

            <motion.button
              type="button"
              className="login-google"
              disabled={!supabaseConfigured || busy}
              onClick={() => void onGoogleSignIn()}
              {...fadeUp(1.05)}
            >
              Google ile devam et
            </motion.button>

            <motion.button
              type="button"
              className="login-guest"
              onClick={onContinueAsGuest}
              {...fadeUp(1.1)}
            >
              Misafir olarak devam et
            </motion.button>

            {!supabaseConfigured ? (
              <p className="login-hint">
                Demo modu: Supabase olmadan misafir olarak içeriğe girebilirsiniz.
              </p>
            ) : null}
          </motion.div>

          <motion.p className="login-credit" {...fadeUp(1.15)}>
            Arayüz:{' '}
            <a
              href="https://github.com/afgprogrammer/Flutter-Login-Page-UI"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) =>
                handleExternalLinkClick(
                  event,
                  'https://github.com/afgprogrammer/Flutter-Login-Page-UI',
                )
              }
            >
              Flutter Login Page UI
            </a>{' '}
            (Apache-2.0) — React uyarlaması
          </motion.p>
        </section>
      </div>
    </motion.div>
  )
}
