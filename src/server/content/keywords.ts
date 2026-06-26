export function parseKeywords(value: string) {
  return value
    .split(/[,\n，、;；]+/)
    .map((keyword) => keyword.trim())
    .filter(Boolean)
}

export function findMatchedKeyword(
  value: {
    summary?: string | null
    tag?: string | null
    title: string
  },
  keywords: string[],
) {
  if (keywords.length === 0) {
    return null
  }

  const haystack = `${value.title} ${value.summary ?? ""} ${value.tag ?? ""}`
    .toLowerCase()
    .trim()

  return (
    keywords.find((keyword) => haystack.includes(keyword.toLowerCase())) ?? null
  )
}

export function matchesKeywords(
  value: {
    summary?: string | null
    tag?: string | null
    title: string
  },
  keywords: string[],
) {
  return Boolean(findMatchedKeyword(value, keywords))
}
