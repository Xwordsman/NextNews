import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { load } from "cheerio"
import { XMLParser } from "fast-xml-parser"
import type { NewsItem } from "@/types"
import {
  absoluteUrl,
  browserHeaders,
  cleanText,
  fetchJson,
  fetchText,
  stripHtml,
} from "../utils"

type NewsnowCollector = () => Promise<NewsItem[]>
type UnknownRecord = Record<string, unknown>

const jsonHeaders = {
  ...browserHeaders,
  Accept: "application/json, text/plain, */*",
}

const collectors: Record<string, NewsnowCollector> = {
  "36kr.quick": collect36krQuick,
  "36kr.renqi": collect36krRenqi,
  "aihot.all": collectAihot,
  "baidu.hot-search": collectBaiduHotSearch,
  "bilibili.hot-search": collectBilibiliHotSearch,
  "bilibili.hot-video": collectBilibiliHotVideo,
  "bilibili.ranking": collectBilibiliRanking,
  "cankaoxiaoxi.news": collectCankaoxiaoxi,
  "chongbuluo.hot": collectChongbuluoHot,
  "cls.depth": collectClsDepth,
  "cls.hot": collectClsHot,
  "cls.telegraph": collectClsTelegraph,
  "coolapk.hot-list": collectCoolapkHotList,
  "douban.hot-movie": collectDoubanHotMovie,
  "douyin.hot-list": collectDouyinHotList,
  "fastbull.express": collectFastbullExpress,
  "fastbull.news": collectFastbullNews,
  "gelonghui.news": collectGelonghuiNews,
  "hackernews.top": collectHackerNews,
  "hupu.daily-hot": collectHupuDailyHot,
  "ifeng.hot": collectIfengHot,
  "iqiyi.hot-ranklist": collectIqiyiHotRanklist,
  "ithome.news": collectIthomeNews,
  "jin10.flash": collectJin10Flash,
  "juejin.hot": collectJuejinHot,
  "kaopu.news": collectKaopuNews,
  "kuaishou.hot-list": collectKuaishouHotList,
  "mktnews.flash": collectMktnewsFlash,
  "nowcoder.hot-search": collectNowcoderHotSearch,
  "qqvideo.tv-hotsearch": collectQqVideoTvHotSearch,
  "sputniknewscn.news": collectSputnikNewsCn,
  "sspai.hot": collectSspaiHot,
  "steam.online": collectSteamOnline,
  "tencent.hot": collectTencentHot,
  "thepaper.hot-list": collectThepaperHotList,
  "tieba.hot-topic": collectTiebaHotTopic,
  "toutiao.hot-board": collectToutiaoHotBoard,
  "v2ex.share": collectV2exShare,
  "wallstreetcn.hot": collectWallstreetcnHot,
  "wallstreetcn.news": collectWallstreetcnNews,
  "wallstreetcn.quick": collectWallstreetcnQuick,
  "xueqiu.hotstock": collectXueqiuHotStock,
  "zaobao.realtime": collectZaobaoRealtime,
}

export const implementedNewsnowCollectorKeys = new Set(Object.keys(collectors))

export async function collectNewsnowSource(definitionKey: string) {
  const collector = collectors[definitionKey]

  if (!collector) {
    throw new Error(`NewsNow 数据源尚未实现采集器：${definitionKey}`)
  }

  return collector()
}

async function collectV2exShare() {
  type V2exFeed = {
    items?: Array<{
      date_modified?: string
      date_published?: string
      id?: string
      title?: string
      url?: string
    }>
  }
  const feeds = await Promise.all(
    ["create", "ideas", "programmer", "share"].map((node) =>
      fetchJson<V2exFeed>(`https://www.v2ex.com/feed/${node}.json`, {
        headers: jsonHeaders,
      }),
    ),
  )

  return rankItems(
    feeds
      .flatMap((feed) => feed.items ?? [])
      .map((item) => ({
        sourceItemId: item.id ?? item.url,
        title: item.title ?? "",
        url: item.url ?? "",
        publishedAt: dateToIso(item.date_modified ?? item.date_published),
      }))
      .sort(comparePublishedAtDesc),
  )
}

async function collectZaobaoRealtime() {
  const buffer = await fetchArrayBuffer("https://www.zaochenbao.com/realtime/")
  const decoder = new TextDecoder("gb18030")
  const html = decoder.decode(buffer)
  const $ = load(html)
  const baseUrl = "https://www.zaochenbao.com"
  const items: NewsItem[] = []

  $("div.list-block>a.item").each((_, element) => {
    const link = $(element)
    const href = link.attr("href")
    const title = cleanText(link.find(".eps").text())
    const dateText = cleanText(link.find(".pdt10").text().replace(/-\s/g, " "))

    if (!href || !title) {
      return
    }

    items.push({
      sourceItemId: href,
      title,
      url: absoluteUrl(href, baseUrl),
      publishedAt: parseRelativeDateToIso(dateText),
    })
  })

  return rankItems(items.sort(comparePublishedAtDesc))
}

async function collectCoolapkHotList() {
  type CoolapkResponse = {
    data?: Array<{
      editor_title?: string
      id?: string
      message?: string
      targetRow?: {
        subTitle?: string
      }
      url?: string
    }>
  }
  const url =
    "https://api.coolapk.com/v6/page/dataList?url=%2Ffeed%2FstatList%3FcacheExpires%3D300%26statType%3Dday%26sortField%3Ddetailnum%26title%3D%E4%BB%8A%E6%97%A5%E7%83%AD%E9%97%A8&title=%E4%BB%8A%E6%97%A5%E7%83%AD%E9%97%A8&subTitle=&page=1"
  const response = await fetchJson<CoolapkResponse>(url, {
    headers: await coolapkHeaders(),
  })

  return rankItems(
    (response.data ?? []).map((item) => {
      const messageTitle = stripHtml(item.message)?.split("\n")[0]
      const title = cleanText(item.editor_title ?? messageTitle)

      return {
        sourceItemId: item.id,
        title: title ?? "",
        url: item.url ? absoluteUrl(item.url, "https://www.coolapk.com") : "",
        hotLabel: cleanText(item.targetRow?.subTitle),
        hotValue: cleanText(item.targetRow?.subTitle),
      }
    }),
  )
}

async function collectMktnewsFlash() {
  type MktnewsResponse = {
    data?: Array<{
      data?: {
        content?: string
        title?: string
      }
      id?: string
      important?: number
      time?: string
    }>
  }
  const response = await fetchJson<MktnewsResponse>(
    "https://api.mktnews.net/api/flash?type=0&limit=50",
    {
      headers: {
        ...jsonHeaders,
        Origin: "https://mktnews.net",
        Referer: "https://mktnews.net/",
      },
    },
  )

  return rankItems(
    (response.data ?? [])
      .map((item) => {
        const content = cleanText(item.data?.content)
        const title = cleanText(
          item.data?.title ?? extractBracketTitle(content) ?? content,
        )

        return {
          sourceItemId: item.id,
          title: title ?? "",
          url: item.id
            ? `https://mktnews.net/flashDetail.html?id=${item.id}`
            : "",
          summary: content,
          tag: item.important === 1 ? "重要" : undefined,
          publishedAt: parseShanghaiDateToIso(item.time),
        }
      })
      .sort(comparePublishedAtDesc),
  )
}

async function collectWallstreetcnQuick() {
  type LiveResponse = {
    data?: {
      items?: WallstreetcnItem[]
    }
  }
  const response = await fetchJson<LiveResponse>(
    "https://api-one.wallstcn.com/apiv1/content/lives?channel=global-channel&limit=30",
    { headers: jsonHeaders },
  )

  return rankItems(
    (response.data?.items ?? []).map((item) => ({
      sourceItemId: item.id?.toString(),
      title: cleanText(item.title ?? item.content_text) ?? "",
      url: item.uri ?? "",
      summary: cleanText(item.content_short ?? item.content_text),
      publishedAt: timestampToIso(item.display_time, 1000),
    })),
  )
}

async function collectWallstreetcnNews() {
  type NewsResponse = {
    data?: {
      items?: Array<{
        resource?: WallstreetcnItem
        resource_type?: string
      }>
    }
  }
  const response = await fetchJson<NewsResponse>(
    "https://api-one.wallstcn.com/apiv1/content/information-flow?channel=global-channel&accept=article&limit=30",
    { headers: jsonHeaders },
  )

  return rankItems(
    (response.data?.items ?? [])
      .filter(
        (item) =>
          item.resource_type !== "theme" &&
          item.resource_type !== "ad" &&
          item.resource?.type !== "live" &&
          Boolean(item.resource?.uri),
      )
      .map(({ resource }) => ({
        sourceItemId: resource?.id?.toString(),
        title: cleanText(resource?.title ?? resource?.content_short) ?? "",
        url: resource?.uri ?? "",
        summary: cleanText(resource?.content_short ?? resource?.content_text),
        publishedAt: timestampToIso(resource?.display_time, 1000),
      })),
  )
}

async function collectWallstreetcnHot() {
  type HotResponse = {
    data?: {
      day_items?: WallstreetcnItem[]
    }
  }
  const response = await fetchJson<HotResponse>(
    "https://api-one.wallstcn.com/apiv1/content/articles/hot?period=all",
    { headers: jsonHeaders },
  )

  return rankItems(
    (response.data?.day_items ?? []).map((item) => ({
      sourceItemId: item.id?.toString(),
      title: cleanText(item.title) ?? "",
      url: item.uri ?? "",
    })),
  )
}

async function collect36krQuick() {
  const baseUrl = "https://www.36kr.com"
  const html = await fetchText(`${baseUrl}/newsflashes`, {
    headers: browserHeaders,
  })
  const $ = load(html)
  const items: NewsItem[] = []

  $(".newsflash-item").each((_, element) => {
    const block = $(element)
    const link = block.find("a.item-title")
    const href = link.attr("href")
    const title = cleanText(link.text())
    const relativeDate = cleanText(block.find(".time").text())

    if (!href || !title) {
      return
    }

    items.push({
      sourceItemId: href,
      title,
      url: absoluteUrl(href, baseUrl),
      publishedAt: parseRelativeDateToIso(relativeDate),
    })
  })

  return rankItems(items)
}

async function collect36krRenqi() {
  const baseUrl = "https://36kr.com"
  const date = formatShanghaiDate(new Date())
  const html = await fetchText(`${baseUrl}/hot-list/renqi/${date}/1`, {
    headers: {
      ...browserHeaders,
      Referer: "https://36kr.com/",
    },
  })
  const $ = load(html)
  const items: NewsItem[] = []

  $(".article-item-info").each((_, element) => {
    const block = $(element)
    const link = block.find("a.article-item-title.weight-bold")
    const href = link.attr("href")
    const title = cleanText(link.text())
    const summary = cleanText(
      block.find("a.article-item-description.ellipsis-2").text(),
    )
    const author = cleanText(block.find(".kr-flow-bar-author").text())
    const hot = cleanText(block.find(".kr-flow-bar-hot span").text())

    if (!href || !title) {
      return
    }

    items.push({
      sourceItemId: href,
      title,
      url: absoluteUrl(href, baseUrl),
      summary,
      hotLabel: [author, hot].filter(Boolean).join(" | ") || undefined,
      hotValue: hot,
    })
  })

  return items.length > 0 ? rankItems(items) : collect36krQuick()
}

async function collectDouyinHotList() {
  type DouyinResponse = {
    data?: {
      word_list?: Array<{
        hot_value?: string
        sentence_id?: string
        word?: string
      }>
    }
  }
  const cookie = await getCookieHeader("https://login.douyin.com/")
  const response = await fetchJson<DouyinResponse>(
    "https://www.douyin.com/aweme/v1/web/hot/search/list/?device_platform=webapp&aid=6383&channel=channel_pc_web&detail_list=1",
    {
      headers: {
        ...jsonHeaders,
        Cookie: cookie,
        Referer: "https://www.douyin.com/",
      },
    },
  )

  return rankItems(
    (response.data?.word_list ?? []).map((item) => ({
      sourceItemId: item.sentence_id,
      title: item.word ?? "",
      url: item.sentence_id
        ? `https://www.douyin.com/hot/${item.sentence_id}`
        : "",
      hotValue: item.hot_value,
      hotLabel: item.hot_value,
    })),
  )
}

async function collectHupuDailyHot() {
  const html = await fetchText("https://bbs.hupu.com/topic-daily-hot", {
    headers: browserHeaders,
  })
  const regex =
    /<li class="bbs-sl-web-post-body">[\s\S]*?<a href="(\/[^"]+?\.html)"[^>]*?class="p-title"[^>]*>([^<]+)<\/a>/g
  const items: NewsItem[] = []
  let match: RegExpExecArray | null

  while ((match = regex.exec(html))) {
    const path = match[1]
    const title = cleanText(match[2])

    if (!path || !title) {
      continue
    }

    items.push({
      sourceItemId: path,
      title,
      url: `https://bbs.hupu.com${path}`,
      mobileUrl: `https://bbs.hupu.com${path}`,
    })
  }

  return rankItems(items)
}

async function collectAihot() {
  type AihotResponse = {
    items?: Array<{
      category?: string | null
      id?: string
      publishedAt?: string | null
      source?: string
      summary?: string | null
      title?: string
      url?: string
    }>
  }

  try {
    const response = await fetchJson<AihotResponse>(
      "https://aihot.virxact.com/api/public/items?mode=all&take=30",
      {
        headers: {
          ...jsonHeaders,
          "User-Agent": `${browserHeaders["User-Agent"]} NextNews/0.1`,
        },
      },
    )

    const items = rankItems(
      (response.items ?? []).map((item) => ({
        sourceItemId: item.id,
        title: item.title ?? "",
        url: item.url ?? "",
        summary: cleanText(item.summary ?? undefined),
        hotLabel:
          [item.source, item.category].filter(Boolean).join(" · ") || undefined,
        publishedAt: dateToIso(item.publishedAt ?? undefined),
      })),
    )

    return items.length > 0
      ? items
      : fetchRssUrl("https://aihot.virxact.com/feed/all.xml")
  } catch {
    return fetchRssUrl("https://aihot.virxact.com/feed/all.xml")
  }
}

async function collectTiebaHotTopic() {
  type TiebaResponse = {
    data?: {
      bang_topic?: {
        topic_list?: Array<{
          topic_id?: string
          topic_name?: string
          topic_url?: string
        }>
      }
    }
  }
  const response = await fetchJson<TiebaResponse>(
    "https://tieba.baidu.com/hottopic/browse/topicList",
    { headers: jsonHeaders },
  )

  return rankItems(
    (response.data?.bang_topic?.topic_list ?? []).map((item) => ({
      sourceItemId: item.topic_id,
      title: item.topic_name ?? "",
      url: item.topic_url ?? "",
    })),
  )
}

async function collectToutiaoHotBoard() {
  type ToutiaoResponse = {
    data?: Array<{
      ClusterIdStr?: string
      HotValue?: string
      Image?: {
        url?: string
      }
      LabelUri?: {
        url?: string
      }
      Title?: string
    }>
  }
  const response = await fetchJson<ToutiaoResponse>(
    "https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc",
    {
      headers: {
        ...jsonHeaders,
        Referer: "https://www.toutiao.com/",
      },
    },
  )

  return rankItems(
    (response.data ?? []).map((item) => ({
      sourceItemId: item.ClusterIdStr,
      title: item.Title ?? "",
      url: item.ClusterIdStr
        ? `https://www.toutiao.com/trending/${item.ClusterIdStr}/`
        : "",
      imageUrl: item.Image?.url ?? item.LabelUri?.url,
      hotValue: item.HotValue,
      hotLabel: item.HotValue,
    })),
  )
}

async function collectIthomeNews() {
  const html = await fetchText("https://www.ithome.com/list/", {
    headers: browserHeaders,
  })
  const $ = load(html)
  const items: NewsItem[] = []

  $("#list > div.fl > ul > li").each((_, element) => {
    const block = $(element)
    const link = block.find("a.t")
    const href = link.attr("href")
    const title = cleanText(link.text())
    const dateText = cleanText(block.find("i").text())
    const isAd =
      href?.includes("lapin") ||
      ["神券", "优惠", "补贴", "京东"].some((keyword) =>
        title?.includes(keyword),
      )

    if (!href || !title || isAd) {
      return
    }

    items.push({
      sourceItemId: href,
      title,
      url: href,
      publishedAt: parseRelativeDateToIso(dateText),
    })
  })

  return rankItems(items.sort(comparePublishedAtDesc))
}

async function collectThepaperHotList() {
  type ThepaperResponse = {
    data?: {
      hotNews?: Array<{
        contId?: string
        name?: string
        pubTimeLong?: string
      }>
    }
  }
  const response = await fetchJson<ThepaperResponse>(
    "https://cache.thepaper.cn/contentapi/wwwIndex/rightSidebar",
    { headers: jsonHeaders },
  )

  return rankItems(
    (response.data?.hotNews ?? []).map((item) => ({
      sourceItemId: item.contId,
      title: item.name ?? "",
      url: item.contId
        ? `https://www.thepaper.cn/newsDetail_forward_${item.contId}`
        : "",
      mobileUrl: item.contId
        ? `https://m.thepaper.cn/newsDetail_forward_${item.contId}`
        : undefined,
      publishedAt: timestampToIso(item.pubTimeLong),
    })),
  )
}

async function collectSputnikNewsCn() {
  const html = await fetchText(
    "https://sputniknews.cn/services/widget/lenta/",
    {
      headers: browserHeaders,
    },
  )
  const $ = load(html)
  const items: NewsItem[] = []

  $(".lenta__item").each((_, element) => {
    const link = $(element).find("a")
    const href = link.attr("href")
    const title = cleanText(link.find(".lenta__item-text").text())
    const unixTime = link.find(".lenta__item-date").attr("data-unixtime")

    if (!href || !title) {
      return
    }

    items.push({
      sourceItemId: href,
      title,
      url: absoluteUrl(href, "https://sputniknews.cn"),
      publishedAt: timestampToIso(unixTime, 1000),
    })
  })

  return rankItems(items.sort(comparePublishedAtDesc))
}

async function collectCankaoxiaoxi() {
  type CankaoxiaoxiResponse = {
    list?: Array<{
      data?: {
        id?: string
        publishTime?: string
        title?: string
        url?: string
      }
    }>
  }
  const responses = await Promise.all(
    ["zhongguo", "guandian", "gj"].map((channel) =>
      fetchJson<CankaoxiaoxiResponse>(
        `http://china.cankaoxiaoxi.com/json/channel/${channel}/list.json`,
        { headers: jsonHeaders },
      ),
    ),
  )

  return rankItems(
    responses
      .flatMap((response) => response.list ?? [])
      .map((item) => ({
        sourceItemId: item.data?.id,
        title: item.data?.title ?? "",
        url: item.data?.url ?? "",
        publishedAt: parseShanghaiDateToIso(item.data?.publishTime),
      }))
      .sort(comparePublishedAtDesc),
  )
}

async function collectClsTelegraph() {
  type TelegraphResponse = {
    data?: {
      roll_data?: ClsItem[]
    }
  }
  const url = new URL("https://www.cls.cn/v1/roll/get_roll_list")
  const params = await clsSearchParams({
    last_time: Math.floor(Date.now() / 1000),
    refresh_type: 1,
    rn: 30,
  })
  url.search = params.toString()
  const response = await fetchJson<TelegraphResponse>(url.toString(), {
    headers: {
      ...jsonHeaders,
      Referer: "https://www.cls.cn/telegraph",
    },
  })

  return rankItems(
    (response.data?.roll_data ?? [])
      .filter((item) => item.is_ad !== 1)
      .map((item) => clsItemToNews(item)),
  )
}

async function collectClsDepth() {
  type DepthResponse = {
    data?: {
      depth_list?: ClsItem[]
    }
  }
  const url = new URL("https://www.cls.cn/v3/depth/home/assembled/1000")
  url.search = (await clsSearchParams()).toString()
  const response = await fetchJson<DepthResponse>(url.toString(), {
    headers: jsonHeaders,
  })

  return rankItems(
    (response.data?.depth_list ?? [])
      .map((item) => clsItemToNews(item))
      .sort(comparePublishedAtDesc),
  )
}

async function collectClsHot() {
  type HotResponse = {
    data?: ClsItem[]
  }
  const url = new URL("https://www.cls.cn/v2/article/hot/list")
  url.search = (await clsSearchParams()).toString()
  const response = await fetchJson<HotResponse>(url.toString(), {
    headers: jsonHeaders,
  })

  return rankItems((response.data ?? []).map((item) => clsItemToNews(item)))
}

async function collectXueqiuHotStock() {
  type XueqiuResponse = {
    data?: {
      items?: Array<{
        ad?: number
        code?: string
        exchange?: string
        name?: string
        percent?: number
      }>
    }
  }
  const cookie = await getCookieHeader("https://xueqiu.com/hq")
  const response = await fetchJson<XueqiuResponse>(
    "https://stock.xueqiu.com/v5/stock/hot_stock/list.json?size=30&_type=10&type=10",
    {
      headers: {
        ...jsonHeaders,
        Cookie: cookie,
        Referer: "https://xueqiu.com/hq",
      },
    },
  )

  return rankItems(
    (response.data?.items ?? [])
      .filter((item) => item.ad !== 1)
      .map((item) => ({
        sourceItemId: item.code,
        title: item.name ?? "",
        url: item.code ? `https://xueqiu.com/s/${item.code}` : "",
        hotLabel: [percentageText(item.percent), item.exchange]
          .filter(Boolean)
          .join(" "),
        hotValue: percentageText(item.percent),
      })),
  )
}

async function collectGelonghuiNews() {
  const baseUrl = "https://www.gelonghui.com"
  const html = await fetchText(`${baseUrl}/news/`, { headers: browserHeaders })
  const $ = load(html)
  const items: NewsItem[] = []

  $(".article-content").each((_, element) => {
    const block = $(element)
    const link = block.find(".detail-right>a")
    const href = link.attr("href")
    const title = cleanText(link.find("h2").text())
    const source = cleanText(block.find(".time > span:nth-child(1)").text())
    const relativeTime = cleanText(
      block.find(".time > span:nth-child(3)").text(),
    )

    if (!href || !title) {
      return
    }

    items.push({
      sourceItemId: href,
      title,
      url: absoluteUrl(href, baseUrl),
      hotLabel: source,
      publishedAt: parseRelativeDateToIso(relativeTime),
    })
  })

  return rankItems(items)
}

async function collectFastbullExpress() {
  const baseUrl = "https://www.fastbull.com"
  const html = await fetchText(`${baseUrl}/cn/express-news`, {
    headers: browserHeaders,
  })
  const $ = load(html)
  const items: NewsItem[] = []

  $(".content-list.news-list").each((_, element) => {
    const block = $(element)
    const rawUrl =
      block.find("[data-href]").attr("data-href") ??
      block.find("[data-id]").attr("data-id")
    const titleText = cleanText(block.find(".title_name").text())
    const title = extractBracketTitle(titleText) ?? titleText
    const date = block.attr("data-date")

    if (!rawUrl || !title) {
      return
    }

    const pathname = rawUrl.startsWith("/") ? rawUrl : `/cn/fastshort/${rawUrl}`
    items.push({
      sourceItemId: rawUrl,
      title,
      url: absoluteUrl(pathname, baseUrl),
      publishedAt: timestampToIso(date),
    })
  })

  return rankItems(items.sort(comparePublishedAtDesc))
}

async function collectFastbullNews() {
  const baseUrl = "https://www.fastbull.com"
  const html = await fetchText(`${baseUrl}/cn/news`, {
    headers: browserHeaders,
  })
  const $ = load(html)
  const items: NewsItem[] = []

  $(".trending_type").each((_, element) => {
    const link = $(element)
    const href = link.attr("href")
    const title = cleanText(link.find(".title").text())
    const date = link.find("[data-date]").attr("data-date")

    if (!href || !title) {
      return
    }

    items.push({
      sourceItemId: href,
      title,
      url: absoluteUrl(href, baseUrl),
      publishedAt: timestampToIso(date),
    })
  })

  return rankItems(items.sort(comparePublishedAtDesc))
}

async function collectHackerNews() {
  const baseUrl = "https://news.ycombinator.com"
  const html = await fetchText(baseUrl, { headers: browserHeaders })
  const $ = load(html)
  const items: NewsItem[] = []

  $(".athing").each((_, element) => {
    const row = $(element)
    const id = row.attr("id")
    const title = cleanText(row.find(".titleline a").first().text())
    const score = id ? cleanText($(`#score_${id}`).text()) : undefined

    if (!id || !title) {
      return
    }

    items.push({
      sourceItemId: id,
      title,
      url: `${baseUrl}/item?id=${id}`,
      hotLabel: score,
      hotValue: score,
    })
  })

  return rankItems(items)
}

async function collectBilibiliHotSearch() {
  type HotSearchResponse = {
    list?: Array<{
      heat_score?: number
      hot_id?: number
      icon?: string
      keyword?: string
      show_name?: string
    }>
  }
  const response = await fetchJson<HotSearchResponse>(
    "https://s.search.bilibili.com/main/hotword?limit=30",
    { headers: jsonHeaders },
  )

  return rankItems(
    (response.list ?? []).map((item) => ({
      sourceItemId: item.hot_id?.toString() ?? item.keyword,
      title: item.show_name ?? item.keyword ?? "",
      url: item.keyword
        ? `https://search.bilibili.com/all?keyword=${encodeURIComponent(item.keyword)}`
        : "",
      imageUrl: item.icon,
      hotValue: item.heat_score,
      hotLabel: item.heat_score ? String(item.heat_score) : undefined,
    })),
  )
}

async function collectBilibiliHotVideo() {
  return collectBilibiliVideoList(
    "https://api.bilibili.com/x/web-interface/popular",
  )
}

async function collectBilibiliRanking() {
  return collectBilibiliVideoList(
    "https://api.bilibili.com/x/web-interface/ranking/v2",
  )
}

async function collectKuaishouHotList() {
  const html = await fetchText("https://www.kuaishou.com/?isHome=1", {
    headers: browserHeaders,
  })
  const match = html.match(/window\.__APOLLO_STATE__\s*=\s*(\{.+?\});/)

  if (!match?.[1]) {
    throw new Error("无法解析快手热榜数据")
  }

  const data = JSON.parse(match[1]) as {
    defaultClient?: Record<string, unknown> & {
      ROOT_QUERY?: Record<string, unknown>
    }
  }
  const client = data.defaultClient
  const root = asRecord(client?.ROOT_QUERY?.['visionHotRank({"page":"home"})'])
  const hotRankId = asString(root?.id)
  const hotRankData = hotRankId ? asRecord(client?.[hotRankId]) : undefined
  const items = asArray(hotRankData?.items)

  return rankItems(
    items.map((item) => {
      const itemRecord = asRecord(item)
      const itemId = asString(itemRecord?.id)
      const hotItem = itemId ? asRecord(client?.[itemId]) : undefined
      const title = asString(hotItem?.name)

      if (asString(hotItem?.tagType) === "置顶") {
        return null
      }

      return {
        sourceItemId: itemId?.replace("VisionHotRankItem:", ""),
        title: title ?? "",
        url: title
          ? `https://www.kuaishou.com/search/video?searchKey=${encodeURIComponent(title)}`
          : "",
        imageUrl: asString(hotItem?.iconUrl),
      }
    }),
  )
}

async function collectKaopuNews() {
  const baseUrl = "https://kaopu.news"
  const html = await fetchText(baseUrl, { headers: browserHeaders })
  const $ = load(html)
  const seen = new Set<string>()
  const items: NewsItem[] = []

  $("article").each((_, element) => {
    const article = $(element)
    const href = article.find('a[href^="/story/"]').first().attr("href")
    const title = cleanText(article.find("h2").first().text())
    const summary = cleanText(article.find("p").first().text())
    const date = cleanText(article.find(".story-meta span").first().text())
    const source = cleanText(article.find(".story-provenance").first().text())

    if (!href || !title || seen.has(href)) {
      return
    }

    seen.add(href)
    items.push({
      sourceItemId: href,
      title,
      url: absoluteUrl(href, baseUrl),
      summary,
      hotLabel: source,
      publishedAt: parseRelativeDateToIso(date),
    })
  })

  return rankItems(items)
}

async function collectJin10Flash() {
  type Jin10Item = {
    channel?: number[]
    data?: {
      content?: string
      title?: string
    }
    id?: string
    important?: number
    time?: string
  }
  const text = await fetchText(
    `https://www.jin10.com/flash_newest.js?t=${Date.now()}`,
    {
      headers: browserHeaders,
    },
  )
  const json = text.replace(/^var\s+newest\s*=\s*/, "").replace(/;*\s*$/, "")
  const data = JSON.parse(json) as Jin10Item[]

  return rankItems(
    data
      .filter((item) => !item.channel?.includes(5))
      .map((item) => {
        const rawText = cleanText(
          (item.data?.title ?? item.data?.content)?.replace(/<\/?b>/g, ""),
        )
        const title = extractBracketTitle(rawText) ?? rawText

        return {
          sourceItemId: item.id,
          title: title ?? "",
          url: item.id ? `https://flash.jin10.com/detail/${item.id}` : "",
          summary: rawText,
          tag: item.important ? "重要" : undefined,
          publishedAt: parseShanghaiDateToIso(item.time),
        }
      }),
  )
}

async function collectBaiduHotSearch() {
  type BaiduData = {
    data?: {
      cards?: Array<{
        content?: Array<{
          desc?: string
          isTop?: boolean
          rawUrl?: string
          word?: string
        }>
      }>
    }
  }
  const html = await fetchText("https://top.baidu.com/board?tab=realtime", {
    headers: browserHeaders,
  })
  const json = html.match(/<!--s-data:(.*?)-->/s)?.[1]

  if (!json) {
    throw new Error("无法解析百度热搜数据")
  }

  const data = JSON.parse(json) as BaiduData

  return rankItems(
    (data.data?.cards?.[0]?.content ?? [])
      .filter((item) => !item.isTop)
      .map((item) => ({
        sourceItemId: item.rawUrl ?? item.word,
        title: item.word ?? "",
        url: item.rawUrl ?? "",
        summary: cleanText(item.desc),
      })),
  )
}

async function collectNowcoderHotSearch() {
  type NowcoderResponse = {
    data?: {
      result?: Array<{
        id?: string
        title?: string
        type?: number
        uuid?: string
      }>
    }
  }
  const response = await fetchJson<NowcoderResponse>(
    `https://gw-c.nowcoder.com/api/sparta/hot-search/top-hot-pc?size=20&_=${Date.now()}&t=`,
    { headers: jsonHeaders },
  )

  return rankItems(
    (response.data?.result ?? []).map((item) => {
      const id = item.type === 74 ? item.uuid : item.id
      const url =
        item.type === 74 && item.uuid
          ? `https://www.nowcoder.com/feed/main/detail/${item.uuid}`
          : item.type === 0 && item.id
            ? `https://www.nowcoder.com/discuss/${item.id}`
            : ""

      return {
        sourceItemId: id,
        title: item.title ?? "",
        url,
      }
    }),
  )
}

async function collectSspaiHot() {
  type SspaiResponse = {
    data?: Array<{
      id?: number
      title?: string
    }>
  }
  const response = await fetchJson<SspaiResponse>(
    `https://sspai.com/api/v1/article/tag/page/get?limit=30&offset=0&created_at=${Date.now()}&tag=%E7%83%AD%E9%97%A8%E6%96%87%E7%AB%A0&released=false`,
    { headers: jsonHeaders },
  )

  return rankItems(
    (response.data ?? []).map((item) => ({
      sourceItemId: item.id?.toString(),
      title: item.title ?? "",
      url: item.id ? `https://sspai.com/post/${item.id}` : "",
    })),
  )
}

async function collectJuejinHot() {
  type JuejinResponse = {
    data?: Array<{
      content?: {
        content_id?: string
        title?: string
      }
    }>
  }
  const response = await fetchJson<JuejinResponse>(
    "https://api.juejin.cn/content_api/v1/content/article_rank?category_id=1&type=hot&spider=0",
    { headers: jsonHeaders },
  )

  return rankItems(
    (response.data ?? []).map((item) => ({
      sourceItemId: item.content?.content_id,
      title: item.content?.title ?? "",
      url: item.content?.content_id
        ? `https://juejin.cn/post/${item.content.content_id}`
        : "",
    })),
  )
}

async function collectIfengHot() {
  type IfengData = {
    hotNews1?: Array<{
      newsTime?: string
      title?: string
      url?: string
    }>
  }
  const html = await fetchText("https://www.ifeng.com/", {
    headers: browserHeaders,
  })
  const json = /var\s+allData\s*=\s*(\{[\s\S]*?\});/.exec(html)?.[1]

  if (!json) {
    return []
  }

  const data = JSON.parse(json) as IfengData

  return rankItems(
    (data.hotNews1 ?? []).map((item) => ({
      sourceItemId: item.url,
      title: item.title ?? "",
      url: item.url ?? "",
      publishedAt: parseShanghaiDateToIso(item.newsTime),
    })),
  )
}

async function collectChongbuluoHot() {
  const baseUrl = "https://www.chongbuluo.com/"
  const html = await fetchText(`${baseUrl}forum.php?mod=guide&view=hot`, {
    headers: browserHeaders,
  })
  const $ = load(html)
  const items: NewsItem[] = []

  $(".bmw table tr").each((_, element) => {
    const row = $(element)
    const title = cleanText(row.find(".common .xst").text())
    const href = row.find(".common a").attr("href")

    if (!href || !title) {
      return
    }

    items.push({
      sourceItemId: href,
      title,
      url: absoluteUrl(href, baseUrl),
      summary: title,
    })
  })

  return rankItems(items)
}

async function collectDoubanHotMovie() {
  type DoubanResponse = {
    items?: Array<{
      card_subtitle?: string
      id?: string
      pic?: {
        large?: string
        normal?: string
      }
      rating?: {
        value?: number
      }
      title?: string
    }>
  }
  const response = await fetchJson<DoubanResponse>(
    "https://m.douban.com/rexxar/api/v2/subject/recent_hot/movie",
    {
      headers: {
        ...jsonHeaders,
        Referer: "https://movie.douban.com/",
      },
    },
  )

  return rankItems(
    (response.items ?? []).map((movie) => ({
      sourceItemId: movie.id,
      title: movie.title ?? "",
      url: movie.id ? `https://movie.douban.com/subject/${movie.id}` : "",
      imageUrl: movie.pic?.large ?? movie.pic?.normal,
      summary: cleanText(movie.card_subtitle),
      hotValue: movie.rating?.value,
      hotLabel: movie.card_subtitle?.split(" / ").slice(0, 3).join(" / "),
    })),
  )
}

async function collectSteamOnline() {
  const html = await fetchText("https://store.steampowered.com/stats/stats/", {
    headers: browserHeaders,
  })
  const $ = load(html)
  const items: NewsItem[] = []

  $("#detailStats tr.player_count_row").each((_, element) => {
    const row = $(element)
    const link = row.find("a.gameLink")
    const href = link.attr("href")
    const title = cleanText(link.text())
    const currentPlayers = cleanText(
      row.find("td:first-child .currentServers").text(),
    )

    if (!href || !title) {
      return
    }

    items.push({
      sourceItemId: href,
      title,
      url: href,
      hotValue: currentPlayers,
      hotLabel: currentPlayers,
      publishedAt: new Date().toISOString(),
    })
  })

  return rankItems(items)
}

async function collectTencentHot() {
  type TencentResponse = {
    data?: {
      tabs?: Array<{
        articleList?: Array<{
          desc?: string
          id?: string
          link_info?: {
            url?: string
          }
          title?: string
        }>
      }>
    }
  }
  const response = await fetchJson<TencentResponse>(
    "https://i.news.qq.com/web_backend/v2/getTagInfo?tagId=aEWqxLtdgmQ%3D",
    {
      headers: {
        ...jsonHeaders,
        Referer: "https://news.qq.com/",
      },
    },
  )

  return rankItems(
    (response.data?.tabs?.[0]?.articleList ?? []).map((item) => ({
      sourceItemId: item.id,
      title: item.title ?? "",
      url: item.link_info?.url ?? "",
      summary: cleanText(item.desc),
    })),
  )
}

async function collectQqVideoTvHotSearch() {
  type QqVideoResponse = {
    data?: {
      card?: {
        children_list?: {
          list?: {
            cards?: Array<{
              id?: string
              params?: {
                image_url?: string
                publish_date?: string
                sub_title?: string
                title?: string
              }
            }>
          }
        }
      }
    }
  }
  const response = await fetchJson<QqVideoResponse>(
    "https://pbaccess.video.qq.com/trpc.vector_layout.page_view.PageService/getCard?video_appid=3000010&vversion_platform=2",
    {
      body: JSON.stringify({
        page_params: {
          rank_channel_id: "100113",
          rank_name: "HotSearch",
          rank_page_size: "30",
          tab_mvl_sub_mod_id: "792ac_19e77Sub_1b2",
          tab_name: "热搜榜",
          tab_type: "hot_rank",
          tab_vl_data_src: "f5200deb4596bbf3",
          page_id: "scms_shake",
          page_type: "scms_shake",
          source_key: "",
          tag_id: "",
          tag_type: "",
          new_mark_label_enabled: "1",
        },
        page_context: { page_index: "1" },
      }),
      headers: {
        ...jsonHeaders,
        "Content-Type": "application/json",
        Referer: "https://v.qq.com/",
      },
      method: "POST",
    },
  )

  return rankItems(
    (response.data?.card?.children_list?.list?.cards ?? []).map((item) => ({
      sourceItemId: item.id,
      title: item.params?.title ?? "",
      url: item.id ? `https://v.qq.com/x/cover/${item.id}.html` : "",
      imageUrl: item.params?.image_url,
      summary: cleanText(item.params?.sub_title),
      publishedAt: parseShanghaiDateToIso(item.params?.publish_date),
    })),
  )
}

async function collectIqiyiHotRanklist() {
  type IqiyiResponse = {
    items?: Array<{
      video?: Array<{
        data?: Array<{
          back_image?: string
          desc?: string
          description?: string
          entity_id?: number
          page_url?: string
          showDate?: string
          tag?: string
          title?: string
        }>
      }>
    }>
  }
  const response = await fetchJson<IqiyiResponse>(
    "https://mesh.if.iqiyi.com/portal/lw/v7/channel/card/videoTab?channelName=recommend&data_source=v7_rec_sec_hot_rank_list&tempId=85&count=30&block_id=hot_ranklist&device=14a4b5ba98e790dce6dc07482447cf48&from=webapp",
    {
      headers: {
        ...jsonHeaders,
        Referer: "https://www.iqiyi.com",
      },
    },
  )

  return rankItems(
    (response.items?.[0]?.video?.[0]?.data ?? []).map((item) => ({
      sourceItemId: item.entity_id?.toString(),
      title: item.title ?? "",
      url: item.page_url ?? "",
      imageUrl: item.back_image,
      summary: cleanText(item.description),
      hotLabel: cleanText(item.desc),
      tag: cleanText(item.tag),
      publishedAt: parseShanghaiDateToIso(item.showDate),
    })),
  )
}

type WallstreetcnItem = {
  content_short?: string
  content_text?: string
  display_time?: number
  id?: number
  title?: string
  type?: string
  uri?: string
}

type ClsItem = {
  brief?: string
  ctime?: number
  id?: number
  is_ad?: number
  shareurl?: string
  title?: string
}

function clsItemToNews(item: ClsItem): NewsItem {
  return {
    sourceItemId: item.id?.toString(),
    title: cleanText(item.title ?? item.brief) ?? "",
    url: item.id ? `https://www.cls.cn/detail/${item.id}` : "",
    mobileUrl: item.shareurl,
    publishedAt: timestampToIso(item.ctime, 1000),
    summary: cleanText(item.brief),
  }
}

async function collectBilibiliVideoList(url: string) {
  type VideoListResponse = {
    data?: {
      list?: Array<{
        bvid?: string
        desc?: string
        owner?: {
          name?: string
        }
        pic?: string
        pubdate?: number
        stat?: {
          like?: number
          view?: number
        }
        title?: string
      }>
    }
  }
  const response = await fetchJson<VideoListResponse>(url, {
    headers: jsonHeaders,
  })

  return rankItems(
    (response.data?.list ?? []).map((video) => {
      const info = [
        video.owner?.name,
        video.stat?.view === undefined
          ? undefined
          : `${formatCompactNumber(video.stat.view)}观看`,
        video.stat?.like === undefined
          ? undefined
          : `${formatCompactNumber(video.stat.like)}点赞`,
      ]
        .filter(Boolean)
        .join(" · ")

      return {
        sourceItemId: video.bvid,
        title: video.title ?? "",
        url: video.bvid ? `https://www.bilibili.com/video/${video.bvid}` : "",
        imageUrl: video.pic,
        summary: cleanText(video.desc),
        hotLabel: info || undefined,
        hotValue: video.stat?.view,
        publishedAt: timestampToIso(video.pubdate, 1000),
      }
    }),
  )
}

async function clsSearchParams(moreParams: Record<string, number> = {}) {
  const searchParams = new URLSearchParams({
    appName: "CailianpressWeb",
    os: "web",
    sv: "7.7.5",
    ...Object.fromEntries(
      Object.entries(moreParams).map(([key, value]) => [key, String(value)]),
    ),
  })
  searchParams.sort()
  searchParams.append("sign", md5Hex(sha1Hex(searchParams.toString())))
  return searchParams
}

async function coolapkHeaders() {
  const deviceId = randomCoolapkDeviceId()
  const now = Math.round(Date.now() / 1000)
  const hexNow = `0x${now.toString(16)}`
  const md5Now = md5Hex(now.toString())
  const tokenSource = `token://com.coolapk.market/c67ef5943784d09750dcfbb31020f0ab?${md5Now}$${deviceId}&com.coolapk.market`
  const token =
    md5Hex(Buffer.from(tokenSource).toString("base64")) + deviceId + hexNow

  return {
    "User-Agent":
      "Dalvik/2.1.0 (Linux; U; Android 10; Redmi K30 5G MIUI/V12.0.3.0.QGICMXM) (#Build; Redmi; Redmi K30 5G; QKQ1.191222.002 test-keys; 10) +CoolMarket/11.0-2101202",
    "X-Api-Version": "11",
    "X-App-Code": "2101202",
    "X-App-Id": "com.coolapk.market",
    "X-App-Token": token,
    "X-App-Version": "11.0",
    "X-Requested-With": "XMLHttpRequest",
    "X-Sdk-Int": "29",
    "X-Sdk-Locale": "zh-CN",
  }
}

function randomCoolapkDeviceId() {
  return [10, 6, 6, 6, 14]
    .map((length) => Math.random().toString(36).substring(2, length))
    .join("-")
}

async function fetchArrayBuffer(
  url: string,
  init: RequestInit = {},
  timeoutMs = 15_000,
) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        ...browserHeaders,
        ...init.headers,
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Request failed with ${response.status} for ${url}`)
    }

    return response.arrayBuffer()
  } finally {
    clearTimeout(timeout)
  }
}

async function getCookieHeader(url: string) {
  const response = await fetch(url, { headers: browserHeaders })
  const headers = response.headers as Headers & {
    getSetCookie?: () => string[]
  }
  const cookies =
    headers.getSetCookie?.() ??
    splitCombinedSetCookieHeader(response.headers.get("set-cookie"))

  return cookies.map((cookie) => cookie.split(";")[0]).join("; ")
}

function splitCombinedSetCookieHeader(value: string | null) {
  if (!value) {
    return []
  }

  return value.split(/,(?=\s*[^;,]+=)/)
}

async function fetchRssUrl(url: string) {
  const xml = await fetchText(url, {
    headers: {
      Accept: "application/rss+xml, application/atom+xml, application/xml",
      "User-Agent": browserHeaders["User-Agent"],
    },
  })
  const parser = new XMLParser({
    attributeNamePrefix: "@",
    ignoreAttributes: false,
    textNodeName: "#text",
    trimValues: true,
  })
  const root = asRecord(parser.parse(xml))
  const rssItems = asArray(asRecord(asRecord(root?.rss)?.channel)?.item)
  const atomEntries = asArray(asRecord(root?.feed)?.entry)
  const items = rssItems.length > 0 ? rssItems : atomEntries

  return rankItems(
    items.map((item) => {
      const record = asRecord(item)
      const title = xmlText(record?.title)
      const link = xmlText(record?.link) ?? atomLink(record?.link)

      return {
        sourceItemId: xmlText(record?.guid) ?? xmlText(record?.id) ?? link,
        title: title ?? "",
        url: link ? absoluteUrl(link, url) : "",
        summary: stripHtml(
          xmlText(record?.description) ?? xmlText(record?.summary),
        ),
        publishedAt: dateToIso(
          xmlText(record?.pubDate) ??
            xmlText(record?.published) ??
            xmlText(record?.updated),
        ),
      }
    }),
  )
}

function rankItems(items: Array<NewsItem | null | undefined>) {
  let rankNo = 0

  return items.flatMap((item) => {
    const title = cleanText(item?.title)
    const url = cleanText(item?.url)

    if (!item || !title || !url) {
      return []
    }

    rankNo += 1
    return [
      {
        ...item,
        rankNo: item.rankNo ?? rankNo,
        sourceItemId: item.sourceItemId ?? url,
        title,
        url,
      },
    ]
  })
}

function comparePublishedAtDesc(left: NewsItem, right: NewsItem) {
  return dateValue(right.publishedAt) - dateValue(left.publishedAt)
}

function dateValue(value?: string) {
  if (!value) {
    return 0
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

function timestampToIso(
  value: number | string | undefined,
  multiplier = 1,
): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined
  }

  const numeric =
    typeof value === "number" ? value : Number.parseInt(String(value), 10)

  if (!Number.isFinite(numeric)) {
    return dateToIso(String(value))
  }

  return dateToIso(numeric * multiplier)
}

function dateToIso(value?: string | number | null) {
  if (value === undefined || value === null || value === "") {
    return undefined
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

function parseShanghaiDateToIso(value?: string) {
  const text = cleanText(value)

  if (!text) {
    return undefined
  }

  if (/^\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2}(?::\d{2})?)?$/.test(text)) {
    return dateToIso(`${text.replace(" ", "T")}+08:00`)
  }

  if (/^\d{2}-\d{2}\s+\d{2}:\d{2}(?::\d{2})?$/.test(text)) {
    return dateToIso(
      `${new Date().getFullYear()}-${text.replace(" ", "T")}+08:00`,
    )
  }

  return dateToIso(text)
}

function parseRelativeDateToIso(value?: string) {
  const text = cleanText(value)

  if (!text) {
    return undefined
  }

  if (text === "刚刚") {
    return new Date().toISOString()
  }

  const unitMatch = text.match(
    /(\d+)\s*(秒|分钟|小时|天|周|月|年|sec|secs|min|mins|hour|hours|day|days)\s*(前|ago)?/i,
  )
  if (unitMatch) {
    const amount = Number.parseInt(unitMatch[1] ?? "0", 10)
    const unit = unitMatch[2]?.toLowerCase()
    const unitMs =
      unit === "秒" || unit?.startsWith("sec")
        ? 1000
        : unit === "分钟" || unit?.startsWith("min")
          ? 60 * 1000
          : unit === "小时" || unit?.startsWith("hour")
            ? 60 * 60 * 1000
            : unit === "天" || unit?.startsWith("day")
              ? 24 * 60 * 60 * 1000
              : unit === "周"
                ? 7 * 24 * 60 * 60 * 1000
                : unit === "月"
                  ? 30 * 24 * 60 * 60 * 1000
                  : 365 * 24 * 60 * 60 * 1000

    return new Date(Date.now() - amount * unitMs).toISOString()
  }

  const todayMatch = text.match(
    /^(今天|昨日|昨天|前天)\s*(\d{1,2})[:点时](\d{1,2})?/,
  )
  if (todayMatch) {
    const date = new Date()
    const word = todayMatch[1]
    const daysAgo =
      word === "前天" ? 2 : word === "昨天" || word === "昨日" ? 1 : 0
    date.setDate(date.getDate() - daysAgo)
    date.setHours(
      Number.parseInt(todayMatch[2] ?? "0", 10),
      Number.parseInt(todayMatch[3] ?? "0", 10),
      0,
      0,
    )
    return date.toISOString()
  }

  return parseShanghaiDateToIso(text)
}

function formatShanghaiDate(value: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Shanghai",
    year: "numeric",
  }).format(value)
}

function formatCompactNumber(value: number) {
  return value >= 10000 ? `${Math.floor(value / 10000)}w+` : String(value)
}

function percentageText(value?: number) {
  return value === undefined ? undefined : `${value}%`
}

function extractBracketTitle(value?: string) {
  return cleanText(value?.match(/^【(.+?)】(.*)$/)?.[1])
}

function sha1Hex(value: string) {
  return createHash("sha1").update(value).digest("hex")
}

function md5Hex(value: string) {
  return createHash("md5").update(value).digest("hex")
}

function asRecord(value: unknown): UnknownRecord | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as UnknownRecord)
    : undefined
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value
  }

  return value === undefined || value === null ? [] : [value]
}

function asString(value: unknown) {
  if (typeof value === "string" || typeof value === "number") {
    return cleanText(String(value))
  }

  return undefined
}

function xmlText(value: unknown): string | undefined {
  if (typeof value === "string" || typeof value === "number") {
    return cleanText(String(value))
  }

  const record = asRecord(value)
  return asString(record?.["#text"])
}

function atomLink(value: unknown) {
  for (const link of asArray(value)) {
    const record = asRecord(link)
    const href = xmlText(record?.["@href"])
    const rel = xmlText(record?.["@rel"])

    if (href && (!rel || rel === "alternate")) {
      return href
    }

    const text = xmlText(link)
    if (text) {
      return text
    }
  }

  return undefined
}
