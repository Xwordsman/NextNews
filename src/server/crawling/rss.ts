import { XMLParser } from "fast-xml-parser"
import type { ChannelDefinition } from "@/server/channels/definition"
import type { NewsItem } from "@/types"

type XmlRecord = Record<string, unknown>

const parser = new XMLParser({
  attributeNamePrefix: "@",
  ignoreAttributes: false,
  textNodeName: "#text",
  trimValues: true,
})

export async function fetchRssItems(
  definition: ChannelDefinition,
): Promise<NewsItem[]> {
  const url = definition.rss?.url

  if (!url) {
    throw new Error(`RSS channel ${definition.key} is missing rss.url`)
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/rss+xml, application/atom+xml, application/xml",
        "User-Agent": "NextNewsBot/0.1 (+https://nextnews.local)",
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`RSS request failed with ${response.status}`)
    }

    const xml = await response.text()
    return parseRssXml(xml, url)
  } finally {
    clearTimeout(timeout)
  }
}

function parseRssXml(xml: string, feedUrl: string): NewsItem[] {
  const root = asRecord(parser.parse(xml))

  if (!root) {
    return []
  }

  const rssChannel = asRecord(asRecord(root.rss)?.channel)
  const rssItems = asArray(rssChannel?.item)

  if (rssItems.length > 0) {
    return rssItems
      .map((item, index) => parseRssItem(item, feedUrl, index + 1))
      .filter((item): item is NewsItem => Boolean(item))
  }

  const atomFeed = asRecord(root.feed)
  const atomEntries = asArray(atomFeed?.entry)

  return atomEntries
    .map((entry, index) => parseAtomEntry(entry, feedUrl, index + 1))
    .filter((item): item is NewsItem => Boolean(item))
}

function parseRssItem(
  value: unknown,
  feedUrl: string,
  rankNo: number,
): NewsItem | null {
  const item = asRecord(value)

  if (!item) {
    return null
  }

  const title = textValue(item.title)
  const rawUrl = textValue(item.link) ?? textValue(item.guid)
  const url = rawUrl ? absoluteUrl(rawUrl, feedUrl) : undefined

  if (!title || !url) {
    return null
  }

  return {
    sourceItemId: textValue(item.guid) ?? url,
    title,
    url,
    imageUrl: imageValue(item),
    summary: stripHtml(textValue(item.description)),
    rankNo,
    publishedAt: textValue(item.pubDate) ?? textValue(item["dc:date"]),
  }
}

function parseAtomEntry(
  value: unknown,
  feedUrl: string,
  rankNo: number,
): NewsItem | null {
  const entry = asRecord(value)

  if (!entry) {
    return null
  }

  const title = textValue(entry.title)
  const rawUrl = atomLinkValue(entry.link)
  const url = rawUrl ? absoluteUrl(rawUrl, feedUrl) : undefined

  if (!title || !url) {
    return null
  }

  return {
    sourceItemId: textValue(entry.id) ?? url,
    title,
    url,
    imageUrl: imageValue(entry),
    summary: stripHtml(textValue(entry.summary) ?? textValue(entry.content)),
    rankNo,
    publishedAt: textValue(entry.published) ?? textValue(entry.updated),
  }
}

function asRecord(value: unknown): XmlRecord | undefined {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as XmlRecord
  }

  return undefined
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value
  }

  return value === undefined || value === null ? [] : [value]
}

function textValue(value: unknown): string | undefined {
  if (typeof value === "string" || typeof value === "number") {
    return cleanString(String(value))
  }

  const record = asRecord(value)

  if (!record) {
    return undefined
  }

  return textValue(record["#text"])
}

function atomLinkValue(value: unknown): string | undefined {
  const links = asArray(value)

  for (const link of links) {
    const record = asRecord(link)

    if (!record) {
      const text = textValue(link)
      if (text) {
        return text
      }
      continue
    }

    const rel = textValue(record["@rel"])
    const href = textValue(record["@href"])

    if (href && (!rel || rel === "alternate")) {
      return href
    }
  }

  return undefined
}

function imageValue(item: XmlRecord): string | undefined {
  const candidates = [
    item["media:thumbnail"],
    item["media:content"],
    item.enclosure,
    item.image,
  ]

  for (const candidate of candidates) {
    for (const value of asArray(candidate)) {
      const record = asRecord(value)
      const url = record ? textValue(record["@url"]) : textValue(value)

      if (url) {
        return url
      }
    }
  }

  return undefined
}

function absoluteUrl(value: string, baseUrl: string) {
  try {
    return new URL(value, baseUrl).toString()
  } catch {
    return value
  }
}

function stripHtml(value?: string) {
  return cleanString(value?.replace(/<[^>]+>/g, " "))
}

function cleanString(value?: string) {
  const trimmed = value?.replace(/\s+/g, " ").trim()
  return trimmed || undefined
}
