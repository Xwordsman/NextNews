import { getDb } from "@/server/db/client"
import { sysJobQueue } from "@/server/db/schema"
import { getAppSettings, settingBoolean } from "@/server/settings/app-settings"

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
