import { asc, and, desc, eq, inArray, isNull } from "drizzle-orm"
import { getDb } from "@/server/db/client"
import {
  bizChannel,
  bizContentBlock,
  bizSite,
  bizSnapshotItem,
  relUserChannelSubscription,
  userTrackingRule,
} from "@/server/db/schema"
import type { PublicRankItem } from "@/features/public-content/queries"
import {
  listLatestPublicOperationItems,
  matchesKeywords,
  parseKeywords,
  type PublicOperationItem,
} from "@/features/public-operations/queries"

export type UserSubscription = {
  subscriptionId: string
  channelId: string
  channelName: string
  channelSlug: string
  siteName: string
  siteSlug: string
  definitionKey: string
  isPinned: boolean
  notifyEnabled: boolean
  lastSuccessAt: Date | null
  href: string
  items: PublicRankItem[]
}

export type UserFeedItem = PublicRankItem & {
  channelId: string
  channelName: string
  siteName: string
  channelHref: string
}

export type UserTrackingRule = {
  id: string
  keyword: string
  description: string | null
  isEnabled: boolean
  notifyEnabled: boolean
  createdAt: Date
  updatedAt: Date
  keywords: string[]
  matches: PublicOperationItem[]
}

export async function isChannelSubscribed(userId: string, channelId: string) {
  const [subscription] = await getDb()
    .select({ id: relUserChannelSubscription.id })
    .from(relUserChannelSubscription)
    .where(
      and(
        eq(relUserChannelSubscription.userId, userId),
        eq(relUserChannelSubscription.channelId, channelId),
      ),
    )
    .limit(1)

  return Boolean(subscription)
}

export async function getUserSubscriptions(
  userId: string,
): Promise<UserSubscription[]> {
  const db = getDb()
  const rows = await db
    .select({
      subscriptionId: relUserChannelSubscription.id,
      channelId: bizChannel.id,
      channelName: bizChannel.channelName,
      channelSlug: bizChannel.slug,
      siteName: bizSite.siteName,
      siteSlug: bizSite.slug,
      definitionKey: bizChannel.definitionKey,
      lastSnapshotId: bizChannel.lastSnapshotId,
      lastSuccessAt: bizChannel.lastSuccessAt,
      isPinned: relUserChannelSubscription.isPinned,
      notifyEnabled: relUserChannelSubscription.notifyEnabled,
    })
    .from(relUserChannelSubscription)
    .innerJoin(
      bizChannel,
      eq(relUserChannelSubscription.channelId, bizChannel.id),
    )
    .innerJoin(bizSite, eq(bizChannel.siteId, bizSite.id))
    .where(
      and(
        eq(relUserChannelSubscription.userId, userId),
        isNull(bizChannel.deletedAt),
        isNull(bizSite.deletedAt),
        eq(bizChannel.status, "active"),
        eq(bizChannel.isPublic, true),
        eq(bizSite.status, "active"),
        eq(bizSite.isVisible, true),
      ),
    )
    .orderBy(
      desc(relUserChannelSubscription.isPinned),
      asc(relUserChannelSubscription.sort),
      asc(bizSite.sort),
      asc(bizChannel.sort),
    )

  const snapshotIds = rows
    .map((row) => row.lastSnapshotId)
    .filter((id): id is string => Boolean(id))

  const items =
    snapshotIds.length > 0
      ? await db
          .select({
            snapshotId: bizSnapshotItem.snapshotId,
            id: bizSnapshotItem.id,
            rankNo: bizSnapshotItem.rankNo,
            title: bizSnapshotItem.title,
            url: bizSnapshotItem.url,
            summary: bizSnapshotItem.summary,
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

  const itemsBySnapshotId = new Map<string, PublicRankItem[]>()

  for (const item of items) {
    const snapshotItems = itemsBySnapshotId.get(item.snapshotId) ?? []
    snapshotItems.push(toPublicRankItem(item))
    itemsBySnapshotId.set(item.snapshotId, snapshotItems)
  }

  return rows.map((row) => ({
    subscriptionId: row.subscriptionId,
    channelId: row.channelId,
    channelName: row.channelName,
    channelSlug: row.channelSlug,
    siteName: row.siteName,
    siteSlug: row.siteSlug,
    definitionKey: row.definitionKey,
    isPinned: row.isPinned,
    notifyEnabled: row.notifyEnabled,
    lastSuccessAt: row.lastSuccessAt,
    href: `/channels/${row.siteSlug}/${row.channelSlug}`,
    items: row.lastSnapshotId
      ? (itemsBySnapshotId.get(row.lastSnapshotId) ?? []).slice(0, 5)
      : [],
  }))
}

export async function getUserFeed(userId: string): Promise<UserFeedItem[]> {
  const subscriptions = await getUserSubscriptions(userId)

  return subscriptions
    .flatMap((subscription) =>
      subscription.items.map((item) => ({
        ...item,
        channelId: subscription.channelId,
        channelName: subscription.channelName,
        siteName: subscription.siteName,
        channelHref: subscription.href,
      })),
    )
    .sort((a, b) => {
      const aTime = a.publishedAt?.getTime() ?? 0
      const bTime = b.publishedAt?.getTime() ?? 0

      return bTime - aTime
    })
}

export async function getUserTrackingDashboard(
  userId: string,
): Promise<UserTrackingRule[]> {
  const db = getDb()
  const rules = await db
    .select({
      id: userTrackingRule.id,
      keyword: userTrackingRule.keyword,
      description: userTrackingRule.description,
      isEnabled: userTrackingRule.isEnabled,
      notifyEnabled: userTrackingRule.notifyEnabled,
      createdAt: userTrackingRule.createdAt,
      updatedAt: userTrackingRule.updatedAt,
    })
    .from(userTrackingRule)
    .where(eq(userTrackingRule.userId, userId))
    .orderBy(desc(userTrackingRule.isEnabled), desc(userTrackingRule.createdAt))

  if (rules.length === 0) {
    return []
  }

  const latestItems = await listLatestPublicOperationItems(240)

  return rules.map((rule) => {
    const keywords = parseKeywords(rule.keyword)
    const matches = rule.isEnabled
      ? latestItems
          .filter((item) => matchesKeywords(item, keywords))
          .slice(0, 8)
      : []

    return {
      ...rule,
      keywords,
      matches,
    }
  })
}

function toPublicRankItem(item: PublicRankItem): PublicRankItem {
  return {
    id: item.id,
    rankNo: item.rankNo,
    title: item.title,
    url: item.url,
    summary: item.summary,
    hotValue: item.hotValue,
    hotLabel: item.hotLabel,
    tag: item.tag,
    publishedAt: item.publishedAt,
  }
}
