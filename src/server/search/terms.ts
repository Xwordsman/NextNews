export function normalizeSearchTerms(query: string, limit = 6) {
  const terms = query
    .trim()
    .toLowerCase()
    .split(/[\s,，、]+/u)
    .map((term) => term.trim())
    .filter(Boolean)

  return Array.from(new Set(terms)).slice(0, Math.max(1, limit))
}
