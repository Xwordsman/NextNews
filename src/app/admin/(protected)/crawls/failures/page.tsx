import {
  AdminAlert,
  AdminEmptyState,
  AdminNotice,
  AdminPageHeader,
  AdminSection,
  AdminTable,
  RunButton,
  StatusBadge,
  formatDateTime,
  formatDurationMs,
} from "@/features/admin-content/components/admin-ui"
import { retryCrawlRunAction } from "@/features/admin-content/actions"
import { listAdminCrawlRuns } from "@/features/admin-content/queries"
import {
  getErrorMessage,
  getNoticeMessage,
  type AdminSearchParams,
} from "@/features/admin-content/search-params"

export const dynamic = "force-dynamic"

export default async function CrawlFailuresPage({
  searchParams,
}: {
  searchParams: AdminSearchParams
}) {
  const [runs, errorMessage, noticeMessage] = await Promise.all([
    listAdminCrawlRuns({ status: "failed" }),
    getErrorMessage(searchParams),
    getNoticeMessage(searchParams),
  ])

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        description="这里聚合失败采集记录。服务器测试时优先看这里，可以快速判断是频道定义缺失、目标站点异常，还是网络请求失败。"
        eyebrow="抓取中心"
        title="失败记录"
      />
      <AdminAlert message={errorMessage} />
      <AdminNotice message={noticeMessage} />
      <AdminSection>
        {runs.length === 0 ? (
          <AdminEmptyState
            description="当前没有失败采集记录。"
            title="采集状态良好"
          />
        ) : (
          <AdminTable>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs text-slate-500">
                <th className="px-5 py-3 font-semibold">时间</th>
                <th className="px-5 py-3 font-semibold">频道</th>
                <th className="px-5 py-3 font-semibold">状态</th>
                <th className="px-5 py-3 font-semibold">耗时</th>
                <th className="px-5 py-3 font-semibold">错误</th>
                <th className="px-5 py-3 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr
                  className="border-b border-slate-200 last:border-0 hover:bg-slate-50/80"
                  key={run.id}
                >
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {formatDateTime(run.startedAt)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-semibold">{run.channelName}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {run.siteName} / {run.definitionKey}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={run.status} />
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {formatDurationMs(run.durationMs)}
                  </td>
                  <td className="px-5 py-4">
                    <p className="max-w-[520px] text-sm text-red-700">
                      {run.errorMessage ?? "未知错误"}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <form action={retryCrawlRunAction}>
                      <input name="id" type="hidden" value={run.id} />
                      <input
                        name="backTo"
                        type="hidden"
                        value="/admin/crawls/failures"
                      />
                      <RunButton label="重试" />
                    </form>
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
