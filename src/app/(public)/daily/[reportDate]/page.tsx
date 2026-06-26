import Link from "next/link"
import { notFound } from "next/navigation"
import {
  PublicContentShell,
  PublicPageHero,
  PublicTopBar,
  formatDateTime,
} from "@/features/public-content/components/public-content-ui"
import { getPublicDailyReportDetail } from "@/features/public-operations/queries"
import { getCurrentUser } from "@/server/auth/session"
import {
  canAccessSnapshotDate,
  getHistoryAccessForUser,
} from "@/server/membership/access"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ reportDate: string }>
}) {
  const { reportDate } = await params

  return {
    title: `日报 ${reportDate}`,
  }
}

export default async function DailyDetailPage({
  params,
}: {
  params: Promise<{ reportDate: string }>
}) {
  const { reportDate } = await params
  const user = await getCurrentUser()
  const access = await getHistoryAccessForUser(user?.id)

  if (!canAccessSnapshotDate(reportDate, access)) {
    notFound()
  }

  const data = await getPublicDailyReportDetail(reportDate)

  if (!data) {
    notFound()
  }

  const { report } = data
  const manualItems = data.manualItems
  const sources = data.sources.slice(0, report.channelLimit)
  const itemCount = sources.reduce(
    (total, source) =>
      total + source.items.slice(0, report.itemLimitPerChannel).length,
    manualItems.length,
  )

  return (
    <PublicContentShell>
      <PublicTopBar />
      <PublicPageHero
        description={report.summary}
        eyebrow="Daily"
        meta={`${report.reportDate} / ${itemCount} 条内容 / 发布于 ${formatDateTime(report.publishedAt)}`}
        title={report.title}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/90 px-5 py-4 shadow-sm">
        <p className="text-sm font-semibold text-slate-700">
          这份日报使用发布日期前最近一次频道快照生成，适合回看某一天的热点切面。
        </p>
        <Link
          className="inline-flex min-h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 no-underline transition-colors hover:bg-slate-900 hover:text-white"
          href="/daily"
        >
          返回日报
        </Link>
      </div>

      {manualItems.length > 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-brand">
                Editor Picks
              </p>
              <h2 className="mt-2 font-serif text-2xl font-semibold">
                人工精选
              </h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
              {manualItems.length} 条
            </span>
          </div>
          <ol className="mt-4 grid gap-3">
            {manualItems.map((item, index) => (
              <li
                className="grid grid-cols-[34px_1fr] gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                key={item.id}
              >
                <span className="grid h-8 place-items-center rounded-lg bg-slate-950 font-mono text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <a
                    className="font-semibold leading-6 text-slate-950 no-underline transition-colors hover:text-brand"
                    href={item.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {item.title}
                  </a>
                  {item.note ? (
                    <span className="mt-1 block text-sm leading-6 text-slate-500">
                      {item.note}
                    </span>
                  ) : null}
                  <span className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                    <Link className="hover:text-brand" href={item.channelHref}>
                      {item.siteName} / {item.channelName}
                    </Link>
                    {item.hotValue ? <span>{item.hotValue}</span> : null}
                    {item.hotLabel ? <span>{item.hotLabel}</span> : null}
                    <span>{formatDateTime(item.snapshotTime)}</span>
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {sources.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center">
          <h2 className="font-serif text-2xl font-semibold">暂无日报内容</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
            当前日报没有找到可展示的频道快照。
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
                    频道
                  </Link>
                ) : null}
              </div>

              {source.items.length === 0 ? (
                <p className="mt-4 rounded-xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  该频道暂无快照条目。
                </p>
              ) : (
                <ol className="mt-4 grid gap-2">
                  {source.items
                    .slice(0, report.itemLimitPerChannel)
                    .map((item, index) => (
                      <li
                        className="grid grid-cols-[28px_1fr] gap-2"
                        key={`${source.id}-${item.url}-${index}`}
                      >
                        <span className="grid h-7 place-items-center rounded-md bg-slate-100 font-mono text-xs font-semibold text-slate-500">
                          {index + 1}
                        </span>
                        <span className="min-w-0">
                          <a
                            className="line-clamp-2 text-sm font-semibold leading-6 text-slate-950 no-underline transition-colors hover:text-brand"
                            href={item.url}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {item.title}
                          </a>
                          {item.meta ? (
                            <span className="mt-1 block text-xs text-slate-500">
                              {item.meta}
                            </span>
                          ) : null}
                        </span>
                      </li>
                    ))}
                </ol>
              )}
            </article>
          ))}
        </section>
      )}
    </PublicContentShell>
  )
}
