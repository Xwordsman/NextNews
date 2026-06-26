import {
  AdminEmptyState,
  AdminPageHeader,
  AdminSection,
  AdminTable,
  BooleanBadge,
  formatDateTime,
} from "@/features/admin-content/components/admin-ui"
import { listAdminNotifications } from "@/features/admin-content/queries"

export const dynamic = "force-dynamic"

export default async function AdminUserNotificationsPage() {
  const notifications = await listAdminNotifications()

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        description="查看系统生成的站内通知。当前通知主要来自用户追踪规则命中，后续可以继续接入日报、频道异常和会员提醒。"
        eyebrow="Users"
        title="站内通知"
      />

      <AdminSection>
        {notifications.length === 0 ? (
          <AdminEmptyState
            description="开启追踪通知并产生命中后，这里会出现通知记录。"
            title="还没有通知"
          />
        ) : (
          <AdminTable>
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-5 py-3">通知</th>
                <th className="px-5 py-3">用户</th>
                <th className="px-5 py-3">类型</th>
                <th className="px-5 py-3">状态</th>
                <th className="px-5 py-3">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {notifications.map((notification) => (
                <tr className="hover:bg-slate-50/80" key={notification.id}>
                  <td className="max-w-[520px] px-5 py-4">
                    <div className="font-semibold">{notification.title}</div>
                    {notification.body ? (
                      <div className="mt-1 text-sm leading-6 text-slate-500">
                        {notification.body}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-semibold">
                      {notification.userDisplayName}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {notification.userEmail}
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-slate-500">
                    {notification.notificationType}
                  </td>
                  <td className="px-5 py-4">
                    <BooleanBadge
                      active={!notification.isRead}
                      activeLabel="未读"
                      inactiveLabel="已读"
                    />
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {formatDateTime(notification.createdAt)}
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
