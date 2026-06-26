import { closeDatabaseConnection } from "@/server/db/client"
import { runDueChannelCrawls } from "@/server/crawling/scheduler"
import { getInstallState } from "@/server/install/service"
import { processDueSystemJobs } from "@/server/jobs/queue"

const pollIntervalMs =
  Number(process.env.WORKER_POLL_INTERVAL_SECONDS ?? 30) * 1000
const batchSize = Number(process.env.CRAWL_BATCH_SIZE ?? 5)
const jobBatchSize = Number(process.env.JOB_BATCH_SIZE ?? batchSize)

let stopping = false
let lastInstallWaitLogAt = 0

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
    `[nextnews-worker] polling every ${pollIntervalMs / 1000}s, crawl batch size ${batchSize}, job batch size ${jobBatchSize}`,
  )

  while (!stopping) {
    try {
      const installState = await getInstallState()

      if (!installState.installed) {
        const now = Date.now()

        if (now - lastInstallWaitLogAt > 60_000) {
          console.log(
            "[nextnews-worker] waiting for web installer to initialize database",
          )
          lastInstallWaitLogAt = now
        }

        await sleep(pollIntervalMs)
        continue
      }

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

      const jobResult = await processDueSystemJobs({ limit: jobBatchSize })

      if (
        !jobResult.disabled &&
        (jobResult.processedCount > 0 || jobResult.failedCount > 0)
      ) {
        console.log(
          `[nextnews-worker] jobs processed=${jobResult.processedCount} success=${jobResult.successCount} skipped=${jobResult.skippedCount} retry=${jobResult.retriedCount} failed=${jobResult.failedCount}`,
        )
      }

      for (const error of jobResult.errors) {
        console.error(
          `[nextnews-worker] job=${error.jobId} type=${error.jobType} failed: ${error.message}`,
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
