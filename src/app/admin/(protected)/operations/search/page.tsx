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

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        description="查看前台搜索关键词、筛选条件、结果数量和热门词，用于后续优化首页入口、频道编排和全文搜索。"
        eyebrow="Search"
        title="搜索分析"
      />

      <AdminSection>
        {data.hotKeywords.length === 0 ? (
          <AdminEmptyState
            description="开启搜索日志后，用户在前台搜索会逐步形成热门关键词。"
            title="暂无热门搜索"
          />
        ) : (
          <AdminTable>
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-5 py-3">关键词</th>
                <th className="px-5 py-3">搜索次数</th>
                <th className="px-5 py-3">平均结果数</th>
                <th className="px-5 py-3">最近搜索</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.hotKeywords.map((keyword) => (
                <tr className="hover:bg-slate-50/80" key={keyword.keyword}>
                  <td className="px-5 py-4 font-semibold">{keyword.keyword}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {keyword.searchCount}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {keyword.averageResultCount ?? 0}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
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
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-5 py-3">搜索</th>
                <th className="px-5 py-3">筛选</th>
                <th className="px-5 py-3">结果</th>
                <th className="px-5 py-3">用户</th>
                <th className="px-5 py-3">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.recentLogs.map((log) => (
                <tr className="hover:bg-slate-50/80" key={log.id}>
                  <td className="px-5 py-4 font-semibold">{log.keyword}</td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    站点：{log.siteSlug ?? "全部"}
                    <br />
                    频道：{log.channelId ?? "全部"}
                    <br />
                    日期：{log.dateFrom ?? "-"} 至 {log.dateTo ?? "-"}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {log.resultCount}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {log.userDisplayName ?? "访客"}
                    {log.userEmail ? (
                      <>
                        <br />
                        {log.userEmail}
                      </>
                    ) : null}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
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
