import { notFound } from "next/navigation"
import {
  AdminBackLink,
  AdminEmptyState,
  AdminPageHeader,
  AdminSection,
  AdminTable,
  StatusBadge,
  formatDateTime,
} from "@/features/admin-content/components/admin-ui"
import { getAdminSnapshot } from "@/features/admin-content/queries"

export const dynamic = "force-dynamic"

export default async function SnapshotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const snapshot = await getAdminSnapshot(id)

  if (!snapshot) {
    notFound()
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <AdminPageHeader
          description="这里展示一次采集生成的完整榜单条目，便于确认标题、URL、热度和排序是否符合预期。"
          eyebrow="内容库"
          title="快照详情"
        />
        <AdminBackLink href="/admin/contents/snapshots" />
      </div>

      <AdminSection>
        <div className="grid gap-4 p-5 md:grid-cols-4">
          <SummaryItem label="频道" value={snapshot.channelName} />
          <SummaryItem label="站点" value={snapshot.siteName} />
          <SummaryItem
            label="快照时间"
            value={formatDateTime(snapshot.snapshotTime)}
          />
          <div>
            <p className="text-xs font-semibold text-zinc-500">状态</p>
            <div className="mt-2">
              <StatusBadge status={snapshot.status} />
            </div>
          </div>
          <SummaryItem label="条目数" value={String(snapshot.itemCount)} />
          <SummaryItem label="日期" value={snapshot.snapshotDate} />
          <SummaryItem label="definition_key" value={snapshot.definitionKey} />
          <SummaryItem
            label="内容哈希"
            value={snapshot.contentHash.slice(0, 16)}
          />
        </div>
      </AdminSection>

      <AdminSection>
        {snapshot.items.length === 0 ? (
          <AdminEmptyState
            description="这次快照没有写入条目。"
            title="暂无条目"
          />
        ) : (
          <AdminTable>
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/80 text-xs text-zinc-500">
                <th className="px-5 py-3 font-semibold">排名</th>
                <th className="px-5 py-3 font-semibold">标题</th>
                <th className="px-5 py-3 font-semibold">热度</th>
                <th className="px-5 py-3 font-semibold">标签</th>
                <th className="px-5 py-3 font-semibold">发布时间</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.items.map((item) => (
                <tr
                  className="border-b border-zinc-200 last:border-0 hover:bg-zinc-50/80"
                  key={item.id}
                >
                  <td className="px-5 py-4 font-mono text-sm text-zinc-500">
                    {item.rankNo ?? "-"}
                  </td>
                  <td className="px-5 py-4">
                    <a
                      className="font-semibold text-zinc-900 transition-colors hover:text-zinc-600 hover:underline"
                      href={item.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {item.title}
                    </a>
                    {item.summary ? (
                      <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">
                        {item.summary}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-500">
                    {item.hotValue ?? item.hotLabel ?? "-"}
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-500">
                    {item.tag ?? "-"}
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-500">
                    {formatDateTime(item.publishedAt)}
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

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-zinc-500">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold">{value}</p>
    </div>
  )
}
