import { useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import {
  BookOpen,
  Brain,
  Check,
  ChevronRight,
  CirclePlay,
  Clock3,
  Headphones,
  Languages,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageSquareText,
  Mic,
  Plus,
  Search,
  Send,
  Sparkles,
  Star,
  Trophy,
  UserRound,
  Video,
} from 'lucide-react'
import './App.css'
import { fetchDictionaryEntry, supportsDictionaryLanguage, type DictionaryEntry } from './lib/dictionary'
import {
  articles,
  languages,
  learningGoals,
  levels,
  practiceModules,
  progressMetrics,
  type Article,
  type Level,
  type VocabularyItem,
} from './data'
import { supabase, supabaseConfigured } from './lib/supabase'
import { generateCoachReply, isGeminiAiConfigured, offlineCoachFallback, resolveGeminiModel, type CoachTurn } from './lib/gemini'

function App() {
  const [nativeLanguage, setNativeLanguage] = useState('tr')
  const [targetLanguage, setTargetLanguage] = useState('en')
  const [level, setLevel] = useState<Level>('B1')
  const [goal, setGoal] = useState(learningGoals[0])
  const [signupEmail, setSignupEmail] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [selectedArticleId, setSelectedArticleId] = useState('food-waste-b1')
  const [selectedLexeme, setSelectedLexeme] = useState<string | null>(null)
  const [dictionaryCache, setDictionaryCache] = useState<Record<string, DictionaryEntry>>({})
  const [dictionaryStatus, setDictionaryStatus] = useState<
    | { state: 'idle' }
    | { state: 'loading'; key: string }
    | { state: 'error'; key: string; reason: 'not_found' | 'unsupported_language' | 'network' }
  >({ state: 'idle' })
  const [savedWords, setSavedWords] = useState<VocabularyItem[]>([
    articles[2].vocabulary[0],
    articles[2].vocabulary[1],
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatSending, setChatSending] = useState(false)
  const [chatMessages, setChatMessages] = useState<CoachTurn[]>([
    {
      role: 'coach',
      text: 'Tell me what you read today in two sentences. I will correct tone, grammar, and word choice.',
    },
    {
      role: 'learner',
      text: 'The restaurants give food to students because they have too much meals.',
    },
    {
      role: 'coach',
      text: 'Good idea. More natural: "The restaurants give food to students because they have too many meals left over."',
    },
  ])

  const matchingArticles = useMemo(() => {
    const exact = articles.filter((article) => article.level === level)
    return exact.length > 0 ? exact : articles
  }, [level])

  const selectedArticle =
    articles.find((article) => article.id === selectedArticleId) ?? matchingArticles[0]

  const targetLanguageOption = languages.find((language) => language.code === targetLanguage)

  const nativeLanguageOption = languages.find((language) => language.code === nativeLanguage)

  const vocabularyLookup = useMemo(() => {
    const entries = new Map<string, VocabularyItem>()
    for (const word of selectedArticle.vocabulary) {
      entries.set(word.term.toLowerCase(), word)
    }
    return entries
  }, [selectedArticle.vocabulary])

  const selectedLexemeEntry = useMemo(() => {
    if (!selectedLexeme) {
      return null
    }
    return vocabularyLookup.get(selectedLexeme.toLowerCase()) ?? null
  }, [selectedLexeme, vocabularyLookup])

  const dictionaryKey = useMemo(() => {
    if (!selectedLexeme) {
      return null
    }
    return `${targetLanguage}:${selectedLexeme.toLowerCase()}`
  }, [selectedLexeme, targetLanguage])

  const apiDictionaryEntry = useMemo(() => {
    if (!dictionaryKey) {
      return null
    }
    return dictionaryCache[dictionaryKey] ?? null
  }, [dictionaryCache, dictionaryKey])

  const savedTerms = useMemo(
    () => new Set(savedWords.map((word) => word.term.toLowerCase())),
    [savedWords],
  )

  useEffect(() => {
    if (!supabase) {
      setUser(null)
      return
    }

    let cancelled = false

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (cancelled) {
          return
        }
        setUser(data.session?.user ?? null)
      })
      .catch(() => {
        if (cancelled) {
          return
        }
        setUser(null)
      })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      cancelled = true
      subscription.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    if (!selectedLexeme) {
      setDictionaryStatus({ state: 'idle' })
      return () => {
        cancelled = true
      }
    }

    if (selectedLexemeEntry) {
      setDictionaryStatus({ state: 'idle' })
      return () => {
        cancelled = true
      }
    }

    if (!dictionaryKey) {
      return () => {
        cancelled = true
      }
    }

    if (dictionaryCache[dictionaryKey]) {
      setDictionaryStatus({ state: 'idle' })
      return () => {
        cancelled = true
      }
    }

    if (!supportsDictionaryLanguage(targetLanguage)) {
      setDictionaryStatus({
        state: 'error',
        key: dictionaryKey,
        reason: 'unsupported_language',
      })
      return () => {
        cancelled = true
      }
    }

    setDictionaryStatus({ state: 'loading', key: dictionaryKey })
    fetchDictionaryEntry(targetLanguage, selectedLexeme)
      .then((entry) => {
        if (cancelled) {
          return
        }
        setDictionaryCache((current) => ({ ...current, [dictionaryKey]: entry }))
        setDictionaryStatus({ state: 'idle' })
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return
        }
        const message = error instanceof Error ? error.message : ''
        const reason =
          message === 'unsupported_language'
            ? 'unsupported_language'
            : message === 'not_found'
              ? 'not_found'
              : 'network'
        setDictionaryStatus({ state: 'error', key: dictionaryKey, reason })
      })

    return () => {
      cancelled = true
    }
  }, [dictionaryCache, dictionaryKey, selectedLexeme, selectedLexemeEntry, targetLanguage])

  const toggleWord = (word: VocabularyItem) => {
    const termKey = word.term.toLowerCase()

    setSavedWords((current) => {
      const alreadySaved = current.some((item) => item.term.toLowerCase() === termKey)
      if (alreadySaved) {
        return current.filter((item) => item.term.toLowerCase() !== termKey)
      }

      return [word, ...current]
    })
  }

  const speakArticle = (article: Article) => {
    if (!('speechSynthesis' in window)) {
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(
      [article.title, ...article.paragraphs].join('. '),
    )
    utterance.lang = targetLanguageOption?.locale ?? 'en-US'
    utterance.rate = article.level === 'A1' || article.level === 'A2' ? 0.82 : 0.96
    window.speechSynthesis.speak(utterance)
  }

  const renderClickableParagraph = (paragraph: string) => {
    const tokens = paragraph.match(/[A-Za-zÀ-ÖØ-öø-ÿ]+(?:'[A-Za-zÀ-ÖØ-öø-ÿ]+)?|[^A-Za-zÀ-ÖØ-öø-ÿ]+/g) ?? [
      paragraph,
    ]

    return (
      <p key={paragraph}>
        {tokens.map((token, index) => {
          const isWord = /^[A-Za-zÀ-ÖØ-öø-ÿ]/.test(token)
          if (!isWord) {
            return <span key={`${token}-${index}`}>{token}</span>
          }

          const lexeme = token.replace(/^[^A-Za-zÀ-ÖØ-öø-ÿ]+|[^A-Za-zÀ-ÖØ-öø-ÿ]+$/g, '')
          if (!lexeme) {
            return <span key={`${token}-${index}`}>{token}</span>
          }

          return (
            <button
              key={`${token}-${index}`}
              type="button"
              className="inline-word"
              onClick={() => setSelectedLexeme(lexeme)}
              aria-label={`Dictionary for ${lexeme}`}
            >
              {token}
            </button>
          )
        })}
      </p>
    )
  }

  const sendChatMessage = async () => {
    const trimmed = chatInput.trim()
    if (!trimmed || chatSending) {
      return
    }

    const userTurn = { role: 'learner' as const, text: trimmed }
    const transcript = [...chatMessages, userTurn]
    setChatMessages(transcript)
    setChatInput('')

    if (!isGeminiAiConfigured()) {
      setChatMessages([...transcript, { role: 'coach', text: offlineCoachFallback(trimmed) }])
      return
    }

    setChatSending(true)
    try {
      const reply = await generateCoachReply(transcript, {
        nativeLanguageLabel: nativeLanguageOption?.label ?? nativeLanguage,
        targetLanguageLabel: targetLanguageOption?.label ?? targetLanguage,
        level,
        goal,
        articleTitle: selectedArticle.title,
      })
      setChatMessages((current) => [...current, { role: 'coach', text: reply }])
    } catch {
      setChatMessages((current) => [
        ...current,
        { role: 'coach', text: offlineCoachFallback(trimmed) },
      ])
    } finally {
      setChatSending(false)
    }
  }

  const signInWithGoogle = async () => {
    if (!supabase) {
      return
    }

    const redirectTo = window.location.origin
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    })

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Google sign-in failed', error)
    }
  }

  const signOutUser = async () => {
    if (!supabase) {
      return
    }

    const { error } = await supabase.auth.signOut()

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Sign out failed', error)
    }
  }

  const userEmail = user?.email ?? ''
  const userDisplayName =
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    (userEmail ? userEmail.split('@')[0] : 'User')

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary">
        <div className="brand">
          <div className="brand-mark">
            <Languages size={24} aria-hidden="true" />
          </div>
          <div>
            <strong>Colingual</strong>
            <span>Language studio</span>
          </div>
        </div>

        <nav className="nav-list">
          {[
            { label: 'Dashboard', icon: LayoutDashboard },
            { label: 'Reading', icon: BookOpen },
            { label: 'Vocabulary', icon: Brain },
            { label: 'Chat', icon: MessageSquareText },
            { label: 'Progress', icon: Trophy },
          ].map((item) => (
            <a key={item.label} href={`#${item.label.toLowerCase()}`}>
              <item.icon size={18} aria-hidden="true" />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="sync-card">
          <span className={supabaseConfigured ? 'status-dot online' : 'status-dot'} />
          <div>
            <strong>{supabaseConfigured ? 'Supabase connected' : 'Offline seed mode'}</strong>
            <span>{supabaseConfigured ? 'Live data ready' : 'Add env values later'}</span>
          </div>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar" id="dashboard">
          <div>
            <p className="eyebrow">Daily plan</p>
            <h1>Today&apos;s learning desk</h1>
          </div>

          <div className="topbar-actions">
            {user ? (
              <div className="signup-mini account-bar" aria-label="Account">
                <div className="account-profile" aria-labelledby="account-profile-heading">
                  <span id="account-profile-heading" className="account-profile-label">
                    Profil
                  </span>
                  <div className="account-profile-body">
                    <UserRound size={18} aria-hidden="true" />
                    <div className="account-profile-text">
                      <strong>{userDisplayName}</strong>
                      <span>{userEmail}</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="provider-button subtle sign-out-button"
                  onClick={() => {
                    void signOutUser()
                  }}
                >
                  <LogOut size={16} aria-hidden="true" />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="signup-mini signup-auth-bar" aria-label="Sign up">
                <div className="signup-providers" aria-label="Providers">
                  <button
                    type="button"
                    className="provider-button provider-google"
                    onClick={() => {
                      void signInWithGoogle()
                    }}
                    disabled={!supabaseConfigured}
                    aria-label="Google ile giriş yap"
                  >
                    Google
                  </button>
                </div>

                <form
                  className="signup-email"
                  aria-label="Email sign up"
                  onSubmit={(event) => {
                    event.preventDefault()
                    setSignupEmail('')
                  }}
                >
                  <input
                    value={signupEmail}
                    onChange={(event) => setSignupEmail(event.target.value)}
                    placeholder="E-posta ile kayıt ol"
                    inputMode="email"
                    autoComplete="email"
                  />
                  <button type="submit">Kayıt Ol</button>
                </form>
              </div>
            )}

            <div className="profile-chip">
              <UserRound size={18} aria-hidden="true" />
              <span>{level}</span>
              <strong>{targetLanguageOption?.label}</strong>
            </div>
          </div>
        </header>

        <section className="setup-strip" aria-label="Learning setup">
          <label>
            <span>Native</span>
            <select
              value={nativeLanguage}
              onChange={(event) => setNativeLanguage(event.target.value)}
            >
              {languages.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Target</span>
            <select
              value={targetLanguage}
              onChange={(event) => setTargetLanguage(event.target.value)}
            >
              {languages.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.label}
                </option>
              ))}
            </select>
          </label>

          <div className="level-control" aria-label="Level">
            {levels.map((candidate) => (
              <button
                key={candidate}
                type="button"
                className={candidate === level ? 'active' : ''}
                onClick={() => {
                  setLevel(candidate)
                  const article = articles.find((item) => item.level === candidate)
                  if (article) {
                    setSelectedArticleId(article.id)
                  }
                }}
              >
                {candidate}
              </button>
            ))}
          </div>

          <label>
            <span>Goal</span>
            <select value={goal} onChange={(event) => setGoal(event.target.value)}>
              {learningGoals.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="metric-grid" aria-label="Progress summary">
          {progressMetrics.map((metric) => (
            <article className="metric-card" key={metric.label}>
              <metric.icon size={20} aria-hidden="true" />
              <div>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <small>{metric.change}</small>
              </div>
            </article>
          ))}
        </section>

        <div className="content-grid">
          <section className="panel article-list" aria-labelledby="article-list-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Reading queue</p>
                <h2 id="article-list-title">Level {level} news</h2>
              </div>
              <button className="icon-button" type="button" aria-label="Search articles">
                <Search size={18} />
              </button>
            </div>

            <div className="article-stack">
              {articles.map((article) => (
                <button
                  type="button"
                  key={article.id}
                  className={article.id === selectedArticle.id ? 'article-row active' : 'article-row'}
                  onClick={() => setSelectedArticleId(article.id)}
                >
                  <span className={`article-thumb ${article.imageTone}`}>
                    <BookOpen size={22} aria-hidden="true" />
                  </span>
                  <span>
                    <small>
                      {article.level} / {article.category}
                    </small>
                    <strong>{article.title}</strong>
                    <em>{article.minutes} min read</em>
                  </span>
                  <ChevronRight size={17} aria-hidden="true" />
                </button>
              ))}
            </div>
          </section>

          <section className="panel reading-panel" id="reading" aria-labelledby="reading-title">
            <div className="reading-visual">
              <div className={`visual-band ${selectedArticle.imageTone}`}>
                <div className="visual-lines">
                  <span />
                  <span />
                  <span />
                </div>
                <CirclePlay size={42} aria-hidden="true" />
              </div>
              <div className="media-actions">
                <button type="button" onClick={() => speakArticle(selectedArticle)}>
                  <Headphones size={17} aria-hidden="true" />
                  Listen
                </button>
                <button type="button">
                  <Video size={17} aria-hidden="true" />
                  Watch
                </button>
              </div>
            </div>

            <article>
              <div className="article-meta">
                <span>{selectedArticle.level}</span>
                <span>{selectedArticle.category}</span>
                <span>
                  <Clock3 size={14} aria-hidden="true" />
                  {selectedArticle.minutes} min
                </span>
              </div>
              <h2 id="reading-title">{selectedArticle.title}</h2>
              <p className="deck">{selectedArticle.deck}</p>
              <div className="story-copy">
                {selectedArticle.paragraphs.map((paragraph) => renderClickableParagraph(paragraph))}
              </div>
            </article>

            <aside className="lex-panel" aria-label="Dictionary">
              <header className="lex-header">
                <strong>Word details</strong>
                <button type="button" className="lex-clear" onClick={() => setSelectedLexeme(null)}>
                  Clear
                </button>
              </header>

              {selectedLexeme ? (
                selectedLexemeEntry ? (
                  <div className="lex-body">
                    <div className="lex-title">
                      <strong>{selectedLexemeEntry.term}</strong>
                      <span className="lex-phonetic">/{selectedLexemeEntry.pronunciation}/</span>
                    </div>
                    <p className="lex-meaning">{selectedLexemeEntry.meaning}</p>
                    <div className="lex-examples">
                      <span className="lex-label">Example</span>
                      <p>{selectedLexemeEntry.example}</p>
                    </div>
                  </div>
                ) : apiDictionaryEntry ? (
                  <div className="lex-body">
                    <div className="lex-title">
                      <strong>{apiDictionaryEntry.word}</strong>
                      <span className="lex-phonetic">
                        {apiDictionaryEntry.phonetic ? `/${apiDictionaryEntry.phonetic}/` : '—'}
                      </span>
                    </div>
                    {apiDictionaryEntry.senses.slice(0, 2).map((sense, index) => (
                      <div className="lex-sense" key={`${sense.partOfSpeech ?? 'sense'}-${index}`}>
                        <div className="lex-sense-head">
                          <span className="lex-pos">{sense.partOfSpeech ?? 'meaning'}</span>
                        </div>
                        <ul className="lex-defs">
                          {sense.definitions.slice(0, 3).map((definition) => (
                            <li key={definition}>{definition}</li>
                          ))}
                        </ul>
                        {sense.examples.length > 0 && (
                          <div className="lex-examples">
                            <span className="lex-label">Examples</span>
                            <div className="lex-example-list">
                              {sense.examples.map((example) => (
                                <p key={example.text}>{example.text}</p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : dictionaryStatus.state === 'loading' && dictionaryKey && dictionaryStatus.key === dictionaryKey ? (
                  <div className="lex-body empty">
                    <p>Looking up “{selectedLexeme}”…</p>
                  </div>
                ) : dictionaryStatus.state === 'error' && dictionaryKey && dictionaryStatus.key === dictionaryKey ? (
                  <div className="lex-body empty">
                    {dictionaryStatus.reason === 'unsupported_language' ? (
                      <p>
                        External dictionary lookup is currently enabled for English only. Switch
                        target language to English or connect a multi-language provider.
                      </p>
                    ) : dictionaryStatus.reason === 'not_found' ? (
                      <p>No dictionary entry found for “{selectedLexeme}”.</p>
                    ) : (
                      <p>Dictionary lookup failed. Please try again.</p>
                    )}
                  </div>
                ) : (
                  <div className="lex-body">
                    <div className="lex-title">
                      <strong>{selectedLexeme}</strong>
                      <span className="lex-phonetic">—</span>
                    </div>
                    <p className="lex-meaning">No data yet.</p>
                  </div>
                )
              ) : (
                <div className="lex-body empty">
                  <p>Click any word in the text to see pronunciation, meaning, and an example.</p>
                </div>
              )}
            </aside>

            <div className="vocab-strip">
              {selectedArticle.vocabulary.map((word) => (
                <button
                  type="button"
                  key={word.term}
                  className={savedTerms.has(word.term.toLowerCase()) ? 'word-chip saved' : 'word-chip'}
                  onClick={() => toggleWord(word)}
                >
                  {savedTerms.has(word.term.toLowerCase()) ? (
                    <Check size={15} aria-hidden="true" />
                  ) : (
                    <Plus size={15} aria-hidden="true" />
                  )}
                  {word.term}
                </button>
              ))}
            </div>
          </section>

          <section className="panel vocab-panel" id="vocabulary" aria-labelledby="vocab-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Spaced review</p>
                <h2 id="vocab-title">Vocabulary cards</h2>
              </div>
              <span className="count-pill">{savedWords.length} saved</span>
            </div>

            <div className="card-list">
              {savedWords.map((word, index) => (
                <article className="word-card" key={`${word.term}-${index}`}>
                  <div>
                    <strong>{word.term}</strong>
                    <span>{word.pronunciation}</span>
                  </div>
                  <p>{word.meaning}</p>
                  <small>{word.example}</small>
                </article>
              ))}
            </div>
          </section>

          <section className="panel chat-panel" id="chat" aria-labelledby="chat-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Practice room</p>
                <h2 id="chat-title">Chat coach</h2>
              </div>
              <span className="count-pill">
                {isGeminiAiConfigured() ? `${resolveGeminiModel()} · AI` : 'Demo replies'}
              </span>
            </div>

            <div className="messages" aria-live="polite">
              {chatMessages.map((message, index) => (
                <div
                  className={message.role === 'coach' ? 'message coach' : 'message learner'}
                  key={`${message.role}-${index}`}
                >
                  {message.role === 'coach' && <Sparkles size={15} aria-hidden="true" />}
                  <p>{message.text}</p>
                </div>
              ))}
            </div>

            <form
              className="chat-form"
              onSubmit={(event) => {
                event.preventDefault()
                sendChatMessage()
              }}
            >
              <Mic size={18} aria-hidden="true" />
              <input
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="Write in your target language"
              />
              <button type="submit" aria-label="Send message" disabled={chatSending}>
                <Send size={18} />
              </button>
            </form>
          </section>

          <section className="panel progress-panel" id="progress" aria-labelledby="progress-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Weekly path</p>
                <h2 id="progress-title">Progress tracking</h2>
              </div>
              <Star size={19} aria-hidden="true" />
            </div>

            <div className="module-list">
              {practiceModules.map((module) => (
                <article className="module-row" key={module.label}>
                  <module.icon size={18} aria-hidden="true" />
                  <div>
                    <strong>{module.label}</strong>
                    <span>{module.detail}</span>
                    <div className="progress-track">
                      <span style={{ width: `${module.progress}%` }} />
                    </div>
                  </div>
                  <em>{module.progress}%</em>
                </article>
              ))}
            </div>
          </section>
        </div>

        <div className="marketing-grid" aria-label="Product details">
          <section className="panel marketing-panel" aria-labelledby="why-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Why Colingual</p>
                <h2 id="why-title">A calm workflow that keeps you showing up</h2>
              </div>
              <Brain size={18} aria-hidden="true" />
            </div>

            <div className="why-grid">
              {[
                {
                  icon: BookOpen,
                  title: 'Real reading, not random drills',
                  text: 'Level-matched articles with vocabulary you can save in one tap.',
                },
                {
                  icon: Headphones,
                  title: 'Listen + shadow to build rhythm',
                  text: 'Turn any article into a listening session and practice pronunciation.',
                },
                {
                  icon: MessageSquareText,
                  title: 'Guided chat that corrects gently',
                  text: 'Write freely; get corrected tone, grammar, and word choice.',
                },
              ].map((reason) => (
                <article className="why-card" key={reason.title}>
                  <span className="why-icon" aria-hidden="true">
                    <reason.icon size={18} />
                  </span>
                  <div>
                    <strong>{reason.title}</strong>
                    <p>{reason.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="panel marketing-panel" aria-labelledby="about-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Hakkında</p>
                <h2 id="about-title">Okuma + dinleme + sohbet, tek ritimde</h2>
              </div>
              <Languages size={18} aria-hidden="true" />
            </div>

            <div className="about-body">
              <p>
                Colingual; seviye uyumlu kısa okumalar, tek dokunuşla kelime kaydetme ve nazik
                düzeltmelerle sohbet pratiğini aynı akışta birleştirir.
              </p>
              <div className="about-pills" role="list" aria-label="Highlights">
                {['Seviye uyumlu içerik', 'Günlük akış', 'Nazik geri bildirim', 'Takip edilebilir ilerleme'].map(
                  (item) => (
                    <span key={item} role="listitem" className="about-pill">
                      {item}
                    </span>
                  ),
                )}
              </div>
            </div>
          </section>

          <section className="panel marketing-panel" aria-labelledby="contact-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">İletişim</p>
                <h2 id="contact-title">Görüşün bizim için değerli</h2>
              </div>
              <Mail size={18} aria-hidden="true" />
            </div>

            <form
              className="contact-form"
              onSubmit={(event) => {
                event.preventDefault()
              }}
            >
              <label>
                <span>Ad</span>
                <input placeholder="Adın" autoComplete="name" />
              </label>
              <label>
                <span>E-posta</span>
                <input placeholder="mail@ornek.com" type="email" autoComplete="email" />
              </label>
              <label className="contact-message">
                <span>Mesaj</span>
                <textarea placeholder="Ne geliştirelim?" rows={4} />
              </label>
              <div className="contact-actions">
                <button type="submit">
                  <Send size={16} aria-hidden="true" />
                  Gönder
                </button>
                <small>Şimdilik demo form; backend bağlanınca iletilecek.</small>
              </div>
            </form>
          </section>

          <section className="panel marketing-panel" aria-labelledby="pricing-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Simple pricing</p>
                <h2 id="pricing-title">Pick a plan that matches your pace</h2>
              </div>
              <Sparkles size={18} aria-hidden="true" />
            </div>

            <div className="pricing-grid">
              {[
                {
                  name: 'Starter',
                  price: '$0',
                  note: 'For consistent daily practice.',
                  highlights: ['Reading desk', 'Vocabulary saving', 'Basic chat corrections'],
                },
                {
                  name: 'Plus',
                  price: '$9',
                  note: 'For faster fluency loops.',
                  highlights: ['Unlimited coach turns', 'Listening mode', 'Progress insights'],
                  featured: true,
                },
                {
                  name: 'Studio',
                  price: '$19',
                  note: 'For power learners and creators.',
                  highlights: ['Multiple goals', 'Advanced feedback', 'Priority features'],
                },
              ].map((plan) => (
                <article
                  key={plan.name}
                  className={plan.featured ? 'price-card featured' : 'price-card'}
                >
                  <header>
                    <strong>{plan.name}</strong>
                    <div className="price-line">
                      <span className="price">{plan.price}</span>
                      <span className="price-suffix">/month</span>
                    </div>
                    <p>{plan.note}</p>
                  </header>

                  <ul>
                    {plan.highlights.map((item) => (
                      <li key={item}>
                        <Check size={16} aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default App
