import Link from "next/link"
import {
  PublicContentShell,
  PublicPageHero,
  PublicTopBar,
} from "@/features/public-content/components/public-content-ui"
import { initialSources } from "@/features/public-home/mock-data"
import { getPublicHomeData } from "@/features/public-home/queries"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "日报",
}

export default async function DailyPage() {
  const data = await getPublicHomeData()
  const sources = data.sources.length > 0 ? data.sources : initialSources

  return (
    <PublicContentShell>
      <PublicTopBar />
      <PublicPageHero
        description="按频道汇总最新入库内容，适合每天快速扫一遍主要来源。"
        eyebrow="Daily"
        meta={`${sources.length} 个来源`}
        title="今日日报"
      />
      <section className="grid gap-4 md:grid-cols-2">
        {sources.slice(0, 8).map((source) => (
          <article
            className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm"
            key={source.id}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl font-semibold">
                  {source.name}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{source.tag}</p>
              </div>
              {source.href ? (
                <Link
                  className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 no-underline transition-colors hover:bg-slate-900 hover:text-white"
                  href={source.href}
                >
                  进入频道
                </Link>
              ) : null}
            </div>
            <ol className="mt-4 grid gap-2">
              {source.items.slice(0, 5).map((item, index) => (
                <li
                  className="grid grid-cols-[28px_1fr] gap-2"
                  key={item.title}
                >
                  <span className="grid h-7 place-items-center rounded-md bg-slate-100 font-mono text-xs font-semibold text-slate-500">
                    {index + 1}
                  </span>
                  {item.url ? (
                    <a
                      className="text-sm font-semibold leading-6 text-slate-950 no-underline transition-colors hover:text-brand"
                      href={item.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {item.title}
                    </a>
                  ) : (
                    <span className="text-sm font-semibold leading-6 text-slate-950">
                      {item.title}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </article>
        ))}
      </section>
    </PublicContentShell>
  )
}
