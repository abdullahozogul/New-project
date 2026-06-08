import {
  GEMINI_MODEL_DEFAULT,
  generateGeminiContents,
  isGeminiConfigured,
  resolveGeminiModel,
} from './geminiCore'

export { GEMINI_MODEL_DEFAULT, resolveGeminiModel }

export type CoachTurn = { role: 'coach' | 'learner'; text: string }

export type CoachContext = {
  nativeLanguageLabel: string
  targetLanguageLabel: string
  level: string
  goal: string
  articleTitle: string
  /** ScholarShelf — stories the learner saved for Q&A (AminaAsif9/ScholarShelf). */
  shelfSummary?: string
  /** brylie/language-lesson-chat — scenario role-play context. */
  scenarioSetting?: string
  scenarioKeyConcepts?: string[]
}

export function isGeminiAiConfigured(): boolean {
  return isGeminiConfigured()
}

function buildSystemInstruction(context: CoachContext): string {
  return [
    'You are Colingual, a supportive language coach.',
    `The learner's native language is ${context.nativeLanguageLabel}.`,
    `They are learning ${context.targetLanguageLabel} at CEFR level ${context.level}.`,
    `Their stated goal: ${context.goal}.`,
    `They are currently reading: "${context.articleTitle}".`,
    context.shelfSummary ?? 'Their personal story shelf is empty.',
    'When answering, you may reference the current article and any titles on their shelf.',
    context.scenarioSetting ?
      `Active scenario lesson: ${context.scenarioSetting}. Key concepts: ${context.scenarioKeyConcepts?.join(', ') ?? ''}. Stay in character for the scenario.`
    : '',
    'Respond in the TARGET language when giving examples or corrections, unless you briefly clarify in the native language when helpful.',
    'Be concise: correct gently, suggest one improved sentence when useful, and ask one short follow-up.',
  ].join(' ')
}

function toGeminiContents(turns: CoachTurn[]): { role: string; parts: { text: string }[] }[] {
  const contents: { role: string; parts: { text: string }[] }[] = []

  for (const turn of turns) {
    const role = turn.role === 'learner' ? 'user' : 'model'
    contents.push({ role, parts: [{ text: turn.text }] })
  }

  if (contents.length === 0) {
    return contents
  }

  if (contents[0].role === 'model') {
    contents.unshift({ role: 'user', parts: [{ text: '(Conversation started.)' }] })
  }

  return contents
}

/**
 * Calls Gemini **gemini-2.5-flash** (unless overridden by `VITE_GEMINI_MODEL`).
 * Configure `VITE_AI_ASSISTANT_ENDPOINT`; local dev can use the Vite proxy with
 * server-only `AI_ASSISTANT_API_KEY`.
 */
export async function generateCoachReply(
  turns: CoachTurn[],
  context: CoachContext,
): Promise<string> {
  const systemInstruction = buildSystemInstruction(context)
  const contents = toGeminiContents(turns)

  return generateGeminiContents(systemInstruction, contents)
}

export function offlineCoachFallback(learnerText: string): string {
  return `Try this refined version: "${learnerText.replace(/\bi\b/g, 'I')}" Add one detail from the article and one opinion to make the answer stronger.`
}
