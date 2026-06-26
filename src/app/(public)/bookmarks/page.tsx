import Link from "next/link"
import { BookmarkX, ExternalLink } from "lucide-react"
import { toggleBookmarkAction } from "@/features/account/actions"
import { getUserBookmarks } from "@/features/account/queries"
import {
  PublicContentShell,
  PublicPageHero,
  PublicTopBar,
  formatDateTime,
} from "@/features/public-content/components/public-content-ui"
import { requireUser } from "@/server/auth/session"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "我的收藏",
}

export default async function BookmarksPage({
  searchParams,
}: {
  searchParams?: Promise<{ notice?: string }>
}) {
  const user = await requireUser()
  const query = await searchParams
  const items = await getUserBookmarks(user.id)

  return (
    <PublicContentShell>
      <PublicTopBar />
      <PublicPageHero
        description="收藏的快照条目会保存在这里，方便后续回看、追踪和做主题整理。"
        eyebrow="Bookmarks"
        meta={`${items.length} 条收藏`}
        title="我的收藏"
      />

      {query?.notice ? (
        <p
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
          role="status"
        >
          {query.notice}
        </p>
      ) : null}

      {items.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center">
          <h2 className="font-serif text-2xl font-semibold">暂无收藏</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
            在频道榜单或历史快照中点击收藏，内容就会出现在这里。
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
                  收藏于 {formatDateTime(item.createdAt)}
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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  {item.rankNo ? <span>原榜 #{item.rankNo}</span> : null}
                  {item.hotValue ? <span>{item.hotValue}</span> : null}
                  {item.hotLabel ? <span>{item.hotLabel}</span> : null}
                  {item.tag ? <span>{item.tag}</span> : null}
                </div>
                <form action={toggleBookmarkAction}>
                  <input
                    name="snapshotItemId"
                    type="hidden"
                    value={item.snapshotItemId}
                  />
                  <input name="backTo" type="hidden" value="/bookmarks" />
                  <button
                    className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full border border-red-200 bg-white px-3 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50"
                    type="submit"
                  >
                    <BookmarkX aria-hidden="true" size={15} />
                    取消收藏
                  </button>
                </form>
              </div>
            </article>
          ))}
        </section>
      )}
    </PublicContentShell>
  )
}
