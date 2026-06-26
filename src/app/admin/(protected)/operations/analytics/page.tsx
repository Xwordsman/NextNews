import Link from "next/link"
import { Download } from "lucide-react"
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminSection,
  AdminTable,
  BooleanBadge,
  StatusBadge,
  formatDateTime,
} from "@/features/admin-content/components/admin-ui"
import { getAdminOperationsAnalytics } from "@/features/admin-content/queries"

export const dynamic = "force-dynamic"

export default async function AdminOperationsAnalyticsPage() {
  const data = await getAdminOperationsAnalytics()
  const stats = [
    {
      label: "活跃频道",
      value: data.stats.activeChannels,
      detail: "状态为 active 的频道",
    },
    {
      label: "首页频道",
      value: data.stats.homeChannels,
      detail: "已展示在首页聚合",
    },
    {
      label: "今日快照",
      value: data.stats.todaySnapshots,
      detail: "今天新入库榜单快照",
    },
    {
      label: "今日内容",
      value: data.stats.todayItems,
      detail: "今天写入的快照条目",
    },
    {
      label: "失败采集",
      value: data.stats.todayFailedRuns,
      detail: "今天失败的采集运行",
    },
    { label: "用户", value: data.stats.users, detail: "后台与前台账号" },
    {
      label: "频道订阅",
      value: data.stats.subscriptions,
      detail: "个人中心订阅关系",
    },
    {
      label: "有效会员",
      value: data.stats.activeMemberships,
      detail: "后台授予的 active 权益",
    },
    {
      label: "今日通知",
      value: data.stats.todayNotifications,
      detail: "今天生成的站内通知",
    },
    {
      label: "未读通知",
      value: data.stats.unreadNotifications,
      detail: "用户尚未读取",
    },
    {
      label: "今日追踪",
      value: data.stats.todayTrackingMatches,
      detail: "追踪关键词命中",
    },
    {
      label: "日报",
      value: data.stats.activeDailyReports,
      detail: "已发布日报数量",
    },
    {
      label: "今日搜索",
      value: data.stats.todaySearches,
      detail: "前台搜索日志命中次数",
    },
    {
      label: "收藏内容",
      value: data.stats.bookmarks,
      detail: "用户收藏的快照条目",
    },
    {
      label: "今日阅读",
      value: data.stats.todayReads,
      detail: "通过跳转页记录的阅读次数",
    },
    {
      label: "待处理任务",
      value: data.stats.pendingJobs,
      detail: "系统任务队列中的 pending 任务",
    },
    {
      label: "失败队列",
      value: data.stats.failedJobs,
      detail: "需要排查或手动重试的 failed 任务",
    },
  ]
  const trendMetrics = [
    { key: "snapshots", label: "快照", tone: "bg-slate-900" },
    { key: "items", label: "内容", tone: "bg-blue-600" },
    { key: "searches", label: "搜索", tone: "bg-emerald-600" },
    { key: "notifications", label: "通知", tone: "bg-amber-500" },
    { key: "reads", label: "阅读", tone: "bg-violet-600" },
    { key: "failedRuns", label: "失败", tone: "bg-red-500" },
  ]

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        description="汇总前台运营、采集健康、用户订阅、通知和会员权益数据，用于快速判断哪些模块需要处理。"
        eyebrow="Analytics"
        title="运营统计"
      />
      <div className="flex justify-end">
        <Link
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-900 hover:text-white"
          href="/admin/operations/analytics/export"
        >
          <Download aria-hidden="true" size={16} />
          导出 CSV
        </Link>
      </div>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {data.alerts.map((alert) => (
          <article
            className={`rounded-2xl border p-4 shadow-sm ${alertClassName(
              alert.level,
            )}`}
            key={`${alert.level}-${alert.title}`}
          >
            <p className="text-sm font-semibold">{alert.title}</p>
            <p className="mt-2 text-sm leading-6">{alert.description}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <article
            className="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm backdrop-blur-xl"
            key={item.label}
          >
            <p className="text-sm font-medium text-slate-500">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold">{item.value}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {item.detail}
            </p>
          </article>
        ))}
      </section>

      <AdminSection>
        <div className="grid gap-5 p-5">
          <div>
            <h2 className="text-base font-semibold">14 天趋势</h2>
            <p className="mt-1 text-sm text-slate-500">
              用于观察采集、搜索、通知和阅读是否出现持续异常。
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {trendMetrics.map((metric) => (
              <TrendPanel
                key={metric.key}
                metricKey={metric.key}
                rows={data.dailyTrend}
                title={metric.label}
                tone={metric.tone}
              />
            ))}
          </div>
        </div>
      </AdminSection>

      <AdminSection>
        {data.channelHealth.length === 0 ? (
          <AdminEmptyState
            description="创建频道并完成采集后，这里会显示最新快照和失败任务。"
            title="暂无频道健康数据"
          />
        ) : (
          <AdminTable>
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-5 py-3">频道</th>
                <th className="px-5 py-3">状态</th>
                <th className="px-5 py-3">采集</th>
                <th className="px-5 py-3">最近成功</th>
                <th className="px-5 py-3">最新快照</th>
                <th className="px-5 py-3">今日失败</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.channelHealth.map((channel) => (
                <tr className="hover:bg-slate-50/80" key={channel.id}>
                  <td className="px-5 py-4">
                    <div className="font-semibold">
                      {channel.siteName} / {channel.channelName}
                    </div>
                    <div className="mt-1 font-mono text-xs text-slate-500">
                      {channel.definitionKey}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={channel.status} />
                  </td>
                  <td className="px-5 py-4">
                    <BooleanBadge
                      active={channel.isCrawlEnabled}
                      activeLabel="已开启"
                      inactiveLabel="已关闭"
                    />
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {formatDateTime(channel.lastSuccessAt)}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {channel.snapshotId
                      ? `${formatDateTime(channel.snapshotTime)} / ${
                          channel.snapshotItemCount ?? 0
                        } 条`
                      : "暂无快照"}
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                    {channel.todayFailedRuns}
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </AdminSection>
    </div>
  )
}

function TrendPanel({
  metricKey,
  rows,
  title,
  tone,
}: {
  metricKey: string
  rows: Array<Record<string, number | string>>
  title: string
  tone: string
}) {
  const values = rows.map((row) => Number(row[metricKey] ?? 0))
  const maxValue = Math.max(1, ...values)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-700">{title}</p>
        <p className="font-mono text-xs text-slate-500">
          {values.reduce((sum, value) => sum + value, 0)}
        </p>
      </div>
      <div className="mt-4 flex h-20 items-end gap-1.5">
        {rows.map((row) => {
          const value = Number(row[metricKey] ?? 0)

          return (
            <div
              className="flex min-w-0 flex-1 items-end"
              key={`${metricKey}-${row.date}`}
              title={`${row.date}: ${value}`}
            >
              <span
                className={`block w-full rounded-t ${tone}`}
                style={{
                  height: `${Math.max(4, Math.round((value / maxValue) * 72))}px`,
                }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function alertClassName(level: "critical" | "info" | "warning") {
  if (level === "critical") {
    return "border-red-200 bg-red-50 text-red-800"
  }

  if (level === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-800"
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-800"
}
