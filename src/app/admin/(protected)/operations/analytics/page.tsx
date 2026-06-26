import {
  AdminEmptyState,
  AdminPageHeader,
  AdminSection,
  AdminTable,
  BooleanBadge,
  StatusBadge,
  formatDateTime,
} from "@/features/admin-content/components/admin-ui"
import { getAdminOperationsAnalytics } from "@/features/admin-content/queries"

export const dynamic = "force-dynamic"

export default async function AdminOperationsAnalyticsPage() {
  const data = await getAdminOperationsAnalytics()
  const stats = [
    {
      label: "活跃频道",
      value: data.stats.activeChannels,
      detail: "状态为 active 的频道",
    },
    {
      label: "首页频道",
      value: data.stats.homeChannels,
      detail: "已展示在首页聚合",
    },
    {
      label: "今日快照",
      value: data.stats.todaySnapshots,
      detail: "今天新入库榜单快照",
    },
    {
      label: "今日内容",
      value: data.stats.todayItems,
      detail: "今天写入的快照条目",
    },
    {
      label: "失败任务",
      value: data.stats.todayFailedRuns,
      detail: "今天失败的采集运行",
    },
    { label: "用户", value: data.stats.users, detail: "后台与前台账户" },
    {
      label: "频道订阅",
      value: data.stats.subscriptions,
      detail: "个人中心订阅关系",
    },
    {
      label: "有效会员",
      value: data.stats.activeMemberships,
      detail: "后台授予的 active 权益",
    },
    {
      label: "今日通知",
      value: data.stats.todayNotifications,
      detail: "今天生成的站内通知",
    },
    {
      label: "未读通知",
      value: data.stats.unreadNotifications,
      detail: "用户尚未读取",
    },
    {
      label: "今日追踪",
      value: data.stats.todayTrackingMatches,
      detail: "追踪关键词命中",
    },
    {
      label: "日报",
      value: data.stats.activeDailyReports,
      detail: "已发布日报数量",
    },
  ]

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        description="汇总前台运营、采集健康、用户订阅、通知和会员权益数据，用于快速判断哪些模块需要处理。"
        eyebrow="Analytics"
        title="运营统计"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <article
            className="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm backdrop-blur-xl"
            key={item.label}
          >
            <p className="text-sm font-medium text-slate-500">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold">{item.value}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {item.detail}
            </p>
          </article>
        ))}
      </section>

      <AdminSection>
        {data.channelHealth.length === 0 ? (
          <AdminEmptyState
            description="创建频道并完成采集后，这里会显示最新快照和失败任务。"
            title="暂无频道健康数据"
          />
        ) : (
          <AdminTable>
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-5 py-3">频道</th>
                <th className="px-5 py-3">状态</th>
                <th className="px-5 py-3">采集</th>
                <th className="px-5 py-3">最新成功</th>
                <th className="px-5 py-3">最新快照</th>
                <th className="px-5 py-3">今日失败</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.channelHealth.map((channel) => (
                <tr className="hover:bg-slate-50/80" key={channel.id}>
                  <td className="px-5 py-4">
                    <div className="font-semibold">
                      {channel.siteName} / {channel.channelName}
                    </div>
                    <div className="mt-1 font-mono text-xs text-slate-500">
                      {channel.definitionKey}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={channel.status} />
                  </td>
                  <td className="px-5 py-4">
                    <BooleanBadge
                      active={channel.isCrawlEnabled}
                      activeLabel="已开启"
                      inactiveLabel="已关闭"
                    />
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {formatDateTime(channel.lastSuccessAt)}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {channel.snapshotId
                      ? `${formatDateTime(channel.snapshotTime)} / ${channel.snapshotItemCount ?? 0} 条`
                      : "暂无快照"}
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                    {channel.todayFailedRuns}
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
