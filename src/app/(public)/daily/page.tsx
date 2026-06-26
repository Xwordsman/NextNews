import Link from "next/link"
import {
  PublicContentShell,
  PublicPageHero,
  PublicTopBar,
  formatDateTime,
} from "@/features/public-content/components/public-content-ui"
import { getPublicDailyPageData } from "@/features/public-operations/queries"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "日报",
}

export default async function DailyPage() {
  const data = await getPublicDailyPageData()
  const latestReport = data.latestReport
  const channelLimit = latestReport?.channelLimit ?? 8
  const itemLimit = latestReport?.itemLimitPerChannel ?? 5
  const sources = data.sources.slice(0, channelLimit)
  const itemCount = sources.reduce(
    (total, source) => total + source.items.slice(0, itemLimit).length,
    0,
  )

  return (
    <PublicContentShell>
      <PublicTopBar />
      <PublicPageHero
        description={
          latestReport?.summary ??
          "日报由后台发布控制。发布后会按首页频道聚合最新入库内容。"
        }
        eyebrow="Daily"
        meta={
          latestReport
            ? `${latestReport.reportDate} / ${itemCount} 条内容`
            : "等待后台发布"
        }
        title={latestReport?.title ?? "今日日报"}
      />

      {sources.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center">
          <h2 className="font-serif text-2xl font-semibold">暂无日报内容</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
            频道完成采集并在后台发布日报后，这里会展示每日聚合内容。
          </p>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {sources.map((source) => (
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
              {source.items.length === 0 ? (
                <p className="mt-4 rounded-xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  该频道暂无快照条目。
                </p>
              ) : (
                <ol className="mt-4 grid gap-2">
                  {source.items.slice(0, itemLimit).map((item, index) => (
                    <li
                      className="grid grid-cols-[28px_1fr] gap-2"
                      key={`${source.id}-${item.title}`}
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
              )}
            </article>
          ))}
        </section>
      )}

      {data.reports.length > 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <h2 className="font-serif text-2xl font-semibold">历史日报</h2>
          <div className="mt-4 grid gap-3">
            {data.reports.map((report) => (
              <div
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3"
                key={report.id}
              >
                <div>
                  <div className="font-semibold">{report.title}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {report.reportDate}
                  </div>
                </div>
                <span className="text-sm text-slate-500">
                  {formatDateTime(report.publishedAt)}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </PublicContentShell>
  )
}
