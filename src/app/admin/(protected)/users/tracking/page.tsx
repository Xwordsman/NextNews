import {
  AdminAlert,
  AdminEmptyState,
  AdminNotice,
  AdminPageHeader,
  AdminSection,
  AdminTable,
  BooleanBadge,
  RunButton,
  formatDateTime,
} from "@/features/admin-content/components/admin-ui"
import { updateTrackingRuleEnabledAction } from "@/features/admin-content/actions"
import { listAdminTrackingRules } from "@/features/admin-content/queries"
import {
  getErrorMessage,
  getNoticeMessage,
  type AdminSearchParams,
} from "@/features/admin-content/search-params"

export const dynamic = "force-dynamic"

export default async function AdminUserTrackingPage({
  searchParams,
}: {
  searchParams: AdminSearchParams
}) {
  const [rules, errorMessage, noticeMessage] = await Promise.all([
    listAdminTrackingRules(),
    getErrorMessage(searchParams),
    getNoticeMessage(searchParams),
  ])

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        description="查看用户在前台创建的关键词追踪规则。后台可以临时停用规则，后续通知策略会继续基于这里扩展。"
        eyebrow="Tracking"
        title="追踪规则"
      />
      <AdminAlert message={errorMessage} />
      <AdminNotice message={noticeMessage} />

      <AdminSection>
        {rules.length === 0 ? (
          <AdminEmptyState
            description="用户在前台追踪页添加关键词后，这里会显示规则。"
            title="还没有追踪规则"
          />
        ) : (
          <AdminTable>
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-5 py-3">用户</th>
                <th className="px-5 py-3">关键词</th>
                <th className="px-5 py-3">状态</th>
                <th className="px-5 py-3">匹配</th>
                <th className="px-5 py-3">时间</th>
                <th className="px-5 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rules.map((rule) => (
                <tr className="hover:bg-slate-50/80" key={rule.id}>
                  <td className="px-5 py-4">
                    <div className="font-semibold">{rule.userDisplayName}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {rule.userEmail}
                    </div>
                  </td>
                  <td className="max-w-[360px] px-5 py-4">
                    <div className="font-semibold">{rule.keyword}</div>
                    {rule.description ? (
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {rule.description}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <BooleanBadge
                        active={rule.isEnabled}
                        activeLabel="启用"
                        inactiveLabel="停用"
                      />
                      <BooleanBadge
                        active={rule.notifyEnabled}
                        activeLabel="通知"
                        inactiveLabel="不通知"
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {formatDateTime(rule.lastMatchedAt)}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    <div>创建：{formatDateTime(rule.createdAt)}</div>
                    <div className="mt-1">
                      更新：{formatDateTime(rule.updatedAt)}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <form action={updateTrackingRuleEnabledAction}>
                      <input name="id" type="hidden" value={rule.id} />
                      <input
                        name="isEnabled"
                        type="hidden"
                        value={String(!rule.isEnabled)}
                      />
                      <input
                        name="backTo"
                        type="hidden"
                        value="/admin/users/tracking"
                      />
                      <RunButton label={rule.isEnabled ? "停用" : "启用"} />
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
