import { useCallback, useState } from 'react'
import type { CEFRLevel, ComprehensionQuestion } from '../types'
import { generateComprehensionQuestions } from '../services/aiService'

export function useReadingComprehension() {
  const [questions, setQuestions] = useState<ComprehensionQuestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async (passage: string, cefrLevel: CEFRLevel, count = 5) => {
    setLoading(true)
    setError(null)
    try {
      const result = await generateComprehensionQuestions(passage, cefrLevel, count)
      setQuestions(result)
    } catch {
      setError('Sorular üretilemedi.')
      setQuestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  return { questions, loading, error, generate }
}
