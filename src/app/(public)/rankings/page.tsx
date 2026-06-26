import Link from "next/link"
import {
  PublicContentShell,
  PublicPageHero,
  PublicTopBar,
} from "@/features/public-content/components/public-content-ui"
import { getPublicHomeData } from "@/features/public-home/queries"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "榜中榜",
}

export default async function RankingsPage() {
  const data = await getPublicHomeData()
  const sources = data.sources

  return (
    <PublicContentShell>
      <PublicTopBar />
      <PublicPageHero
        description="把不同来源的榜单集中到一个页面，便于横向比较热点。"
        eyebrow="Rankings"
        meta={`${sources.reduce((total, source) => total + source.items.length, 0)} 条内容`}
        title="榜中榜"
      />
      {sources.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center">
          <h2 className="font-serif text-2xl font-semibold">暂无榜单</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
            后台开启首页展示的频道并完成采集后，这里会展示榜中榜。
          </p>
        </section>
      ) : (
        <section className="grid gap-3">
          {sources.map((source, index) => (
            <Link
              className="grid grid-cols-[44px_1fr_auto] items-center gap-4 rounded-2xl border border-slate-200 bg-white/90 p-4 text-slate-950 no-underline shadow-sm transition-colors hover:bg-slate-50"
              href={source.href ?? "/"}
              key={source.id}
            >
              <span className="grid h-11 place-items-center rounded-xl bg-slate-950 font-mono text-sm font-semibold text-white">
                {index + 1}
              </span>
              <span className="min-w-0">
                <span className="block font-serif text-2xl font-semibold">
                  {source.name}
                </span>
                <span className="mt-1 block text-sm text-slate-500">
                  {source.items[0]?.title ?? "等待采集"}
                </span>
              </span>
              <span className="text-sm font-semibold text-slate-500">
                {source.items.length} 条
              </span>
            </Link>
          ))}
        </section>
      )}
    </PublicContentShell>
  )
}
