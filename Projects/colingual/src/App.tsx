import { useCallback, useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import {
  BookMarked,
  BookOpen,
  Brain,
  Check,
  ChevronRight,
  Clock3,
  Headphones,
  Heart,
  ImageIcon,
  Languages,
  Loader2,
  Mail,
  MessageSquareText,
  Mic,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Star,
  ThumbsUp,
  UserRound,
  Video,
} from 'lucide-react'
import './App.css'
import { fetchDictionaryEntry, supportsDictionaryLanguage, type DictionaryEntry } from './lib/dictionary'
import {
  articles,
  communityPosts,
  languagePartners,
  learningGoals,
  languages,
  levels,
  practiceModules,
  progressMetrics,
  trendingTopics,
  type Article,
  type Level,
  type VocabularyItem,
} from './data'
import { supabase, supabaseConfigured } from './lib/supabase'
import { ScholarShelfPanel } from './components/library/ScholarShelfPanel'
import { CefrAssessmentBadge } from './components/reading/CefrAssessmentBadge'
import { CefrLevelsPanel } from './components/reading/CefrLevelsPanel'
import { assessArticleParagraphs } from './lib/cefrAssess'
import {
  addToShelf,
  loadShelf,
  removeFromShelf,
  shelfSummaryForCoach,
  type ShelfItem,
} from './lib/scholarShelf'
import { seedStoryBundles } from './config/seedStoryBundles'
import {
  articleFromBundle,
  availableLevelsForBundle,
  buildCefrNewsBundle,
  buildStoryQueue,
  type NewsStoryBundle,
} from './lib/cefrNews'
import { generateCoachReply, isGeminiAiConfigured, offlineCoachFallback, resolveGeminiModel, type CoachTurn } from './lib/gemini'
import { fetchLiveNewsHeadlines, loadSeenHeadlineIds } from './lib/newsFeed'
import { getLemonSqueezyPremiumCheckoutUrl } from './lib/lemonSqueezy'
import { TopBar } from './components/layout/TopBar'
import { AppSidebar } from './components/layout/AppSidebar'
import { LearnerSetupStrip } from './components/layout/LearnerSetupStrip'
import { MobileTabBar } from './components/layout/MobileTabBar'
import { HomeView } from './components/home/HomeView'
import { CoachShelfPrompts } from './components/practice/CoachShelfPrompts'
import { ScenarioLessonPicker } from './components/practice/ScenarioLessonPicker'
import { StudyMaterialPanel } from './components/practice/StudyMaterialPanel'
import { AiCourseOutlinePanel } from './components/progress/AiCourseOutlinePanel'
import { LearningEcosystemPanel } from './components/more/LearningEcosystemPanel'
import { getScenarioById } from './config/lessonScenarios'
import { LearningPathSection } from './components/progress/LearningPathSection'
import { CEFRDashboardSection } from './components/dashboard/CEFRDashboardSection'
import { DailyMissions } from './components/gamification/DailyMissions'
import { LevelUpModal } from './components/gamification/LevelUpModal'
import { StreakProtectModal } from './components/gamification/StreakProtectModal'
import { WeeklyChallenge } from './components/gamification/WeeklyChallenge'
import { XPBreakdown } from './components/gamification/XPBreakdown'
import { ReadingComprehensionPanel } from './components/ai/ReadingComprehensionPanel'
import { SkillsWorkbench } from './components/skills/SkillsWorkbench'
import { AudioPlayer } from './components/skills/listening/AudioPlayer'
import { ReviewSessionView } from './components/srs/ReviewSessionView'
import { RetentionGraph } from './components/srs/RetentionGraph'
import { VocabularyBank } from './components/vocabulary/VocabularyBank'
import { useXpLevelUp } from './hooks/useXpLevelUp'
import { useSRSStore } from './stores/useSRSStore'
import { levelFromAppLevel } from './utils/cefrUtils'
import { localeToLanguage } from './utils/ttsUtils'
import { isCloudTtsConfigured, tts } from './services/tts/ttsService'
import { useStreak } from './hooks/useStreak'
import { useProgressStore } from './stores/useProgressStore'
import { loadCoachUsed, markCoachUsed } from './lib/classroomProgress'
import { VIEW_TITLES } from './config/navigation'
import { useAppNavigation } from './hooks/useAppNavigation'

const SAVED_WORDS_KEY = 'colingual-saved-words-v1'
const LIVE_BUNDLES_KEY = 'colingual-live-bundles-v1'
const MAX_LIVE_BUNDLES = 8
const DEFAULT_SAVED_WORDS: VocabularyItem[] = [
  articles[2].vocabulary[0],
  articles[2].vocabulary[1],
]

function isVocabularyItem(value: unknown): value is VocabularyItem {
  if (!value || typeof value !== 'object') {
    return false
  }

  const item = value as Partial<Record<keyof VocabularyItem, unknown>>
  return (
    typeof item.term === 'string' &&
    typeof item.meaning === 'string' &&
    typeof item.pronunciation === 'string' &&
    typeof item.example === 'string'
  )
}

function loadSavedWords(): VocabularyItem[] {
  if (typeof window === 'undefined') {
    return DEFAULT_SAVED_WORDS
  }

  try {
    const raw = window.localStorage.getItem(SAVED_WORDS_KEY)
    if (!raw) {
      return DEFAULT_SAVED_WORDS
    }

    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter(isVocabularyItem) : DEFAULT_SAVED_WORDS
  } catch {
    return DEFAULT_SAVED_WORDS
  }
}

function saveSavedWords(words: VocabularyItem[]): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(SAVED_WORDS_KEY, JSON.stringify(words))
  } catch {
    // Keep the current session usable if storage is unavailable or full.
  }
}

function isNewsStoryBundle(value: unknown): value is NewsStoryBundle {
  if (!value || typeof value !== 'object') {
    return false
  }

  const bundle = value as Partial<NewsStoryBundle>
  return (
    typeof bundle.storyId === 'string' &&
    typeof bundle.sourceTitle === 'string' &&
    typeof bundle.category === 'string' &&
    typeof bundle.fetchedAt === 'number' &&
    typeof bundle.imageTone === 'string' &&
    Boolean(bundle.variants) &&
    typeof bundle.variants === 'object'
  )
}

function loadLiveBundles(): NewsStoryBundle[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(LIVE_BUNDLES_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter(isNewsStoryBundle).slice(0, MAX_LIVE_BUNDLES) : []
  } catch {
    return []
  }
}

function saveLiveBundles(bundles: NewsStoryBundle[]): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(
      LIVE_BUNDLES_KEY,
      JSON.stringify(bundles.slice(0, MAX_LIVE_BUNDLES)),
    )
  } catch {
    // Live stories are still available for the current in-memory session.
  }
}

function App() {
  const [nativeLanguage, setNativeLanguage] = useState('tr')
  const [targetLanguage, setTargetLanguage] = useState('en')
  const [level, setLevel] = useState<Level>('B1')
  const [goal, setGoal] = useState(learningGoals[0])
  const [user, setUser] = useState<User | null>(null)
  const [selectedStoryKey, setSelectedStoryKey] = useState('city-garden')
  const [liveBundles, setLiveBundles] = useState<NewsStoryBundle[]>(() => loadLiveBundles())
  const [shelfItems, setShelfItems] = useState<ShelfItem[]>(() => loadShelf())
  const [coachUsed, setCoachUsed] = useState(() => loadCoachUsed())
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null)
  const [newsLoading, setNewsLoading] = useState(false)
  const [newsError, setNewsError] = useState<string | null>(null)
  const [selectedLexeme, setSelectedLexeme] = useState<string | null>(null)
  const [dictionaryCache, setDictionaryCache] = useState<Record<string, DictionaryEntry>>({})
  const [dictionaryStatus, setDictionaryStatus] = useState<
    | { state: 'idle' }
    | { state: 'loading'; key: string }
    | { state: 'error'; key: string; reason: 'not_found' | 'unsupported_language' | 'network' }
  >({ state: 'idle' })
  const [savedWords, setSavedWords] = useState<VocabularyItem[]>(() => loadSavedWords())
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

  const storyBundles = useMemo(
    () => [...liveBundles, ...seedStoryBundles],
    [liveBundles],
  )

  const storyQueue = useMemo(
    () => buildStoryQueue(liveBundles, seedStoryBundles, articles),
    [liveBundles],
  )

  const selectedStoryBundle = useMemo(
    () => storyBundles.find((bundle) => bundle.storyId === selectedStoryKey) ?? null,
    [storyBundles, selectedStoryKey],
  )

  const readingLevels = useMemo(() => {
    if (selectedStoryBundle) {
      return availableLevelsForBundle(selectedStoryBundle)
    }
    const seed = articles.find(
      (article) => article.id === selectedStoryKey || article.storyId === selectedStoryKey,
    )
    return seed ? [seed.level] : levels
  }, [selectedStoryBundle, selectedStoryKey])

  const effectiveLevel = useMemo(() => {
    if (readingLevels.length === 0) {
      return level
    }
    return readingLevels.includes(level) ? level : readingLevels[0]
  }, [level, readingLevels])

  const selectedArticle = useMemo(() => {
    if (selectedStoryBundle) {
      return (
        articleFromBundle(selectedStoryBundle, effectiveLevel) ??
        articleFromBundle(selectedStoryBundle, readingLevels[0] ?? 'B1') ??
        articles[0]
      )
    }
    const seed =
      articles.find((article) => article.id === selectedStoryKey) ??
      articles.find((article) => article.storyId === selectedStoryKey)
    return seed ?? articles[0]
  }, [selectedStoryBundle, selectedStoryKey, effectiveLevel, readingLevels])

  const currentStoryKey = selectedStoryBundle?.storyId ?? selectedStoryKey

  const cefrAssessment = useMemo(
    () => assessArticleParagraphs(selectedArticle.paragraphs),
    [selectedArticle.paragraphs],
  )

  const progressSignals = useMemo(
    () => ({
      savedWordCount: savedWords.length,
      hasLiveStory: liveBundles.length > 0,
      coachUsed,
      shelfCount: shelfItems.length,
    }),
    [savedWords.length, liveBundles.length, coachUsed, shelfItems.length],
  )

  const targetLanguageOption = languages.find((language) => language.code === targetLanguage)
  const nativeLanguageOption = languages.find((language) => language.code === nativeLanguage)

  const syncFromSignals = useProgressStore((state) => state.syncFromSignals)
  const recordSession = useProgressStore((state) => state.recordSession)
  const { markActiveToday, atRisk: streakAtRisk } = useStreak()
  const { level: xpLevel, showLevelUp, dismissLevelUp } = useXpLevelUp()
  const addSrsCard = useSRSStore((state) => state.addCard)
  const [streakModalOpen, setStreakModalOpen] = useState(false)
  const sessionStats = useProgressStore((state) => state.sessions)
  const userStreak = useProgressStore((state) => state.progress.streak)

  useEffect(() => {
    syncFromSignals(progressSignals)
  }, [progressSignals, syncFromSignals])

  useEffect(() => {
    saveSavedWords(savedWords)
  }, [savedWords])

  useEffect(() => {
    saveLiveBundles(liveBundles)
  }, [liveBundles])

  const recordLearningSession = useCallback<typeof recordSession>(
    (skill, score) => {
      markActiveToday()
      recordSession(skill, score)
    },
    [markActiveToday, recordSession],
  )

  useEffect(() => {
    if (streakAtRisk) {
      setStreakModalOpen(true)
    }
  }, [streakAtRisk])

  const loadFreshNewsStory = async () => {
    if (!isGeminiAiConfigured()) {
      setNewsError('Add VITE_AI_ASSISTANT_ENDPOINT or a local AI_ASSISTANT_API_KEY to fetch live news.')
      return
    }

    setNewsLoading(true)
    setNewsError(null)

    try {
      const excludeIds = [
        ...loadSeenHeadlineIds(),
        ...liveBundles.map((bundle) => bundle.storyId),
      ]
      const headlines = await fetchLiveNewsHeadlines({
        excludeIds,
        limit: 16,
        languageCode: targetLanguage,
      })
      if (headlines.length === 0) {
        throw new Error('no_headlines')
      }

      const headline = headlines[0]
      const bundle = await buildCefrNewsBundle(headline, {
        targetLanguageCode: targetLanguage,
        targetLanguageLabel: targetLanguageOption?.label ?? targetLanguage,
        nativeLanguageLabel: nativeLanguageOption?.label ?? nativeLanguage,
      })

      setLiveBundles((current) =>
        [bundle, ...current.filter((item) => item.storyId !== bundle.storyId)].slice(
          0,
          MAX_LIVE_BUNDLES,
        ),
      )
      setSelectedStoryKey(bundle.storyId)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'news_failed'
      setNewsError(
        message === 'gemini_not_configured'
          ? 'Configure Gemini to adapt headlines to CEFR levels.'
          : 'Could not load a new story. Try again in a moment.',
      )
    } finally {
      setNewsLoading(false)
    }
  }

  useEffect(() => {
    if (!isGeminiAiConfigured() || liveBundles.length > 0 || newsLoading) {
      return
    }

    void loadFreshNewsStory()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount when AI is ready
  }, [])

  const lemonSqueezyCheckoutUrl = useMemo(() => getLemonSqueezyPremiumCheckoutUrl(), [])

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

  const { activeView, goToView } = useAppNavigation()
  const viewCopy = VIEW_TITLES[activeView]

  const onShelf = shelfItems.some((item) => item.storyKey === currentStoryKey)

  const openShelfStory = useCallback(
    (storyKey: string) => {
      setSelectedStoryKey(storyKey)
      goToView('read')
    },
    [goToView],
  )

  const toggleShelfStory = () => {
    if (onShelf) {
      setShelfItems(removeFromShelf(currentStoryKey))
      return
    }
    setShelfItems(
      addToShelf({
        storyKey: currentStoryKey,
        title: selectedStoryBundle?.sourceTitle ?? selectedArticle.title,
        category: selectedArticle.category,
        sourceUrl: selectedStoryBundle?.sourceUrl ?? selectedArticle.sourceUrl,
        isLive: Boolean(selectedStoryBundle),
        lastLevel: effectiveLevel,
      }),
    )
  }

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

    if (savedTerms.has(termKey)) {
      setSavedWords((current) => current.filter((item) => item.term.toLowerCase() !== termKey))
      return
    }

    recordLearningSession('writing', 75)
    addSrsCard({
      id: `sw-${word.term}-${Date.now()}`,
      skill: 'reading',
      cefrLevel: levelFromAppLevel(level),
      front: word.term,
      back: word.meaning,
    })

    setSavedWords((current) => {
      const alreadySaved = current.some((item) => item.term.toLowerCase() === termKey)
      return alreadySaved ? current : [word, ...current]
    })
  }

  const handleLevelChange = (candidate: Level) => {
    if (!readingLevels.includes(candidate)) {
      return
    }
    setLevel(candidate)
  }

  useEffect(() => {
    if (readingLevels.length === 0) {
      return
    }
    if (!readingLevels.includes(level)) {
      setLevel(readingLevels[0])
    }
  }, [selectedStoryKey, readingLevels])

  const speakArticle = async (article: Article) => {
    const text = [article.title, ...article.paragraphs].join('. ')
    const language = localeToLanguage(targetLanguageOption?.locale)
    const cefr = levelFromAppLevel(effectiveLevel)
    const rate = article.level === 'A1' || article.level === 'A2' ? 0.82 : 0.96

    if (isCloudTtsConfigured()) {
      try {
        const result = await tts.listening(text, language, cefr, rate)
        const audio = new Audio(result.audioUrl)
        audio.playbackRate = rate
        audio.onended = () => {
          URL.revokeObjectURL(result.audioUrl)
          recordLearningSession('listening')
        }
        audio.onerror = () => URL.revokeObjectURL(result.audioUrl)
        await audio.play()
        return
      } catch {
        // fall through to browser TTS
      }
    }

    if (!('speechSynthesis' in window)) {
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = targetLanguageOption?.locale ?? 'en-US'
    utterance.rate = rate
    utterance.onend = () => recordLearningSession('listening')
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
    markCoachUsed()
    setCoachUsed(true)
    recordLearningSession('speaking', 72)

    if (!isGeminiAiConfigured()) {
      setChatMessages([...transcript, { role: 'coach', text: offlineCoachFallback(trimmed) }])
      return
    }

    setChatSending(true)
    try {
      const scenario = getScenarioById(activeScenarioId)
      const reply = await generateCoachReply(transcript, {
        nativeLanguageLabel: nativeLanguageOption?.label ?? nativeLanguage,
        targetLanguageLabel: targetLanguageOption?.label ?? targetLanguage,
        level: effectiveLevel,
        goal,
        articleTitle: selectedStoryBundle?.sourceTitle ?? selectedArticle.title,
        shelfSummary: shelfSummaryForCoach(shelfItems),
        scenarioSetting: scenario ? `${scenario.title}. ${scenario.setting}` : undefined,
        scenarioKeyConcepts: scenario?.keyConcepts,
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
      <AppSidebar
        activeView={activeView}
        supabaseConfigured={supabaseConfigured}
        userLabel={user ? userDisplayName : 'Misafir öğrenci'}
        userMeta={`${level} • ${targetLanguageOption?.label ?? targetLanguage}`}
      />

      <div className="workspace-column">
        <main className={`workspace is-view-${activeView}`}>
        <header className="topbar" id="dashboard">
          <TopBar
            authenticated={Boolean(user)}
            isPremium={false}
            profile={{
              level,
              targetLanguageLabel: targetLanguageOption?.label ?? targetLanguage,
              displayName: userDisplayName,
              email: userEmail || undefined,
              avatarUrl:
                (user?.user_metadata?.avatar_url as string | undefined) ??
                (user?.user_metadata?.picture as string | undefined) ??
                null,
            }}
            premiumCheckoutUrl={lemonSqueezyCheckoutUrl}
            onGoogleSignIn={() => {
              void signInWithGoogle()
            }}
            googleSignInDisabled={!supabaseConfigured}
            plansHref="#more"
            onSignOut={() => {
              void signOutUser()
            }}
            onNotificationClick={() => {
              document.getElementById('contact-title')?.scrollIntoView({ behavior: 'smooth' })
            }}
          />

          <div className="topbar-hero">
            <p className="eyebrow">{viewCopy.eyebrow}</p>
            <h1>{viewCopy.title}</h1>
            {viewCopy.lead ? <p className="topbar-hero-lead">{viewCopy.lead}</p> : null}
          </div>
        </header>

        <div className="view-pane" data-view-pane="home">
          <HomeView
            metrics={progressMetrics}
            continueTitle={selectedArticle.title}
            continueMeta={`${selectedArticle.level} • ${selectedArticle.minutes} min`}
            onContinueRead={() => goToView('read')}
            onOpenPractice={() => goToView('practice')}
          />
        </div>


        <div className="view-pane" data-view-pane="read">
        <LearnerSetupStrip
          nativeLanguage={nativeLanguage}
          targetLanguage={targetLanguage}
          level={effectiveLevel}
          goal={goal}
          onNativeChange={setNativeLanguage}
          onTargetChange={setTargetLanguage}
          availableLevels={readingLevels}
          onLevelChange={handleLevelChange}
          onGoalChange={setGoal}
        />


        <div className="content-grid">
          <section className="panel article-list" aria-labelledby="article-list-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Orijinal metin</p>
                <h2 id="article-list-title">Hikâye seç</h2>
              </div>
              <div className="article-list-actions">
                <button
                  className="icon-button news-refresh-btn"
                  type="button"
                  aria-label="Fetch a new live news story"
                  disabled={newsLoading}
                  onClick={() => void loadFreshNewsStory()}
                >
                  {newsLoading ? <Loader2 size={18} className="spin" /> : <RefreshCw size={18} />}
                </button>
                <button className="icon-button" type="button" aria-label="Search articles">
                  <Search size={18} />
                </button>
              </div>
            </div>

            {newsError ? <p className="news-status news-status--error">{newsError}</p> : null}
            {newsLoading && liveBundles.length === 0 ? (
              <p className="news-status">Fetching today&apos;s story and building CEFR versions…</p>
            ) : null}

            <div className="article-stack">
              {storyQueue.map((item) => (
                <button
                  type="button"
                  key={item.key}
                  className={item.key === selectedStoryKey ? 'article-row active' : 'article-row'}
                  onClick={() => setSelectedStoryKey(item.key)}
                >
                  <span className={`article-thumb ${item.imageTone}`}>
                    <BookOpen size={22} aria-hidden="true" />
                  </span>
                  <span>
                    <small>
                      {item.category}
                      {item.isLive ? ' • Canlı' : ''}
                    </small>
                    <strong>{item.title}</strong>
                    <em>{item.minutes} min</em>
                  </span>
                  <ChevronRight size={17} aria-hidden="true" />
                </button>
              ))}
            </div>
          </section>

          <section className="panel reading-panel" id="reading" aria-labelledby="reading-title">
            <div className="reading-visual">
              <div className="media-actions media-actions--listening">
                <AudioPlayer
                  title={selectedArticle.title}
                  transcript={selectedArticle.paragraphs.join(' ')}
                  locale={targetLanguageOption?.locale}
                  cefrLevel={levelFromAppLevel(effectiveLevel)}
                  onListenComplete={() => recordLearningSession('listening')}
                />
                <button type="button" onClick={() => speakArticle(selectedArticle)}>
                  <Headphones size={17} aria-hidden="true" />
                  Hızlı dinle
                </button>
                <button type="button">
                  <Video size={17} aria-hidden="true" />
                  Watch
                </button>
              </div>
            </div>

            <article>
              <div className="reading-toolbar">
                <CefrAssessmentBadge
                  selectedLevel={effectiveLevel}
                  assessment={cefrAssessment}
                />
                <button
                  type="button"
                  className={onShelf ? 'shelf-toggle shelf-toggle--on' : 'shelf-toggle'}
                  onClick={toggleShelfStory}
                >
                  <BookMarked size={16} aria-hidden="true" />
                  {onShelf ? 'Rafta' : 'Rafa ekle'}
                </button>
              </div>
              {selectedStoryBundle ? (
                <>
                  <div className="article-meta">
                    <span>{selectedArticle.category}</span>
                    {selectedStoryBundle.isLive ? (
                      <>
                        <span>Live</span>
                        <span>A1 – C1</span>
                      </>
                    ) : (
                      <>
                        <span>Community</span>
                        <span>
                          <Clock3 size={14} aria-hidden="true" />
                          {selectedArticle.minutes} min
                        </span>
                      </>
                    )}
                  </div>
                  <h2 id="reading-title">{selectedStoryBundle.sourceTitle}</h2>
                  <p className="deck">{selectedArticle.deck}</p>
                  {selectedStoryBundle.sourceUrl ? (
                    <p className="news-source">
                      <a href={selectedStoryBundle.sourceUrl} target="_blank" rel="noreferrer">
                        Original article
                      </a>
                    </p>
                  ) : null}
                </>
              ) : (
                <>
                  <div className="article-meta">
                    <span>{effectiveLevel}</span>
                    <span>{selectedArticle.category}</span>
                    <span>
                      <Clock3 size={14} aria-hidden="true" />
                      {selectedArticle.minutes} min
                    </span>
                  </div>
                  <h2 id="reading-title">{selectedArticle.title}</h2>
                  <p className="deck">{selectedArticle.deck}</p>
                </>
              )}
              {selectedStoryBundle ? (
                <CefrLevelsPanel
                  bundle={selectedStoryBundle}
                  activeLevel={effectiveLevel}
                  renderParagraph={renderClickableParagraph}
                />
              ) : (
                <div className="story-copy">
                  {selectedArticle.paragraphs.map((paragraph) =>
                    renderClickableParagraph(paragraph),
                  )}
                </div>
              )}
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
        </div>

        </div>

        <div className="view-pane content-grid--practice" data-view-pane="practice">
          <SkillsWorkbench
            article={selectedArticle}
            appLevel={effectiveLevel}
            locale={targetLanguageOption?.locale}
            storyKey={currentStoryKey}
            onWordClick={setSelectedLexeme}
          />

          <ReviewSessionView />

          <VocabularyBank
            words={savedWords}
            defaultLevel={effectiveLevel}
            language={targetLanguage}
          />

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
                <p className="eyebrow">ScholarShelf · SchoBot</p>
                <h2 id="chat-title">Chat coach</h2>
              </div>
              <span className="count-pill">
                {isGeminiAiConfigured() ? `${resolveGeminiModel()} · AI` : 'Demo replies'}
              </span>
            </div>

            <ScenarioLessonPicker
              activeId={activeScenarioId}
              onSelect={setActiveScenarioId}
            />

            <CoachShelfPrompts
              items={shelfItems}
              disabled={chatSending}
              onPick={(prompt) => setChatInput(prompt)}
            />

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

          <StudyMaterialPanel
            topic={selectedStoryBundle?.sourceTitle ?? selectedArticle.title}
            level={effectiveLevel}
            targetLanguageLabel={targetLanguageOption?.label ?? targetLanguage}
            nativeLanguageLabel={nativeLanguageOption?.label ?? nativeLanguage}
            vocabularyTerms={selectedArticle.vocabulary.map((word) => word.term)}
          />

          <ReadingComprehensionPanel
            passage={selectedArticle.paragraphs.join('\n')}
            cefrLevel={levelFromAppLevel(effectiveLevel)}
          />
        </div>

        <div className="view-pane" data-view-pane="progress">
          <CEFRDashboardSection
            onNavigateLevel={(candidate) => {
              if (levels.includes(candidate as Level)) {
                setLevel(candidate as Level)
              }
            }}
          />
          <DailyMissions />
          <WeeklyChallenge />
          <XPBreakdown
            exercises={sessionStats.length}
            correct={sessionStats.filter((item) => item.score >= 70).length}
            streak={userStreak}
          />
          <RetentionGraph />
          <LearningPathSection signals={progressSignals} />
          <AiCourseOutlinePanel
            defaultCourseName="Günlük haber okuma"
            level={effectiveLevel}
            targetLanguageLabel={targetLanguageOption?.label ?? targetLanguage}
          />
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

        <div className="view-pane" data-view-pane="more">
        <ScholarShelfPanel
          items={shelfItems}
          activeStoryKey={currentStoryKey}
          onOpen={openShelfStory}
          onRemove={(storyKey) => setShelfItems(removeFromShelf(storyKey))}
        />

        <LearningEcosystemPanel />

        <section id="community" className="community-hub" aria-labelledby="community-title">
          <div className="community-hub-intro">
            <p className="eyebrow">Community hub</p>
            <h2 id="community-title">Moments &amp; questions</h2>
            <p className="community-lead">
              Share wins, ask for corrections, and learn with peers — posting is a demo until backend hooks exist.
            </p>
          </div>
          <div className="community-hub-grid">
            <div className="community-main">
              <div className="community-composer panel">
                <div className="cc-row">
                  <div className="cc-avatar" aria-hidden="true">
                    <UserRound size={20} />
                  </div>
                  <input
                    className="cc-input"
                    type="text"
                    placeholder="Share a moment, question, or correction..."
                    readOnly
                  />
                </div>
                <div className="cc-toolbar">
                  <div className="cc-tools">
                    <button type="button" className="cc-tool" aria-label="Image">
                      <ImageIcon size={18} />
                    </button>
                    <button type="button" className="cc-tool" aria-label="Voice">
                      <Mic size={18} />
                    </button>
                    <button type="button" className="cc-tool" aria-label="Spell check">
                      <Sparkles size={18} />
                    </button>
                  </div>
                  <button type="button" className="cc-post">
                    Post
                  </button>
                </div>
              </div>

              <div className="community-feed">
                {communityPosts.map((post) => (
                  <article key={post.id} className="community-post panel">
                    <header className="cp-head">
                      <div className="cp-author">
                        <div className="cp-avatar" aria-hidden="true">
                          {post.author.charAt(0)}
                        </div>
                        <div>
                          <strong>{post.author}</strong>
                          <p className="cp-meta">{post.meta}</p>
                        </div>
                      </div>
                      <span className="cp-tag">{post.tagLabel}</span>
                    </header>
                    {post.correctionLead ? (
                      <div className="cp-correction-box">
                        <p className="cp-correction-lead">{post.correctionLead}</p>
                        <p>{post.body}</p>
                      </div>
                    ) : (
                      <div className="cp-body">
                        <p>{post.body}</p>
                        {post.kind === 'moment' ? (
                          <div className="cp-moment-visual" role="img" aria-label={post.momentCaption}>
                            <span>{post.momentCaption}</span>
                          </div>
                        ) : null}
                      </div>
                    )}
                    <footer className="cp-foot">
                      <span className="cp-stat">
                        <MessageSquareText size={16} aria-hidden="true" /> {post.statsLeft}
                      </span>
                      <span className="cp-stat">
                        {post.kind === 'moment' ? (
                          <Heart size={16} aria-hidden="true" />
                        ) : (
                          <ThumbsUp size={16} aria-hidden="true" />
                        )}{' '}
                        {post.statsRight}
                      </span>
                    </footer>
                  </article>
                ))}
              </div>
              <button type="button" className="community-load-more">
                Load more
              </button>
            </div>

            <aside className="community-aside">
              <div className="panel cp-partners">
                <header className="cp-partners-head">
                  <h3>Language partners</h3>
                  <button type="button" className="cp-see-all">
                    See all
                  </button>
                </header>
                <ul className="cp-partners-list">
                  {languagePartners.map((p) => (
                    <li key={p.id}>
                      <div className="cp-partner-row">
                        <div className="cp-partner-avatar-wrap">
                          <span className="cp-partner-initial">{p.name.charAt(0)}</span>
                          <span className={p.online ? 'cp-dot online' : 'cp-dot'} />
                        </div>
                        <div>
                          <strong>{p.name}</strong>
                          <p className="cp-partner-lang">
                            N: {p.native} | L: {p.learning}
                          </p>
                        </div>
                        <button type="button" className="cp-chat-btn" aria-label={`Message ${p.name}`}>
                          <MessageSquareText size={18} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="panel cp-trending">
                <h3>Trending topics</h3>
                <div className="cp-tags">
                  {trendingTopics.map((t) => (
                    <button key={t} type="button" className="cp-tag-chip">
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>

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

          <section className="panel marketing-panel" id="pricing" aria-labelledby="pricing-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Lemon Squeezy ile güvenli ödeme</p>
                <h2 id="pricing-title">Planlar ve premium üyelik</h2>
                <p className="pricing-deck">
                  Ücretsiz kullanım için <strong>Google ile giriş</strong> yap. Premium abonelik ödemesi{' '}
                  <strong>Lemon Squeezy</strong> üzerinden alınır; fiyat ve para birimi checkout sayfasında
                  görünür.
                </p>
              </div>
              <Sparkles size={18} aria-hidden="true" />
            </div>

            <div className="pricing-grid">
              {[
                {
                  name: 'Starter',
                  price: 'Ücretsiz',
                  suffix: '',
                  note: 'Okuma, kelime kaydı ve temel sohbet düzeltmeleri — hesap için Google ile giriş.',
                  highlights: [
                    'Okuma masası ve seviye uyumlu metinler',
                    'Tek dokunuşla kelime kaydı',
                    'Sınırlı coach sohbeti',
                  ],
                  variant: 'free' as const,
                },
                {
                  name: 'Plus',
                  price: 'Premium',
                  suffix: '/ abonelik',
                  note: 'Gelişmiş coach, dinleme ve ilerleme — ödeme Lemon Squeezy sandbox veya canlı checkout’ta.',
                  highlights: [
                    'Sınırsız coach turu (plan kapsamında)',
                    'Dinleme modu ve içgörüler',
                    'Öncelikli özellik güncellemeleri',
                  ],
                  variant: 'premium' as const,
                  featured: true,
                },
                {
                  name: 'Studio',
                  price: 'Özel',
                  suffix: '',
                  note: 'Takımlar ve içerik üreticileri için — yakında.',
                  highlights: ['Çoklu hedef', 'Gelişmiş geri bildirim', 'Öncelikli destek'],
                  variant: 'soon' as const,
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
                      {plan.suffix ? (
                        <span className="price-suffix">{plan.suffix}</span>
                      ) : null}
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

                  {plan.variant === 'free' ? (
                    <a className="price-card-cta price-card-cta-secondary" href="#home">
                      Ücretsiz başla
                    </a>
                  ) : null}
                  {plan.variant === 'premium' && lemonSqueezyCheckoutUrl ? (
                    <a
                      className="price-card-cta"
                      href={lemonSqueezyCheckoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Premium’a geç — Lemon Squeezy
                    </a>
                  ) : null}
                  {plan.variant === 'premium' && !lemonSqueezyCheckoutUrl ? (
                    <p className="price-card-missing">Checkout URL yapılandırın (.env.local).</p>
                  ) : null}
                  {plan.variant === 'soon' ? (
                    <span className="price-card-soon">Çok yakında</span>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        </div>
        </div>
      </main>

      <MobileTabBar activeView={activeView} />

      <LevelUpModal open={showLevelUp} level={xpLevel} onClose={dismissLevelUp} />
      <StreakProtectModal open={streakModalOpen} onClose={() => setStreakModalOpen(false)} />
      </div>
    </div>
  )
}

export default App
