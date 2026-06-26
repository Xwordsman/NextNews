import { and, asc, desc, eq, isNull } from "drizzle-orm"
import { getDb } from "@/server/db/client"
import {
  bizChannel,
  bizChannelSnapshot,
  bizContentBlock,
  bizDailyReport,
  bizSite,
  bizSnapshotItem,
  bizTopic,
} from "@/server/db/schema"
import { getPublicHomeData } from "@/features/public-home/queries"

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

export async function getPublicDailyPageData() {
  const [reports, homeData] = await Promise.all([
    getDb()
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
      .limit(12),
    getPublicHomeData(),
  ])

  return {
    latestReport: reports[0] ?? null,
    reports,
    sources: homeData.sources,
  }
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

export function parseKeywords(value: string) {
  return value
    .split(/[,\n，、;；]+/)
    .map((keyword) => keyword.trim())
    .filter(Boolean)
}

export function matchesKeywords(
  item: Pick<PublicOperationItem, "summary" | "tag" | "title">,
  keywords: string[],
) {
  if (keywords.length === 0) {
    return false
  }

  const haystack = `${item.title} ${item.summary ?? ""} ${item.tag ?? ""}`
    .toLowerCase()
    .trim()

  return keywords.some((keyword) => haystack.includes(keyword.toLowerCase()))
}
