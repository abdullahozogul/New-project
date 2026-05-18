import type { Level } from '../data'
import { generateGeminiJson, generateGeminiText, isGeminiConfigured } from './geminiCore'

/** AI Study Material Generator (Adiaparmar) + ACCG quiz patterns. */
export type StudyMaterialResult = {
  summary: string
  keyPoints: string[]
  vocabulary: { term: string; definition: string }[]
  practicePrompts: string[]
}

/** Automated Course Content Generator (pramodkoujalagi) outline shape. */
export type CourseOutlineResult = {
  title: string
  audience: string
  modules: { title: string; lessons: string[] }[]
  quiz: { question: string; choices: string[]; answer: string }[]
}

export type StudyMaterialRequest = {
  topic: string
  level: Level
  targetLanguage: string
  nativeLanguage: string
  vocabularyTerms?: string[]
}

export type CourseOutlineRequest = {
  courseName: string
  level: Level
  targetLanguage: string
  moduleCount?: number
}

const DEMO_STUDY: StudyMaterialResult = {
  summary: 'Review the headline vocabulary and practise one opinion sentence about the story.',
  keyPoints: ['Identify the main actor and action', 'Use past tense for what happened', 'Add one personal reaction'],
  vocabulary: [
    { term: 'headline', definition: 'The title of a news story' },
    { term: 'source', definition: 'Where the information comes from' },
  ],
  practicePrompts: [
    'Summarise the story in two sentences.',
    'Do you agree with the article? Why?',
  ],
}

const DEMO_OUTLINE: CourseOutlineResult = {
  title: 'Daily news reading',
  audience: 'Intermediate learners (B1)',
  modules: [
    {
      title: 'Module 1 — Headlines',
      lessons: ['Skim for key facts', 'Match vocabulary to meaning', 'Short oral summary'],
    },
    {
      title: 'Module 2 — Opinion',
      lessons: ['Agree / disagree phrases', 'Write a comment', 'Peer-style correction'],
    },
  ],
  quiz: [
    {
      question: 'Which level is easiest for beginners?',
      choices: ['A1', 'C1', 'B2'],
      answer: 'A1',
    },
  ],
}

export async function generateStudyMaterial(
  request: StudyMaterialRequest,
): Promise<StudyMaterialResult> {
  if (!isGeminiConfigured()) {
    return DEMO_STUDY
  }

  const vocabHint =
    request.vocabularyTerms?.length ?
      `Focus vocabulary: ${request.vocabularyTerms.slice(0, 12).join(', ')}.`
    : ''

  try {
    return await generateGeminiJson<StudyMaterialResult>(
      'You create concise personalized study sheets for language learners.',
      [
        `Topic: ${request.topic}`,
        `CEFR level: ${request.level}`,
        `Target language: ${request.targetLanguage}`,
        `Learner native language: ${request.nativeLanguage}`,
        vocabHint,
        'Return JSON: { summary (string), keyPoints (string[]), vocabulary ({term, definition}[]), practicePrompts (string[]) }.',
        'Definitions may briefly use the native language if helpful; examples in the target language.',
      ].join('\n'),
    )
  } catch {
    const text = await generateGeminiText(
      'Create a short study sheet as plain sections: Summary, Key points, Vocabulary, Practice.',
      `Topic: ${request.topic}, level ${request.level}, target ${request.targetLanguage}.`,
    )
    return {
      ...DEMO_STUDY,
      summary: text.slice(0, 500),
    }
  }
}

export async function generateCourseOutline(
  request: CourseOutlineRequest,
): Promise<CourseOutlineResult> {
  if (!isGeminiConfigured()) {
    return { ...DEMO_OUTLINE, title: request.courseName }
  }

  const modules = request.moduleCount ?? 3

  try {
    return await generateGeminiJson<CourseOutlineResult>(
      'You are an instructional designer using Bloom-style progression (ACCG / ClassroomIO style).',
      [
        `Course: ${request.courseName}`,
        `Audience CEFR: ${request.level}`,
        `Language: ${request.targetLanguage}`,
        `Create ${modules} modules with 3 lesson titles each.`,
        'Add 3 multiple-choice quiz questions for the final module.',
        'Return JSON: { title, audience, modules: [{title, lessons: string[]}], quiz: [{question, choices, answer}] }.',
      ].join('\n'),
    )
  } catch {
    return { ...DEMO_OUTLINE, title: request.courseName }
  }
}
