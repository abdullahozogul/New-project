import type { Article, Level, VocabularyItem } from '../data'
import { levels } from '../data'
import { generateGeminiJson, isGeminiConfigured } from './geminiCore'
import type { RawNewsHeadline } from './newsFeed'
import { rememberHeadlineId } from './newsFeed'
import {
  buildTtflTurkishCefrSystemInstruction,
  isTurkishTargetLanguage,
} from './ttflTurkishCefrPrompt'

export type NewsStoryBundle = {
  storyId: string
  sourceTitle: string
  sourceUrl?: string
  category: string
  fetchedAt: number
  imageTone: Article['imageTone']
  /** True for RSS/Gemini headlines; false for bundled demo stories. */
  isLive?: boolean
  variants: Partial<Record<Level, ArticleVariantContent>>
}

export type ArticleVariantContent = {
  title: string
  deck: string
  minutes: number
  listening: string
  video: string
  paragraphs: string[]
  vocabulary: VocabularyItem[]
  /** TTFL: primary reading purpose for this level. */
  readingPurpose?: string
  /** TTFL: grammar structures used in this version (cumulative model). */
  grammarUsed?: string[]
}

const IMAGE_TONES: Article['imageTone'][] = ['mint', 'coral', 'blue', 'gold', 'violet']

type CefrBundleResponse = {
  category?: string
  variants: Partial<
    Record<
      Level,
      {
        title: string
        deck: string
        minutes?: number
        listening?: string
        video?: string
        paragraphs: string[]
        vocabulary: VocabularyItem[]
        readingPurpose?: string
        grammarUsed?: string[]
      }
    >
  >
}

export type CefrNewsBuildOptions = {
  targetLanguageCode: string
  targetLanguageLabel: string
  nativeLanguageLabel: string
}

function imageToneForStory(storyId: string): Article['imageTone'] {
  let hash = 0
  for (let index = 0; index < storyId.length; index += 1) {
    hash = (hash << 5) - hash + storyId.charCodeAt(index)
    hash |= 0
  }
  return IMAGE_TONES[Math.abs(hash) % IMAGE_TONES.length]
}

function defaultListening(level: Level): string {
  if (level === 'A1' || level === 'A2') {
    return 'Slow voice'
  }
  if (level === 'B1' || level === 'B2') {
    return 'News voice'
  }
  return 'Full speed'
}

function defaultVideo(category: string): string {
  if (category === 'Sports') {
    return 'Match clip'
  }
  if (category === 'Technology') {
    return 'Tech brief'
  }
  return 'News clip'
}

function estimateMinutes(paragraphs: string[]): number {
  const words = paragraphs.join(' ').split(/\s+/).filter(Boolean).length
  return Math.max(3, Math.min(12, Math.round(words / 130)))
}

export function articleFromBundle(bundle: NewsStoryBundle, level: Level): Article | null {
  const variant = bundle.variants[level]
  if (!variant) {
    return null
  }

  return {
    id: `${bundle.storyId}-${level}`,
    storyId: bundle.storyId,
    isLive: bundle.isLive ?? false,
    level,
    category: bundle.category,
    title: variant.title,
    deck: variant.deck,
    minutes: variant.minutes,
    listening: variant.listening,
    video: variant.video,
    imageTone: bundle.imageTone,
    paragraphs: variant.paragraphs,
    vocabulary: variant.vocabulary,
    sourceUrl: bundle.sourceUrl,
    sourceTitle: bundle.sourceTitle,
    readingPurpose: variant.readingPurpose,
    grammarUsed: variant.grammarUsed,
  }
}

export function bundleArticlesForLevel(
  bundles: NewsStoryBundle[],
  level: Level,
): Article[] {
  return bundles
    .map((bundle) => articleFromBundle(bundle, level))
    .filter((article): article is Article => article !== null)
}

/** One queue row per live story (uses `level`, then B1, then any available variant). */
export function bundleStorySummariesForQueue(
  bundles: NewsStoryBundle[],
  level: Level,
): Article[] {
  return bundles
    .map((bundle) => {
      return (
        articleFromBundle(bundle, level) ??
        articleFromBundle(bundle, 'B1') ??
        levels.map((candidate) => articleFromBundle(bundle, candidate)).find(Boolean) ??
        null
      )
    })
    .filter((article): article is Article => article !== null)
}

export type StoryQueueItem = {
  key: string
  title: string
  category: string
  minutes: number
  imageTone: Article['imageTone']
  isLive?: boolean
  /** Demo articles only ship one CEFR level. */
  fixedLevel?: Level
}

function previewArticleForBundle(bundle: NewsStoryBundle): Article | null {
  return (
    articleFromBundle(bundle, 'B1') ??
    levels.map((candidate) => articleFromBundle(bundle, candidate)).find(Boolean) ??
    null
  )
}

/** Sidebar list: one entry per story, not per CEFR level. */
export function buildStoryQueue(
  liveBundles: NewsStoryBundle[],
  seedBundles: NewsStoryBundle[] = [],
  orphanSeedArticles: Article[] = [],
): StoryQueueItem[] {
  const bundledStoryIds = new Set([
    ...liveBundles.map((bundle) => bundle.storyId),
    ...seedBundles.map((bundle) => bundle.storyId),
  ])

  const live = liveBundles.map((bundle) => {
    const preview = previewArticleForBundle(bundle)
    return {
      key: bundle.storyId,
      title: bundle.sourceTitle,
      category: bundle.category,
      minutes: preview?.minutes ?? 5,
      imageTone: bundle.imageTone,
      isLive: true,
    }
  })

  const seed = seedBundles.map((bundle) => {
    const preview = previewArticleForBundle(bundle)
    return {
      key: bundle.storyId,
      title: bundle.sourceTitle,
      category: bundle.category,
      minutes: preview?.minutes ?? 5,
      imageTone: bundle.imageTone,
    }
  })

  const orphan = orphanSeedArticles
    .filter((article) => !bundledStoryIds.has(article.storyId ?? article.id))
    .map((article) => ({
      key: article.id,
      title: article.title,
      category: article.category,
      minutes: article.minutes,
      imageTone: article.imageTone,
      fixedLevel: article.level,
    }))

  return [...live, ...seed, ...orphan]
}

export function availableLevelsForBundle(bundle: NewsStoryBundle): Level[] {
  return levels.filter((candidate) => Boolean(bundle.variants[candidate]))
}

function buildGenericCefrSystemInstruction(
  targetLanguageLabel: string,
  nativeLanguageLabel: string,
): string {
  return [
    'You are Colingual, an expert language educator and news editor.',
    `Adapt a real news headline into graded reading texts in ${targetLanguageLabel}.`,
    'Produce one version per CEFR level: A1, A2, B1, B2, C1.',
    'All versions must describe the SAME factual story; simplify grammar and vocabulary at lower levels.',
    'Follow CEFR reading progression: A1 recognition, A2 locating facts, B1 interpretation, B2 evaluation, C1 inference.',
    `Vocabulary glosses in ${nativeLanguageLabel}.`,
    'Do not invent sensational claims beyond the source summary.',
  ].join(' ')
}

function buildCefrUserPrompt(headline: RawNewsHeadline, useTtflSchema: boolean): string {
  const variantShape = {
    title: 'string',
    deck: 'string',
    paragraphs: ['string'],
    vocabulary: [{ term: '', meaning: '', pronunciation: '', example: '' }],
    ...(useTtflSchema ?
      { readingPurpose: 'string', grammarUsed: ['string'] }
    : {}),
  }

  return JSON.stringify({
    headline: headline.title,
    summary: headline.summary,
    category: headline.category,
    levels,
    outputShape: {
      category: 'string',
      variants: {
        A1: variantShape,
        A2: variantShape,
        B1: variantShape,
        B2: variantShape,
        C1: variantShape,
      },
    },
  })
}

export async function buildCefrNewsBundle(
  headline: RawNewsHeadline,
  options: CefrNewsBuildOptions,
): Promise<NewsStoryBundle> {
  if (!isGeminiConfigured()) {
    throw new Error('gemini_not_configured')
  }

  const useTtfl = isTurkishTargetLanguage(options.targetLanguageCode)

  const systemInstruction =
    useTtfl ?
      buildTtflTurkishCefrSystemInstruction({
        topic: headline.title,
        topicSummary: headline.summary,
        nativeLanguageLabel: options.nativeLanguageLabel,
      })
    : buildGenericCefrSystemInstruction(
        options.targetLanguageLabel,
        options.nativeLanguageLabel,
      )

  const userPrompt = buildCefrUserPrompt(headline, useTtfl)

  const parsed = await generateGeminiJson<CefrBundleResponse>(
    systemInstruction,
    userPrompt,
    useTtfl ? { maxOutputTokens: 16384 } : undefined,
  )
  const storyId = headline.id
  const category = parsed.category?.trim() || headline.category
  const variants: NewsStoryBundle['variants'] = {}

  for (const level of levels) {
    const raw = parsed.variants?.[level]
    if (!raw?.title || !raw.paragraphs?.length) {
      continue
    }

    variants[level] = {
      title: raw.title.trim(),
      deck: raw.deck?.trim() || `Level ${level} version of today's story.`,
      minutes: raw.minutes ?? estimateMinutes(raw.paragraphs),
      listening: raw.listening?.trim() || defaultListening(level),
      video: raw.video?.trim() || defaultVideo(category),
      paragraphs: raw.paragraphs.map((p) => p.trim()).filter(Boolean),
      vocabulary: (raw.vocabulary ?? []).slice(0, 5).map((item) => ({
        term: item.term.trim(),
        meaning: item.meaning.trim(),
        pronunciation: item.pronunciation.trim(),
        example: item.example.trim(),
      })),
      readingPurpose: raw.readingPurpose?.trim() || undefined,
      grammarUsed: (raw.grammarUsed ?? []).map((item) => item.trim()).filter(Boolean).slice(0, 10),
    }
  }

  if (Object.keys(variants).length === 0) {
    throw new Error('empty_cefr_bundle')
  }

  rememberHeadlineId(headline.id)

  return {
    storyId,
    sourceTitle: headline.title,
    sourceUrl: headline.sourceUrl,
    category,
    fetchedAt: Date.now(),
    imageTone: imageToneForStory(storyId),
    isLive: true,
    variants,
  }
}
