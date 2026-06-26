import {
  AdminAlert,
  AdminEmptyState,
  AdminNotice,
  AdminPageHeader,
  AdminSection,
  AdminTable,
  RunButton,
  ViewLink,
  formatDateTime,
} from "@/features/admin-content/components/admin-ui"
import {
  createManualContentBlockAction,
  unblockContentAction,
} from "@/features/admin-content/actions"
import { listAdminBlockedContents } from "@/features/admin-content/queries"
import {
  getErrorMessage,
  getNoticeMessage,
  type AdminSearchParams,
} from "@/features/admin-content/search-params"

export const dynamic = "force-dynamic"

export default async function AdminBlockedContentsPage({
  searchParams,
}: {
  searchParams: AdminSearchParams
}) {
  const [items, errorMessage, noticeMessage] = await Promise.all([
    listAdminBlockedContents(),
    getErrorMessage(searchParams),
    getNoticeMessage(searchParams),
  ])

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        description="管理需要从前台隐藏的标题和链接。屏蔽按 URL hash 生效，会影响首页、频道、分类、日报、话题和个人动态。"
        eyebrow="Moderation"
        title="屏蔽内容"
      />
      <AdminAlert message={errorMessage} />
      <AdminNotice message={noticeMessage} />

      <AdminSection>
        <form
          action={createManualContentBlockAction}
          className="grid gap-4 p-5 lg:grid-cols-[1fr_1.2fr_1fr_auto]"
        >
          <input name="backTo" type="hidden" value="/admin/contents/blocked" />
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            标题
            <input
              className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none transition-colors focus:border-slate-400"
              name="title"
              placeholder="需要屏蔽的标题"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            链接
            <input
              className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none transition-colors focus:border-slate-400"
              name="url"
              placeholder="https://..."
              required
              type="url"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            原因
            <input
              className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none transition-colors focus:border-slate-400"
              name="reason"
              placeholder="可选"
            />
          </label>
          <div className="flex items-end">
            <RunButton label="添加屏蔽" />
          </div>
        </form>
      </AdminSection>

      <AdminSection>
        {items.length === 0 ? (
          <AdminEmptyState
            description="从最新内容页点击屏蔽，或在上方手动添加链接后会出现在这里。"
            title="还没有屏蔽内容"
          />
        ) : (
          <AdminTable>
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-5 py-3">内容</th>
                <th className="px-5 py-3">原因</th>
                <th className="px-5 py-3">操作人</th>
                <th className="px-5 py-3">时间</th>
                <th className="px-5 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item) => (
                <tr className="hover:bg-slate-50/80" key={item.id}>
                  <td className="max-w-[520px] px-5 py-4">
                    <a
                      className="line-clamp-2 font-semibold text-slate-900 transition-colors hover:text-brand"
                      href={item.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {item.title}
                    </a>
                    <div className="mt-1 font-mono text-[11px] text-slate-400">
                      {item.urlHash.slice(0, 16)}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {item.reason ?? "-"}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {item.creatorName ?? item.creatorEmail ?? "系统"}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {formatDateTime(item.createdAt)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <ViewLink href={item.url} label="打开" />
                      <form action={unblockContentAction}>
                        <input name="id" type="hidden" value={item.id} />
                        <input
                          name="backTo"
                          type="hidden"
                          value="/admin/contents/blocked"
                        />
                        <RunButton label="取消屏蔽" />
                      </form>
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
