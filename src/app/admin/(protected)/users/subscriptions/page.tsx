import {
  AdminEmptyState,
  AdminPageHeader,
  AdminSection,
  AdminTable,
  BooleanBadge,
  formatDateTime,
} from "@/features/admin-content/components/admin-ui"
import { listAdminUserSubscriptions } from "@/features/admin-content/queries"

export const dynamic = "force-dynamic"

export default async function AdminUserSubscriptionsPage() {
  const subscriptions = await listAdminUserSubscriptions()

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        description="查看前台用户订阅了哪些频道，方便后续分析频道价值和会员权益。"
        eyebrow="Subscriptions"
        title="频道订阅"
      />

      <AdminSection>
        {subscriptions.length === 0 ? (
          <AdminEmptyState
            description="当前还没有读者订阅频道。"
            title="暂无订阅"
          />
        ) : (
          <AdminTable>
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-[0.08em] text-zinc-500">
              <tr>
                <th className="px-5 py-3">用户</th>
                <th className="px-5 py-3">频道</th>
                <th className="px-5 py-3">置顶</th>
                <th className="px-5 py-3">通知</th>
                <th className="px-5 py-3">订阅时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {subscriptions.map((subscription) => (
                <tr key={subscription.id}>
                  <td className="px-5 py-4">
                    <div className="font-semibold">
                      {subscription.userDisplayName}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {subscription.userEmail}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-semibold">
                      {subscription.channelName}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {subscription.siteName} / {subscription.definitionKey}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <BooleanBadge
                      active={subscription.isPinned}
                      activeLabel="已置顶"
                      inactiveLabel="未置顶"
                    />
                  </td>
                  <td className="px-5 py-4">
                    <BooleanBadge
                      active={subscription.notifyEnabled}
                      activeLabel="开启"
                      inactiveLabel="关闭"
                    />
                  </td>
                  <td className="px-5 py-4">
                    {formatDateTime(subscription.createdAt)}
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
