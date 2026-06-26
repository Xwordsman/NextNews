import { asc, and, desc, eq, inArray, isNull } from "drizzle-orm"
import { getDb } from "@/server/db/client"
import {
  bizChannel,
  bizContentBlock,
  bizSite,
  bizSnapshotItem,
  membershipOrder,
  relUserChannelSubscription,
  userBookmark,
  userNotification,
  userReadHistory,
  userTrackingMatch,
  userTrackingRule,
} from "@/server/db/schema"
import type { PublicRankItem } from "@/features/public-content/queries"
import { parseKeywords } from "@/server/content/keywords"

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
  matches: UserTrackingMatch[]
}

export type UserTrackingMatch = {
  id: string
  snapshotItemId: string
  title: string
  url: string
  matchedKeyword: string
  isRead: boolean
  matchedAt: Date
  channelName: string
  siteName: string
  channelHref: string
}

export type UserNotification = {
  id: string
  notificationType: string
  title: string
  body: string | null
  href: string | null
  isRead: boolean
  createdAt: Date
}

export type UserMembershipOrder = {
  id: string
  planKey: string
  planName: string
  amountCents: number
  currency: string
  status: string
  paidAt: Date | null
  expiresAt: Date | null
  createdAt: Date
}

export type UserSavedItem = {
  id: string
  snapshotItemId: string
  title: string
  url: string
  rankNo: number | null
  hotValue: string | null
  hotLabel: string | null
  tag: string | null
  channelName: string
  siteName: string
  channelHref: string
  createdAt: Date
}

export type UserReadHistoryItem = UserSavedItem & {
  firstReadAt: Date
  lastReadAt: Date
  readCount: number
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

  const matches = await db
    .select({
      id: userTrackingMatch.id,
      snapshotItemId: userTrackingMatch.snapshotItemId,
      ruleId: userTrackingMatch.ruleId,
      title: userTrackingMatch.title,
      url: userTrackingMatch.url,
      matchedKeyword: userTrackingMatch.matchedKeyword,
      isRead: userTrackingMatch.isRead,
      matchedAt: userTrackingMatch.matchedAt,
      channelName: bizChannel.channelName,
      siteName: bizSite.siteName,
      siteSlug: bizSite.slug,
      channelSlug: bizChannel.slug,
    })
    .from(userTrackingMatch)
    .innerJoin(
      bizSnapshotItem,
      eq(userTrackingMatch.snapshotItemId, bizSnapshotItem.id),
    )
    .innerJoin(bizChannel, eq(bizSnapshotItem.channelId, bizChannel.id))
    .innerJoin(bizSite, eq(bizChannel.siteId, bizSite.id))
    .where(eq(userTrackingMatch.userId, userId))
    .orderBy(desc(userTrackingMatch.matchedAt))
    .limit(240)

  const matchesByRuleId = new Map<string, UserTrackingMatch[]>()

  for (const match of matches) {
    const ruleMatches = matchesByRuleId.get(match.ruleId) ?? []
    ruleMatches.push({
      id: match.id,
      snapshotItemId: match.snapshotItemId,
      title: match.title,
      url: match.url,
      matchedKeyword: match.matchedKeyword,
      isRead: match.isRead,
      matchedAt: match.matchedAt,
      channelName: match.channelName,
      siteName: match.siteName,
      channelHref: `/channels/${match.siteSlug}/${match.channelSlug}`,
    })
    matchesByRuleId.set(match.ruleId, ruleMatches)
  }

  return rules.map((rule) => {
    const keywords = parseKeywords(rule.keyword)

    return {
      ...rule,
      keywords,
      matches: (matchesByRuleId.get(rule.id) ?? []).slice(0, 8),
    }
  })
}

export async function getUserNotifications(
  userId: string,
): Promise<UserNotification[]> {
  return getDb()
    .select({
      id: userNotification.id,
      notificationType: userNotification.notificationType,
      title: userNotification.title,
      body: userNotification.body,
      href: userNotification.href,
      isRead: userNotification.isRead,
      createdAt: userNotification.createdAt,
    })
    .from(userNotification)
    .where(eq(userNotification.userId, userId))
    .orderBy(desc(userNotification.createdAt))
    .limit(100)
}

export async function getUserMembershipOrders(
  userId: string,
): Promise<UserMembershipOrder[]> {
  return getDb()
    .select({
      id: membershipOrder.id,
      planKey: membershipOrder.planKey,
      planName: membershipOrder.planName,
      amountCents: membershipOrder.amountCents,
      currency: membershipOrder.currency,
      status: membershipOrder.status,
      paidAt: membershipOrder.paidAt,
      expiresAt: membershipOrder.expiresAt,
      createdAt: membershipOrder.createdAt,
    })
    .from(membershipOrder)
    .where(eq(membershipOrder.userId, userId))
    .orderBy(desc(membershipOrder.createdAt))
    .limit(20)
}

export async function getUserBookmarks(
  userId: string,
): Promise<UserSavedItem[]> {
  return getDb()
    .select({
      id: userBookmark.id,
      snapshotItemId: userBookmark.snapshotItemId,
      title: userBookmark.title,
      url: userBookmark.url,
      rankNo: bizSnapshotItem.rankNo,
      hotValue: bizSnapshotItem.hotValue,
      hotLabel: bizSnapshotItem.hotLabel,
      tag: bizSnapshotItem.tag,
      createdAt: userBookmark.createdAt,
      channelName: bizChannel.channelName,
      siteName: bizSite.siteName,
      siteSlug: bizSite.slug,
      channelSlug: bizChannel.slug,
    })
    .from(userBookmark)
    .innerJoin(
      bizSnapshotItem,
      eq(userBookmark.snapshotItemId, bizSnapshotItem.id),
    )
    .innerJoin(bizChannel, eq(bizSnapshotItem.channelId, bizChannel.id))
    .innerJoin(bizSite, eq(bizChannel.siteId, bizSite.id))
    .where(eq(userBookmark.userId, userId))
    .orderBy(desc(userBookmark.createdAt))
    .limit(120)
    .then((items) =>
      items.map((item) => ({
        id: item.id,
        snapshotItemId: item.snapshotItemId,
        title: item.title,
        url: item.url,
        rankNo: item.rankNo,
        hotValue: item.hotValue,
        hotLabel: item.hotLabel,
        tag: item.tag,
        channelName: item.channelName,
        siteName: item.siteName,
        channelHref: `/channels/${item.siteSlug}/${item.channelSlug}`,
        createdAt: item.createdAt,
      })),
    )
}

export async function getUserReadHistory(
  userId: string,
): Promise<UserReadHistoryItem[]> {
  return getDb()
    .select({
      id: userReadHistory.id,
      snapshotItemId: userReadHistory.snapshotItemId,
      title: userReadHistory.title,
      url: userReadHistory.url,
      rankNo: bizSnapshotItem.rankNo,
      hotValue: bizSnapshotItem.hotValue,
      hotLabel: bizSnapshotItem.hotLabel,
      tag: bizSnapshotItem.tag,
      createdAt: userReadHistory.lastReadAt,
      firstReadAt: userReadHistory.firstReadAt,
      lastReadAt: userReadHistory.lastReadAt,
      readCount: userReadHistory.readCount,
      channelName: bizChannel.channelName,
      siteName: bizSite.siteName,
      siteSlug: bizSite.slug,
      channelSlug: bizChannel.slug,
    })
    .from(userReadHistory)
    .innerJoin(
      bizSnapshotItem,
      eq(userReadHistory.snapshotItemId, bizSnapshotItem.id),
    )
    .innerJoin(bizChannel, eq(bizSnapshotItem.channelId, bizChannel.id))
    .innerJoin(bizSite, eq(bizChannel.siteId, bizSite.id))
    .where(eq(userReadHistory.userId, userId))
    .orderBy(desc(userReadHistory.lastReadAt))
    .limit(160)
    .then((items) =>
      items.map((item) => ({
        id: item.id,
        snapshotItemId: item.snapshotItemId,
        title: item.title,
        url: item.url,
        rankNo: item.rankNo,
        hotValue: item.hotValue,
        hotLabel: item.hotLabel,
        tag: item.tag,
        channelName: item.channelName,
        siteName: item.siteName,
        channelHref: `/channels/${item.siteSlug}/${item.channelSlug}`,
        createdAt: item.createdAt,
        firstReadAt: item.firstReadAt,
        lastReadAt: item.lastReadAt,
        readCount: item.readCount,
      })),
    )
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
