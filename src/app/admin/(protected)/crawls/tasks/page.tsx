import {
  AdminEmptyState,
  AdminPageHeader,
  AdminSection,
  AdminTable,
  BooleanBadge,
  StatusBadge,
  formatDateTime,
} from "@/features/admin-content/components/admin-ui"
import { listAdminCrawlTasks } from "@/features/admin-content/queries"

export const dynamic = "force-dynamic"

export default async function CrawlTasksPage() {
  const tasks = await listAdminCrawlTasks()

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        description="这里展示频道级采集任务。Worker 会扫描启用采集且状态为启用的频道，并按照采集间隔执行。"
        eyebrow="抓取中心"
        title="抓取任务"
      />
      <AdminSection>
        {tasks.length === 0 ? (
          <AdminEmptyState
            description="创建频道并启用采集后，这里会出现对应任务。"
            title="还没有采集任务"
          />
        ) : (
          <AdminTable>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs text-slate-500">
                <th className="px-5 py-3 font-semibold">频道</th>
                <th className="px-5 py-3 font-semibold">definition_key</th>
                <th className="px-5 py-3 font-semibold">状态</th>
                <th className="px-5 py-3 font-semibold">采集间隔</th>
                <th className="px-5 py-3 font-semibold">最近采集</th>
                <th className="px-5 py-3 font-semibold">最近成功</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr
                  className="border-b border-slate-200 last:border-0 hover:bg-slate-50/80"
                  key={task.id}
                >
                  <td className="px-5 py-4">
                    <div className="font-semibold">{task.channelName}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {task.siteName}
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs">
                    {task.definitionKey}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={task.status} />
                      <BooleanBadge
                        active={task.isCrawlEnabled}
                        activeLabel="采集"
                        inactiveLabel="停采"
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {formatInterval(task.crawlIntervalSeconds)}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {formatDateTime(task.lastCrawlAt)}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {formatDateTime(task.lastSuccessAt)}
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

function formatInterval(seconds: number) {
  if (seconds < 60) {
    return `${seconds} 秒`
  }

  if (seconds < 3600) {
    return `${Math.round(seconds / 60)} 分钟`
  }

  return `${Math.round(seconds / 3600)} 小时`
}
