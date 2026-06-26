import Link from "next/link"
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminSection,
  AdminTable,
  StatusBadge,
  ViewLink,
  formatDateTime,
  formatDurationMs,
} from "@/features/admin-content/components/admin-ui"
import { listAdminCrawlRuns } from "@/features/admin-content/queries"

export const dynamic = "force-dynamic"

const runTypeLabels: Record<string, string> = {
  manual: "手动",
  retry: "重试",
  scheduled: "定时",
}

export default async function CrawlLogsPage() {
  const runs = await listAdminCrawlRuns()

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        description="记录每一次手动采集、定时采集和后续重试。失败时会保留错误信息，便于排查频道定义或目标站点问题。"
        eyebrow="抓取中心"
        title="抓取日志"
      />
      <AdminSection>
        {runs.length === 0 ? (
          <AdminEmptyState
            description="手动采集或 Worker 执行后，这里会出现运行记录。"
            title="还没有采集日志"
          />
        ) : (
          <AdminTable>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs text-slate-500">
                <th className="px-5 py-3 font-semibold">时间</th>
                <th className="px-5 py-3 font-semibold">频道</th>
                <th className="px-5 py-3 font-semibold">类型</th>
                <th className="px-5 py-3 font-semibold">状态</th>
                <th className="px-5 py-3 font-semibold">数量</th>
                <th className="px-5 py-3 font-semibold">耗时</th>
                <th className="px-5 py-3 font-semibold">结果</th>
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
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {runTypeLabels[run.runType] ?? run.runType}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={run.status} />
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    抓取 {run.fetchedCount} / 写入 {run.insertedCount}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {formatDurationMs(run.durationMs)}
                  </td>
                  <td className="px-5 py-4">
                    {run.snapshotId ? (
                      <ViewLink
                        href={`/admin/contents/snapshots/${run.snapshotId}`}
                        label="快照"
                      />
                    ) : run.errorMessage ? (
                      <p className="max-w-[320px] text-sm text-red-700">
                        {run.errorMessage}
                      </p>
                    ) : (
                      <span className="text-sm text-slate-500">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </AdminSection>
      <div>
        <Link
          className="text-sm font-semibold text-slate-500 transition-colors hover:text-slate-950"
          href="/admin/crawls/failures"
        >
          只看失败记录
        </Link>
      </div>
    </div>
  )
}
