import type { NewsItem } from "@/types"
import { defineChannel } from "../definition"
import { browserHeaders, cleanText, fetchJson } from "../utils"

type ZhihuHotListResponse = {
  data?: ZhihuHotListFeed[]
}

type ZhihuHotListFeed = {
  card_id?: string
  detail_text?: string
  id?: string
  target?: {
    excerpt?: string
    id?: number | string
    title?: string
    url?: string
    excerpt_area?: {
      text?: string
    }
    image_area?: {
      url?: string
    }
    link?: {
      url?: string
    }
    metrics_area?: {
      text?: string
    }
    title_area?: {
      text?: string
    }
  }
  children?: Array<{
    thumbnail?: string
  }>
}

const sourceUrl =
  "https://www.zhihu.com/api/v3/feed/topstory/hot-list-web?limit=30&desktop=true"

export default defineChannel({
  key: "zhihu.hot-list",
  siteSlug: "zhihu",
  channelSlug: "hot-list",
  collectorType: "adapter",
  defaults: {
    name: "知乎热榜",
    intervalSeconds: 300,
    categorySlugs: ["general"],
    isHomeVisible: true,
    isSubscribable: true,
  },
  async collect() {
    const response = await fetchJson<ZhihuHotListResponse>(sourceUrl, {
      headers: {
        ...browserHeaders,
        Accept: "application/json, text/plain, */*",
        Referer: "https://www.zhihu.com/hot",
        "x-requested-with": "fetch",
      },
    })
    const items = parseZhihuHotListResponse(response)

    if (items.length === 0) {
      throw new Error("知乎热榜未解析到内容，可能是接口鉴权或响应结构变更")
    }

    return items
  },
})

export function parseZhihuHotListResponse(
  response: ZhihuHotListResponse,
): NewsItem[] {
  const items: NewsItem[] = []

  for (const [index, item] of (response.data ?? []).entries()) {
    const target = item.target
    const title = cleanText(target?.title_area?.text ?? target?.title)
    const rawUrl = target?.link?.url ?? target?.url
    const url = rawUrl ? normalizeZhihuUrl(rawUrl) : undefined

    if (!title || !url) {
      continue
    }

    const hotLabel = cleanText(target?.metrics_area?.text ?? item.detail_text)
    const summary = cleanText(target?.excerpt_area?.text ?? target?.excerpt)

    items.push({
      sourceItemId: target?.id?.toString() ?? item.card_id ?? item.id ?? url,
      title,
      url,
      imageUrl: target?.image_area?.url ?? item.children?.[0]?.thumbnail,
      summary,
      rankNo: index + 1,
      hotLabel,
      hotValue: hotLabel,
      extra: {
        source: sourceUrl,
      },
    })
  }

  return items
}

function normalizeZhihuUrl(value: string) {
  const questionId = value.match(/\/questions?\/(\d+)/)?.[1]

  if (questionId) {
    return `https://www.zhihu.com/question/${questionId}`
  }

  return value
}
