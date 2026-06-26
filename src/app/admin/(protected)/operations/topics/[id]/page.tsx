import { notFound } from "next/navigation"
import {
  AdminBackLink,
  AdminEmptyState,
  AdminNotice,
  AdminPageHeader,
  AdminSection,
  AdminTable,
  DeleteButton,
  RunButton,
  formatDateTime,
} from "@/features/admin-content/components/admin-ui"
import {
  addTopicSnapshotItemAction,
  removeTopicSnapshotItemAction,
} from "@/features/admin-content/actions"
import { getAdminTopicOperation } from "@/features/admin-content/queries"

export const dynamic = "force-dynamic"

export default async function AdminTopicDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ notice?: string }>
}) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  const data = await getAdminTopicOperation(id)

  if (!data) {
    notFound()
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <AdminPageHeader
          description="人工关联的内容会优先展示在话题详情页。候选内容来自话题关键词对最近入库内容的自动匹配。"
          eyebrow="Topic"
          title={data.topic.topicName}
        />
        <AdminBackLink href="/admin/operations/topics" />
      </div>
      <AdminNotice message={query?.notice} />

      <AdminSection>
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
          关键词
        </div>
        <div className="flex flex-wrap gap-2 p-5">
          {data.topic.keywords.map((keyword) => (
            <span
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500"
              key={keyword}
            >
              {keyword}
            </span>
          ))}
        </div>
      </AdminSection>

      <AdminSection>
        {data.manualItems.length === 0 ? (
          <AdminEmptyState
            description="从下方候选内容加入后，会优先展示在话题详情页。"
            title="还没有人工关联内容"
          />
        ) : (
          <AdminTable>
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-5 py-3">内容</th>
                <th className="px-5 py-3">来源</th>
                <th className="px-5 py-3">排序</th>
                <th className="px-5 py-3">加入时间</th>
                <th className="px-5 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.manualItems.map((item) => (
                <tr className="hover:bg-slate-50/80" key={item.relationId}>
                  <td className="px-5 py-4">
                    <a
                      className="font-semibold text-slate-950 no-underline transition-colors hover:text-brand"
                      href={item.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {item.title}
                    </a>
                    <div className="mt-1 text-xs text-slate-500">
                      原榜排名：{item.rankNo ?? "-"}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {item.siteName} / {item.channelName}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {item.sort}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {formatDateTime(item.createdAt)}
                  </td>
                  <td className="px-5 py-4">
                    <form action={removeTopicSnapshotItemAction}>
                      <input name="id" type="hidden" value={item.relationId} />
                      <input
                        name="topicId"
                        type="hidden"
                        value={data.topic.id}
                      />
                      <input
                        name="backTo"
                        type="hidden"
                        value={`/admin/operations/topics/${data.topic.id}`}
                      />
                      <DeleteButton label="移除" />
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </AdminSection>

      <AdminSection>
        {data.candidates.length === 0 ? (
          <AdminEmptyState
            description="暂未从最近内容中匹配到候选条目，可以调整关键词后再看。"
            title="暂无候选内容"
          />
        ) : (
          <AdminTable>
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-5 py-3">候选内容</th>
                <th className="px-5 py-3">来源</th>
                <th className="px-5 py-3">入库时间</th>
                <th className="px-5 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.candidates.map((item) => (
                <tr className="hover:bg-slate-50/80" key={item.snapshotItemId}>
                  <td className="px-5 py-4">
                    <a
                      className="font-semibold text-slate-950 no-underline transition-colors hover:text-brand"
                      href={item.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {item.title}
                    </a>
                    <div className="mt-1 text-xs text-slate-500">
                      原榜排名：{item.rankNo ?? "-"}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {item.siteName} / {item.channelName}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {formatDateTime(item.createdAt)}
                  </td>
                  <td className="px-5 py-4">
                    <form action={addTopicSnapshotItemAction}>
                      <input
                        name="topicId"
                        type="hidden"
                        value={data.topic.id}
                      />
                      <input
                        name="snapshotItemId"
                        type="hidden"
                        value={item.snapshotItemId}
                      />
                      <input name="sort" type="hidden" value="0" />
                      <input
                        name="backTo"
                        type="hidden"
                        value={`/admin/operations/topics/${data.topic.id}`}
                      />
                      <RunButton label="加入话题" />
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
