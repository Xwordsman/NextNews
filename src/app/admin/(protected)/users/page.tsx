import {
  AdminEmptyState,
  AdminPageHeader,
  AdminSection,
  AdminTable,
  StatusBadge,
  formatDateTime,
} from "@/features/admin-content/components/admin-ui"
import { listAdminUsers } from "@/features/admin-content/queries"

export const dynamic = "force-dynamic"

export default async function AdminUsersPage() {
  const users = await listAdminUsers()

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        description="查看后台管理员和前台读者账号。当前版本前台用户用于频道订阅和个人动态。"
        eyebrow="Users"
        title="用户列表"
      />

      <AdminSection>
        {users.length === 0 ? (
          <AdminEmptyState
            description="暂无用户。运行 seed 后会创建默认管理员。"
            title="暂无用户"
          />
        ) : (
          <AdminTable>
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-5 py-3">用户</th>
                <th className="px-5 py-3">角色</th>
                <th className="px-5 py-3">状态</th>
                <th className="px-5 py-3">订阅数</th>
                <th className="px-5 py-3">最后登录</th>
                <th className="px-5 py-3">创建时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-5 py-4">
                    <div className="font-semibold">{user.displayName}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {user.email}
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs">{user.role}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="px-5 py-4">{user.subscriptionCount}</td>
                  <td className="px-5 py-4">
                    {formatDateTime(user.lastLoginAt)}
                  </td>
                  <td className="px-5 py-4">
                    {formatDateTime(user.createdAt)}
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
