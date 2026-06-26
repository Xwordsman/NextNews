import { closeDatabaseConnection } from "@/server/db/client"
import { runDueChannelCrawls } from "@/server/crawling/scheduler"

const pollIntervalMs =
  Number(process.env.WORKER_POLL_INTERVAL_SECONDS ?? 30) * 1000
const batchSize = Number(process.env.CRAWL_BATCH_SIZE ?? 5)

let stopping = false

process.once("SIGINT", () => {
  stopping = true
})

process.once("SIGTERM", () => {
  stopping = true
})

async function main() {
  console.log(
    `[nextnews-worker] bootstrap started at ${new Date().toISOString()}`,
  )
  console.log(
    `[nextnews-worker] polling every ${pollIntervalMs / 1000}s, batch size ${batchSize}`,
  )

  while (!stopping) {
    try {
      const result = await runDueChannelCrawls({ limit: batchSize })

      if (result.dueCount > 0 || result.failedCount > 0) {
        console.log(
          `[nextnews-worker] scanned=${result.scannedCount} due=${result.dueCount} success=${result.successCount} skipped=${result.skippedCount} failed=${result.failedCount}`,
        )
      }

      for (const error of result.errors) {
        console.error(
          `[nextnews-worker] channel=${error.channelId} failed: ${error.message}`,
        )
      }
    } catch (error) {
      console.error("[nextnews-worker] scheduler tick failed")
      console.error(error)
    }

    await sleep(pollIntervalMs)
  }

  await closeDatabaseConnection()
  console.log("[nextnews-worker] stopped")
}

function sleep(durationMs: number) {
  return new Promise((resolve) => setTimeout(resolve, durationMs))
}

void main()
