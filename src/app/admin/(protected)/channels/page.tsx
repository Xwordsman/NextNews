import {
  AdminAlert,
  AdminEmptyState,
  AdminNotice,
  AdminPageHeader,
  AdminSection,
  AdminTable,
  BooleanBadge,
  DeleteButton,
  EditLink,
  RunButton,
  StatusBadge,
  formatDateTime,
} from "@/features/admin-content/components/admin-ui"
import {
  deleteChannelAction,
  runChannelCrawlAction,
} from "@/features/admin-content/actions"
import { listAdminChannels } from "@/features/admin-content/queries"
import {
  getErrorMessage,
  getNoticeMessage,
  type AdminSearchParams,
} from "@/features/admin-content/search-params"

export const dynamic = "force-dynamic"

export default async function ChannelsPage({
  searchParams,
}: {
  searchParams: AdminSearchParams
}) {
  const [channels, errorMessage, noticeMessage] = await Promise.all([
    listAdminChannels(),
    getErrorMessage(searchParams),
    getNoticeMessage(searchParams),
  ])

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        action={{ href: "/admin/channels/new", label: "新建频道" }}
        description="频道是真正被 Worker 抓取、被前台展示和被用户订阅的对象。definition_key 必须对应代码仓库里的频道定义。"
        eyebrow="内容源"
        title="频道管理"
      />
      <AdminAlert message={errorMessage} />
      <AdminNotice message={noticeMessage} />
      <AdminSection>
        {channels.length === 0 ? (
          <AdminEmptyState
            description="先选择站点，再创建频道并绑定 definition_key。"
            title="还没有频道"
          />
        ) : (
          <AdminTable>
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/80 text-xs text-zinc-500">
                <th className="px-5 py-3 font-semibold">频道</th>
                <th className="px-5 py-3 font-semibold">definition_key</th>
                <th className="px-5 py-3 font-semibold">分类</th>
                <th className="px-5 py-3 font-semibold">状态</th>
                <th className="px-5 py-3 font-semibold">运营</th>
                <th className="px-5 py-3 font-semibold">采集状态</th>
                <th className="px-5 py-3 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((channel) => (
                <tr
                  className="border-b border-zinc-200 last:border-0 hover:bg-zinc-50/80"
                  key={channel.id}
                >
                  <td className="px-5 py-4">
                    <div className="font-semibold">{channel.channelName}</div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {channel.siteName} / {channel.slug} ·{" "}
                      {channel.collectorType}
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs">
                    {channel.definitionKey}
                  </td>
                  <td className="px-5 py-4">
                    {channel.categories.length > 0
                      ? channel.categories.join("、")
                      : "未分类"}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={channel.status} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <BooleanBadge
                        active={channel.isCrawlEnabled}
                        activeLabel="采集"
                        inactiveLabel="停采"
                      />
                      <BooleanBadge
                        active={channel.isHomeVisible}
                        activeLabel="首页"
                        inactiveLabel="非首页"
                      />
                      <BooleanBadge
                        active={channel.isSubscribable}
                        activeLabel="可订阅"
                        inactiveLabel="不可订阅"
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-500">
                    <div>采集：{formatDateTime(channel.lastCrawlAt)}</div>
                    <div className="mt-1">
                      成功：{formatDateTime(channel.lastSuccessAt)}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <form action={runChannelCrawlAction}>
                        <input name="id" type="hidden" value={channel.id} />
                        <RunButton label="采集" />
                      </form>
                      <EditLink href={`/admin/channels/${channel.id}/edit`} />
                      <form action={deleteChannelAction}>
                        <input name="id" type="hidden" value={channel.id} />
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
