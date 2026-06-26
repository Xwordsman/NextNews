import Link from "next/link"
import { Bell, Check, CheckCheck, LogIn } from "lucide-react"
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/features/account/actions"
import { getUserNotifications } from "@/features/account/queries"
import {
  PublicContentShell,
  PublicPageHero,
  PublicTopBar,
  formatDateTime,
} from "@/features/public-content/components/public-content-ui"
import { getCurrentUser } from "@/server/auth/session"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "通知",
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ notice?: string }>
}) {
  const user = await getCurrentUser()
  const query = await searchParams

  if (!user) {
    return (
      <PublicContentShell>
        <PublicTopBar />
        <PublicPageHero
          description="登录后可以查看追踪命中、订阅提醒等个人消息。"
          eyebrow="Notifications"
          meta="需要登录"
          title="站内通知"
        />
        <section className="rounded-2xl border border-slate-200 bg-white/90 px-6 py-12 text-center shadow-sm">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-slate-950 text-white">
            <LogIn aria-hidden="true" size={22} />
          </span>
          <h2 className="mt-5 font-serif text-2xl font-semibold">
            登录后查看通知
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
            个人通知只对当前账号可见。
          </p>
          <Link
            className="mt-5 inline-flex min-h-10 items-center rounded-full bg-slate-950 px-4 text-sm font-semibold text-white no-underline transition-colors hover:bg-black"
            href="/login"
          >
            登录
          </Link>
        </section>
      </PublicContentShell>
    )
  }

  const notifications = await getUserNotifications(user.id)
  const unreadCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length

  return (
    <PublicContentShell>
      <PublicTopBar />
      <PublicPageHero
        description="这里汇总个人订阅和追踪产生的消息，后续也可以扩展为会员提醒。"
        eyebrow="Notifications"
        meta={`${notifications.length} 条通知 / ${unreadCount} 条未读`}
        title="站内通知"
      />

      {query?.notice ? (
        <p
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
          role="status"
        >
          {query.notice}
        </p>
      ) : null}

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/90 px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-white">
            <Bell aria-hidden="true" size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {user.displayName}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              未读通知会保留在列表顶部。
            </p>
          </div>
        </div>
        <form action={markAllNotificationsReadAction}>
          <input name="backTo" type="hidden" value="/notifications" />
          <button
            className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={unreadCount === 0}
            type="submit"
          >
            <CheckCheck aria-hidden="true" size={16} />
            全部已读
          </button>
        </form>
      </section>

      {notifications.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center">
          <h2 className="font-serif text-2xl font-semibold">暂无通知</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
            开启追踪通知后，命中内容会自动出现在这里。
          </p>
        </section>
      ) : (
        <section className="grid gap-3">
          {notifications.map((notification) => (
            <article
              className={`grid gap-3 rounded-2xl border p-4 shadow-sm ${
                notification.isRead
                  ? "border-slate-200 bg-white/90"
                  : "border-amber-200 bg-amber-50/80"
              }`}
              key={notification.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {notification.notificationType}
                    </span>
                    {!notification.isRead ? (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                        未读
                      </span>
                    ) : null}
                    <span className="text-xs text-slate-500">
                      {formatDateTime(notification.createdAt)}
                    </span>
                  </div>
                  <h2 className="mt-3 font-serif text-xl font-semibold">
                    {notification.title}
                  </h2>
                  {notification.body ? (
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {notification.body}
                    </p>
                  ) : null}
                </div>
                {!notification.isRead ? (
                  <form action={markNotificationReadAction}>
                    <input name="id" type="hidden" value={notification.id} />
                    <input name="backTo" type="hidden" value="/notifications" />
                    <button
                      className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-900 hover:text-white"
                      type="submit"
                    >
                      <Check aria-hidden="true" size={16} />
                      已读
                    </button>
                  </form>
                ) : null}
              </div>
              {notification.href ? (
                <NotificationHref href={notification.href} />
              ) : null}
            </article>
          ))}
        </section>
      )}
    </PublicContentShell>
  )
}

function NotificationHref({ href }: { href: string }) {
  if (href.startsWith("/")) {
    return (
      <Link
        className="text-sm font-semibold text-brand no-underline transition-colors hover:text-red-700"
        href={href}
      >
        查看相关内容
      </Link>
    )
  }

  return (
    <a
      className="text-sm font-semibold text-brand no-underline transition-colors hover:text-red-700"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      查看相关内容
    </a>
  )
}
