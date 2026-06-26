import Link from "next/link"
import { ExternalLink, LogIn, Rss } from "lucide-react"
import { getUserFeed, getUserSubscriptions } from "@/features/account/queries"
import {
  PublicContentShell,
  PublicTopBar,
  formatDateTime,
} from "@/features/public-content/components/public-content-ui"
import { getCurrentUser } from "@/server/auth/session"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "动态",
}

export default async function FeedPage() {
  const user = await getCurrentUser()

  if (!user) {
    return (
      <PublicContentShell>
        <PublicTopBar />
        <section className="rounded-2xl border border-slate-200 bg-white/90 px-6 py-14 text-center shadow-sm">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-slate-950 text-white">
            <LogIn aria-hidden="true" size={22} />
          </span>
          <h1 className="mt-5 font-serif text-[32px] font-semibold leading-none">
            登录后查看订阅动态
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-500">
            动态页会聚合你订阅频道的最新快照条目，适合日常快速浏览。
          </p>
          <Link
            className="mt-6 inline-flex min-h-10 items-center rounded-full bg-slate-950 px-4 text-sm font-semibold text-white no-underline transition-colors hover:bg-black"
            href="/login"
          >
            登录个人中心
          </Link>
        </section>
      </PublicContentShell>
    )
  }

  const [subscriptions, feedItems] = await Promise.all([
    getUserSubscriptions(user.id),
    getUserFeed(user.id),
  ])

  return (
    <PublicContentShell>
      <PublicTopBar />
      <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-brand">
              Feed
            </p>
            <h1 className="mt-2 font-serif text-[34px] font-semibold leading-none">
              我的订阅动态
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-500">
              已订阅 {subscriptions.length} 个频道，当前聚合 {feedItems.length}{" "}
              条最新内容。
            </p>
          </div>
          <Link
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 no-underline transition-colors hover:bg-slate-900 hover:text-white"
            href="/account"
          >
            <Rss aria-hidden="true" size={16} />
            管理订阅
          </Link>
        </div>
      </section>

      {subscriptions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center">
          <h2 className="font-serif text-2xl font-semibold">还没有订阅频道</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            先在频道详情页订阅几个来源，动态页就会开始汇总内容。
          </p>
          <Link
            className="mt-5 inline-flex min-h-10 items-center rounded-full bg-slate-950 px-4 text-sm font-semibold text-white no-underline transition-colors hover:bg-black"
            href="/"
          >
            去首页看看
          </Link>
        </div>
      ) : feedItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center">
          <h2 className="font-serif text-2xl font-semibold">暂无动态内容</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            订阅频道还没有完成采集，等 Worker 写入快照后这里会自动出现。
          </p>
        </div>
      ) : (
        <ol className="grid gap-3">
          {feedItems.map((item) => (
            <li
              className="grid gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm"
              key={`${item.channelId}-${item.id}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 no-underline transition-colors hover:bg-slate-900 hover:text-white"
                  href={item.channelHref}
                >
                  {item.siteName} / {item.channelName}
                </Link>
                <span className="text-xs text-slate-500">
                  {item.publishedAt
                    ? formatDateTime(item.publishedAt)
                    : `排名 ${item.rankNo ?? "-"}`}
                </span>
              </div>
              <a
                className="flex items-start justify-between gap-4 text-base font-semibold leading-7 text-slate-950 no-underline transition-colors hover:text-brand"
                href={item.url}
                rel="noreferrer"
                target="_blank"
              >
                <span>{item.title}</span>
                <ExternalLink
                  aria-hidden="true"
                  className="mt-1 shrink-0 text-slate-400"
                  size={18}
                />
              </a>
              {item.summary ? (
                <p className="text-sm leading-6 text-slate-500">
                  {item.summary}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                {item.hotValue ? <span>{item.hotValue}</span> : null}
                {item.hotLabel ? <span>{item.hotLabel}</span> : null}
                {item.tag ? <span>{item.tag}</span> : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </PublicContentShell>
  )
}
