import Link from "next/link"
import { notFound } from "next/navigation"
import {
  PublicContentShell,
  PublicPageHero,
  PublicTopBar,
  formatDateTime,
} from "@/features/public-content/components/public-content-ui"
import { getPublicChannelHistory } from "@/features/public-content/queries"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ channelSlug: string; siteSlug: string }>
}) {
  const { channelSlug, siteSlug } = await params

  return {
    title: `${siteSlug}/${channelSlug} 历史`,
  }
}

export default async function ChannelHistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ channelSlug: string; siteSlug: string }>
  searchParams?: Promise<{ month?: string; year?: string }>
}) {
  const { channelSlug, siteSlug } = await params
  const query = await searchParams
  const data = await getPublicChannelHistory(siteSlug, channelSlug, {
    month: query?.month,
    year: query?.year,
  })

  if (!data) {
    notFound()
  }

  const channelHref = `/channels/${siteSlug}/${channelSlug}`
  const historyHref = `${channelHref}/history`

  return (
    <PublicContentShell>
      <PublicTopBar />
      <PublicPageHero
        description={`来自 ${data.channel.siteName} 的历史快照归档。`}
        eyebrow="History"
        meta={`${data.snapshots.length} 个快照 / ${data.filters.month ?? data.filters.year ?? "全部"}`}
        title={`${data.channel.channelName} 历史`}
      />

      <section className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-2xl font-semibold">筛选</h2>
            <Link
              className="text-sm font-semibold text-slate-500 no-underline transition-colors hover:text-slate-950"
              href={historyHref}
            >
              全部
            </Link>
          </div>

          <div className="mt-5">
            <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-brand">
              Years
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.years.length === 0 ? (
                <span className="text-sm text-slate-500">暂无年份</span>
              ) : (
                data.years.map((year) => (
                  <Link
                    className={`rounded-full border px-3 py-1 text-xs font-semibold no-underline transition-colors ${
                      data.filters.year === year && !data.filters.month
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-900 hover:text-white"
                    }`}
                    href={`${historyHref}?year=${year}`}
                    key={year}
                  >
                    {year}
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-brand">
              Months
            </h3>
            <div className="mt-3 grid gap-2">
              {data.months.slice(0, 24).map((month) => (
                <Link
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold no-underline transition-colors ${
                    data.filters.month === month
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                  href={`${historyHref}?month=${month}`}
                  key={month}
                >
                  {month}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        <section className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/90 px-5 py-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-700">
              历史快照会保留每次采集后的榜单状态，后续可以继续扩展为年月归档和会员能力。
            </p>
            <Link
              className="inline-flex min-h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 no-underline transition-colors hover:bg-slate-900 hover:text-white"
              href={channelHref}
            >
              返回频道
            </Link>
          </div>

          {data.snapshots.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center">
              <h2 className="font-serif text-2xl font-semibold">
                暂无历史快照
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
                当前筛选条件下没有快照记录。
              </p>
            </div>
          ) : (
            data.snapshots.map((snapshot) => (
              <Link
                className="grid gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 text-slate-950 no-underline shadow-sm transition-colors hover:bg-slate-50"
                href={snapshot.href}
                key={snapshot.id}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="font-serif text-xl font-semibold">
                    {formatDateTime(snapshot.snapshotTime)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {snapshot.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                  <span>{snapshot.snapshotDate}</span>
                  <span>{snapshot.itemCount} 条内容</span>
                </div>
              </Link>
            ))
          )}
        </section>
      </section>
    </PublicContentShell>
  )
}
