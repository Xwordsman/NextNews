import {
  AdminEmptyState,
  AdminNotice,
  AdminPageHeader,
  AdminSection,
  AdminTable,
  BooleanBadge,
  StatusBadge,
  formatDateTime,
} from "@/features/admin-content/components/admin-ui"
import { saveHomeModuleAction } from "@/features/admin-content/actions"
import {
  listAdminHomeChannels,
  listAdminHomeModules,
} from "@/features/admin-content/queries"

export const dynamic = "force-dynamic"

export default async function AdminHomeOperationPage({
  searchParams,
}: {
  searchParams?: Promise<{ notice?: string }>
}) {
  const query = await searchParams
  const [channels, modules] = await Promise.all([
    listAdminHomeChannels(),
    listAdminHomeModules(),
  ])
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
      <AdminNotice message={query?.notice} />

      <AdminSection>
        <div className="border-b border-zinc-200 bg-zinc-50 px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
          首页模块
        </div>
        <div className="grid gap-4 p-5">
          {modules.map((module) => (
            <form
              action={saveHomeModuleAction}
              className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 lg:grid-cols-[1fr_1fr_120px_120px_120px_auto]"
              key={module.moduleKey}
            >
              <input
                name="backTo"
                type="hidden"
                value="/admin/operations/home"
              />
              <input name="moduleKey" type="hidden" value={module.moduleKey} />
              <label className="grid gap-2 text-sm font-semibold text-zinc-700">
                标题
                <input
                  className={inputClassName}
                  defaultValue={module.title}
                  name="title"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-zinc-700">
                副标题
                <input
                  className={inputClassName}
                  defaultValue={module.subtitle ?? ""}
                  name="subtitle"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-zinc-700">
                状态
                <select
                  className={inputClassName}
                  defaultValue={module.status}
                  name="status"
                >
                  <option value="active">启用</option>
                  <option value="draft">草稿</option>
                  <option value="disabled">停用</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-zinc-700">
                数量
                <input
                  className={inputClassName}
                  defaultValue={module.displayLimit}
                  min={1}
                  name="displayLimit"
                  type="number"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-zinc-700">
                排序
                <input
                  className={inputClassName}
                  defaultValue={module.sort}
                  min={0}
                  name="sort"
                  type="number"
                />
              </label>
              <div className="flex items-end">
                <button
                  className="inline-flex min-h-10 cursor-pointer items-center rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline-none"
                  type="submit"
                >
                  保存
                </button>
              </div>
            </form>
          ))}
        </div>
      </AdminSection>

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
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-[0.08em] text-zinc-500">
              <tr>
                <th className="px-5 py-3">频道</th>
                <th className="px-5 py-3">状态</th>
                <th className="px-5 py-3">权重</th>
                <th className="px-5 py-3">快照</th>
                <th className="px-5 py-3">最近成功</th>
                <th className="px-5 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {channels.map((channel) => (
                <tr className="hover:bg-zinc-50/80" key={channel.id}>
                  <td className="px-5 py-4">
                    <div className="font-semibold">{channel.channelName}</div>
                    <div className="mt-1 font-mono text-xs text-zinc-500">
                      {channel.definitionKey}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
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
                  <td className="px-5 py-4 text-sm text-zinc-500">
                    {channel.weight} / {channel.sort}
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-500">
                    {channel.snapshotItemCount ?? 0} 条
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-500">
                    {formatDateTime(channel.lastSuccessAt)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <a
                        className="inline-flex min-h-9 items-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-600 no-underline transition-colors hover:bg-zinc-900 hover:text-white focus-visible:outline-none"
                        href={`/channels/${channel.siteSlug}/${channel.channelSlug}`}
                      >
                        前台
                      </a>
                      <a
                        className="inline-flex min-h-9 items-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-600 no-underline transition-colors hover:bg-zinc-900 hover:text-white focus-visible:outline-none"
                        href={`/admin/channels/${channel.id}/edit`}
                      >
                        编辑
                      </a>
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
  "min-h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium outline-none transition-colors focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-zinc-950">{value}</div>
    </div>
  )
}
