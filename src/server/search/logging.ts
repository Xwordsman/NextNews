import { headers } from "next/headers"
import { getDb } from "@/server/db/client"
import { logSearchQuery } from "@/server/db/schema"
import { getAppSettings, settingBoolean } from "@/server/settings/app-settings"

export async function recordSearchQuery(input: {
  channelId?: string
  dateFrom?: string
  dateTo?: string
  keyword: string
  resultCount: number
  siteSlug?: string
  userId?: string | null
}) {
  const keyword = input.keyword.trim()

  if (!keyword) {
    return
  }

  const settings = await getAppSettings()

  if (!settingBoolean(settings, "search.logging_enabled")) {
    return
  }

  try {
    const requestHeaders = await headers()
    const forwardedFor = requestHeaders.get("x-forwarded-for")

    await getDb()
      .insert(logSearchQuery)
      .values({
        userId: input.userId ?? null,
        keyword: keyword.slice(0, 200),
        siteSlug: input.siteSlug || null,
        channelId: input.channelId || null,
        dateFrom: isDateString(input.dateFrom) ? input.dateFrom : null,
        dateTo: isDateString(input.dateTo) ? input.dateTo : null,
        resultCount: input.resultCount,
        sourceIp: forwardedFor?.split(",")[0]?.trim() ?? null,
        userAgent: requestHeaders.get("user-agent"),
      })
  } catch (error) {
    console.error("[nextnews] search logging failed", error)
  }
}

function isDateString(value?: string) {
  return Boolean(value?.match(/^\d{4}-\d{2}-\d{2}$/))
}
