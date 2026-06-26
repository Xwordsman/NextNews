import {
  AdminAlert,
  AdminEmptyState,
  AdminNotice,
  AdminPageHeader,
  AdminSection,
  AdminTable,
  BooleanBadge,
  StatusBadge,
  formatDateTime,
} from "@/features/admin-content/components/admin-ui"
import {
  createRankingConfigAction,
  updateRankingConfigStatusAction,
} from "@/features/admin-content/actions"
import {
  listAdminRankingChannelOptions,
  listAdminRankingConfigs,
} from "@/features/admin-content/queries"

export const dynamic = "force-dynamic"

export default async function AdminRankingOperationPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; notice?: string }>
}) {
  const query = await searchParams
  const [configs, channels] = await Promise.all([
    listAdminRankingConfigs(),
    listAdminRankingChannelOptions(),
  ])

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        description="配置参与榜中榜聚合的频道、时间范围和展示数量。前台会基于已入库快照计算跨频道热度，不实时请求第三方站点。"
        eyebrow="Operations"
        title="榜中榜配置"
      />
      <AdminAlert message={query?.error} />
      <AdminNotice message={query?.notice} />

      <AdminSection>
        <form action={createRankingConfigAction} className="grid gap-5 p-5">
          <input
            name="backTo"
            type="hidden"
            value="/admin/operations/rankings"
          />
          <div className="grid gap-4 lg:grid-cols-4">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              榜单名称
              <input
                className={inputClassName}
                name="configName"
                placeholder="默认榜中榜"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Slug
              <input
                className={inputClassName}
                name="slug"
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                placeholder="default"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              时间窗口（小时）
              <input
                className={inputClassName}
                defaultValue={24}
                min={1}
                name="timeWindowHours"
                type="number"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              状态
              <select
                className={inputClassName}
                defaultValue="active"
                name="status"
              >
                <option value="active">启用</option>
                <option value="draft">草稿</option>
                <option value="disabled">停用</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_160px_160px_160px]">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              描述
              <input
                className={inputClassName}
                name="description"
                placeholder="跨频道聚合最近热点"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              展示数量
              <input
                className={inputClassName}
                defaultValue={50}
                min={1}
                name="itemLimit"
                type="number"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              单频道数量
              <input
                className={inputClassName}
                defaultValue={10}
                min={1}
                name="perChannelLimit"
                type="number"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              排序
              <input
                className={inputClassName}
                defaultValue={0}
                min={0}
                name="sort"
                type="number"
              />
            </label>
          </div>

          <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 text-sm font-semibold text-slate-600">
            <input
              className="h-4 w-4 accent-slate-950"
              name="isDefault"
              type="checkbox"
            />
            设为默认榜中榜
          </label>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {channels.map((channel) => (
              <label
                className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 text-sm transition-colors hover:bg-slate-50"
                key={channel.id}
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold">
                    {channel.siteName} / {channel.channelName}
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    权重 {channel.weight} /{" "}
                    {formatDateTime(channel.lastSuccessAt)}
                  </span>
                </span>
                <input
                  className="h-4 w-4 shrink-0 accent-slate-950"
                  name="channelIds"
                  type="checkbox"
                  value={channel.id}
                />
              </label>
            ))}
          </div>

          <div className="flex justify-end border-t border-slate-200 pt-4">
            <button
              className="inline-flex min-h-10 cursor-pointer items-center rounded-full bg-slate-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-black"
              type="submit"
            >
              创建配置
            </button>
          </div>
        </form>
      </AdminSection>

      <AdminSection>
        {configs.length === 0 ? (
          <AdminEmptyState
            description="创建一个榜中榜配置后，前台 /rankings 会按配置聚合内容。"
            title="还没有榜中榜配置"
          />
        ) : (
          <AdminTable>
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-5 py-3">配置</th>
                <th className="px-5 py-3">状态</th>
                <th className="px-5 py-3">规则</th>
                <th className="px-5 py-3">频道</th>
                <th className="px-5 py-3">更新</th>
                <th className="px-5 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {configs.map((config) => (
                <tr className="hover:bg-slate-50/80" key={config.id}>
                  <td className="px-5 py-4">
                    <div className="font-semibold">{config.configName}</div>
                    <div className="mt-1 font-mono text-xs text-slate-500">
                      {config.slug}
                    </div>
                    {config.description ? (
                      <div className="mt-1 text-xs text-slate-500">
                        {config.description}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={config.status} />
                      <BooleanBadge
                        active={config.isDefault}
                        activeLabel="默认"
                        inactiveLabel="非默认"
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {config.timeWindowHours} 小时 / {config.itemLimit} 条 /
                    单频道 {config.perChannelLimit}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {config.channels.length === 0
                      ? "未选择频道"
                      : config.channels
                          .slice(0, 3)
                          .map((channel) => channel.channelName)
                          .join("、")}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {formatDateTime(config.updatedAt)}
                  </td>
                  <td className="px-5 py-4">
                    <form
                      action={updateRankingConfigStatusAction}
                      className="flex flex-wrap gap-2"
                    >
                      <input name="id" type="hidden" value={config.id} />
                      <input
                        name="backTo"
                        type="hidden"
                        value="/admin/operations/rankings"
                      />
                      <input
                        name="isDefault"
                        type="hidden"
                        value={String(config.isDefault)}
                      />
                      <select
                        className="min-h-9 rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600"
                        defaultValue={config.status}
                        name="status"
                      >
                        <option value="active">启用</option>
                        <option value="draft">草稿</option>
                        <option value="disabled">停用</option>
                      </select>
                      <button
                        className="inline-flex min-h-9 cursor-pointer items-center rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-900 hover:text-white"
                        type="submit"
                      >
                        保存状态
                      </button>
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
  "min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none transition-colors focus:border-slate-400"
