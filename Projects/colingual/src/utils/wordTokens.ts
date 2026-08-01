/**
 * Tokenize reading text into clickable words vs separators.
 * Uses Unicode letters so Turkish (ı, ğ, ş, İ, …) and other targets stay whole.
 */
const TOKEN_PATTERN = /\p{L}+(?:['’]\p{L}+)?|[^\p{L}]+/gu
const STARTS_WITH_LETTER = /^\p{L}/u
const EDGE_NON_LETTERS = /^[^\p{L}]+|[^\p{L}]+$/gu

export function tokenizeClickableText(text: string): string[] {
  return text.match(TOKEN_PATTERN) ?? [text]
}

export function isWordToken(token: string): boolean {
  return STARTS_WITH_LETTER.test(token)
}

export function extractLexeme(token: string): string {
  return token.replace(EDGE_NON_LETTERS, '')
}
