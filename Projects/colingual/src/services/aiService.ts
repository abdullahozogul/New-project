import type {
  CEFRLevel,
  ComprehensionQuestion,
  ListeningContent,
  SpeakingEvaluationRequest,
  SpeakingEvaluationResponse,
  WritingFeedbackRequest,
  WritingFeedbackResponse,
} from '../types'
import { apiPostJson } from '../lib/apiClient'
import { generateGeminiJson, isGeminiConfigured } from '../lib/geminiCore'

export async function fetchWritingFeedback(
  request: WritingFeedbackRequest,
): Promise<WritingFeedbackResponse> {
  try {
    return await apiPostJson<WritingFeedbackResponse>('/ai/writing-feedback', request)
  } catch {
    throw new Error('writing_feedback_failed')
  }
}

export async function fetchSpeakingEvaluation(
  request: SpeakingEvaluationRequest,
): Promise<SpeakingEvaluationResponse> {
  if (!isGeminiConfigured()) {
    return offlineSpeakingEvaluation(request)
  }

  const parsed = await generateGeminiJson<SpeakingEvaluationResponse>(
    `You evaluate ${request.cefrLevel} speaking practice in the target language.`,
    JSON.stringify({
      transcript: request.transcript,
      prompt: request.prompt,
      durationSeconds: request.durationSeconds,
      wordsPerMinute: request.wordsPerMinute,
      outputShape: {
        fluencyScore: 'number 0-100',
        grammarScore: 'number 0-100',
        vocabularyScore: 'number 0-100',
        pronunciationFeedback: 'string',
        overallCEFR: 'A1|A2|B1|B2|C1|C2',
        strongPoints: ['string'],
        improvementAreas: ['string'],
        modelAnswer: 'string',
      },
    }),
  )
  return parsed
}

function offlineSpeakingEvaluation(
  request: SpeakingEvaluationRequest,
): SpeakingEvaluationResponse {
  const wordCount = request.transcript.split(/\s+/).filter(Boolean).length
  const base = Math.min(85, 40 + wordCount * 2)
  return {
    fluencyScore: base,
    grammarScore: base - 5,
    vocabularyScore: base - 3,
    pronunciationFeedback:
      'Çevrimdışı mod: telaffuz için AI anahtarı ekleyin veya tekrar kaydedin.',
    overallCEFR: request.cefrLevel,
    strongPoints: ['Yanıt verdin ve konuşma pratiği yaptın.'],
    improvementAreas: ['Daha uzun cümleler kurmayı dene.'],
    modelAnswer: 'I think this topic is interesting because it helps me practice every day.',
  }
}

export async function generateComprehensionQuestions(
  passage: string,
  cefrLevel: CEFRLevel,
  count = 5,
): Promise<ComprehensionQuestion[]> {
  if (!isGeminiConfigured()) {
    return Array.from({ length: Math.min(count, 3) }, (_, index) => ({
      id: `q-${index}`,
      question: `What is the main idea? (${index + 1})`,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctIndex: 0,
    }))
  }

  const parsed = await generateGeminiJson<{ questions: ComprehensionQuestion[] }>(
    `Generate ${count} multiple-choice comprehension questions for ${cefrLevel} learners.`,
    JSON.stringify({
      passage: passage.slice(0, 4000),
      count,
      outputShape: {
        questions: [
          {
            id: 'string',
            question: 'string',
            options: ['string'],
            correctIndex: 'number',
          },
        ],
      },
    }),
  )
  return parsed.questions ?? []
}

export async function generateListeningContent(
  cefrLevel: CEFRLevel,
  topic: string,
  durationTarget: '30s' | '1min' | '2min',
): Promise<ListeningContent> {
  const parsed = await generateGeminiJson<ListeningContent>(
    `Create a ${durationTarget} listening script at CEFR ${cefrLevel} about: ${topic}.`,
    JSON.stringify({
      topic,
      durationTarget,
      outputShape: {
        id: 'string',
        title: 'string',
        transcript: 'string',
        cefrLevel,
        topic,
        questions: [
          {
            id: 'string',
            question: 'string',
            options: ['string'],
            correctIndex: 'number',
          },
        ],
      },
    }),
  )
  return parsed
}

export const CONVERSATION_SYSTEM_PROMPT = (params: {
  targetLanguage: string
  nativeLanguage: string
  cefrLevel: CEFRLevel
  scenario: string
}) => `
Sen bir dil öğretmenisin. Kullanıcı ${params.targetLanguage} öğreniyor ve şu an ${params.cefrLevel} seviyesinde.
Senaryomuz: ${params.scenario}.
Kurallar:
- ${params.cefrLevel} seviyesine uygun kelime ve yapılar kullan.
- Her 3-4 yanıtta bir doğal şekilde bir düzeltme/öneri yap.
- Konuşmayı ${params.targetLanguage} dilinde sürdür, kullanıcı zorunlu olmadıkça ${params.nativeLanguage}'ya geçme.
- Yanıtların 1-3 cümle olsun.
`.trim()
