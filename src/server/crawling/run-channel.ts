import { and, eq, gt, isNull, lt, sql } from "drizzle-orm"
import { getChannelDefinition } from "@/server/channels/registry"
import { hashText } from "@/server/content/hash"
import { getDb } from "@/server/db/client"
import {
  bizChannel,
  bizChannelSnapshot,
  bizContentItem,
  bizSnapshotItem,
  logCrawlRun,
} from "@/server/db/schema"
import { enqueueSystemJob } from "@/server/jobs/queue"
import { recordSubscriptionNotificationsForSnapshot } from "@/server/subscriptions/notifications"
import { recordTrackingMatchesForSnapshot } from "@/server/tracking/matches"
import type { NewsItem } from "@/types"
import { fetchRssItems } from "./rss"

type CrawlRunType = typeof logCrawlRun.$inferInsert.runType
type CrawlRunStatus = "success" | "skipped"

const CRAWL_LOCK_NAMESPACE = 0x4e4e
const runningTimeoutSeconds = Number(
  process.env.CRAWL_RUNNING_TIMEOUT_SECONDS ?? 15 * 60,
)

type NormalizedNewsItem = {
  sourceItemId: string | undefined
  title: string
  url: string
  imageUrl: string | undefined
  summary: string | undefined
  rankNo: number
  hotValue: string | undefined
  hotLabel: string | undefined
  tag: string | undefined
  publishedAt: Date | undefined
  extra: Record<string, unknown>
  urlHash: string
  titleHash: string
}

export type RunChannelCrawlResult = {
  channelId: string
  runId?: string
  snapshotId?: string
  status: CrawlRunStatus
  fetchedCount: number
  insertedCount: number
  createdSnapshot: boolean
  skippedReason?: string
}

export async function runChannelCrawl(
  channelId: string,
  options: { runType?: CrawlRunType } = {},
): Promise<RunChannelCrawlResult> {
  const db = getDb()
  const startedAt = Date.now()
  const [channel] = await db
    .select()
    .from(bizChannel)
    .where(and(eq(bizChannel.id, channelId), isNull(bizChannel.deletedAt)))
    .limit(1)

  if (!channel) {
    throw new Error("频道不存在或已删除")
  }

  const reservation = await reserveCrawlRun(
    channelId,
    options.runType ?? "scheduled",
    startedAt,
  )

  if (reservation.status === "skipped") {
    return {
      channelId,
      status: "skipped",
      fetchedCount: 0,
      insertedCount: 0,
      createdSnapshot: false,
      skippedReason: reservation.reason,
    }
  }

  try {
    const definition = getChannelDefinition(channel.definitionKey)

    if (!definition) {
      throw new Error(`未找到频道定义：${channel.definitionKey}`)
    }

    const rawItems = await collectItems(definition)
    const items = normalizeItems(rawItems)
    const now = new Date()
    const contentHash = hashSnapshot(items)

    const result = await db.transaction(async (tx) => {
      const [snapshot] = await tx
        .insert(bizChannelSnapshot)
        .values({
          channelId,
          crawlRunId: reservation.runId,
          snapshotTime: now,
          snapshotDate: formatDate(now),
          itemCount: items.length,
          contentHash,
          status: "active",
        })
        .onConflictDoNothing({
          target: [
            bizChannelSnapshot.channelId,
            bizChannelSnapshot.contentHash,
          ],
        })
        .returning({ id: bizChannelSnapshot.id })

      if (!snapshot) {
        const [existingSnapshot] = await tx
          .select({ id: bizChannelSnapshot.id })
          .from(bizChannelSnapshot)
          .where(
            and(
              eq(bizChannelSnapshot.channelId, channelId),
              eq(bizChannelSnapshot.contentHash, contentHash),
            ),
          )
          .limit(1)

        if (!existingSnapshot) {
          throw new Error("快照写入冲突，请稍后重试")
        }

        await tx
          .update(bizChannel)
          .set({
            lastSnapshotId: existingSnapshot.id,
            lastCrawlAt: now,
            lastSuccessAt: now,
            updatedAt: now,
          })
          .where(eq(bizChannel.id, channelId))

        return {
          snapshotId: existingSnapshot.id,
          insertedCount: 0,
          createdSnapshot: false,
        }
      }

      const snapshotRows = []

      for (const item of items) {
        const [contentItem] = await tx
          .insert(bizContentItem)
          .values({
            canonicalTitle: item.title,
            canonicalUrl: item.url,
            urlHash: item.urlHash,
            titleHash: item.titleHash,
            firstChannelId: channelId,
            firstSeenAt: now,
            lastSeenAt: now,
            imageUrl: item.imageUrl,
            extra: item.sourceItemId ? { sourceItemId: item.sourceItemId } : {},
          })
          .onConflictDoUpdate({
            target: bizContentItem.urlHash,
            set: {
              canonicalTitle: item.title,
              canonicalUrl: item.url,
              titleHash: item.titleHash,
              lastSeenAt: now,
              imageUrl: item.imageUrl,
              updatedAt: now,
            },
          })
          .returning({ id: bizContentItem.id })

        snapshotRows.push({
          snapshotId: snapshot.id,
          channelId,
          contentItemId: contentItem.id,
          rankNo: item.rankNo,
          title: item.title,
          url: item.url,
          urlHash: item.urlHash,
          imageUrl: item.imageUrl,
          summary: item.summary,
          hotValue: item.hotValue,
          hotLabel: item.hotLabel,
          tag: item.tag,
          publishedAt: item.publishedAt,
          extra: item.extra,
        })
      }

      if (snapshotRows.length > 0) {
        await tx.insert(bizSnapshotItem).values(snapshotRows)
      }

      await tx
        .update(bizChannel)
        .set({
          lastSnapshotId: snapshot.id,
          lastCrawlAt: now,
          lastSuccessAt: now,
          updatedAt: now,
        })
        .where(eq(bizChannel.id, channelId))

      return {
        snapshotId: snapshot.id,
        insertedCount: snapshotRows.length,
        createdSnapshot: true,
      }
    })

    await db
      .update(logCrawlRun)
      .set({
        status: "success",
        finishedAt: now,
        durationMs: Date.now() - startedAt,
        fetchedCount: rawItems.length,
        insertedCount: result.insertedCount,
        snapshotId: result.snapshotId,
      })
      .where(eq(logCrawlRun.id, reservation.runId))

    if (result.createdSnapshot) {
      try {
        await enqueueSystemJob({
          jobType: "snapshot.created",
          payload: {
            channelId,
            crawlRunId: reservation.runId,
            snapshotId: result.snapshotId,
          },
        })
      } catch (error) {
        console.error("[nextnews] snapshot job enqueue failed", error)
      }

      try {
        await recordTrackingMatchesForSnapshot(result.snapshotId)
      } catch (error) {
        console.error("[nextnews] tracking match processing failed", error)
      }

      try {
        await recordSubscriptionNotificationsForSnapshot(result.snapshotId)
      } catch (error) {
        console.error(
          "[nextnews] subscription notification processing failed",
          error,
        )
      }
    }

    return {
      channelId,
      runId: reservation.runId,
      snapshotId: result.snapshotId,
      status: "success",
      fetchedCount: rawItems.length,
      insertedCount: result.insertedCount,
      createdSnapshot: result.createdSnapshot,
    }
  } catch (error) {
    const now = new Date()

    await Promise.all([
      db
        .update(logCrawlRun)
        .set({
          status: "failed",
          finishedAt: now,
          durationMs: Date.now() - startedAt,
          errorMessage: error instanceof Error ? error.message : "采集失败",
          errorStack: error instanceof Error ? error.stack : undefined,
        })
        .where(eq(logCrawlRun.id, reservation.runId)),
      db
        .update(bizChannel)
        .set({
          lastCrawlAt: now,
          updatedAt: now,
        })
        .where(eq(bizChannel.id, channelId)),
    ])

    throw error
  }
}

async function reserveCrawlRun(
  channelId: string,
  runType: CrawlRunType = "scheduled",
  startedAt: number,
) {
  const db = getDb()
  const now = new Date(startedAt)
  const staleBefore = new Date(startedAt - runningTimeoutSeconds * 1000)

  return db.transaction(async (tx) => {
    const lockRows = await tx.execute<{ locked: boolean }>(
      sql`select pg_try_advisory_xact_lock(${CRAWL_LOCK_NAMESPACE}, hashtext(${channelId})) as locked`,
    )
    const locked = Boolean(lockRows[0]?.locked)

    if (!locked) {
      return {
        status: "skipped" as const,
        reason: "已有采集任务正在登记，请稍后再试",
      }
    }

    await tx
      .update(logCrawlRun)
      .set({
        status: "failed",
        finishedAt: now,
        errorMessage: "采集任务超时，已释放运行锁",
      })
      .where(
        and(
          eq(logCrawlRun.channelId, channelId),
          eq(logCrawlRun.status, "running"),
          lt(logCrawlRun.startedAt, staleBefore),
        ),
      )

    const [runningRun] = await tx
      .select({ id: logCrawlRun.id })
      .from(logCrawlRun)
      .where(
        and(
          eq(logCrawlRun.channelId, channelId),
          eq(logCrawlRun.status, "running"),
          gt(logCrawlRun.startedAt, staleBefore),
        ),
      )
      .limit(1)

    if (runningRun) {
      return {
        status: "skipped" as const,
        reason: "该频道已有采集任务正在运行",
      }
    }

    const [run] = await tx
      .insert(logCrawlRun)
      .values({
        channelId,
        runType,
        status: "running",
      })
      .returning({ id: logCrawlRun.id })

    return {
      status: "reserved" as const,
      runId: run.id,
    }
  })
}

async function collectItems(
  definition: NonNullable<ReturnType<typeof getChannelDefinition>>,
) {
  if (definition.collectorType === "rss") {
    return fetchRssItems(definition)
  }

  if (!definition.collect) {
    throw new Error(`频道定义 ${definition.key} 缺少 collect()`)
  }

  return definition.collect()
}

function normalizeItems(items: NewsItem[]): NormalizedNewsItem[] {
  return items
    .map((item, index) => {
      const title = cleanString(item.title)
      const url = cleanUrl(item.url)

      if (!title || !url) {
        return null
      }

      return {
        sourceItemId: cleanString(item.sourceItemId),
        title,
        url,
        imageUrl: cleanUrl(item.imageUrl),
        summary: cleanString(item.summary),
        rankNo: item.rankNo ?? index + 1,
        hotValue:
          item.hotValue === undefined ? undefined : String(item.hotValue),
        hotLabel: cleanString(item.hotLabel),
        tag: cleanString(item.tag),
        publishedAt: parseDate(item.publishedAt),
        extra: item.extra ?? {},
        urlHash: hashText(url),
        titleHash: hashText(title),
      }
    })
    .filter((item): item is NormalizedNewsItem => Boolean(item))
}

function hashSnapshot(items: NormalizedNewsItem[]) {
  return hashText(
    JSON.stringify(
      items.map((item) => ({
        rankNo: item.rankNo,
        title: item.title,
        url: item.url,
        hotValue: item.hotValue,
        hotLabel: item.hotLabel,
      })),
    ),
  )
}

function cleanString(value?: string) {
  const trimmed = value?.replace(/\s+/g, " ").trim()
  return trimmed || undefined
}

function cleanUrl(value?: string) {
  const trimmed = cleanString(value)

  if (!trimmed) {
    return undefined
  }

  try {
    return new URL(trimmed).toString()
  } catch {
    return trimmed
  }
}

function parseDate(value?: string) {
  if (!value) {
    return undefined
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10)
}
