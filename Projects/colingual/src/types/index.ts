export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export type Skill = 'reading' | 'writing' | 'listening' | 'speaking'

export const CEFR_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

export const SKILLS: Skill[] = ['reading', 'writing', 'listening', 'speaking']

export interface SkillProgress {
  skill: Skill
  level: CEFRLevel
  percentage: number
  totalSessions: number
  lastPracticed: string
}

export interface UserProgress {
  userId: string
  currentLevel: CEFRLevel
  skills: Record<Skill, SkillProgress>
  streak: number
  totalXP: number
}

export interface LearningPathConfig {
  userId: string
  todayMinutes: number
  weakSkillWeight: number
  spaceRepetitionIntervals: number[]
}

export interface SRSCard {
  id: string
  skill: Skill
  cefrLevel: CEFRLevel
  front: string
  back: string
  nextReview: string
  interval: number
  easeFactor: number
  repetitions: number
}

export type BadgeCategory = 'skill' | 'streak' | 'cefr' | 'social' | 'challenge'

export interface Badge {
  id: string
  name: string
  description: string
  category: BadgeCategory
  icon: string
  condition: (progress: UserProgress) => boolean
}

export interface SessionRecord {
  skill: Skill
  score: number
  at: string
}

export interface WritingFeedbackRequest {
  text: string
  cefrLevel: CEFRLevel
  taskType: 'email' | 'essay' | 'description' | 'story' | 'formal'
  targetLanguage: string
  nativeLanguage: string
}

export interface GrammarIssue {
  span: string
  message: string
  category: 'grammar' | 'vocabulary' | 'coherence'
}

export interface VocabSuggestion {
  original: string
  suggestion: string
  reason: string
}

export interface WritingFeedbackResponse {
  overallScore: number
  grammarIssues: GrammarIssue[]
  vocabularySuggestions: VocabSuggestion[]
  cohesionFeedback: string
  cefrAlignment: CEFRLevel
  improvedVersion?: string
}

export interface SpeakingEvaluationRequest {
  transcript: string
  cefrLevel: CEFRLevel
  prompt: string
  durationSeconds: number
  wordsPerMinute: number
}

export interface SpeakingEvaluationResponse {
  fluencyScore: number
  grammarScore: number
  vocabularyScore: number
  pronunciationFeedback: string
  overallCEFR: CEFRLevel
  strongPoints: string[]
  improvementAreas: string[]
  modelAnswer?: string
}

export interface ComprehensionQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
}

export interface ListeningContent {
  id: string
  title: string
  transcript: string
  cefrLevel: CEFRLevel
  topic: string
  questions: ComprehensionQuestion[]
}
