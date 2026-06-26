import {
  AdminAlert,
  AdminEmptyState,
  AdminNotice,
  AdminPageHeader,
  AdminSection,
  AdminTable,
  RunButton,
  StatusBadge,
  ViewLink,
  formatDateTime,
} from "@/features/admin-content/components/admin-ui"
import {
  publishTodayDailyReportAction,
  updateDailyReportStatusAction,
} from "@/features/admin-content/actions"
import { listAdminDailyReports } from "@/features/admin-content/queries"
import {
  getErrorMessage,
  getNoticeMessage,
  type AdminSearchParams,
} from "@/features/admin-content/search-params"

export const dynamic = "force-dynamic"

export default async function AdminDailyOperationPage({
  searchParams,
}: {
  searchParams: AdminSearchParams
}) {
  const [reports, errorMessage, noticeMessage] = await Promise.all([
    listAdminDailyReports(),
    getErrorMessage(searchParams),
    getNoticeMessage(searchParams),
  ])

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        description="日报由后台发布状态控制，前台展示最新 active 日报，并按当前首页频道读取最近快照内容。"
        eyebrow="Operations"
        title="日报配置"
      />
      <AdminAlert message={errorMessage} />
      <AdminNotice message={noticeMessage} />

      <AdminSection>
        <div className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <h2 className="text-base font-semibold">发布今日日报</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              发布后 `/daily` 会显示今天的日报标题，并聚合首页频道的最新内容。
            </p>
          </div>
          <form action={publishTodayDailyReportAction}>
            <input
              name="backTo"
              type="hidden"
              value="/admin/operations/daily"
            />
            <RunButton label="生成并发布" />
          </form>
        </div>
      </AdminSection>

      <AdminSection>
        {reports.length === 0 ? (
          <AdminEmptyState
            description="点击上方按钮后会生成第一份日报记录。"
            title="还没有日报"
          />
        ) : (
          <AdminTable>
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-5 py-3">日报</th>
                <th className="px-5 py-3">状态</th>
                <th className="px-5 py-3">展示策略</th>
                <th className="px-5 py-3">发布时间</th>
                <th className="px-5 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {reports.map((report) => (
                <tr className="hover:bg-slate-50/80" key={report.id}>
                  <td className="px-5 py-4">
                    <div className="font-semibold">{report.title}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {report.reportDate}
                    </div>
                    {report.summary ? (
                      <p className="mt-2 max-w-[520px] text-sm leading-6 text-slate-500">
                        {report.summary}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={report.status} />
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {report.channelLimit} 个频道 / 每频道{" "}
                    {report.itemLimitPerChannel} 条
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {formatDateTime(report.publishedAt)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <ViewLink
                        href={`/admin/operations/daily/${report.id}`}
                        label="编辑精选"
                      />
                      {report.status === "active" ? (
                        <form action={updateDailyReportStatusAction}>
                          <input name="id" type="hidden" value={report.id} />
                          <input name="status" type="hidden" value="disabled" />
                          <input
                            name="backTo"
                            type="hidden"
                            value="/admin/operations/daily"
                          />
                          <RunButton label="下线" />
                        </form>
                      ) : (
                        <form action={updateDailyReportStatusAction}>
                          <input name="id" type="hidden" value={report.id} />
                          <input name="status" type="hidden" value="active" />
                          <input
                            name="backTo"
                            type="hidden"
                            value="/admin/operations/daily"
                          />
                          <RunButton label="发布" />
                        </form>
                      )}
                    </div>
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
