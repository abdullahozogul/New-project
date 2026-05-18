import type { Level } from '../data'
import { levels } from '../data'

/**
 * Lightweight CEFR estimate inspired by sentence-level difficulty research
 * (CEFR-SP corpus methodology — yukiar/CEFR-SP) and classifier-style scoring
 * (JonathanStefanov/CEFR_Classifier_French). Not a trained CamemBERT model;
 * use for UI hints and dev validation alongside Gemini-generated levels.
 */
export type CefrSentenceScore = {
  sentence: string
  level: Level
  score: number
}

export type CefrTextAssessment = {
  estimatedLevel: Level
  confidence: number
  sentenceScores: CefrSentenceScore[]
  averageScore: number
}

const COMPLEX_MARKERS =
  /\b(because|although|however|therefore|which|whose|despite|whereas|moreover|nevertheless|consequently|significant|implement|approximately|infrastructure|hypothesis)\b/i

function scoreSentence(sentence: string): number {
  const words = sentence.split(/\s+/).filter(Boolean)
  if (words.length === 0) {
    return 0
  }

  const avgWordLen = words.reduce((sum, word) => sum + word.length, 0) / words.length
  let score = 0

  score += Math.min(words.length / 22, 1.4)
  score += Math.min(avgWordLen / 7.5, 1.2)

  if (/[,;:—–-]/.test(sentence)) {
    score += 0.35
  }
  if (COMPLEX_MARKERS.test(sentence)) {
    score += 0.9
  }
  if (/\b(is|are|was|were)\s+\w+ed\b/i.test(sentence)) {
    score += 0.25
  }

  return score
}

/** Phase 1 — coarse band (CEFR_Classifier_French style A / B / C). */
function coarseBand(score: number): 'A' | 'B' | 'C' {
  if (score < 2.2) {
    return 'A'
  }
  if (score < 3.6) {
    return 'B'
  }
  return 'C'
}

/** Phase 2 — fine level within the coarse band. */
function scoreToLevel(score: number): Level {
  const band = coarseBand(score)
  if (band === 'A') {
    return score < 1.4 ? 'A1' : 'A2'
  }
  if (band === 'B') {
    return score < 3.1 ? 'B1' : 'B2'
  }
  return 'C1'
}

export function pickHardestSentences(
  assessment: CefrTextAssessment,
  limit = 3,
): CefrSentenceScore[] {
  return [...assessment.sentenceScores]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

function levelIndex(level: Level): number {
  return levels.indexOf(level)
}

export function assessTextCefr(text: string): CefrTextAssessment {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 8)

  if (sentences.length === 0) {
    return {
      estimatedLevel: 'A1',
      confidence: 0.2,
      sentenceScores: [],
      averageScore: 0,
    }
  }

  const sentenceScores = sentences.map((sentence) => {
    const score = scoreSentence(sentence)
    return { sentence, score, level: scoreToLevel(score) }
  })

  const averageScore =
    sentenceScores.reduce((sum, item) => sum + item.score, 0) / sentenceScores.length

  const estimatedLevel = scoreToLevel(averageScore)

  const agreement =
    sentenceScores.filter((item) => item.level === estimatedLevel).length / sentenceScores.length

  const confidence = Math.min(0.95, Math.max(0.35, agreement * 0.65 + 0.3))

  return { estimatedLevel, confidence, sentenceScores, averageScore }
}

export function assessArticleParagraphs(paragraphs: string[]): CefrTextAssessment {
  return assessTextCefr(paragraphs.join(' '))
}

export function levelsMatch(selected: Level, estimated: Level): boolean {
  return Math.abs(levelIndex(selected) - levelIndex(estimated)) <= 0
}

export async function fetchRemoteCefrAssessment(text: string): Promise<CefrTextAssessment | null> {
  try {
    const response = await fetch('/api/cefr/assess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!response.ok) {
      return null
    }
    return (await response.json()) as CefrTextAssessment
  } catch {
    return null
  }
}
