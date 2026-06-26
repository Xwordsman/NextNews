import type { ReactNode } from "react"
import {
  AdminAlert,
  AdminEmptyState,
  AdminNotice,
  AdminPageHeader,
  AdminSection,
  AdminTable,
  BooleanBadge,
  DeleteButton,
  RunButton,
  StatusBadge,
  formatDateTime,
} from "@/features/admin-content/components/admin-ui"
import {
  createTopicAction,
  deleteTopicAction,
  updateTopicStatusAction,
} from "@/features/admin-content/actions"
import { listAdminTopics } from "@/features/admin-content/queries"
import {
  getErrorMessage,
  getNoticeMessage,
  type AdminSearchParams,
} from "@/features/admin-content/search-params"

export const dynamic = "force-dynamic"

export default async function AdminTopicsOperationPage({
  searchParams,
}: {
  searchParams: AdminSearchParams
}) {
  const [topics, errorMessage, noticeMessage] = await Promise.all([
    listAdminTopics(),
    getErrorMessage(searchParams),
    getNoticeMessage(searchParams),
  ])

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        description="话题是后台配置的关键词集合。前台会基于这些关键词，从最新公开内容里聚合相关条目。"
        eyebrow="Operations"
        title="话题配置"
      />
      <AdminAlert message={errorMessage} />
      <AdminNotice message={noticeMessage} />

      <AdminSection>
        <form action={createTopicAction} className="grid gap-4 p-5">
          <input name="backTo" type="hidden" value="/admin/operations/topics" />
          <div className="grid gap-4 lg:grid-cols-3">
            <FormField label="话题名称">
              <input
                className={inputClassName}
                name="topicName"
                placeholder="例如：AI 产品"
                required
              />
            </FormField>
            <FormField label="Slug">
              <input
                className={inputClassName}
                name="slug"
                placeholder="ai-products"
                required
              />
            </FormField>
            <FormField label="状态">
              <select className={inputClassName} name="status">
                <option value="active">启用</option>
                <option value="draft">草稿</option>
                <option value="disabled">停用</option>
              </select>
            </FormField>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_180px_auto]">
            <FormField label="关键词">
              <input
                className={inputClassName}
                name="keywords"
                placeholder="AI, 大模型, 智能体"
              />
            </FormField>
            <FormField label="描述">
              <input
                className={inputClassName}
                name="description"
                placeholder="可选"
              />
            </FormField>
            <FormField label="排序">
              <input
                className={inputClassName}
                defaultValue="0"
                min="0"
                name="sort"
                type="number"
              />
            </FormField>
            <div className="flex items-end gap-3">
              <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 text-sm font-semibold text-slate-600">
                <input
                  className="h-4 w-4 cursor-pointer accent-slate-950"
                  defaultChecked
                  name="isHomeVisible"
                  type="checkbox"
                />
                前台显示
              </label>
              <RunButton label="创建" />
            </div>
          </div>
        </form>
      </AdminSection>

      <AdminSection>
        {topics.length === 0 ? (
          <AdminEmptyState
            description="创建话题后，前台话题页会按关键词聚合最新内容。"
            title="还没有话题"
          />
        ) : (
          <AdminTable>
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-5 py-3">话题</th>
                <th className="px-5 py-3">关键词</th>
                <th className="px-5 py-3">状态</th>
                <th className="px-5 py-3">排序</th>
                <th className="px-5 py-3">更新时间</th>
                <th className="px-5 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {topics.map((topic) => (
                <tr className="hover:bg-slate-50/80" key={topic.id}>
                  <td className="px-5 py-4">
                    <div className="font-semibold">{topic.topicName}</div>
                    <div className="mt-1 font-mono text-xs text-slate-500">
                      {topic.slug}
                    </div>
                    {topic.description ? (
                      <p className="mt-2 max-w-[420px] text-sm leading-6 text-slate-500">
                        {topic.description}
                      </p>
                    ) : null}
                  </td>
                  <td className="max-w-[320px] px-5 py-4 text-sm text-slate-500">
                    {topic.keywords || "-"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={topic.status} />
                      <BooleanBadge
                        active={topic.isHomeVisible}
                        activeLabel="前台"
                        inactiveLabel="隐藏"
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {topic.sort}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {formatDateTime(topic.updatedAt)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <form action={updateTopicStatusAction}>
                        <input name="id" type="hidden" value={topic.id} />
                        <input
                          name="status"
                          type="hidden"
                          value={
                            topic.status === "active" ? "disabled" : "active"
                          }
                        />
                        <input
                          name="isHomeVisible"
                          type="hidden"
                          value={String(topic.isHomeVisible)}
                        />
                        <input
                          name="backTo"
                          type="hidden"
                          value="/admin/operations/topics"
                        />
                        <RunButton
                          label={topic.status === "active" ? "停用" : "启用"}
                        />
                      </form>
                      <form action={updateTopicStatusAction}>
                        <input name="id" type="hidden" value={topic.id} />
                        <input
                          name="status"
                          type="hidden"
                          value={topic.status}
                        />
                        <input
                          name="isHomeVisible"
                          type="hidden"
                          value={String(!topic.isHomeVisible)}
                        />
                        <input
                          name="backTo"
                          type="hidden"
                          value="/admin/operations/topics"
                        />
                        <RunButton
                          label={topic.isHomeVisible ? "隐藏" : "显示"}
                        />
                      </form>
                      <form action={deleteTopicAction}>
                        <input name="id" type="hidden" value={topic.id} />
                        <input
                          name="backTo"
                          type="hidden"
                          value="/admin/operations/topics"
                        />
                        <DeleteButton label="删除" />
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

const inputClassName =
  "min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none transition-colors focus:border-slate-400"

function FormField({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      {children}
    </label>
  )
}
