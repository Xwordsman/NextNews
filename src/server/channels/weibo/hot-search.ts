import type { NewsItem } from "@/types"
import { defineChannel } from "../definition"
import {
  absoluteUrl,
  browserHeaders,
  cleanText,
  decodeHtmlEntities,
  fetchText,
  stripHtml,
} from "../utils"

const baseUrl = "https://s.weibo.com"
const sourceUrl = `${baseUrl}/top/summary?cate=realtimehot`
const defaultVisitorCookie =
  "SUB=_2AkMWIuNSf8NxqwJRmP8dy2rhaoV2ygrEieKgfhKJJRMxHRl-yT9jqk86tRB6PaLNvQZR6zYUcYVT1zSjoSreQHidcUq7"

export default defineChannel({
  key: "weibo.hot-search",
  siteSlug: "weibo",
  channelSlug: "hot-search",
  collectorType: "adapter",
  defaults: {
    name: "微博热搜",
    intervalSeconds: 120,
    categorySlugs: ["general", "entertainment"],
    isHomeVisible: true,
    isSubscribable: true,
  },
  async collect() {
    const html = await fetchText(sourceUrl, {
      headers: {
        ...browserHeaders,
        Cookie: process.env.WEIBO_VISITOR_COOKIE ?? defaultVisitorCookie,
        Referer: sourceUrl,
      },
    })
    const items = parseWeiboHotSearchHtml(html)

    if (items.length === 0) {
      throw new Error(
        "微博热搜未解析到内容，可能是访客 Cookie 失效或页面结构变更",
      )
    }

    return items
  },
})

export function parseWeiboHotSearchHtml(html: string): NewsItem[] {
  const rows = html.match(/<tr\b[\s\S]*?<\/tr>/gi) ?? []
  const items: NewsItem[] = []

  for (const row of rows) {
    const link = extractFirstLink(extractTableCell(row, "td-02") ?? row)

    if (!link) {
      continue
    }

    const isRankedItem = /(?:[?&]|&amp;)band_rank=/.test(link.href)

    if (!isRankedItem && items.length === 0) {
      continue
    }

    const title = stripHtml(link.label)
    const url = absoluteUrl(link.href, baseUrl)

    if (!title || !url) {
      continue
    }

    const hotValue = extractHotValue(row)
    const tag = stripHtml(extractTableCell(row, "td-03"))

    items.push({
      sourceItemId: title,
      title,
      url,
      rankNo: items.length + 1,
      hotValue,
      hotLabel: hotValue,
      tag,
      extra: {
        source: sourceUrl,
      },
    })
  }

  return items
}

function extractTableCell(row: string, className: string) {
  const pattern = new RegExp(
    `<td\\b[^>]*class=["'][^"']*${className}[^"']*["'][^>]*>([\\s\\S]*?)<\\/td>`,
    "i",
  )
  return row.match(pattern)?.[1]
}

function extractFirstLink(value: string) {
  const match = value.match(/<a\b[^>]*href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/i)

  if (!match) {
    return undefined
  }

  const href = decodeHtmlEntities(match[2] ?? "")

  if (!href || href.includes("javascript:void")) {
    return undefined
  }

  return {
    href,
    label: match[3] ?? "",
  }
}

function extractHotValue(row: string) {
  const cell = extractTableCell(row, "td-02")

  if (!cell) {
    return undefined
  }

  const withoutLink = cell.replace(
    /<a\b[^>]*href=(["'])(.*?)\1[^>]*>[\s\S]*?<\/a>/i,
    " ",
  )
  return cleanText(stripHtml(withoutLink))
}
