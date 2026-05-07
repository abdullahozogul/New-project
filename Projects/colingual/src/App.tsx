import { useMemo, useState } from 'react'
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
import { supabaseConfigured } from './lib/supabase'

function App() {
  const [nativeLanguage, setNativeLanguage] = useState('tr')
  const [targetLanguage, setTargetLanguage] = useState('en')
  const [level, setLevel] = useState<Level>('B1')
  const [goal, setGoal] = useState(learningGoals[0])
  const [selectedArticleId, setSelectedArticleId] = useState('food-waste-b1')
  const [savedWords, setSavedWords] = useState<VocabularyItem[]>([
    articles[2].vocabulary[0],
    articles[2].vocabulary[1],
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState([
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

  const savedTerms = useMemo(
    () => new Set(savedWords.map((word) => word.term.toLowerCase())),
    [savedWords],
  )

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

  const sendChatMessage = () => {
    const trimmed = chatInput.trim()
    if (!trimmed) {
      return
    }

    setChatMessages((current) => [
      ...current,
      { role: 'learner', text: trimmed },
      {
        role: 'coach',
        text: `Try this refined version: "${trimmed.replace(/\bi\b/g, 'I')}" Add one detail from the article and one opinion to make the answer stronger.`,
      },
    ])
    setChatInput('')
  }

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

          <div className="profile-chip">
            <UserRound size={18} aria-hidden="true" />
            <span>{level}</span>
            <strong>{targetLanguageOption?.label}</strong>
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
                {selectedArticle.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>

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
              <span className="count-pill">AI-ready</span>
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
              <button type="submit" aria-label="Send message">
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
