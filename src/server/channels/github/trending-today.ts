import type { NewsItem } from "@/types"
import { defineChannel } from "../definition"
import {
  absoluteUrl,
  browserHeaders,
  cleanText,
  fetchText,
  stripHtml,
} from "../utils"

const baseUrl = "https://github.com"
const sourceUrl = "https://github.com/trending?since=daily"

export default defineChannel({
  key: "github.trending-today",
  siteSlug: "github",
  channelSlug: "trending-today",
  collectorType: "adapter",
  defaults: {
    name: "GitHub Trending",
    intervalSeconds: 1800,
    categorySlugs: ["tech"],
    isHomeVisible: true,
    isSubscribable: true,
  },
  async collect() {
    const html = await fetchText(sourceUrl, {
      headers: {
        ...browserHeaders,
        Accept: "text/html,*/*;q=0.8",
      },
    })
    const items = parseGithubTrendingHtml(html)

    if (items.length === 0) {
      throw new Error("GitHub Trending 未解析到内容，可能是页面结构变更")
    }

    return items
  },
})

export function parseGithubTrendingHtml(html: string): NewsItem[] {
  const articles = html.match(/<article\b[\s\S]*?<\/article>/gi) ?? []
  const items: NewsItem[] = []

  for (const article of articles) {
    const heading = article.match(
      /<h2\b[\s\S]*?<a\b[^>]*href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h2>/i,
    )

    if (!heading) {
      continue
    }

    const path = heading[2]?.trim()
    const title = normalizeRepoTitle(stripHtml(heading[3]))

    if (!path || !/^\/[^/]+\/[^/]+$/.test(path) || !title) {
      continue
    }

    const summary = stripHtml(article.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1])
    const tag = stripHtml(
      article.match(
        /<span\b[^>]*itemprop=(["'])programmingLanguage\1[^>]*>([\s\S]*?)<\/span>/i,
      )?.[2],
    )
    const starCount = compactNumberText(
      stripHtml(
        article.match(
          /<a\b[^>]*href=(["'])[^"']*\/stargazers\1[^>]*>([\s\S]*?)<\/a>/i,
        )?.[2],
      ),
    )
    const todayStars = cleanText(
      stripHtml(article)?.match(/([\d,]+)\s+stars?\s+today/i)?.[0],
    )

    items.push({
      sourceItemId: path,
      title,
      url: absoluteUrl(path, baseUrl),
      summary,
      rankNo: items.length + 1,
      hotValue: todayStars ?? starCount,
      hotLabel: todayStars ?? (starCount ? `${starCount} stars` : undefined),
      tag,
      extra: {
        source: sourceUrl,
        stars: starCount,
      },
    })
  }

  return items
}

function normalizeRepoTitle(value?: string) {
  return cleanText(value)?.replace(/\s*\/\s*/, " / ")
}

function compactNumberText(value?: string) {
  return cleanText(value)?.replace(/\s+/g, "")
}
