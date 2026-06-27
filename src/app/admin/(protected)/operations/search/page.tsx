import {
  AdminEmptyState,
  AdminPageHeader,
  AdminSection,
  AdminTable,
  formatDateTime,
} from "@/features/admin-content/components/admin-ui"
import { getAdminSearchAnalytics } from "@/features/admin-content/queries"

export const dynamic = "force-dynamic"

export default async function AdminSearchAnalyticsPage() {
  const data = await getAdminSearchAnalytics()
  const qualityStats = [
    {
      label: "14 天搜索",
      value: data.quality.totalSearches,
      detail: "最近 14 天搜索请求总数",
    },
    {
      label: "零结果",
      value: data.quality.totalZeroResults,
      detail: "没有返回内容的搜索次数",
    },
    {
      label: "零结果率",
      value: `${data.quality.zeroResultRate}%`,
      detail: "越高越需要优化内容覆盖或搜索入口",
    },
  ]

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        description="查看前台搜索关键词、筛选条件、结果数量、热门词和零结果趋势，用于优化首页入口、频道编排和全文搜索。"
        eyebrow="Search"
        title="搜索分析"
      />

      <section className="grid gap-4 md:grid-cols-3">
        {qualityStats.map((item) => (
          <article
            className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
            key={item.label}
          >
            <p className="text-sm font-medium text-zinc-500">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold text-zinc-950">
              {item.value}
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              {item.detail}
            </p>
          </article>
        ))}
      </section>

      <AdminSection>
        <div className="grid gap-5 p-5">
          <div>
            <h2 className="text-base font-semibold">14 天搜索趋势</h2>
            <p className="mt-1 text-sm text-zinc-500">
              对比搜索量、零结果次数和平均结果数，判断搜索质量是否在变差。
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <TrendPanel
              metricKey="searchCount"
              rows={data.trend}
              title="搜索量"
              tone="bg-zinc-900"
            />
            <TrendPanel
              metricKey="zeroResultCount"
              rows={data.trend}
              title="零结果"
              tone="bg-red-500"
            />
            <TrendPanel
              metricKey="averageResultCount"
              rows={data.trend}
              title="平均结果"
              tone="bg-blue-600"
            />
          </div>
        </div>
      </AdminSection>

      <AdminSection>
        {data.hotKeywords.length === 0 ? (
          <AdminEmptyState
            description="开启搜索日志后，用户在前台搜索会逐步形成热门关键词。"
            title="暂无热门搜索"
          />
        ) : (
          <AdminTable>
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-[0.08em] text-zinc-500">
              <tr>
                <th className="px-5 py-3">关键词</th>
                <th className="px-5 py-3">搜索次数</th>
                <th className="px-5 py-3">平均结果数</th>
                <th className="px-5 py-3">零结果</th>
                <th className="px-5 py-3">最近搜索</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {data.hotKeywords.map((keyword) => (
                <tr className="hover:bg-zinc-50/80" key={keyword.keyword}>
                  <td className="px-5 py-4 font-semibold">{keyword.keyword}</td>
                  <td className="px-5 py-4 text-sm text-zinc-600">
                    {keyword.searchCount}
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-600">
                    {keyword.averageResultCount ?? 0}
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-600">
                    {keyword.zeroResultCount ?? 0}
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-500">
                    {formatDateTime(keyword.lastSearchedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </AdminSection>

      <AdminSection>
        {data.zeroResultKeywords.length === 0 ? (
          <AdminEmptyState
            description="暂无零结果关键词。"
            title="搜索覆盖良好"
          />
        ) : (
          <AdminTable>
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-[0.08em] text-zinc-500">
              <tr>
                <th className="px-5 py-3">零结果关键词</th>
                <th className="px-5 py-3">次数</th>
                <th className="px-5 py-3">最近搜索</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {data.zeroResultKeywords.map((keyword) => (
                <tr className="hover:bg-zinc-50/80" key={keyword.keyword}>
                  <td className="px-5 py-4 font-semibold">{keyword.keyword}</td>
                  <td className="px-5 py-4 text-sm text-zinc-600">
                    {keyword.searchCount}
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-500">
                    {formatDateTime(keyword.lastSearchedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </AdminSection>

      <AdminSection>
        {data.recentLogs.length === 0 ? (
          <AdminEmptyState
            description="暂无搜索日志。可以在基础设置中确认搜索日志开关是否开启。"
            title="暂无搜索记录"
          />
        ) : (
          <AdminTable>
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-[0.08em] text-zinc-500">
              <tr>
                <th className="px-5 py-3">搜索</th>
                <th className="px-5 py-3">筛选</th>
                <th className="px-5 py-3">结果</th>
                <th className="px-5 py-3">用户</th>
                <th className="px-5 py-3">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {data.recentLogs.map((log) => (
                <tr className="hover:bg-zinc-50/80" key={log.id}>
                  <td className="px-5 py-4 font-semibold">{log.keyword}</td>
                  <td className="px-5 py-4 text-sm text-zinc-500">
                    站点：{log.siteSlug ?? "全部"}
                    <br />
                    频道：{log.channelId ?? "全部"}
                    <br />
                    日期：{log.dateFrom ?? "-"} 至 {log.dateTo ?? "-"}
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-600">
                    {log.resultCount}
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-500">
                    {log.userDisplayName ?? "访客"}
                    {log.userEmail ? (
                      <>
                        <br />
                        {log.userEmail}
                      </>
                    ) : null}
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-500">
                    {formatDateTime(log.createdAt)}
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
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-zinc-700">{title}</p>
        <p className="font-mono text-xs text-zinc-500">
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
