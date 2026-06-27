import { notFound } from "next/navigation"
import {
  AdminAlert,
  AdminBackLink,
  AdminEmptyState,
  AdminNotice,
  AdminPageHeader,
  AdminSection,
  AdminTable,
  DeleteButton,
  RunButton,
  StatusBadge,
  formatDateTime,
} from "@/features/admin-content/components/admin-ui"
import {
  addDailyReportItemAction,
  removeDailyReportItemAction,
} from "@/features/admin-content/actions"
import { getAdminDailyReportOperation } from "@/features/admin-content/queries"

export const dynamic = "force-dynamic"

export default async function AdminDailyReportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ error?: string; notice?: string }>
}) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  const data = await getAdminDailyReportOperation(id)

  if (!data) {
    notFound()
  }

  const backTo = `/admin/operations/daily/${data.report.id}`

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <AdminPageHeader
          description="人工精选会优先展示在前台日报详情页，适合放置当天最值得保留的跨频道内容。"
          eyebrow="Daily"
          title={data.report.title}
        />
        <AdminBackLink href="/admin/operations/daily" />
      </div>
      <AdminAlert message={query?.error} />
      <AdminNotice message={query?.notice} />

      <AdminSection>
        <div className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={data.report.status} />
              <span className="rounded-md bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-500">
                {data.report.reportDate}
              </span>
            </div>
            {data.report.summary ? (
              <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-500">
                {data.report.summary}
              </p>
            ) : null}
          </div>
          <div className="text-right text-sm text-zinc-500">
            <div>频道 {data.report.channelLimit}</div>
            <div>每频道 {data.report.itemLimitPerChannel} 条</div>
          </div>
        </div>
      </AdminSection>

      <AdminSection>
        {data.manualItems.length === 0 ? (
          <AdminEmptyState
            description="从下方候选内容加入后，前台日报详情页会优先展示这些内容。"
            title="还没有人工精选"
          />
        ) : (
          <AdminTable>
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-[0.08em] text-zinc-500">
              <tr>
                <th className="px-5 py-3">内容</th>
                <th className="px-5 py-3">来源</th>
                <th className="px-5 py-3">排序</th>
                <th className="px-5 py-3">快照</th>
                <th className="px-5 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {data.manualItems.map((item) => (
                <tr className="hover:bg-zinc-50/80" key={item.relationId}>
                  <td className="px-5 py-4">
                    <a
                      className="font-semibold text-zinc-950 no-underline transition-colors hover:text-zinc-600 hover:underline"
                      href={item.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {item.title}
                    </a>
                    {item.note ? (
                      <p className="mt-1 max-w-[520px] text-xs leading-5 text-zinc-500">
                        {item.note}
                      </p>
                    ) : null}
                    <div className="mt-1 text-xs text-zinc-500">
                      原榜排名：{item.rankNo ?? "-"}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-500">
                    {item.siteName} / {item.channelName}
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-500">
                    {item.sort}
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-500">
                    {formatDateTime(item.snapshotTime)}
                  </td>
                  <td className="px-5 py-4">
                    <form action={removeDailyReportItemAction}>
                      <input name="id" type="hidden" value={item.relationId} />
                      <input
                        name="reportId"
                        type="hidden"
                        value={data.report.id}
                      />
                      <input name="backTo" type="hidden" value={backTo} />
                      <DeleteButton label="移除" />
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </AdminSection>

      <AdminSection>
        {data.candidates.length === 0 ? (
          <AdminEmptyState
            description="还没有可加入日报的候选内容，等待频道完成采集后再回来查看。"
            title="暂无候选内容"
          />
        ) : (
          <AdminTable>
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-[0.08em] text-zinc-500">
              <tr>
                <th className="px-5 py-3">候选内容</th>
                <th className="px-5 py-3">来源</th>
                <th className="px-5 py-3">推荐语</th>
                <th className="px-5 py-3">入库时间</th>
                <th className="px-5 py-3">热度</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {data.candidates.map((item) => (
                <tr className="hover:bg-zinc-50/80" key={item.snapshotItemId}>
                  <td className="px-5 py-4">
                    <a
                      className="font-semibold text-zinc-950 no-underline transition-colors hover:text-zinc-600 hover:underline"
                      href={item.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {item.title}
                    </a>
                    <div className="mt-1 text-xs text-zinc-500">
                      原榜排名：{item.rankNo ?? "-"}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-500">
                    {item.siteName} / {item.channelName}
                  </td>
                  <td className="px-5 py-4">
                    <form
                      action={addDailyReportItemAction}
                      className="flex min-w-[260px] flex-wrap items-center gap-2"
                    >
                      <input
                        name="reportId"
                        type="hidden"
                        value={data.report.id}
                      />
                      <input
                        name="snapshotItemId"
                        type="hidden"
                        value={item.snapshotItemId}
                      />
                      <input name="sort" type="hidden" value="0" />
                      <input name="backTo" type="hidden" value={backTo} />
                      <input
                        className="min-h-9 min-w-0 flex-1 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium outline-none transition-colors focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                        name="note"
                        placeholder="可选推荐语"
                      />
                      <RunButton label="加入" />
                    </form>
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-500">
                    {formatDateTime(item.createdAt)}
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-500">
                    {item.hotValue ?? item.hotLabel ?? item.tag ?? "-"}
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
