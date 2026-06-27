export const browserHeaders = {
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
}

const htmlEntities: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
}

export async function fetchText(
  url: string,
  init: RequestInit = {},
  timeoutMs = 15_000,
) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Request failed with ${response.status} for ${url}`)
    }

    return response.text()
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timed out for ${url}`)
    }

    throw error
  } finally {
    clearTimeout(timeout)
  }
}

export async function fetchJson<T>(
  url: string,
  init: RequestInit = {},
  timeoutMs = 15_000,
) {
  const text = await fetchText(url, init, timeoutMs)
  return JSON.parse(text) as T
}

export function cleanText(value?: string) {
  const trimmed = value?.replace(/\s+/g, " ").trim()
  return trimmed || undefined
}

export function stripHtml(value?: string) {
  if (!value) {
    return undefined
  }

  return cleanText(
    decodeHtmlEntities(
      value
        .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
        .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " "),
    ),
  )
}

export function decodeHtmlEntities(value: string) {
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
    const key = String(entity).toLowerCase()

    if (key.startsWith("#x")) {
      return decodeCodePoint(Number.parseInt(key.slice(2), 16), match)
    }

    if (key.startsWith("#")) {
      return decodeCodePoint(Number.parseInt(key.slice(1), 10), match)
    }

    return htmlEntities[key] ?? match
  })
}

export function absoluteUrl(value: string, baseUrl: string) {
  try {
    return new URL(decodeHtmlEntities(value), baseUrl).toString()
  } catch {
    return decodeHtmlEntities(value)
  }
}

function decodeCodePoint(value: number, fallback: string) {
  if (!Number.isFinite(value)) {
    return fallback
  }

  try {
    return String.fromCodePoint(value)
  } catch {
    return fallback
  }
}
