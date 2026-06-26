import {
  AdminAlert,
  AdminEmptyState,
  AdminNotice,
  AdminPageHeader,
  AdminSection,
  AdminTable,
  BooleanBadge,
  DeleteButton,
  ViewLink,
  formatDateTime,
} from "@/features/admin-content/components/admin-ui"
import { blockSnapshotItemAction } from "@/features/admin-content/actions"
import { listAdminLatestContents } from "@/features/admin-content/queries"
import {
  getErrorMessage,
  getNoticeMessage,
  type AdminSearchParams,
} from "@/features/admin-content/search-params"

export const dynamic = "force-dynamic"

export default async function AdminLatestContentsPage({
  searchParams,
}: {
  searchParams: AdminSearchParams
}) {
  const [items, errorMessage, noticeMessage] = await Promise.all([
    listAdminLatestContents(),
    getErrorMessage(searchParams),
    getNoticeMessage(searchParams),
  ])

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        description="汇总最近入库的快照条目，便于快速检查标题、热度、来源频道和入库时间。"
        eyebrow="Contents"
        title="最新内容"
      />
      <AdminAlert message={errorMessage} />
      <AdminNotice message={noticeMessage} />

      <AdminSection>
        {items.length === 0 ? (
          <AdminEmptyState
            description="Worker 成功采集并写入快照后，这里会展示最近入库的内容条目。"
            title="还没有入库内容"
          />
        ) : (
          <AdminTable>
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-5 py-3">内容</th>
                <th className="px-5 py-3">来源</th>
                <th className="px-5 py-3">排名</th>
                <th className="px-5 py-3">热度</th>
                <th className="px-5 py-3">审核</th>
                <th className="px-5 py-3">入库时间</th>
                <th className="px-5 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item) => (
                <tr className="hover:bg-slate-50/80" key={item.id}>
                  <td className="max-w-[420px] px-5 py-4">
                    <a
                      className="line-clamp-2 font-semibold text-slate-900 transition-colors hover:text-brand"
                      href={item.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {item.title}
                    </a>
                    {item.tag ? (
                      <div className="mt-1 text-xs text-slate-500">
                        {item.tag}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-semibold">{item.channelName}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {item.siteName} / {item.siteSlug}.{item.channelSlug}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {item.rankNo ?? "-"}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {item.hotLabel ?? item.hotValue ?? "-"}
                  </td>
                  <td className="px-5 py-4">
                    <BooleanBadge
                      active={!item.blockedId}
                      activeLabel="展示"
                      inactiveLabel="已屏蔽"
                    />
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {formatDateTime(item.createdAt)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <ViewLink
                        href={`/admin/contents/snapshots/${item.snapshotId}`}
                        label="快照"
                      />
                      {item.blockedId ? null : (
                        <form action={blockSnapshotItemAction}>
                          <input name="id" type="hidden" value={item.id} />
                          <input
                            name="backTo"
                            type="hidden"
                            value="/admin/contents/latest"
                          />
                          <DeleteButton label="屏蔽" />
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
