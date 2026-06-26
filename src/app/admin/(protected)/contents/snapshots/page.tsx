import {
  AdminEmptyState,
  AdminPageHeader,
  AdminSection,
  AdminTable,
  StatusBadge,
  ViewLink,
  formatDateTime,
} from "@/features/admin-content/components/admin-ui"
import { listAdminSnapshots } from "@/features/admin-content/queries"

export const dynamic = "force-dynamic"

export default async function SnapshotsPage() {
  const snapshots = await listAdminSnapshots()

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        description="每次成功采集都会生成频道快照。前台首页和频道页后续会优先读取频道的最新快照。"
        eyebrow="内容库"
        title="历史快照"
      />
      <AdminSection>
        {snapshots.length === 0 ? (
          <AdminEmptyState
            description="手动采集或 Worker 成功执行后，这里会出现快照。"
            title="还没有历史快照"
          />
        ) : (
          <AdminTable>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs text-slate-500">
                <th className="px-5 py-3 font-semibold">快照时间</th>
                <th className="px-5 py-3 font-semibold">频道</th>
                <th className="px-5 py-3 font-semibold">条目数</th>
                <th className="px-5 py-3 font-semibold">状态</th>
                <th className="px-5 py-3 font-semibold">内容哈希</th>
                <th className="px-5 py-3 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              {snapshots.map((snapshot) => (
                <tr
                  className="border-b border-slate-200 last:border-0 hover:bg-slate-50/80"
                  key={snapshot.id}
                >
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {formatDateTime(snapshot.snapshotTime)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-semibold">{snapshot.channelName}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {snapshot.siteName} / {snapshot.definitionKey}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {snapshot.itemCount}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={snapshot.status} />
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-slate-500">
                    {snapshot.contentHash.slice(0, 12)}
                  </td>
                  <td className="px-5 py-4">
                    <ViewLink
                      href={`/admin/contents/snapshots/${snapshot.id}`}
                    />
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
