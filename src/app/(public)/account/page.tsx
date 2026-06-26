import Link from "next/link"
import { LogOut, Rss, UserRound } from "lucide-react"
import { ChannelSubscriptionControl } from "@/features/account/components/subscription-controls"
import { getUserSubscriptions } from "@/features/account/queries"
import {
  PublicContentShell,
  PublicTopBar,
  formatDateTime,
} from "@/features/public-content/components/public-content-ui"
import { userLogoutAction } from "@/features/user-auth/actions"
import { requireUser } from "@/server/auth/session"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "个人中心",
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams?: Promise<{ notice?: string }>
}) {
  const user = await requireUser()
  const query = await searchParams
  const subscriptions = await getUserSubscriptions(user.id)

  return (
    <PublicContentShell>
      <PublicTopBar />

      <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-slate-950 text-white">
              <UserRound aria-hidden="true" size={22} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-brand">
                Account
              </p>
              <h1 className="mt-1 font-serif text-[30px] font-semibold leading-none">
                {user.displayName}
              </h1>
              <p className="mt-2 text-sm text-slate-500">{user.email}</p>
            </div>
          </div>
          <form action={userLogoutAction}>
            <button
              className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-900 hover:text-white"
              type="submit"
            >
              <LogOut aria-hidden="true" size={16} />
              退出登录
            </button>
          </form>
        </div>
      </section>

      {query?.notice ? (
        <p
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
          role="status"
        >
          {query.notice}
        </p>
      ) : null}

      <section className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-brand">
              Subscriptions
            </p>
            <h2 className="mt-2 font-serif text-2xl font-semibold">
              我的订阅频道
            </h2>
          </div>
          <Link
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-semibold text-white no-underline transition-colors hover:bg-black"
            href="/feed"
          >
            <Rss aria-hidden="true" size={16} />
            查看动态
          </Link>
        </div>

        {subscriptions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center">
            <h3 className="font-serif text-2xl font-semibold">还没有订阅</h3>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              打开任意频道详情页，点击“订阅频道”后就会出现在这里。
            </p>
            <Link
              className="mt-5 inline-flex min-h-10 items-center rounded-full bg-slate-950 px-4 text-sm font-semibold text-white no-underline transition-colors hover:bg-black"
              href="/"
            >
              返回首页浏览
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {subscriptions.map((subscription) => (
              <article
                className="grid gap-4 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm"
                key={subscription.subscriptionId}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      className="font-serif text-2xl font-semibold text-slate-950 no-underline transition-colors hover:text-brand"
                      href={subscription.href}
                    >
                      {subscription.channelName}
                    </Link>
                    <p className="mt-1 text-sm text-slate-500">
                      {subscription.siteName} / {subscription.definitionKey}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      最近成功：{formatDateTime(subscription.lastSuccessAt)}
                    </p>
                  </div>
                  <ChannelSubscriptionControl
                    backTo="/account"
                    channelId={subscription.channelId}
                    isSubscribable={true}
                    isSubscribed={true}
                  />
                </div>

                {subscription.items.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
                    暂无快照条目，等待频道完成采集。
                  </p>
                ) : (
                  <ol className="grid gap-2">
                    {subscription.items.map((item, index) => (
                      <li
                        className="grid grid-cols-[28px_1fr] gap-2 text-sm"
                        key={item.id}
                      >
                        <span className="grid h-7 place-items-center rounded-md bg-slate-100 font-mono text-xs font-semibold text-slate-500">
                          {item.rankNo ?? index + 1}
                        </span>
                        <a
                          className="font-semibold leading-6 text-slate-900 no-underline transition-colors hover:text-brand"
                          href={item.url}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {item.title}
                        </a>
                      </li>
                    ))}
                  </ol>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </PublicContentShell>
  )
}
