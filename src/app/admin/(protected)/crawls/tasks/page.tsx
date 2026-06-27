import {
  AdminAlert,
  AdminEmptyState,
  AdminNotice,
  AdminPageHeader,
  AdminSection,
  AdminTable,
  BooleanBadge,
  RunButton,
  StatusBadge,
  formatDateTime,
} from "@/features/admin-content/components/admin-ui"
import { runChannelCrawlAction } from "@/features/admin-content/actions"
import { listAdminCrawlTasks } from "@/features/admin-content/queries"
import {
  getErrorMessage,
  getNoticeMessage,
  type AdminSearchParams,
} from "@/features/admin-content/search-params"

export const dynamic = "force-dynamic"

export default async function CrawlTasksPage({
  searchParams,
}: {
  searchParams: AdminSearchParams
}) {
  const [tasks, errorMessage, noticeMessage] = await Promise.all([
    listAdminCrawlTasks(),
    getErrorMessage(searchParams),
    getNoticeMessage(searchParams),
  ])

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        description="这里展示频道级采集任务。Worker 会扫描启用采集且状态为启用的频道，并按照采集间隔执行。"
        eyebrow="抓取中心"
        title="抓取任务"
      />
      <AdminAlert message={errorMessage} />
      <AdminNotice message={noticeMessage} />
      <AdminSection>
        {tasks.length === 0 ? (
          <AdminEmptyState
            description="创建频道并启用采集后，这里会出现对应任务。"
            title="还没有采集任务"
          />
        ) : (
          <AdminTable>
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/80 text-xs text-zinc-500">
                <th className="px-5 py-3 font-semibold">频道</th>
                <th className="px-5 py-3 font-semibold">definition_key</th>
                <th className="px-5 py-3 font-semibold">状态</th>
                <th className="px-5 py-3 font-semibold">采集间隔</th>
                <th className="px-5 py-3 font-semibold">快照间隔</th>
                <th className="px-5 py-3 font-semibold">最近采集</th>
                <th className="px-5 py-3 font-semibold">最近成功</th>
                <th className="px-5 py-3 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr
                  className="border-b border-zinc-200 last:border-0 hover:bg-zinc-50/80"
                  key={task.id}
                >
                  <td className="px-5 py-4">
                    <div className="font-semibold">{task.channelName}</div>
                    <div className="mt-1 text-xs text-zinc-500">
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
                  <td className="px-5 py-4 text-sm text-zinc-500">
                    {formatInterval(task.crawlIntervalSeconds)}
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-500">
                    {formatInterval(task.snapshotIntervalSeconds)}
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-500">
                    {formatDateTime(task.lastCrawlAt)}
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-500">
                    {formatDateTime(task.lastSuccessAt)}
                  </td>
                  <td className="px-5 py-4">
                    <form action={runChannelCrawlAction}>
                      <input name="id" type="hidden" value={task.id} />
                      <input
                        name="backTo"
                        type="hidden"
                        value="/admin/crawls/tasks"
                      />
                      <RunButton label="立即采集" />
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

function formatInterval(seconds: number) {
  if (seconds < 60) {
    return `${seconds} 秒`
  }

  if (seconds < 3600) {
    return `${Math.round(seconds / 60)} 分钟`
  }

  return `${Math.round(seconds / 3600)} 小时`
}
