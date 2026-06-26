import { requireAdmin } from "@/server/auth/session"
import { getAdminOperationsAnalytics } from "@/features/admin-content/queries"
import { getAppSettings, settingBoolean } from "@/server/settings/app-settings"

export const dynamic = "force-dynamic"

export async function GET() {
  await requireAdmin()

  const settings = await getAppSettings()

  if (!settingBoolean(settings, "analytics.export_enabled")) {
    return new Response("Analytics export is disabled", { status: 403 })
  }

  const data = await getAdminOperationsAnalytics()
  const rows: string[][] = [
    ["section", "key", "label", "value", "detail"],
    [
      "stats",
      "activeChannels",
      "活跃频道",
      String(data.stats.activeChannels),
      "",
    ],
    ["stats", "homeChannels", "首页频道", String(data.stats.homeChannels), ""],
    [
      "stats",
      "todaySnapshots",
      "今日快照",
      String(data.stats.todaySnapshots),
      "",
    ],
    ["stats", "todayItems", "今日内容", String(data.stats.todayItems), ""],
    [
      "stats",
      "todayFailedRuns",
      "失败任务",
      String(data.stats.todayFailedRuns),
      "",
    ],
    ["stats", "users", "用户", String(data.stats.users), ""],
    [
      "stats",
      "subscriptions",
      "频道订阅",
      String(data.stats.subscriptions),
      "",
    ],
    [
      "stats",
      "activeMemberships",
      "有效会员",
      String(data.stats.activeMemberships),
      "",
    ],
    [
      "stats",
      "todayNotifications",
      "今日通知",
      String(data.stats.todayNotifications),
      "",
    ],
    [
      "stats",
      "unreadNotifications",
      "未读通知",
      String(data.stats.unreadNotifications),
      "",
    ],
    [
      "stats",
      "todayTrackingMatches",
      "今日追踪",
      String(data.stats.todayTrackingMatches),
      "",
    ],
    [
      "stats",
      "activeDailyReports",
      "日报",
      String(data.stats.activeDailyReports),
      "",
    ],
    [
      "stats",
      "todaySearches",
      "今日搜索",
      String(data.stats.todaySearches),
      "",
    ],
    ["stats", "bookmarks", "收藏内容", String(data.stats.bookmarks), ""],
    ["stats", "todayReads", "今日阅读", String(data.stats.todayReads), ""],
    ["stats", "pendingJobs", "待处理任务", String(data.stats.pendingJobs), ""],
    [],
    [
      "section",
      "site",
      "channel",
      "definition_key",
      "status",
      "crawl_enabled",
      "last_success_at",
      "snapshot_time",
      "snapshot_items",
      "today_failed_runs",
    ],
    ...data.channelHealth.map((channel) => [
      "channel_health",
      channel.siteName,
      channel.channelName,
      channel.definitionKey,
      channel.status,
      channel.isCrawlEnabled ? "true" : "false",
      formatDate(channel.lastSuccessAt),
      formatDate(channel.snapshotTime),
      String(channel.snapshotItemCount ?? 0),
      String(channel.todayFailedRuns),
    ]),
  ]

  const csv = `\uFEFF${rows.map((row) => row.map(csvValue).join(",")).join("\n")}`

  return new Response(csv, {
    headers: {
      "content-disposition": `attachment; filename="nextnews-analytics-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
      "content-type": "text/csv; charset=utf-8",
    },
  })
}

function csvValue(value: string) {
  if (!/[",\n]/.test(value)) {
    return value
  }

  return `"${value.replaceAll('"', '""')}"`
}

function formatDate(value: Date | string | null) {
  if (!value) {
    return ""
  }

  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return date.toISOString()
}
