"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import {
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
} from "../mock-data"

const lightBodyBackground = `
  radial-gradient(circle at top left, rgba(255, 116, 116, 0.18), transparent 26rem),
  radial-gradient(circle at top right, rgba(34, 197, 94, 0.12), transparent 30rem),
  #f1f5f9
`
const darkBodyBackground = `
  radial-gradient(circle at top left, rgba(255, 82, 82, 0.18), transparent 28rem),
  radial-gradient(circle at top right, rgba(38, 216, 133, 0.12), transparent 32rem),
  #0b1118
`
const lightPanelBackground =
  "linear-gradient(120deg, rgba(78, 142, 232, 0.08), transparent 44%), rgba(255, 255, 255, 0.9)"
const darkPanelBackground =
  "linear-gradient(120deg, rgba(78, 142, 232, 0.12), transparent 44%), rgba(255, 255, 255, 0.05)"

function hexToRgb(hex: string) {
  const value = hex.replace("#", "")
  const normalized =
    value.length === 3
      ? value
          .split("")
          .map((char) => char + char)
          .join("")
      : value
  const numeric = Number.parseInt(normalized, 16)

  return {
    r: (numeric >> 16) & 255,
    g: (numeric >> 8) & 255,
    b: numeric & 255,
  }
}

function getSourceCardBackground(source: HomeSource, isDarkMode: boolean) {
  if (isDarkMode) {
    return `linear-gradient(145deg, ${source.color}, rgba(18, 26, 38, 0.92))`
  }

  const { r, g, b } = hexToRgb(source.color)
  return `
    radial-gradient(circle at 16% 0%, rgba(${r}, ${g}, ${b}, 0.24), transparent 15rem),
    linear-gradient(145deg, rgba(${r}, ${g}, ${b}, 0.18), rgba(255, 255, 255, 0.94) 46%, rgba(${r}, ${g}, ${b}, 0.12)),
    #ffffff
  `
}

type PublicHomePageProps = {
  initialSources?: HomeSource[]
  categoryNavItems?: typeof defaultCategoryNavItems
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
          ? "flex min-h-8 shrink-0 items-center rounded-full bg-slate-900 px-3 text-sm font-medium text-white no-underline transition-colors hover:bg-slate-800 focus-visible:bg-slate-800 focus-visible:outline-none dark:bg-white/10 dark:text-slate-50 dark:hover:bg-white/15 dark:focus-visible:bg-white/15"
          : "flex min-h-8 shrink-0 items-center rounded-full px-3 text-sm font-medium text-slate-500 no-underline transition-colors hover:bg-slate-900/10 hover:text-slate-950 focus-visible:bg-slate-900/10 focus-visible:text-slate-950 focus-visible:outline-none dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-50 dark:focus-visible:bg-white/10 dark:focus-visible:text-slate-50"
      }
      href={href}
    >
      {label}
    </Link>
  )
}

export function PublicHomePage({
  categoryNavItems = defaultCategoryNavItems,
  initialSources,
  moreNavItems = defaultMoreNavItems,
  primaryNavItems = defaultPrimaryNavItems,
}: PublicHomePageProps) {
  const [sources, setSources] = useState<HomeSource[]>(() =>
    cloneSources(initialSources ?? designSources),
  )
  const [query, setQuery] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const draggedIdRef = useRef<string | null>(null)
  const lastDragOverIdRef = useRef<string | null>(null)

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
  const storyCount = filteredSources.reduce(
    (total, source) => total + source.items.length,
    0,
  )

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (!searchRef.current?.contains(event.target as Node) && !query.trim()) {
        setIsSearchOpen(false)
      }
    }

    document.addEventListener("click", handleDocumentClick)
    return () => document.removeEventListener("click", handleDocumentClick)
  }, [query])

  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus()
    }
  }, [isSearchOpen])

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
        { transform: "translateY(-4px)", opacity: 0.72 },
        { transform: "translateY(0)", opacity: 1 },
      ],
      { duration: 320, easing: "ease-out" },
    )
  }

  function refreshAll() {
    gridRef.current
      ?.querySelectorAll("[data-source-card]")
      .forEach((card, index) => {
        card.animate(
          [
            { opacity: 0.5, transform: "translateY(8px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          { duration: 260, delay: index * 24, easing: "ease-out" },
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
      <div
        className="min-h-screen min-w-[320px] bg-slate-100 text-slate-950 antialiased transition-colors duration-300 dark:bg-ink dark:text-slate-50"
        style={{
          background: isDarkMode ? darkBodyBackground : lightBodyBackground,
        }}
      >
        <div className="mx-auto w-full max-w-[1720px] px-6 py-6 max-sm:px-3 max-sm:py-3">
          <header className="sticky top-4 z-20 flex items-center justify-between gap-6 rounded-2xl border border-slate-200 bg-white/85 px-[18px] py-3 shadow-sm backdrop-blur-xl transition-colors duration-300 dark:border-line dark:bg-ink/80 dark:shadow-none max-xl:flex-wrap max-sm:top-2 max-sm:px-3">
            <div className="flex min-w-0 flex-1 items-center gap-6 max-xl:flex-wrap">
              <Link
                aria-label="NextNews 首页"
                className="inline-flex shrink-0 items-center gap-3 text-slate-950 no-underline dark:text-slate-50"
                href="/"
              >
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-red-500 to-orange-400 text-white">
                  <Newspaper aria-hidden="true" size={22} strokeWidth={2} />
                </span>
                <span>
                  <strong className="block font-serif text-2xl leading-none tracking-normal">
                    NextNews
                  </strong>
                  <small className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                    Open Source Radar
                  </small>
                </span>
              </Link>

              <div className="flex min-w-0 flex-1 items-center gap-3 max-lg:w-full max-lg:flex-wrap">
                <nav
                  aria-label="站点导航"
                  className="flex min-w-0 flex-nowrap items-center gap-1 max-sm:w-full max-sm:flex-wrap"
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

                <span
                  aria-hidden="true"
                  className="h-7 w-px shrink-0 bg-slate-200 dark:bg-white/10 max-sm:hidden"
                />

                <nav
                  aria-label="频道分类"
                  className="flex min-w-0 flex-nowrap items-center gap-1 text-sm font-medium text-slate-500 dark:text-slate-400 max-lg:flex-wrap max-sm:w-full"
                >
                  {categoryNavItems.map((item) => (
                    <NavPill
                      href={item.href}
                      key={item.href}
                      label={item.label}
                    />
                  ))}
                  <details className="relative shrink-0">
                    <summary className="flex min-h-8 cursor-pointer list-none items-center rounded-full px-3 transition-colors hover:bg-slate-900/10 hover:text-slate-950 focus-visible:bg-slate-900/10 focus-visible:text-slate-950 focus-visible:outline-none dark:hover:bg-white/10 dark:hover:text-slate-50 dark:focus-visible:bg-white/10 dark:focus-visible:text-slate-50">
                      更多
                    </summary>
                    <div className="absolute right-0 top-11 z-30 grid min-w-28 gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-line dark:bg-slate-950">
                      {moreNavItems.map((item) => (
                        <Link
                          className="rounded-lg px-3 py-2 text-sm text-slate-600 no-underline transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-slate-50"
                          href={item.href}
                          key={item.href}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </details>
                </nav>
              </div>
            </div>

            <div className="flex justify-self-end gap-2 max-xl:justify-self-start max-sm:w-full max-sm:flex-wrap">
              <div
                className={`flex h-11 items-center overflow-hidden rounded-full text-slate-500 transition-all duration-200 dark:text-slate-400 max-sm:max-w-full ${
                  isSearchOpen
                    ? "w-72 border border-slate-200 bg-white dark:border-line dark:bg-white/[0.06]"
                    : "w-11 border border-transparent bg-transparent"
                }`}
                ref={searchRef}
              >
                <button
                  aria-expanded={isSearchOpen}
                  aria-label={isSearchOpen ? "聚焦搜索" : "展开搜索"}
                  className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-900/10 hover:text-slate-950 focus-visible:bg-slate-900/10 focus-visible:text-slate-950 focus-visible:outline-none dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-50 dark:focus-visible:bg-white/10 dark:focus-visible:text-slate-50"
                  onClick={() => setIsSearchOpen(true)}
                  type="button"
                >
                  <Search aria-hidden="true" size={22} strokeWidth={2} />
                </button>
                <input
                  className={`min-w-0 flex-1 border-0 bg-transparent pr-4 text-sm text-slate-950 outline-none transition-opacity duration-200 placeholder:text-slate-400 dark:text-slate-50 dark:placeholder:text-slate-500 ${
                    isSearchOpen
                      ? "opacity-100"
                      : "pointer-events-none opacity-0"
                  }`}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape" && !query.trim()) {
                      setIsSearchOpen(false)
                      event.currentTarget.blur()
                    }
                  }}
                  placeholder="搜索平台、标题、关键词"
                  ref={searchInputRef}
                  type="search"
                  value={query}
                />
              </div>

              <button
                aria-label="刷新全部榜单"
                className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-transparent text-slate-500 transition-colors hover:border-slate-200 hover:bg-slate-900/10 hover:text-slate-950 dark:text-slate-400 dark:hover:border-line dark:hover:bg-white/10 dark:hover:text-slate-50"
                onClick={refreshAll}
                type="button"
              >
                <RefreshCw aria-hidden="true" size={22} strokeWidth={2} />
              </button>
              <button
                aria-label={isDarkMode ? "切换日间模式" : "切换夜间模式"}
                className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-transparent text-slate-500 transition-colors hover:border-slate-200 hover:bg-slate-900/10 hover:text-slate-950 dark:text-slate-400 dark:hover:border-line dark:hover:bg-white/10 dark:hover:text-slate-50"
                onClick={() => setIsDarkMode((current) => !current)}
                type="button"
              >
                {isDarkMode ? (
                  <Sun aria-hidden="true" size={22} strokeWidth={2} />
                ) : (
                  <Moon aria-hidden="true" size={22} strokeWidth={2} />
                )}
              </button>
              <Link
                aria-label="登录或注册"
                className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 no-underline shadow-sm transition-colors hover:bg-slate-900 hover:text-white focus-visible:bg-slate-900 focus-visible:text-white focus-visible:outline-none dark:border-line dark:bg-white/[0.06] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-slate-50 dark:focus-visible:bg-white/10 dark:focus-visible:text-slate-50"
                href="/account"
              >
                <User aria-hidden="true" size={22} strokeWidth={2} />
              </Link>
            </div>
          </header>

          <main className="grid gap-6 pt-6">
            <section
              aria-labelledby="hotSitesTitle"
              className="grid gap-[18px] rounded-2xl border border-slate-200 bg-white px-[22px] py-5 shadow-sm transition-colors duration-300 dark:border-line dark:bg-white/[0.05] dark:shadow-none max-sm:p-[18px]"
              style={{
                background: isDarkMode
                  ? darkPanelBackground
                  : lightPanelBackground,
              }}
            >
              <div className="flex items-baseline gap-2">
                <h1
                  className="font-serif text-[28px] leading-none tracking-normal"
                  id="hotSitesTitle"
                >
                  热门站点
                </h1>
                <span className="text-lg text-slate-400 dark:text-slate-500">
                  /
                </span>
                <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-brand">
                  Hot Sites
                </p>
              </div>
              <div
                aria-label="热门站点列表"
                className="flex gap-3 overflow-x-auto px-0.5 pb-2.5 pt-0.5 [scrollbar-color:rgba(255,255,255,0.22)_transparent]"
              >
                {railSources.map((source) => (
                  <button
                    aria-label={`${source.name} ${source.tag}`}
                    className="grid min-h-28 w-[92px] shrink-0 cursor-pointer place-items-center gap-2 rounded-lg bg-transparent px-2 py-3 text-center text-slate-950 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-900/10 focus-visible:-translate-y-0.5 focus-visible:bg-slate-900/10 focus-visible:outline-none dark:text-slate-50 dark:hover:bg-white/10 dark:focus-visible:bg-white/10"
                    key={source.id}
                    type="button"
                  >
                    <span
                      className="grid h-12 w-12 place-items-center rounded-[14px] border border-line text-xl font-extrabold text-white shadow-[0_12px_24px_rgba(0,0,0,0.22)]"
                      style={{ background: source.logoColor }}
                    >
                      {source.logo}
                    </span>
                    <span className="block max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                      <strong className="block max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm leading-tight">
                        {source.name}
                      </strong>
                      <span className="mt-1 block max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                        {source.tag}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section aria-label="热榜看板">
              <div className="mb-4 flex items-end justify-between gap-6 max-sm:grid">
                <div>
                  <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-brand">
                    Sources
                  </p>
                  <h2 className="m-0 font-serif text-[28px] tracking-normal">
                    实时热榜
                  </h2>
                </div>
                <p className="m-0 max-w-[420px] leading-7 text-slate-500 dark:text-slate-400">
                  拖动卡片可调整你的阅读顺序，点击星标可加入关注。
                </p>
              </div>

              <div
                className="grid grid-cols-4 gap-6 max-xl:grid-cols-2 max-sm:grid-cols-1"
                ref={gridRef}
              >
                {filteredSources.length === 0 ? (
                  <div className="col-span-full rounded-[14px] border border-dashed border-slate-300 p-12 text-center text-slate-500 dark:border-line dark:text-slate-400">
                    没有找到匹配的热榜，换个关键词或分类试试。
                  </div>
                ) : (
                  filteredSources.map((source) => (
                    <article
                      className={`min-h-[390px] rounded-[14px] border border-slate-200 p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 dark:border-white/[0.08] dark:shadow-[0_18px_50px_rgba(0,0,0,0.26)] dark:hover:border-white/20 ${
                        draggedId === source.id ? "opacity-50" : ""
                      }`}
                      data-source-card
                      draggable
                      key={source.id}
                      onDragEnd={(event) => {
                        draggedIdRef.current = null
                        lastDragOverIdRef.current = null
                        setDraggedId(null)
                        event.currentTarget.classList.remove("opacity-50")
                      }}
                      onDragOver={(event) => {
                        event.preventDefault()
                        moveDraggedSource(source.id)
                      }}
                      onDragStart={(event) => {
                        draggedIdRef.current = source.id
                        lastDragOverIdRef.current = null
                        setDraggedId(source.id)
                        event.dataTransfer.effectAllowed = "move"
                      }}
                      style={{
                        background: getSourceCardBackground(source, isDarkMode),
                      }}
                    >
                      <div className="mb-3.5 flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span
                            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-extrabold text-white"
                            style={{ background: source.logoColor }}
                          >
                            {source.logo}
                          </span>
                          <span className="min-w-0">
                            <span className="flex min-w-0 items-center gap-2">
                              <strong className="block overflow-hidden text-ellipsis whitespace-nowrap text-xl">
                                {source.name}
                              </strong>
                              <span className="max-w-[82px] shrink-0 overflow-hidden text-ellipsis whitespace-nowrap rounded-md border border-slate-200 bg-white/70 px-1.5 py-0.5 text-xs text-slate-600 dark:border-white/[0.14] dark:bg-white/[0.08] dark:text-blue-100">
                                {source.tag}
                              </span>
                            </span>
                            <small className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                              {source.tag === "实时热搜"
                                ? "正在追踪"
                                : "12 分钟内更新"}
                            </small>
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <button
                            aria-label="刷新该榜单"
                            className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-transparent text-slate-500 transition-colors hover:border-slate-200 hover:bg-slate-900/10 hover:text-slate-950 dark:text-slate-400 dark:hover:border-line dark:hover:bg-white/10 dark:hover:text-slate-50"
                            onClick={(event) =>
                              animateCard(
                                event.currentTarget.closest("article"),
                              )
                            }
                            type="button"
                          >
                            <RefreshCw
                              aria-hidden="true"
                              size={22}
                              strokeWidth={2}
                            />
                          </button>
                          <button
                            aria-label={
                              source.favorite ? "取消收藏来源" : "收藏来源"
                            }
                            aria-pressed={source.favorite}
                            className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-transparent text-slate-500 transition-colors hover:bg-slate-900/10 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-50"
                            onClick={() => toggleFavorite(source.id)}
                            type="button"
                          >
                            <Star
                              aria-hidden="true"
                              className={
                                source.favorite
                                  ? "fill-[#f5bb48] text-[#f5bb48]"
                                  : "fill-none"
                              }
                              size={22}
                              strokeWidth={2}
                            />
                          </button>
                        </div>
                      </div>

                      <ol className="grid max-h-[310px] gap-2 overflow-auto rounded-xl bg-slate-50 p-2 dark:bg-black/25 [scrollbar-color:rgba(255,255,255,0.22)_transparent]">
                        {source.items.map((item, index) => (
                          <li
                            className="grid list-none grid-cols-[30px_1fr_auto] items-start gap-2.5"
                            key={`${source.id}-${item.title}`}
                          >
                            <span className="grid min-h-[30px] place-items-center rounded-md bg-slate-900/10 text-slate-600 dark:bg-white/10 dark:text-white/80">
                              {index + 1}
                            </span>
                            <span className="min-w-0">
                              {item.url ? (
                                <a
                                  className="block text-[15px] font-semibold leading-6 text-slate-900 no-underline transition-colors hover:text-brand focus-visible:text-brand focus-visible:outline-none dark:text-white/90"
                                  href={item.url}
                                  rel="noreferrer"
                                  target="_blank"
                                >
                                  {item.title}
                                </a>
                              ) : (
                                <strong className="block text-[15px] leading-6 text-slate-900 dark:text-white/90">
                                  {item.title}
                                </strong>
                              )}
                              <small className="text-slate-500 dark:text-white/50">
                                {item.meta}
                              </small>
                            </span>
                            {item.badge ? (
                              <span className="rounded-md bg-[#f5bb48] px-1.5 py-0.5 text-[11px] font-bold text-[#23180a]">
                                {item.badge}
                              </span>
                            ) : null}
                          </li>
                        ))}
                      </ol>
                    </article>
                  ))
                )}
              </div>
            </section>
          </main>

          <footer className="mt-10 grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-t border-slate-200 py-6 text-sm text-slate-500 dark:border-line dark:text-slate-400 max-lg:grid-cols-1 max-lg:justify-items-center max-lg:text-center">
            <div>
              <strong className="block font-serif text-lg text-slate-900 dark:text-slate-50">
                NextNews
              </strong>
              <span className="mt-1 block">
                开源新闻聚合前端原型，聚合站点热榜与实时内容。
              </span>
            </div>

            <div
              aria-label="今日概览"
              className="flex justify-center gap-4 whitespace-nowrap text-slate-500 dark:text-slate-400 max-sm:w-full max-sm:overflow-x-auto"
            >
              <span>
                <strong className="text-slate-950 dark:text-slate-50">
                  {filteredSources.length}
                </strong>{" "}
                个来源
              </span>
              <span>
                <strong className="text-slate-950 dark:text-slate-50">
                  {storyCount}
                </strong>{" "}
                条热闻
              </span>
              <span>
                <strong className="text-slate-950 dark:text-slate-50">
                  12
                </strong>{" "}
                分钟内更新
              </span>
            </div>

            <nav
              aria-label="底部导航"
              className="flex flex-wrap items-center justify-end gap-1 max-lg:justify-center"
            >
              {[
                { label: "关于", href: "/about" },
                { label: "数据源", href: "/sources" },
                { label: "隐私", href: "/privacy" },
                { label: "GitHub", href: "https://github.com/" },
              ].map((item) => (
                <Link
                  className="rounded-full px-3 py-2 no-underline transition-colors hover:bg-slate-900/10 hover:text-slate-950 focus-visible:bg-slate-900/10 focus-visible:text-slate-950 focus-visible:outline-none dark:hover:bg-white/10 dark:hover:text-slate-50"
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
    </div>
  )
}
