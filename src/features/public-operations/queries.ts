import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNull,
  lte,
  or,
} from "drizzle-orm"
import { getDb } from "@/server/db/client"
import {
  bizChannel,
  bizChannelSnapshot,
  bizContentBlock,
  bizDailyReport,
  bizRankingConfig,
  bizSite,
  bizSnapshotItem,
  bizTopic,
  relRankingChannel,
  relTopicSnapshotItem,
} from "@/server/db/schema"
import { getPublicHomeData } from "@/features/public-home/queries"
import { matchesKeywords, parseKeywords } from "@/server/content/keywords"

export type PublicOperationItem = {
  id: string
  rankNo: number | null
  title: string
  url: string
  summary: string | null
  hotValue: string | null
  hotLabel: string | null
  tag: string | null
  publishedAt: Date | null
  channelName: string
  siteName: string
  channelHref: string
  snapshotTime: Date
}

export type PublicRankingItem = PublicOperationItem & {
  score: number
  matchedChannels: number
  sourceRank: number | null
}

export async function getPublicDailyPageData() {
  const reports = await getDb()
    .select({
      id: bizDailyReport.id,
      reportDate: bizDailyReport.reportDate,
      title: bizDailyReport.title,
      summary: bizDailyReport.summary,
      publishedAt: bizDailyReport.publishedAt,
      channelLimit: bizDailyReport.channelLimit,
      itemLimitPerChannel: bizDailyReport.itemLimitPerChannel,
    })
    .from(bizDailyReport)
    .where(
      and(
        isNull(bizDailyReport.deletedAt),
        eq(bizDailyReport.status, "active"),
      ),
    )
    .orderBy(desc(bizDailyReport.reportDate))
    .limit(24)

  const latestReport = reports[0] ?? null
  const sourceData = latestReport
    ? await getDailyReportSources(latestReport)
    : await getPublicHomeData()

  return {
    latestReport,
    reports,
    sources: sourceData.sources,
  }
}

export async function getPublicDailyReportDetail(reportDate: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reportDate)) {
    return null
  }

  const [report] = await getDb()
    .select({
      id: bizDailyReport.id,
      reportDate: bizDailyReport.reportDate,
      title: bizDailyReport.title,
      summary: bizDailyReport.summary,
      publishedAt: bizDailyReport.publishedAt,
      channelLimit: bizDailyReport.channelLimit,
      itemLimitPerChannel: bizDailyReport.itemLimitPerChannel,
    })
    .from(bizDailyReport)
    .where(
      and(
        isNull(bizDailyReport.deletedAt),
        eq(bizDailyReport.status, "active"),
        eq(bizDailyReport.reportDate, reportDate),
      ),
    )
    .limit(1)

  if (!report) {
    return null
  }

  const sourceData = await getDailyReportSources(report)

  return {
    report,
    sources: sourceData.sources,
  }
}

async function getDailyReportSources(report: {
  reportDate: string
  channelLimit: number
  itemLimitPerChannel: number
}) {
  const db = getDb()
  const channels = await db
    .select({
      id: bizChannel.id,
      siteSlug: bizSite.slug,
      siteName: bizSite.siteName,
      channelSlug: bizChannel.slug,
      channelName: bizChannel.channelName,
    })
    .from(bizChannel)
    .innerJoin(bizSite, eq(bizChannel.siteId, bizSite.id))
    .where(
      and(
        isNull(bizChannel.deletedAt),
        isNull(bizSite.deletedAt),
        eq(bizChannel.status, "active"),
        eq(bizChannel.isPublic, true),
        eq(bizChannel.isHomeVisible, true),
        eq(bizSite.status, "active"),
        eq(bizSite.isVisible, true),
      ),
    )
    .orderBy(desc(bizChannel.weight), asc(bizSite.sort), asc(bizChannel.sort))
    .limit(report.channelLimit)

  const channelIds = channels.map((channel) => channel.id)

  if (channelIds.length === 0) {
    return {
      sources: [] as Awaited<ReturnType<typeof getPublicHomeData>>["sources"],
    }
  }

  const snapshots = await db
    .select({
      id: bizChannelSnapshot.id,
      channelId: bizChannelSnapshot.channelId,
    })
    .from(bizChannelSnapshot)
    .where(
      and(
        inArray(bizChannelSnapshot.channelId, channelIds),
        lte(bizChannelSnapshot.snapshotDate, report.reportDate),
        eq(bizChannelSnapshot.status, "active"),
      ),
    )
    .orderBy(
      desc(bizChannelSnapshot.snapshotDate),
      desc(bizChannelSnapshot.snapshotTime),
    )

  const snapshotIdByChannelId = new Map<string, string>()

  for (const snapshot of snapshots) {
    if (!snapshotIdByChannelId.has(snapshot.channelId)) {
      snapshotIdByChannelId.set(snapshot.channelId, snapshot.id)
    }
  }

  const snapshotIds = Array.from(snapshotIdByChannelId.values())
  const itemRows =
    snapshotIds.length > 0
      ? await db
          .select({
            snapshotId: bizSnapshotItem.snapshotId,
            title: bizSnapshotItem.title,
            url: bizSnapshotItem.url,
            rankNo: bizSnapshotItem.rankNo,
            hotValue: bizSnapshotItem.hotValue,
            hotLabel: bizSnapshotItem.hotLabel,
            tag: bizSnapshotItem.tag,
            publishedAt: bizSnapshotItem.publishedAt,
          })
          .from(bizSnapshotItem)
          .leftJoin(
            bizContentBlock,
            and(
              eq(bizSnapshotItem.urlHash, bizContentBlock.urlHash),
              isNull(bizContentBlock.deletedAt),
            ),
          )
          .where(
            and(
              inArray(bizSnapshotItem.snapshotId, snapshotIds),
              isNull(bizContentBlock.id),
            ),
          )
          .orderBy(asc(bizSnapshotItem.snapshotId), asc(bizSnapshotItem.rankNo))
      : []

  const itemsBySnapshotId = new Map<string, typeof itemRows>()

  for (const item of itemRows) {
    const items = itemsBySnapshotId.get(item.snapshotId) ?? []
    items.push(item)
    itemsBySnapshotId.set(item.snapshotId, items)
  }

  return {
    sources: channels.map((channel) => {
      const snapshotId = snapshotIdByChannelId.get(channel.id)
      const items = snapshotId ? (itemsBySnapshotId.get(snapshotId) ?? []) : []

      return {
        id: channel.id,
        name: channel.channelName,
        logo: Array.from(channel.siteName.trim())[0]?.toUpperCase() ?? "N",
        tag: snapshotId ? "历史快照" : "等待采集",
        category: "daily",
        color: "#456a9e",
        logoColor: "#1777ff",
        favorite: false,
        href: `/channels/${channel.siteSlug}/${channel.channelSlug}`,
        items: items.slice(0, report.itemLimitPerChannel).map((item) => ({
          title: item.title,
          url: item.url,
          meta:
            item.hotValue ??
            item.hotLabel ??
            item.tag ??
            formatOperationDateTime(item.publishedAt) ??
            "已收录",
          badge:
            item.hotLabel?.includes("新") || item.hotLabel?.includes("热")
              ? item.hotLabel
              : item.rankNo && item.rankNo <= 3
                ? "热"
                : undefined,
        })),
      }
    }),
  }
}

export async function getPublicRankingPageData() {
  const db = getDb()
  const configs = await db
    .select({
      id: bizRankingConfig.id,
      configName: bizRankingConfig.configName,
      slug: bizRankingConfig.slug,
      description: bizRankingConfig.description,
      isDefault: bizRankingConfig.isDefault,
      timeWindowHours: bizRankingConfig.timeWindowHours,
      itemLimit: bizRankingConfig.itemLimit,
      perChannelLimit: bizRankingConfig.perChannelLimit,
    })
    .from(bizRankingConfig)
    .where(
      and(
        isNull(bizRankingConfig.deletedAt),
        eq(bizRankingConfig.status, "active"),
      ),
    )
    .orderBy(desc(bizRankingConfig.isDefault), asc(bizRankingConfig.sort))

  const config = configs[0] ?? null

  if (!config) {
    return {
      channelCount: 0,
      config: null,
      configs,
      items: [] as PublicRankingItem[],
    }
  }

  const channels = await db
    .select({
      channelId: relRankingChannel.channelId,
      weight: relRankingChannel.weight,
    })
    .from(relRankingChannel)
    .innerJoin(bizChannel, eq(relRankingChannel.channelId, bizChannel.id))
    .innerJoin(bizSite, eq(bizChannel.siteId, bizSite.id))
    .where(
      and(
        eq(relRankingChannel.rankingId, config.id),
        isNull(bizChannel.deletedAt),
        isNull(bizSite.deletedAt),
        eq(bizChannel.status, "active"),
        eq(bizChannel.isPublic, true),
        eq(bizSite.status, "active"),
        eq(bizSite.isVisible, true),
      ),
    )
    .orderBy(asc(relRankingChannel.sort))

  if (channels.length === 0) {
    return {
      channelCount: 0,
      config,
      configs,
      items: [] as PublicRankingItem[],
    }
  }

  const channelIds = channels.map((channel) => channel.channelId)
  const weightByChannelId = new Map(
    channels.map((channel) => [channel.channelId, channel.weight]),
  )
  const cutoff = new Date(Date.now() - config.timeWindowHours * 60 * 60 * 1000)
  const rows = await db
    .select({
      id: bizSnapshotItem.id,
      channelId: bizSnapshotItem.channelId,
      rankNo: bizSnapshotItem.rankNo,
      title: bizSnapshotItem.title,
      url: bizSnapshotItem.url,
      urlHash: bizSnapshotItem.urlHash,
      summary: bizSnapshotItem.summary,
      hotValue: bizSnapshotItem.hotValue,
      hotLabel: bizSnapshotItem.hotLabel,
      tag: bizSnapshotItem.tag,
      publishedAt: bizSnapshotItem.publishedAt,
      channelName: bizChannel.channelName,
      siteName: bizSite.siteName,
      siteSlug: bizSite.slug,
      channelSlug: bizChannel.slug,
      snapshotTime: bizChannelSnapshot.snapshotTime,
    })
    .from(bizSnapshotItem)
    .innerJoin(bizChannel, eq(bizSnapshotItem.channelId, bizChannel.id))
    .innerJoin(bizSite, eq(bizChannel.siteId, bizSite.id))
    .innerJoin(
      bizChannelSnapshot,
      eq(bizSnapshotItem.snapshotId, bizChannelSnapshot.id),
    )
    .leftJoin(
      bizContentBlock,
      and(
        eq(bizSnapshotItem.urlHash, bizContentBlock.urlHash),
        isNull(bizContentBlock.deletedAt),
      ),
    )
    .where(
      and(
        inArray(bizSnapshotItem.channelId, channelIds),
        gte(bizChannelSnapshot.snapshotTime, cutoff),
        isNull(bizContentBlock.id),
      ),
    )
    .orderBy(desc(bizChannelSnapshot.snapshotTime), asc(bizSnapshotItem.rankNo))
    .limit(Math.max(config.itemLimit * channels.length, 200))

  const perChannelCount = new Map<string, number>()
  const aggregatedByUrlHash = new Map<string, PublicRankingItem>()

  for (const row of rows) {
    const currentCount = perChannelCount.get(row.channelId) ?? 0

    if (currentCount >= config.perChannelLimit) {
      continue
    }

    perChannelCount.set(row.channelId, currentCount + 1)

    const weight = weightByChannelId.get(row.channelId) ?? 0
    const rankScore = Math.max(0, 120 - (row.rankNo ?? 120))
    const recencyHours = Math.floor(
      (Date.now() - row.snapshotTime.getTime()) / 3_600_000,
    )
    const recencyScore = Math.max(0, config.timeWindowHours - recencyHours)
    const score = weight * 100 + rankScore * 5 + recencyScore
    const existing = aggregatedByUrlHash.get(row.urlHash)

    if (existing) {
      existing.score += score
      existing.matchedChannels += 1
      existing.sourceRank = Math.min(
        existing.sourceRank ?? row.rankNo ?? 9999,
        row.rankNo ?? 9999,
      )
      continue
    }

    aggregatedByUrlHash.set(row.urlHash, {
      id: row.id,
      rankNo: row.rankNo,
      sourceRank: row.rankNo,
      title: row.title,
      url: row.url,
      summary: row.summary,
      hotValue: row.hotValue,
      hotLabel: row.hotLabel,
      tag: row.tag,
      publishedAt: row.publishedAt,
      channelName: row.channelName,
      siteName: row.siteName,
      channelHref: `/channels/${row.siteSlug}/${row.channelSlug}`,
      snapshotTime: row.snapshotTime,
      score,
      matchedChannels: 1,
    })
  }

  const items = Array.from(aggregatedByUrlHash.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, config.itemLimit)
    .map((item, index) => ({ ...item, rankNo: index + 1 }))

  return {
    channelCount: channels.length,
    config,
    configs,
    items,
  }
}

export async function searchPublicContents(query: string) {
  const keyword = query.trim()

  if (!keyword) {
    return []
  }

  const pattern = `%${keyword}%`

  return getDb()
    .select({
      id: bizSnapshotItem.id,
      rankNo: bizSnapshotItem.rankNo,
      title: bizSnapshotItem.title,
      url: bizSnapshotItem.url,
      summary: bizSnapshotItem.summary,
      hotValue: bizSnapshotItem.hotValue,
      hotLabel: bizSnapshotItem.hotLabel,
      tag: bizSnapshotItem.tag,
      publishedAt: bizSnapshotItem.publishedAt,
      channelName: bizChannel.channelName,
      siteName: bizSite.siteName,
      siteSlug: bizSite.slug,
      channelSlug: bizChannel.slug,
      snapshotTime: bizChannelSnapshot.snapshotTime,
    })
    .from(bizSnapshotItem)
    .innerJoin(bizChannel, eq(bizSnapshotItem.channelId, bizChannel.id))
    .innerJoin(bizSite, eq(bizChannel.siteId, bizSite.id))
    .innerJoin(
      bizChannelSnapshot,
      eq(bizSnapshotItem.snapshotId, bizChannelSnapshot.id),
    )
    .leftJoin(
      bizContentBlock,
      and(
        eq(bizSnapshotItem.urlHash, bizContentBlock.urlHash),
        isNull(bizContentBlock.deletedAt),
      ),
    )
    .where(
      and(
        isNull(bizContentBlock.id),
        isNull(bizChannel.deletedAt),
        isNull(bizSite.deletedAt),
        eq(bizChannel.status, "active"),
        eq(bizChannel.isPublic, true),
        eq(bizSite.status, "active"),
        eq(bizSite.isVisible, true),
        or(
          ilike(bizSnapshotItem.title, pattern),
          ilike(bizSnapshotItem.summary, pattern),
          ilike(bizSnapshotItem.tag, pattern),
          ilike(bizChannel.channelName, pattern),
          ilike(bizSite.siteName, pattern),
        ),
      ),
    )
    .orderBy(desc(bizChannelSnapshot.snapshotTime), asc(bizSnapshotItem.rankNo))
    .limit(100)
    .then((items) =>
      items.map((item) => ({
        ...item,
        channelHref: `/channels/${item.siteSlug}/${item.channelSlug}`,
      })),
    )
}

export async function getPublicTopics() {
  const db = getDb()
  const topics = await db
    .select({
      id: bizTopic.id,
      topicName: bizTopic.topicName,
      slug: bizTopic.slug,
      description: bizTopic.description,
      keywords: bizTopic.keywords,
    })
    .from(bizTopic)
    .where(
      and(
        isNull(bizTopic.deletedAt),
        eq(bizTopic.status, "active"),
        eq(bizTopic.isHomeVisible, true),
      ),
    )
    .orderBy(asc(bizTopic.sort), asc(bizTopic.topicName))

  if (topics.length === 0) {
    return []
  }

  const latestItems = await listLatestPublicOperationItems(300)

  return topics.map((topic) => {
    const keywords = parseKeywords(topic.keywords || topic.topicName)
    const items = latestItems
      .filter((item) => matchesKeywords(item, keywords))
      .slice(0, 4)

    return {
      ...topic,
      keywords,
      items,
    }
  })
}

export async function getPublicTopic(slug: string) {
  const db = getDb()
  const [topic] = await db
    .select({
      id: bizTopic.id,
      topicName: bizTopic.topicName,
      slug: bizTopic.slug,
      description: bizTopic.description,
      keywords: bizTopic.keywords,
      updatedAt: bizTopic.updatedAt,
    })
    .from(bizTopic)
    .where(
      and(
        isNull(bizTopic.deletedAt),
        eq(bizTopic.slug, slug),
        eq(bizTopic.status, "active"),
      ),
    )
    .limit(1)

  if (!topic) {
    return null
  }

  const keywords = parseKeywords(topic.keywords || topic.topicName)
  const [manualItems, latestItems] = await Promise.all([
    listTopicManualItems(topic.id),
    listLatestPublicOperationItems(420),
  ])
  const manualIds = new Set(manualItems.map((item) => item.id))
  const automaticItems = latestItems
    .filter((item) => !manualIds.has(item.id))
    .filter((item) => matchesKeywords(item, keywords))
    .slice(0, 60)

  return {
    ...topic,
    keywords,
    manualItems,
    automaticItems,
    items: [...manualItems, ...automaticItems],
  }
}

async function listTopicManualItems(topicId: string) {
  return getDb()
    .select({
      id: bizSnapshotItem.id,
      rankNo: bizSnapshotItem.rankNo,
      title: bizSnapshotItem.title,
      url: bizSnapshotItem.url,
      summary: bizSnapshotItem.summary,
      hotValue: bizSnapshotItem.hotValue,
      hotLabel: bizSnapshotItem.hotLabel,
      tag: bizSnapshotItem.tag,
      publishedAt: bizSnapshotItem.publishedAt,
      channelName: bizChannel.channelName,
      siteName: bizSite.siteName,
      siteSlug: bizSite.slug,
      channelSlug: bizChannel.slug,
      snapshotTime: bizChannelSnapshot.snapshotTime,
    })
    .from(relTopicSnapshotItem)
    .innerJoin(
      bizSnapshotItem,
      eq(relTopicSnapshotItem.snapshotItemId, bizSnapshotItem.id),
    )
    .innerJoin(bizChannel, eq(bizSnapshotItem.channelId, bizChannel.id))
    .innerJoin(bizSite, eq(bizChannel.siteId, bizSite.id))
    .innerJoin(
      bizChannelSnapshot,
      eq(bizSnapshotItem.snapshotId, bizChannelSnapshot.id),
    )
    .leftJoin(
      bizContentBlock,
      and(
        eq(bizSnapshotItem.urlHash, bizContentBlock.urlHash),
        isNull(bizContentBlock.deletedAt),
      ),
    )
    .where(
      and(
        eq(relTopicSnapshotItem.topicId, topicId),
        isNull(bizContentBlock.id),
      ),
    )
    .orderBy(
      desc(relTopicSnapshotItem.isPinned),
      asc(relTopicSnapshotItem.sort),
      desc(relTopicSnapshotItem.createdAt),
    )
    .then((items) =>
      items.map((item) => ({
        ...item,
        channelHref: `/channels/${item.siteSlug}/${item.channelSlug}`,
      })),
    )
}

export async function listLatestPublicOperationItems(limit = 120) {
  const db = getDb()

  return db
    .select({
      id: bizSnapshotItem.id,
      rankNo: bizSnapshotItem.rankNo,
      title: bizSnapshotItem.title,
      url: bizSnapshotItem.url,
      summary: bizSnapshotItem.summary,
      hotValue: bizSnapshotItem.hotValue,
      hotLabel: bizSnapshotItem.hotLabel,
      tag: bizSnapshotItem.tag,
      publishedAt: bizSnapshotItem.publishedAt,
      channelName: bizChannel.channelName,
      siteName: bizSite.siteName,
      siteSlug: bizSite.slug,
      channelSlug: bizChannel.slug,
      snapshotTime: bizChannelSnapshot.snapshotTime,
    })
    .from(bizSnapshotItem)
    .innerJoin(bizChannel, eq(bizSnapshotItem.channelId, bizChannel.id))
    .innerJoin(bizSite, eq(bizChannel.siteId, bizSite.id))
    .innerJoin(
      bizChannelSnapshot,
      eq(bizSnapshotItem.snapshotId, bizChannelSnapshot.id),
    )
    .leftJoin(
      bizContentBlock,
      and(
        eq(bizSnapshotItem.urlHash, bizContentBlock.urlHash),
        isNull(bizContentBlock.deletedAt),
      ),
    )
    .where(
      and(
        isNull(bizChannel.deletedAt),
        isNull(bizSite.deletedAt),
        isNull(bizContentBlock.id),
        eq(bizChannel.status, "active"),
        eq(bizChannel.isPublic, true),
        eq(bizSite.status, "active"),
        eq(bizSite.isVisible, true),
      ),
    )
    .orderBy(desc(bizSnapshotItem.createdAt))
    .limit(limit)
    .then((items) =>
      items.map((item) => ({
        ...item,
        channelHref: `/channels/${item.siteSlug}/${item.channelSlug}`,
      })),
    )
}

function formatOperationDateTime(value: Date | null) {
  if (!value) {
    return null
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value)
}

export { matchesKeywords, parseKeywords }
