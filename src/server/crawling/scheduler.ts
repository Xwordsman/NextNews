import { asc, and, eq, isNull } from "drizzle-orm"
import { getDb } from "@/server/db/client"
import { bizChannel } from "@/server/db/schema"
import { serverEnv } from "@/server/env"
import { runChannelCrawl, type RunChannelCrawlResult } from "./run-channel"

export type RunDueChannelCrawlsResult = {
  scannedCount: number
  dueCount: number
  successCount: number
  skippedCount: number
  failedCount: number
  results: RunChannelCrawlResult[]
  errors: Array<{
    channelId: string
    message: string
  }>
}

export async function runDueChannelCrawls(
  options: { limit?: number; concurrency?: number } = {},
): Promise<RunDueChannelCrawlsResult> {
  const limit = Math.max(1, options.limit ?? 5)
  const concurrency = normalizeConcurrency(options.concurrency, limit)
  const db = getDb()
  const candidates = await db
    .select({
      id: bizChannel.id,
      crawlIntervalSeconds: bizChannel.crawlIntervalSeconds,
      lastCrawlAt: bizChannel.lastCrawlAt,
    })
    .from(bizChannel)
    .where(
      and(
        isNull(bizChannel.deletedAt),
        eq(bizChannel.status, "active"),
        eq(bizChannel.isCrawlEnabled, true),
      ),
    )
    .orderBy(asc(bizChannel.lastCrawlAt), asc(bizChannel.sort))
    .limit(limit * 4)

  const now = Date.now()
  const dueChannels = candidates
    .filter((channel) => {
      if (!channel.lastCrawlAt) {
        return true
      }

      const nextCrawlAt =
        channel.lastCrawlAt.getTime() + channel.crawlIntervalSeconds * 1000

      return nextCrawlAt <= now
    })
    .slice(0, limit)

  const results: RunChannelCrawlResult[] = []
  const errors: RunDueChannelCrawlsResult["errors"] = []
  let cursor = 0

  async function runNext() {
    while (cursor < dueChannels.length) {
      const channel = dueChannels[cursor]
      cursor += 1

      try {
        results.push(
          await runChannelCrawl(channel.id, { runType: "scheduled" }),
        )
      } catch (error) {
        errors.push({
          channelId: channel.id,
          message: error instanceof Error ? error.message : "采集失败",
        })
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, dueChannels.length) }, () =>
      runNext(),
    ),
  )

  return {
    scannedCount: candidates.length,
    dueCount: dueChannels.length,
    successCount: results.filter((result) => result.status === "success")
      .length,
    skippedCount: results.filter((result) => result.status === "skipped")
      .length,
    failedCount: errors.length,
    results,
    errors,
  }
}

function normalizeConcurrency(value: number | undefined, limit: number) {
  const parsed = Number(value ?? serverEnv.crawlConcurrency)

  if (!Number.isFinite(parsed)) {
    return 1
  }

  return Math.min(Math.max(1, Math.floor(parsed)), limit)
}
