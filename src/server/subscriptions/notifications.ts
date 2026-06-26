import { and, eq, inArray } from "drizzle-orm"
import { getDb } from "@/server/db/client"
import {
  bizChannel,
  bizChannelSnapshot,
  bizSite,
  relUserChannelSubscription,
  userNotification,
} from "@/server/db/schema"

export async function recordSubscriptionNotificationsForSnapshot(
  snapshotId: string,
) {
  const db = getDb()
  const [snapshot] = await db
    .select({
      id: bizChannelSnapshot.id,
      itemCount: bizChannelSnapshot.itemCount,
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
    .filter((subscription) => !existingUserIds.has(subscription.userId))
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
