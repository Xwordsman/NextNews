import { and, asc, desc, eq, gte, inArray, lt } from "drizzle-orm"
import { getDb } from "@/server/db/client"
import {
  bizChannel,
  bizChannelSnapshot,
  bizSnapshotItem,
  bizSite,
  relUserChannelSubscription,
  userNotification,
} from "@/server/db/schema"
import {
  getAppSettings,
  settingBoolean,
  settingNumber,
} from "@/server/settings/app-settings"
import { shouldNotifyForTopChanges } from "./notification-strategy"

export async function recordSubscriptionNotificationsForSnapshot(
  snapshotId: string,
) {
  const settings = await getAppSettings()

  if (!settingBoolean(settings, "notification.subscription_enabled")) {
    return { insertedCount: 0 }
  }

  const db = getDb()
  const [snapshot] = await db
    .select({
      id: bizChannelSnapshot.id,
      itemCount: bizChannelSnapshot.itemCount,
      snapshotTime: bizChannelSnapshot.snapshotTime,
      channelId: bizChannel.id,
      channelName: bizChannel.channelName,
      channelSlug: bizChannel.slug,
      siteName: bizSite.siteName,
      siteSlug: bizSite.slug,
    })
    .from(bizChannelSnapshot)
    .innerJoin(bizChannel, eq(bizChannelSnapshot.channelId, bizChannel.id))
    .innerJoin(bizSite, eq(bizChannel.siteId, bizSite.id))
    .where(eq(bizChannelSnapshot.id, snapshotId))
    .limit(1)

  if (!snapshot) {
    return { insertedCount: 0 }
  }

  const topChangeOnly = settingBoolean(
    settings,
    "notification.subscription_top_change_only",
  )

  if (topChangeOnly) {
    const rankLimit = settingNumber(
      settings,
      "notification.subscription_top_rank_limit",
      10,
    )
    const [currentItems, previousItems] = await Promise.all([
      listSnapshotTopItems(snapshot.id, rankLimit),
      listPreviousSnapshotTopItems({
        channelId: snapshot.channelId,
        currentSnapshotTime: snapshot.snapshotTime,
        rankLimit,
      }),
    ])
    const decision = shouldNotifyForTopChanges({
      currentItems,
      minNewTopItems: settingNumber(
        settings,
        "notification.subscription_min_new_top_items",
        1,
      ),
      previousItems,
      rankLimit,
      topChangeOnly,
    })

    if (!decision.shouldNotify) {
      return { insertedCount: 0, skippedReason: "top_change_threshold" }
    }
  }

  const subscriptions = await db
    .select({
      userId: relUserChannelSubscription.userId,
    })
    .from(relUserChannelSubscription)
    .where(
      and(
        eq(relUserChannelSubscription.channelId, snapshot.channelId),
        eq(relUserChannelSubscription.notifyEnabled, true),
      ),
    )

  if (subscriptions.length === 0) {
    return { insertedCount: 0 }
  }

  const userIds = subscriptions.map((subscription) => subscription.userId)
  const minIntervalMinutes = settingNumber(
    settings,
    "notification.subscription_min_interval_minutes",
  )
  const throttledUserIds = new Set<string>()

  if (minIntervalMinutes > 0) {
    const cutoff = new Date(Date.now() - minIntervalMinutes * 60 * 1000)
    const recentRows = await db
      .select({ userId: userNotification.userId })
      .from(userNotification)
      .innerJoin(
        bizChannelSnapshot,
        eq(userNotification.sourceId, bizChannelSnapshot.id),
      )
      .where(
        and(
          inArray(userNotification.userId, userIds),
          eq(userNotification.sourceType, "channel_snapshot"),
          eq(bizChannelSnapshot.channelId, snapshot.channelId),
          gte(userNotification.createdAt, cutoff),
        ),
      )

    for (const row of recentRows) {
      throttledUserIds.add(row.userId)
    }
  }

  const existingRows = await db
    .select({ userId: userNotification.userId })
    .from(userNotification)
    .where(
      and(
        inArray(userNotification.userId, userIds),
        eq(userNotification.sourceType, "channel_snapshot"),
        eq(userNotification.sourceId, snapshot.id),
      ),
    )

  const existingUserIds = new Set(existingRows.map((row) => row.userId))
  const values = subscriptions
    .filter(
      (subscription) =>
        !existingUserIds.has(subscription.userId) &&
        !throttledUserIds.has(subscription.userId),
    )
    .map((subscription) => ({
      userId: subscription.userId,
      notificationType: "channel_update",
      title: `${snapshot.siteName} / ${snapshot.channelName} 已更新`,
      body: `新快照包含 ${snapshot.itemCount} 条内容`,
      href: `/channels/${snapshot.siteSlug}/${snapshot.channelSlug}/snapshots/${snapshot.id}`,
      sourceType: "channel_snapshot",
      sourceId: snapshot.id,
    }))

  if (values.length === 0) {
    return { insertedCount: 0 }
  }

  await db.insert(userNotification).values(values)

  return { insertedCount: values.length }
}

async function listPreviousSnapshotTopItems(input: {
  channelId: string
  currentSnapshotTime: Date
  rankLimit: number
}) {
  const [snapshot] = await getDb()
    .select({ id: bizChannelSnapshot.id })
    .from(bizChannelSnapshot)
    .where(
      and(
        eq(bizChannelSnapshot.channelId, input.channelId),
        eq(bizChannelSnapshot.status, "active"),
        lt(bizChannelSnapshot.snapshotTime, input.currentSnapshotTime),
      ),
    )
    .orderBy(desc(bizChannelSnapshot.snapshotTime))
    .limit(1)

  if (!snapshot) {
    return []
  }

  return listSnapshotTopItems(snapshot.id, input.rankLimit)
}

async function listSnapshotTopItems(snapshotId: string, rankLimit: number) {
  return getDb()
    .select({
      rankNo: bizSnapshotItem.rankNo,
      url: bizSnapshotItem.url,
      urlHash: bizSnapshotItem.urlHash,
    })
    .from(bizSnapshotItem)
    .where(eq(bizSnapshotItem.snapshotId, snapshotId))
    .orderBy(asc(bizSnapshotItem.rankNo), asc(bizSnapshotItem.createdAt))
    .limit(Math.max(1, rankLimit))
}
