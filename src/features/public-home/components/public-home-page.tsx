"use client"

import Link from "next/link"
import { useMemo, useRef, useState } from "react"
import {
  ChevronDown,
  ExternalLink,
  Moon,
  Newspaper,
  RefreshCw,
  Search,
  Star,
  Sun,
  User,
} from "lucide-react"
import {
  categoryNavItems as defaultCategoryNavItems,
  initialSources as designSources,
  moreNavItems as defaultMoreNavItems,
  primaryNavItems as defaultPrimaryNavItems,
  type HomeSource,
  type HomeStory,
} from "../mock-data"
import type { HomeModule } from "../queries"

type PublicHomePageProps = {
  initialSources?: HomeSource[]
  categoryNavItems?: typeof defaultCategoryNavItems
  homeModules?: HomeModule[]
  moreNavItems?: typeof defaultMoreNavItems
  primaryNavItems?: typeof defaultPrimaryNavItems
}

function cloneSources(sources: HomeSource[]) {
  return sources.map((source) => ({
    ...source,
    items: source.items.map((item) => ({ ...item })),
  }))
}

function NavPill({
  href,
  label,
  active,
}: {
  href: string
  label: string
  active?: boolean
}) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "inline-flex min-h-9 shrink-0 items-center rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-none dark:bg-white dark:text-slate-950"
          : "inline-flex min-h-9 shrink-0 items-center rounded-lg px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
      }
      href={href}
    >
      {label}
    </Link>
  )
}

export function PublicHomePage({
  categoryNavItems = defaultCategoryNavItems,
  homeModules = [],
  initialSources,
  moreNavItems = defaultMoreNavItems,
  primaryNavItems = defaultPrimaryNavItems,
}: PublicHomePageProps) {
  const [sources, setSources] = useState<HomeSource[]>(() =>
    cloneSources(initialSources ?? designSources),
  )
  const [query, setQuery] = useState("")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const draggedIdRef = useRef<string | null>(null)
  const lastDragOverIdRef = useRef<string | null>(null)

  const moduleByKey = useMemo(
    () => new Map(homeModules.map((module) => [module.moduleKey, module])),
    [homeModules],
  )
  const hotSitesModule = moduleByKey.get("hot-sites")
  const liveRankingsModule = moduleByKey.get("live-rankings")
  const normalizedQuery = query.trim().toLowerCase()
  const filteredSources = useMemo(() => {
    if (!normalizedQuery) {
      return sources
    }

    return sources.filter((source) => {
      const text = `${source.name} ${source.tag} ${source.items
        .map((item) => `${item.title} ${item.meta} ${item.badge ?? ""}`)
        .join(" ")}`.toLowerCase()

      return text.includes(normalizedQuery)
    })
  }, [normalizedQuery, sources])
  const railSources = filteredSources.length ? filteredSources : sources
  const visibleSources = liveRankingsModule
    ? filteredSources.slice(0, liveRankingsModule.displayLimit)
    : filteredSources
  const storyCount = filteredSources.reduce(
    (total, source) => total + source.items.length,
    0,
  )
  const favoriteCount = sources.filter((source) => source.favorite).length

  function toggleFavorite(sourceId: string) {
    setSources((currentSources) =>
      currentSources.map((source) =>
        source.id === sourceId
          ? { ...source, favorite: !source.favorite }
          : source,
      ),
    )
  }

  function animateCard(element: Element | null) {
    element?.animate(
      [
        { transform: "translateY(0)", opacity: 1 },
        { transform: "translateY(-3px)", opacity: 0.72 },
        { transform: "translateY(0)", opacity: 1 },
      ],
      { duration: 260, easing: "ease-out" },
    )
  }

  function refreshAll() {
    gridRef.current
      ?.querySelectorAll("[data-source-card]")
      .forEach((card, index) => {
        card.animate(
          [
            { opacity: 0.58, transform: "translateY(6px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          { duration: 220, delay: index * 18, easing: "ease-out" },
        )
      })
  }

  function moveDraggedSource(targetId: string) {
    const sourceId = draggedIdRef.current

    if (
      !sourceId ||
      sourceId === targetId ||
      lastDragOverIdRef.current === targetId
    ) {
      return
    }

    setSources((currentSources) => {
      const fromIndex = currentSources.findIndex(
        (source) => source.id === sourceId,
      )
      const toIndex = currentSources.findIndex(
        (source) => source.id === targetId,
      )

      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
        return currentSources
      }

      const nextSources = [...currentSources]
      const [moved] = nextSources.splice(fromIndex, 1)
      nextSources.splice(toIndex, 0, moved)
      lastDragOverIdRef.current = targetId
      return nextSources
    })
  }

  return (
    <div className={isDarkMode ? "dark" : undefined}>
      <div className="min-h-screen bg-[#f6f7f9] text-slate-950 antialiased transition-colors duration-200 dark:bg-[#0b1118] dark:text-slate-50">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1118]/90">
          <div className="mx-auto flex w-full max-w-[1500px] items-center gap-4 px-4 py-3 sm:px-6">
            <Link
              aria-label="NextNews 首页"
              className="inline-flex shrink-0 items-center gap-3"
              href="/"
            >
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-white shadow-sm dark:bg-white dark:text-slate-950">
                <Newspaper aria-hidden="true" size={21} strokeWidth={2} />
              </span>
              <span>
                <strong className="block text-xl font-bold leading-none tracking-normal">
                  NextNews
                </strong>
                <span className="mt-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                  新闻聚合
                </span>
              </span>
            </Link>

            <nav
              aria-label="站点导航"
              className="hidden min-w-0 flex-1 items-center gap-1 lg:flex"
            >
              {primaryNavItems.map((item) => (
                <NavPill
                  active={item.href === "/"}
                  href={item.href}
                  key={item.href}
                  label={item.label}
                />
              ))}
            </nav>

            <form
              action="/search"
              className="relative ml-auto hidden h-10 w-[320px] max-w-[34vw] items-center md:flex"
            >
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 text-slate-400"
                size={18}
                strokeWidth={2}
              />
              <input
                className="h-full w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-medium text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-white/25"
                name="q"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索标题、频道或站点"
                type="search"
                value={query}
              />
            </form>

            <button
              aria-label="刷新全部榜单"
              className="grid h-10 w-10 cursor-pointer place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-950 hover:text-white dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:bg-white dark:hover:text-slate-950"
              onClick={refreshAll}
              type="button"
            >
              <RefreshCw aria-hidden="true" size={18} strokeWidth={2} />
            </button>
            <button
              aria-label={isDarkMode ? "切换日间模式" : "切换夜间模式"}
              className="grid h-10 w-10 cursor-pointer place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-950 hover:text-white dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:bg-white dark:hover:text-slate-950"
              onClick={() => setIsDarkMode((current) => !current)}
              type="button"
            >
              {isDarkMode ? (
                <Sun aria-hidden="true" size={18} strokeWidth={2} />
              ) : (
                <Moon aria-hidden="true" size={18} strokeWidth={2} />
              )}
            </button>
            <Link
              aria-label="个人中心"
              className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-950 hover:text-white dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:bg-white dark:hover:text-slate-950"
              href="/account"
            >
              <User aria-hidden="true" size={18} strokeWidth={2} />
            </Link>
          </div>

          <div className="mx-auto flex w-full max-w-[1500px] gap-3 overflow-x-auto border-t border-slate-100 px-4 py-2 sm:px-6 lg:hidden dark:border-white/10">
            {primaryNavItems.map((item) => (
              <NavPill
                active={item.href === "/"}
                href={item.href}
                key={item.href}
                label={item.label}
              />
            ))}
          </div>

          <div className="mx-auto flex w-full max-w-[1500px] items-center gap-2 overflow-x-auto border-t border-slate-100 px-4 py-2 sm:px-6 dark:border-white/10">
            {categoryNavItems.map((item) => (
              <NavPill href={item.href} key={item.href} label={item.label} />
            ))}
            {moreNavItems.length ? (
              <details className="relative shrink-0">
                <summary className="inline-flex min-h-9 cursor-pointer list-none items-center gap-1 rounded-lg px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white">
                  更多
                  <ChevronDown aria-hidden="true" size={15} strokeWidth={2} />
                </summary>
                <div className="absolute right-0 top-11 z-40 grid min-w-28 gap-1 rounded-lg border border-slate-200 bg-white p-2 shadow-lg dark:border-white/10 dark:bg-slate-950">
                  {moreNavItems.map((item) => (
                    <Link
                      className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                      href={item.href}
                      key={item.href}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </details>
            ) : null}
          </div>

          <div className="mx-auto w-full max-w-[1500px] px-4 pb-3 sm:px-6 md:hidden">
            <form action="/search" className="relative flex h-10 items-center">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 text-slate-400"
                size={18}
                strokeWidth={2}
              />
              <input
                className="h-full w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-medium text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                name="q"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索标题、频道或站点"
                type="search"
                value={query}
              />
            </form>
          </div>
        </header>

        <main className="mx-auto grid w-full max-w-[1500px] gap-5 px-4 py-5 sm:px-6 sm:py-6">
          <section className="grid gap-4 border-b border-slate-200 pb-5 dark:border-white/10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-red-600 dark:text-red-400">
                Live News Radar
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-normal text-slate-950 sm:text-3xl dark:text-white">
                全网热点，按频道实时聚合
              </h1>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm sm:min-w-[360px]">
              <StatBlock label="来源" value={filteredSources.length} />
              <StatBlock label="条目" value={storyCount} />
              <StatBlock label="订阅" value={favoriteCount} />
            </div>
          </section>

          {hotSitesModule ? (
            <section aria-labelledby="hotSitesTitle" className="grid gap-3">
              <SectionHeader
                eyebrow={hotSitesModule.subtitle ?? "Hot Sites"}
                id="hotSitesTitle"
                title={hotSitesModule.title}
              />
              <div
                aria-label="热门站点列表"
                className="flex gap-3 overflow-x-auto pb-1"
              >
                {railSources
                  .slice(0, hotSitesModule.displayLimit)
                  .map((source) => (
                    <HotSiteCard key={source.id} source={source} />
                  ))}
              </div>
            </section>
          ) : null}

          {liveRankingsModule ? (
            <section aria-labelledby="liveRankingsTitle" className="grid gap-3">
              <SectionHeader
                eyebrow={liveRankingsModule.subtitle ?? "Sources"}
                id="liveRankingsTitle"
                title={liveRankingsModule.title}
              />
              <div
                className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                ref={gridRef}
              >
                {visibleSources.length === 0 ? (
                  <div className="col-span-full rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm font-medium text-slate-500 dark:border-white/15 dark:bg-white/[0.04] dark:text-slate-400">
                    没有找到匹配的热榜
                  </div>
                ) : (
                  visibleSources.map((source) => (
                    <SourceCard
                      dragged={draggedId === source.id}
                      key={source.id}
                      onAnimateCard={animateCard}
                      onDragEnd={() => {
                        draggedIdRef.current = null
                        lastDragOverIdRef.current = null
                        setDraggedId(null)
                      }}
                      onDragOver={() => moveDraggedSource(source.id)}
                      onDragStart={() => {
                        draggedIdRef.current = source.id
                        lastDragOverIdRef.current = null
                        setDraggedId(source.id)
                      }}
                      onToggleFavorite={() => toggleFavorite(source.id)}
                      source={source}
                    />
                  ))
                )}
              </div>
            </section>
          ) : null}
        </main>

        <footer className="mx-auto grid w-full max-w-[1500px] gap-4 border-t border-slate-200 px-4 py-6 text-sm text-slate-500 sm:px-6 lg:grid-cols-[1fr_auto_1fr] lg:items-center dark:border-white/10 dark:text-slate-400">
          <div>
            <strong className="block text-base font-bold text-slate-950 dark:text-white">
              NextNews
            </strong>
            <span className="mt-1 block">开源新闻聚合与热榜快照系统</span>
          </div>

          <div
            aria-label="今日概览"
            className="flex flex-wrap justify-start gap-4 whitespace-nowrap lg:justify-center"
          >
            <span>
              <strong className="text-slate-950 dark:text-white">
                {filteredSources.length}
              </strong>{" "}
              个来源
            </span>
            <span>
              <strong className="text-slate-950 dark:text-white">
                {storyCount}
              </strong>{" "}
              条热门
            </span>
            <span>
              <strong className="text-slate-950 dark:text-white">
                {favoriteCount}
              </strong>{" "}
              个订阅
            </span>
          </div>

          <nav
            aria-label="底部导航"
            className="flex flex-wrap items-center gap-1 lg:justify-end"
          >
            {[
              { label: "关于", href: "/about" },
              { label: "数据源", href: "/sources" },
              { label: "隐私", href: "/privacy" },
              { label: "GitHub", href: "https://github.com/" },
            ].map((item) => (
              <Link
                className="rounded-lg px-3 py-2 font-medium transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none dark:hover:bg-white/10 dark:hover:text-white"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </footer>
      </div>
    </div>
  )
}

function SectionHeader({
  eyebrow,
  id,
  title,
}: {
  eyebrow: string
  id: string
  title: string
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          {eyebrow}
        </p>
        <h2
          className="mt-1 text-xl font-bold tracking-normal text-slate-950 dark:text-white"
          id={id}
        >
          {title}
        </h2>
      </div>
    </div>
  )
}

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="text-xl font-bold leading-none text-slate-950 dark:text-white">
        {value}
      </div>
      <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
        {label}
      </div>
    </div>
  )
}

function HotSiteCard({ source }: { source: HomeSource }) {
  const content = (
    <>
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-sm font-bold text-white"
        style={{ background: source.logoColor }}
      >
        {source.logo}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-slate-950 dark:text-white">
          {source.name}
        </span>
        <span className="mt-1 block truncate text-xs font-medium text-slate-500 dark:text-slate-400">
          {source.tag}
        </span>
      </span>
    </>
  )

  if (!source.href) {
    return (
      <div className="flex min-h-16 w-[180px] shrink-0 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        {content}
      </div>
    )
  }

  return (
    <Link
      className="flex min-h-16 w-[180px] shrink-0 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-white/20 dark:hover:bg-white/[0.07]"
      href={source.href}
    >
      {content}
    </Link>
  )
}

function SourceCard({
  dragged,
  onAnimateCard,
  onDragEnd,
  onDragOver,
  onDragStart,
  onToggleFavorite,
  source,
}: {
  dragged: boolean
  onAnimateCard: (element: Element | null) => void
  onDragEnd: () => void
  onDragOver: () => void
  onDragStart: () => void
  onToggleFavorite: () => void
  source: HomeSource
}) {
  return (
    <article
      className={`group grid min-h-[380px] grid-rows-[auto_1fr] rounded-lg border border-slate-200 bg-white shadow-sm transition-colors hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-white/20 ${
        dragged ? "opacity-50" : ""
      }`}
      data-source-card
      draggable
      onDragEnd={onDragEnd}
      onDragOver={(event) => {
        event.preventDefault()
        onDragOver()
      }}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move"
        onDragStart()
      }}
      style={{ borderTopColor: source.logoColor, borderTopWidth: 3 }}
    >
      <div className="flex min-w-0 items-start justify-between gap-3 border-b border-slate-100 p-4 dark:border-white/10">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-sm font-bold text-white"
            style={{ background: source.logoColor }}
          >
            {source.logo}
          </span>
          <div className="min-w-0">
            {source.href ? (
              <Link
                className="block truncate text-base font-bold text-slate-950 transition-colors hover:text-red-600 focus-visible:outline-none dark:text-white dark:hover:text-red-300"
                href={source.href}
              >
                {source.name}
              </Link>
            ) : (
              <h3 className="truncate text-base font-bold text-slate-950 dark:text-white">
                {source.name}
              </h3>
            )}
            <div className="mt-1 flex min-w-0 items-center gap-2">
              <span className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                {source.tag}
              </span>
              <span className="h-1 w-1 shrink-0 rounded-full bg-slate-300 dark:bg-slate-600" />
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {source.items.length} 条
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            aria-label="刷新该榜单"
            className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
            onClick={(event) =>
              onAnimateCard(event.currentTarget.closest("article"))
            }
            type="button"
          >
            <RefreshCw aria-hidden="true" size={17} strokeWidth={2} />
          </button>
          <button
            aria-label={source.favorite ? "取消收藏来源" : "收藏来源"}
            aria-pressed={source.favorite}
            className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
            onClick={onToggleFavorite}
            type="button"
          >
            <Star
              aria-hidden="true"
              className={
                source.favorite ? "fill-amber-400 text-amber-400" : "fill-none"
              }
              size={17}
              strokeWidth={2}
            />
          </button>
        </div>
      </div>

      <ol className="grid content-start gap-1.5 overflow-auto p-3">
        {source.items.map((item, index) => (
          <StoryRow
            item={item}
            key={`${source.id}-${item.id ?? item.title}`}
            rank={index + 1}
          />
        ))}
      </ol>
    </article>
  )
}

function StoryRow({ item, rank }: { item: HomeStory; rank: number }) {
  const href = item.id ? `/go/${item.id}` : item.url

  return (
    <li className="grid list-none grid-cols-[28px_1fr_auto] items-start gap-2 rounded-md px-1 py-1.5 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.05]">
      <span
        className={`grid h-7 place-items-center rounded-md text-xs font-bold ${rankClassName(
          rank,
        )}`}
      >
        {rank}
      </span>
      <span className="min-w-0">
        {href ? (
          <a
            className="block truncate text-[15px] font-semibold leading-6 text-slate-900 transition-colors hover:text-red-600 focus-visible:outline-none dark:text-white/90 dark:hover:text-red-300"
            href={href}
            rel="noreferrer"
            target="_blank"
          >
            {item.title}
          </a>
        ) : (
          <strong className="block truncate text-[15px] font-semibold leading-6 text-slate-900 dark:text-white/90">
            {item.title}
          </strong>
        )}
        <span className="block truncate text-xs font-medium text-slate-500 dark:text-slate-400">
          {item.meta}
        </span>
      </span>
      {item.badge ? (
        <span className="mt-1 inline-flex min-h-5 items-center rounded-md bg-amber-100 px-1.5 text-[11px] font-bold text-amber-800 dark:bg-amber-300/20 dark:text-amber-200">
          {item.badge}
        </span>
      ) : href ? (
        <ExternalLink
          aria-hidden="true"
          className="mt-1 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-slate-600"
          size={14}
          strokeWidth={2}
        />
      ) : null}
    </li>
  )
}

function rankClassName(rank: number) {
  if (rank === 1) {
    return "bg-red-600 text-white"
  }

  if (rank === 2) {
    return "bg-orange-100 text-orange-700 dark:bg-orange-300/20 dark:text-orange-200"
  }

  if (rank === 3) {
    return "bg-amber-100 text-amber-700 dark:bg-amber-300/20 dark:text-amber-200"
  }

  return "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300"
}
