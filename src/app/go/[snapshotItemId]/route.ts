import { sql } from "drizzle-orm"
import { and, eq, isNull } from "drizzle-orm"
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/server/auth/session"
import { getDb } from "@/server/db/client"
import {
  bizChannel,
  bizSite,
  bizSnapshotItem,
  userReadHistory,
} from "@/server/db/schema"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ snapshotItemId: string }> },
) {
  const { snapshotItemId } = await context.params

  if (!isUuid(snapshotItemId)) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  const db = getDb()
  const [item] = await db
    .select({
      id: bizSnapshotItem.id,
      channelId: bizSnapshotItem.channelId,
      title: bizSnapshotItem.title,
      url: bizSnapshotItem.url,
    })
    .from(bizSnapshotItem)
    .innerJoin(bizChannel, eq(bizSnapshotItem.channelId, bizChannel.id))
    .innerJoin(bizSite, eq(bizChannel.siteId, bizSite.id))
    .where(
      and(
        eq(bizSnapshotItem.id, snapshotItemId),
        isNull(bizChannel.deletedAt),
        isNull(bizSite.deletedAt),
        eq(bizChannel.status, "active"),
        eq(bizChannel.isPublic, true),
        eq(bizSite.status, "active"),
        eq(bizSite.isVisible, true),
      ),
    )
    .limit(1)

  if (!item) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  const user = await getCurrentUser()

  if (user) {
    const now = new Date()

    await db
      .insert(userReadHistory)
      .values({
        userId: user.id,
        snapshotItemId: item.id,
        channelId: item.channelId,
        title: item.title,
        url: item.url,
        readCount: 1,
        firstReadAt: now,
        lastReadAt: now,
      })
      .onConflictDoUpdate({
        target: [userReadHistory.userId, userReadHistory.snapshotItemId],
        set: {
          channelId: item.channelId,
          title: item.title,
          url: item.url,
          readCount: sql`${userReadHistory.readCount} + 1`,
          lastReadAt: now,
        },
      })
  }

  return NextResponse.redirect(item.url)
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
}
