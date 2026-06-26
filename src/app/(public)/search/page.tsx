import Link from "next/link"
import { ExternalLink, Search } from "lucide-react"
import {
  PublicContentShell,
  PublicPageHero,
  PublicTopBar,
  formatDateTime,
} from "@/features/public-content/components/public-content-ui"
import {
  getPublicSearchFilters,
  searchPublicContents,
} from "@/features/public-operations/queries"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "搜索",
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: Promise<{
    channel?: string
    from?: string
    q?: string
    site?: string
    to?: string
  }>
}) {
  const query = await searchParams
  const keyword = String(query?.q ?? "").trim()
  const filters = {
    channelId: String(query?.channel ?? "").trim() || undefined,
    from: String(query?.from ?? "").trim() || undefined,
    siteSlug: String(query?.site ?? "").trim() || undefined,
    to: String(query?.to ?? "").trim() || undefined,
  }
  const [filterOptions, items] = await Promise.all([
    getPublicSearchFilters(),
    keyword ? searchPublicContents(keyword, filters) : Promise.resolve([]),
  ])

  return (
    <PublicContentShell>
      <PublicTopBar />
      <PublicPageHero
        description="搜索已入库的快照标题、摘要、标签、站点和频道。"
        eyebrow="Search"
        meta={keyword ? `${items.length} 条结果` : "输入关键词开始检索"}
        title="站内搜索"
      />

      <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
        <form
          action="/search"
          className="grid gap-3 lg:grid-cols-[1fr_180px_220px]"
        >
          <label className="sr-only" htmlFor="site-search">
            搜索关键词
          </label>
          <input
            className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium outline-none transition-colors focus:border-slate-400"
            defaultValue={keyword}
            id="site-search"
            name="q"
            placeholder="搜索热点、频道、站点"
          />
          <label className="sr-only" htmlFor="site-filter">
            站点
          </label>
          <select
            className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-slate-400"
            defaultValue={filters.siteSlug ?? ""}
            id="site-filter"
            name="site"
          >
            <option value="">全部站点</option>
            {filterOptions.sites.map((site) => (
              <option key={site.siteSlug} value={site.siteSlug}>
                {site.siteName}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="channel-filter">
            频道
          </label>
          <select
            className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-slate-400"
            defaultValue={filters.channelId ?? ""}
            id="channel-filter"
            name="channel"
          >
            <option value="">全部频道</option>
            {filterOptions.channels.map((channel) => (
              <option key={channel.channelId} value={channel.channelId}>
                {channel.siteName} / {channel.channelName}
              </option>
            ))}
          </select>
          <div className="grid gap-3 sm:grid-cols-2 lg:col-span-2">
            <label className="sr-only" htmlFor="from-filter">
              开始日期
            </label>
            <input
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-slate-400"
              defaultValue={filters.from ?? ""}
              id="from-filter"
              name="from"
              type="date"
            />
            <label className="sr-only" htmlFor="to-filter">
              结束日期
            </label>
            <input
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-slate-400"
              defaultValue={filters.to ?? ""}
              id="to-filter"
              name="to"
              type="date"
            />
          </div>
          <button
            className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition-colors hover:bg-black"
            type="submit"
          >
            <Search aria-hidden="true" size={16} />
            搜索
          </button>
        </form>
      </section>

      {!keyword ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center">
          <h2 className="font-serif text-2xl font-semibold">等待输入关键词</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
            首页搜索框也会进入这里，适合从历史快照里快速查找线索。
          </p>
        </section>
      ) : items.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center">
          <h2 className="font-serif text-2xl font-semibold">没有找到结果</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
            可以换一个关键词，或等待更多频道完成采集入库。
          </p>
        </section>
      ) : (
        <section className="grid gap-3">
          {items.map((item) => (
            <article
              className="grid grid-cols-[1fr_auto] gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm"
              key={item.id}
            >
              <div className="min-w-0">
                <Link
                  className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 no-underline transition-colors hover:bg-slate-900 hover:text-white"
                  href={item.channelHref}
                >
                  {item.siteName} / {item.channelName}
                </Link>
                <a
                  className="mt-3 block font-serif text-xl font-semibold leading-7 text-slate-950 no-underline transition-colors hover:text-brand"
                  href={item.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  {highlightText(item.title, keyword)}
                </a>
                {item.summary ? (
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                    {highlightText(item.summary, keyword)}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                  {item.rankNo ? <span>原榜 #{item.rankNo}</span> : null}
                  {item.hotValue ? <span>{item.hotValue}</span> : null}
                  {item.hotLabel ? <span>{item.hotLabel}</span> : null}
                  {item.tag ? <span>{item.tag}</span> : null}
                  <span>{formatDateTime(item.snapshotTime)}</span>
                </div>
              </div>
              <ExternalLink
                aria-hidden="true"
                className="mt-1 text-slate-400"
                size={18}
              />
            </article>
          ))}
        </section>
      )}
    </PublicContentShell>
  )
}

function highlightText(text: string, keyword: string) {
  const trimmed = keyword.trim()

  if (!trimmed) {
    return text
  }

  const parts = text.split(new RegExp(`(${escapeRegExp(trimmed)})`, "gi"))

  return parts.map((part, index) =>
    part.toLowerCase() === trimmed.toLowerCase() ? (
      <mark
        className="rounded bg-amber-100 px-0.5 text-slate-950"
        key={`${part}-${index}`}
      >
        {part}
      </mark>
    ) : (
      part
    ),
  )
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
