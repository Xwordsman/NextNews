import Link from "next/link"
import { notFound } from "next/navigation"
import { ChannelSubscriptionControl } from "@/features/account/components/subscription-controls"
import { isChannelSubscribed } from "@/features/account/queries"
import {
  PublicContentShell,
  PublicPageHero,
  PublicRankList,
  PublicTopBar,
  formatDateTime,
} from "@/features/public-content/components/public-content-ui"
import { getPublicChannel } from "@/features/public-content/queries"
import { getCurrentUser } from "@/server/auth/session"

export const dynamic = "force-dynamic"

export default async function ChannelPage({
  params,
  searchParams,
}: {
  params: Promise<{ siteSlug: string; channelSlug: string }>
  searchParams?: Promise<{ notice?: string }>
}) {
  const { channelSlug, siteSlug } = await params
  const query = await searchParams
  const channel = await getPublicChannel(siteSlug, channelSlug)

  if (!channel) {
    notFound()
  }

  const user = await getCurrentUser()
  const isSubscribed = user
    ? await isChannelSubscribed(user.id, channel.id)
    : false
  const backTo = `/channels/${siteSlug}/${channelSlug}`

  return (
    <PublicContentShell>
      <PublicTopBar />
      <PublicPageHero
        description={`来自 ${channel.siteName} 的公开频道，最新榜单会随着 Worker 采集自动更新。`}
        eyebrow="Channel"
        meta={`最近成功：${formatDateTime(channel.lastSuccessAt)} / ${channel.definitionKey}`}
        title={channel.channelName}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/90 px-5 py-4 shadow-sm">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {user ? `${user.displayName} 的订阅状态` : "登录后可订阅频道"}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            订阅后会出现在个人中心和动态页。
          </p>
        </div>
        <ChannelSubscriptionControl
          backTo={backTo}
          channelId={channel.id}
          isSubscribable={channel.isSubscribable}
          isSubscribed={isSubscribed}
        />
      </div>

      {query?.notice ? (
        <p
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
          role="status"
        >
          {query.notice}
        </p>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-serif text-2xl font-semibold">最新榜单</h2>
            {channel.homepageUrl ? (
              <a
                className="text-sm font-semibold text-slate-500 transition-colors hover:text-slate-950"
                href={channel.homepageUrl}
                rel="noreferrer"
                target="_blank"
              >
                原始页面
              </a>
            ) : null}
          </div>
          <PublicRankList backTo={backTo} items={channel.items} />
        </div>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-2xl font-semibold">历史快照</h2>
            <Link
              className="text-sm font-semibold text-slate-500 no-underline transition-colors hover:text-slate-950"
              href={`/channels/${siteSlug}/${channelSlug}/history`}
            >
              归档
            </Link>
          </div>
          {channel.snapshots.length === 0 ? (
            <p className="mt-4 text-sm leading-6 text-slate-500">
              暂无历史快照。
            </p>
          ) : (
            <div className="mt-4 grid gap-2">
              {channel.snapshots.map((snapshot) => (
                <Link
                  className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm no-underline transition-colors hover:bg-slate-50"
                  href={snapshot.href}
                  key={snapshot.id}
                >
                  <span className="block font-semibold text-slate-900">
                    {formatDateTime(snapshot.snapshotTime)}
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {snapshot.itemCount} 条 / {snapshot.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </aside>
      </section>
    </PublicContentShell>
  )
}
