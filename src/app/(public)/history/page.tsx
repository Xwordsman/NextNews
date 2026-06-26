import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { getUserReadHistory } from "@/features/account/queries"
import {
  PublicContentShell,
  PublicPageHero,
  PublicTopBar,
  formatDateTime,
} from "@/features/public-content/components/public-content-ui"
import { requireUser } from "@/server/auth/session"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "阅读历史",
}

export default async function HistoryPage() {
  const user = await requireUser()
  const items = await getUserReadHistory(user.id)

  return (
    <PublicContentShell>
      <PublicTopBar />
      <PublicPageHero
        description="通过站内跳转访问的内容会记录在这里，便于回看最近关注过的热点。"
        eyebrow="History"
        meta={`${items.length} 条记录`}
        title="阅读历史"
      />

      {items.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center">
          <h2 className="font-serif text-2xl font-semibold">暂无阅读历史</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
            从频道榜单、搜索结果或收藏页打开内容后，会自动记录到这里。
          </p>
        </section>
      ) : (
        <section className="grid gap-3">
          {items.map((item) => (
            <article
              className="grid gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm"
              key={item.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 no-underline transition-colors hover:bg-slate-900 hover:text-white"
                  href={item.channelHref}
                >
                  {item.siteName} / {item.channelName}
                </Link>
                <span className="text-xs text-slate-500">
                  最近阅读 {formatDateTime(item.lastReadAt)}
                </span>
              </div>
              <a
                className="flex items-start justify-between gap-4 text-base font-semibold leading-7 text-slate-950 no-underline transition-colors hover:text-brand"
                href={`/go/${item.snapshotItemId}`}
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
              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                <span>阅读 {item.readCount} 次</span>
                <span>首次 {formatDateTime(item.firstReadAt)}</span>
                {item.rankNo ? <span>原榜 #{item.rankNo}</span> : null}
                {item.hotValue ? <span>{item.hotValue}</span> : null}
                {item.hotLabel ? <span>{item.hotLabel}</span> : null}
                {item.tag ? <span>{item.tag}</span> : null}
              </div>
            </article>
          ))}
        </section>
      )}
    </PublicContentShell>
  )
}
