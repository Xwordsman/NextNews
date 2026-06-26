import { and, eq, sql } from "drizzle-orm"
import { getDb } from "@/server/db/client"
import { sysJobQueue } from "@/server/db/schema"
import { getAppSettings, settingBoolean } from "@/server/settings/app-settings"
import { recordSubscriptionNotificationsForSnapshot } from "@/server/subscriptions/notifications"
import { recordTrackingMatchesForSnapshot } from "@/server/tracking/matches"

type ClaimedSystemJob = {
  id: string
  jobType: string
  payload: Record<string, unknown> | null
  attempts: number
  maxAttempts: number
}

export type ProcessSystemJobsResult = {
  disabled: boolean
  processedCount: number
  successCount: number
  failedCount: number
  retriedCount: number
  skippedCount: number
  errors: Array<{
    jobId: string
    jobType: string
    message: string
  }>
}

export async function enqueueSystemJob(input: {
  availableAt?: Date
  jobType: string
  maxAttempts?: number
  payload?: Record<string, unknown>
}) {
  const settings = await getAppSettings()

  if (!settingBoolean(settings, "jobs.async_enabled")) {
    return { enqueued: false, jobId: null }
  }

  const [job] = await getDb()
    .insert(sysJobQueue)
    .values({
      jobType: input.jobType,
      payload: input.payload ?? {},
      maxAttempts: input.maxAttempts ?? 3,
      availableAt: input.availableAt ?? new Date(),
    })
    .returning({ id: sysJobQueue.id })

  return { enqueued: true, jobId: job?.id ?? null }
}

export async function processDueSystemJobs(
  input: { limit?: number } = {},
): Promise<ProcessSystemJobsResult> {
  const settings = await getAppSettings()

  if (!settingBoolean(settings, "jobs.async_enabled")) {
    return emptyProcessResult(true)
  }

  const limit = Math.max(1, Math.min(input.limit ?? 10, 100))
  const jobs = await claimDueJobs(limit)
  const result = emptyProcessResult(false)

  for (const job of jobs) {
    result.processedCount += 1

    try {
      const jobResult = await runSystemJob(job)

      await markJobSuccess(job.id)

      if (jobResult.skipped) {
        result.skippedCount += 1
      } else {
        result.successCount += 1
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Job failed"
      const retried = await markJobFailed(job, message)

      if (retried) {
        result.retriedCount += 1
      } else {
        result.failedCount += 1
      }

      result.errors.push({
        jobId: job.id,
        jobType: job.jobType,
        message,
      })
    }
  }

  return result
}

export async function processSnapshotCreatedJob(snapshotId: string) {
  const [trackingResult, notificationResult] = await Promise.all([
    recordTrackingMatchesForSnapshot(snapshotId),
    recordSubscriptionNotificationsForSnapshot(snapshotId),
  ])

  return {
    notificationCount: notificationResult.insertedCount,
    trackingMatchCount: trackingResult.insertedCount,
  }
}

export function parseSnapshotCreatedPayload(payload: unknown) {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("snapshotId" in payload)
  ) {
    throw new Error("snapshot.created payload requires snapshotId")
  }

  const snapshotId = (payload as { snapshotId?: unknown }).snapshotId

  if (typeof snapshotId !== "string" || !isUuid(snapshotId)) {
    throw new Error("snapshot.created payload snapshotId is invalid")
  }

  return { snapshotId }
}

export function getJobRetryDelayMs(attempts: number) {
  const normalizedAttempts = Math.max(1, attempts)
  const minutes = Math.min(60, 2 ** (normalizedAttempts - 1))

  return minutes * 60 * 1000
}

async function claimDueJobs(limit: number) {
  const db = getDb()
  const rows = await db.execute<ClaimedSystemJob>(sql`
    update ${sysJobQueue}
    set
      status = 'running',
      attempts = attempts + 1,
      locked_at = now(),
      error_message = null,
      updated_at = now()
    where id in (
      select id
      from ${sysJobQueue}
      where status = 'pending'
        and available_at <= now()
        and deleted_at is null
      order by available_at asc, created_at asc
      limit ${limit}
      for update skip locked
    )
    returning id, job_type as "jobType", payload, attempts, max_attempts as "maxAttempts"
  `)

  return Array.from(rows)
}

async function runSystemJob(job: ClaimedSystemJob) {
  if (job.jobType === "snapshot.created") {
    const payload = parseSnapshotCreatedPayload(job.payload)
    await processSnapshotCreatedJob(payload.snapshotId)

    return { skipped: false }
  }

  if (job.jobType.startsWith("daily.")) {
    return { skipped: true }
  }

  throw new Error(`Unsupported system job type: ${job.jobType}`)
}

async function markJobSuccess(jobId: string) {
  await getDb()
    .update(sysJobQueue)
    .set({
      status: "success",
      finishedAt: new Date(),
      lockedAt: null,
      errorMessage: null,
      updatedAt: new Date(),
    })
    .where(and(eq(sysJobQueue.id, jobId), eq(sysJobQueue.status, "running")))
}

async function markJobFailed(job: ClaimedSystemJob, message: string) {
  const exhausted = job.attempts >= job.maxAttempts
  const now = new Date()

  await getDb()
    .update(sysJobQueue)
    .set({
      status: exhausted ? "failed" : "pending",
      availableAt: exhausted
        ? now
        : new Date(now.getTime() + getJobRetryDelayMs(job.attempts)),
      lockedAt: null,
      finishedAt: exhausted ? now : null,
      errorMessage: message.slice(0, 2000),
      updatedAt: now,
    })
    .where(and(eq(sysJobQueue.id, job.id), eq(sysJobQueue.status, "running")))

  return !exhausted
}

function emptyProcessResult(disabled: boolean): ProcessSystemJobsResult {
  return {
    disabled,
    processedCount: 0,
    successCount: 0,
    failedCount: 0,
    retriedCount: 0,
    skippedCount: 0,
    errors: [],
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
}
