import Link from "next/link"
import {
  ArrowLeft,
  Bell,
  ExternalLink,
  Newspaper,
  UserRound,
} from "lucide-react"
import type { PublicRankItem } from "../queries"

export function PublicContentShell({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-5 text-slate-950">
      <div className="mx-auto grid w-full max-w-6xl gap-5">{children}</div>
    </main>
  )
}

export function PublicTopBar() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/90 px-5 py-4 shadow-sm backdrop-blur-xl">
      <Link
        className="inline-flex items-center gap-3 text-slate-950 no-underline"
        href="/"
      >
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-red-500 to-orange-400 text-white">
          <Newspaper aria-hidden="true" size={22} />
        </span>
        <span>
          <strong className="block font-serif text-2xl leading-none">
            NextNews
          </strong>
          <small className="mt-1 block text-xs text-slate-500">
            Open Source Radar
          </small>
        </span>
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-900 hover:text-white"
          href="/account"
        >
          <UserRound aria-hidden="true" size={16} />
          个人中心
        </Link>
        <Link
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-900 hover:text-white"
          href="/notifications"
        >
          <Bell aria-hidden="true" size={16} />
          通知
        </Link>
        <Link
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-900 hover:text-white"
          href="/"
        >
          <ArrowLeft aria-hidden="true" size={16} />
          返回首页
        </Link>
      </div>
    </header>
  )
}

export function PublicPageHero({
  eyebrow,
  title,
  description,
  meta,
}: {
  eyebrow: string
  title: string
  description?: string | null
  meta?: string
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-brand">
        {eyebrow}
      </p>
      <h1 className="mt-3 font-serif text-[34px] leading-none tracking-normal">
        {title}
      </h1>
      {description ? (
        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      ) : null}
      {meta ? <p className="mt-4 text-sm text-slate-500">{meta}</p> : null}
    </section>
  )
}

export function PublicRankList({ items }: { items: PublicRankItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center text-sm text-slate-500">
        暂无快照条目，等待频道完成采集。
      </div>
    )
  }

  return (
    <ol className="grid gap-3">
      {items.map((item, index) => (
        <li
          className="grid grid-cols-[42px_1fr_auto] items-start gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm"
          key={item.id}
        >
          <span className="grid h-10 place-items-center rounded-lg bg-slate-900/10 font-mono text-sm font-semibold text-slate-600">
            {item.rankNo ?? index + 1}
          </span>
          <span className="min-w-0">
            <a
              className="text-base font-semibold leading-6 text-slate-950 no-underline transition-colors hover:text-brand"
              href={item.url}
              rel="noreferrer"
              target="_blank"
            >
              {item.title}
            </a>
            {item.summary ? (
              <span className="mt-1 block text-sm leading-6 text-slate-500">
                {item.summary}
              </span>
            ) : null}
            <span className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
              {item.hotValue ? <span>{item.hotValue}</span> : null}
              {item.hotLabel ? <span>{item.hotLabel}</span> : null}
              {item.tag ? <span>{item.tag}</span> : null}
              {item.publishedAt ? (
                <span>{formatDateTime(item.publishedAt)}</span>
              ) : null}
            </span>
          </span>
          <ExternalLink
            aria-hidden="true"
            className="mt-1 text-slate-400"
            size={18}
          />
        </li>
      ))}
    </ol>
  )
}

export function formatDateTime(value: Date | string | null) {
  if (!value) {
    return "未产生"
  }

  const date = value instanceof Date ? value : new Date(value)

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}
