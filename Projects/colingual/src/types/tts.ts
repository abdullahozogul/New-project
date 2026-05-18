import type { CEFRLevel } from './index'

export type TTSProvider = 'elevenlabs' | 'openai'

export type TTSUseCase =
  | 'listening_content'
  | 'pronunciation'
  | 'ui_feedback'
  | 'conversation'
  | 'word_definition'

export interface TTSRequest {
  text: string
  language: string
  useCase: TTSUseCase
  cefrLevel?: CEFRLevel
  voice?: string
  speed?: number
  streaming?: boolean
}

export interface TTSResponse {
  audioUrl: string
  duration?: number
  provider: TTSProvider
  cached: boolean
}
