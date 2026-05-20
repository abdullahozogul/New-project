/** ~1.5k chars — güvenli parça boyutu (ElevenLabs/OpenAI tek istek). */
const DEFAULT_CHUNK_SIZE = 1500

export function splitTextIntoListeningChunks(
  text: string,
  maxChunkSize = DEFAULT_CHUNK_SIZE,
): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) {
    return []
  }
  if (normalized.length <= maxChunkSize) {
    return [normalized]
  }

  const sentences = normalized.split(/(?<=[.!?])\s+/).filter(Boolean)
  const chunks: string[] = []
  let buffer = ''

  const flush = () => {
    if (buffer.trim()) {
      chunks.push(buffer.trim())
      buffer = ''
    }
  }

  for (const sentence of sentences) {
    const next = buffer ? `${buffer} ${sentence}` : sentence
    if (next.length > maxChunkSize) {
      flush()
      if (sentence.length > maxChunkSize) {
        for (let offset = 0; offset < sentence.length; offset += maxChunkSize) {
          chunks.push(sentence.slice(offset, offset + maxChunkSize).trim())
        }
      } else {
        buffer = sentence
      }
    } else {
      buffer = next
    }
  }

  flush()
  return chunks.length > 0 ? chunks : [normalized.slice(0, maxChunkSize)]
}
