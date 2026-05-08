export type DictionaryExample = {
  text: string
}

export type DictionarySense = {
  partOfSpeech?: string
  definitions: string[]
  examples: DictionaryExample[]
}

export type DictionaryEntry = {
  word: string
  phonetic?: string
  senses: DictionarySense[]
  source?: string
}

type DictionaryApiDefinition = {
  definition?: string
  example?: string
}

type DictionaryApiMeaning = {
  partOfSpeech?: string
  definitions?: DictionaryApiDefinition[]
}

type DictionaryApiPhonetic = {
  text?: string
}

type DictionaryApiEntry = {
  word?: string
  phonetic?: string
  phonetics?: DictionaryApiPhonetic[]
  meanings?: DictionaryApiMeaning[]
}

function pickFirst<T>(items: Array<T | undefined> | undefined): T | undefined {
  return items?.find(Boolean)
}

export function supportsDictionaryLanguage(languageCode: string) {
  // This free endpoint is reliably available for English in documented examples.
  // Extend when you add a multi-language provider.
  return languageCode === 'en'
}

export async function fetchDictionaryEntry(languageCode: string, word: string) {
  const trimmed = word.trim()
  if (!trimmed) {
    throw new Error('Missing word')
  }

  if (!supportsDictionaryLanguage(languageCode)) {
    throw new Error('unsupported_language')
  }

  const url = `https://api.dictionaryapi.dev/api/v2/entries/${encodeURIComponent(
    languageCode,
  )}/${encodeURIComponent(trimmed.toLowerCase())}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('not_found')
  }

  const json = (await response.json()) as DictionaryApiEntry[]
  const entry = json[0]

  const phonetic =
    entry?.phonetic ??
    pickFirst(entry?.phonetics?.map((phoneticEntry) => phoneticEntry.text)) ??
    undefined

  const senses: DictionarySense[] =
    entry?.meanings?.map((meaning) => {
      const definitions = (meaning.definitions ?? [])
        .map((definition) => definition.definition)
        .filter((value): value is string => Boolean(value))

      const examples = (meaning.definitions ?? [])
        .map((definition) => definition.example)
        .filter((value): value is string => Boolean(value))
        .slice(0, 3)
        .map((text) => ({ text }))

      return {
        partOfSpeech: meaning.partOfSpeech,
        definitions,
        examples,
      }
    }) ?? []

  return {
    word: entry?.word ?? trimmed,
    phonetic,
    senses: senses.filter((sense) => sense.definitions.length > 0 || sense.examples.length > 0),
    source: 'dictionaryapi.dev',
  } satisfies DictionaryEntry
}

