/** Google News RSS titles are often "Headline - Publisher". */
export function splitHeadlineSource(rawTitle: string): {
  title: string
  sourceName?: string
} {
  const trimmed = rawTitle.trim()
  if (!trimmed) {
    return { title: trimmed }
  }

  const sep = trimmed.lastIndexOf(' - ')
  if (sep <= 0 || sep >= trimmed.length - 3) {
    return { title: trimmed }
  }

  const sourceName = trimmed.slice(sep + 3).trim()
  const title = trimmed.slice(0, sep).trim()

  if (!sourceName || sourceName.length > 100 || title.length < 8) {
    return { title: trimmed }
  }

  return { title, sourceName }
}

export function headlineFieldsFromRssTitle(rawTitle: string, explicitSource?: string): {
  title: string
  sourceName?: string
} {
  const parsed = splitHeadlineSource(rawTitle)
  const sourceName = explicitSource?.trim() || parsed.sourceName
  return sourceName ? { title: parsed.title, sourceName } : parsed
}
