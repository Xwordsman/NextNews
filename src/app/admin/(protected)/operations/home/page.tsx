import {
  AdminEmptyState,
  AdminPageHeader,
  AdminSection,
  AdminTable,
  BooleanBadge,
  EditLink,
  StatusBadge,
  ViewLink,
  formatDateTime,
} from "@/features/admin-content/components/admin-ui"
import { listAdminHomeChannels } from "@/features/admin-content/queries"

export const dynamic = "force-dynamic"

export default async function AdminHomeOperationPage() {
  const channels = await listAdminHomeChannels()
  const activePublicChannels = channels.filter(
    (channel) => channel.status === "active" && channel.isPublic,
  )
  const channelsWithSnapshot = channels.filter((channel) => channel.snapshotId)

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        description="首页当前由频道上的公开、首页展示、权重和排序字段共同控制。这里集中查看首页会读取到的频道状态。"
        eyebrow="Operations"
        title="首页配置"
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="首页频道" value={channels.length} />
        <MetricCard label="可公开展示" value={activePublicChannels.length} />
        <MetricCard label="已有快照" value={channelsWithSnapshot.length} />
      </div>

      <AdminSection>
        {channels.length === 0 ? (
          <AdminEmptyState
            description="在频道管理中打开“首页展示”后，频道会出现在这里。"
            title="还没有首页频道"
          />
        ) : (
          <AdminTable>
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-5 py-3">频道</th>
                <th className="px-5 py-3">状态</th>
                <th className="px-5 py-3">权重</th>
                <th className="px-5 py-3">快照</th>
                <th className="px-5 py-3">最近成功</th>
                <th className="px-5 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {channels.map((channel) => (
                <tr className="hover:bg-slate-50/80" key={channel.id}>
                  <td className="px-5 py-4">
                    <div className="font-semibold">{channel.channelName}</div>
                    <div className="mt-1 font-mono text-xs text-slate-500">
                      {channel.definitionKey}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {channel.siteName} / {channel.siteSlug}.
                      {channel.channelSlug}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={channel.status} />
                      <BooleanBadge
                        active={channel.isPublic}
                        activeLabel="公开"
                        inactiveLabel="隐藏"
                      />
                      <BooleanBadge
                        active={channel.isSubscribable}
                        activeLabel="可订阅"
                        inactiveLabel="禁订阅"
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {channel.weight} / {channel.sort}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {channel.snapshotItemCount ?? 0} 条
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {formatDateTime(channel.lastSuccessAt)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <ViewLink
                        href={`/channels/${channel.siteSlug}/${channel.channelSlug}`}
                        label="前台"
                      />
                      <EditLink href={`/admin/channels/${channel.id}/edit`} />
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

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-950">{value}</div>
    </div>
  )
}
