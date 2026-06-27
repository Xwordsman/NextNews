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
} from "@/features/admin-content/components/admin-ui"
import {
  saveUserMembershipAction,
  updateUserStatusAction,
} from "@/features/admin-content/actions"
import { listAdminUsers } from "@/features/admin-content/queries"
import {
  getErrorMessage,
  getNoticeMessage,
  type AdminSearchParams,
} from "@/features/admin-content/search-params"

export const dynamic = "force-dynamic"

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: AdminSearchParams
}) {
  const [users, errorMessage, noticeMessage] = await Promise.all([
    listAdminUsers(),
    getErrorMessage(searchParams),
    getNoticeMessage(searchParams),
  ])

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        description="查看后台管理员和前台读者账号。前台用户用于频道订阅、追踪、收藏、阅读历史和会员权益。"
        eyebrow="Users"
        title="用户列表"
      />

      <AdminAlert message={errorMessage} />
      <AdminNotice message={noticeMessage} />

      <AdminSection>
        {users.length === 0 ? (
          <AdminEmptyState
            description="暂无用户。运行 seed 或完成安装后会创建默认管理员。"
            title="暂无用户"
          />
        ) : (
          <AdminTable>
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-[0.08em] text-zinc-500">
              <tr>
                <th className="px-5 py-3">用户</th>
                <th className="px-5 py-3">角色</th>
                <th className="px-5 py-3">状态</th>
                <th className="px-5 py-3">会员权益</th>
                <th className="px-5 py-3">订阅数</th>
                <th className="px-5 py-3">最后登录</th>
                <th className="px-5 py-3">创建时间</th>
                <th className="px-5 py-3">账号操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-5 py-4">
                    <div className="font-semibold">{user.displayName}</div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {user.email}
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs">{user.role}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="px-5 py-4">
                    <form
                      action={saveUserMembershipAction}
                      className="grid min-w-[460px] gap-2"
                    >
                      <input name="userId" type="hidden" value={user.id} />
                      <input name="backTo" type="hidden" value="/admin/users" />
                      <div className="grid gap-2 sm:grid-cols-[90px_120px_90px_120px_90px]">
                        <input
                          className={inputClassName}
                          defaultValue={user.membershipPlanKey}
                          name="planKey"
                          placeholder="member"
                        />
                        <input
                          className={inputClassName}
                          defaultValue={user.membershipPlanName}
                          name="planName"
                          placeholder="会员"
                        />
                        <input
                          className={inputClassName}
                          defaultValue={user.membershipHistoryDays}
                          min={1}
                          name="historyDays"
                          type="number"
                        />
                        <input
                          className={inputClassName}
                          defaultValue={formatDateInput(
                            user.membershipExpiresAt,
                          )}
                          name="expiresAt"
                          type="date"
                        />
                        <select
                          className={inputClassName}
                          defaultValue={user.membershipStatus ?? "active"}
                          name="status"
                        >
                          <option value="active">有效</option>
                          <option value="expired">过期</option>
                          <option value="canceled">取消</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-zinc-500">
                          当前可看 {user.membershipHistoryDays} 天历史
                        </span>
                        <RunButton label="保存权益" />
                      </div>
                    </form>
                  </td>
                  <td className="px-5 py-4">{user.subscriptionCount}</td>
                  <td className="px-5 py-4">
                    {formatDateTime(user.lastLoginAt)}
                  </td>
                  <td className="px-5 py-4">
                    {formatDateTime(user.createdAt)}
                  </td>
                  <td className="px-5 py-4">
                    <form action={updateUserStatusAction}>
                      <input name="userId" type="hidden" value={user.id} />
                      <input name="backTo" type="hidden" value="/admin/users" />
                      <input
                        name="status"
                        type="hidden"
                        value={user.status === "active" ? "disabled" : "active"}
                      />
                      <RunButton
                        label={user.status === "active" ? "停用" : "启用"}
                      />
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

const inputClassName =
  "min-h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium outline-none transition-colors focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"

function formatDateInput(value: Date | null) {
  if (!value) {
    return ""
  }

  return value.toISOString().slice(0, 10)
}
