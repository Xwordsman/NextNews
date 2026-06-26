import Link from "next/link"
import { ExternalLink, LogIn, Plus, Trash2 } from "lucide-react"
import {
  createTrackingRuleAction,
  deleteTrackingRuleAction,
} from "@/features/account/actions"
import { getUserTrackingDashboard } from "@/features/account/queries"
import {
  PublicContentShell,
  PublicPageHero,
  PublicTopBar,
  formatDateTime,
} from "@/features/public-content/components/public-content-ui"
import { getCurrentUser } from "@/server/auth/session"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "追踪",
}

export default async function TrackingPage({
  searchParams,
}: {
  searchParams?: Promise<{ notice?: string }>
}) {
  const user = await getCurrentUser()
  const query = await searchParams

  if (!user) {
    return (
      <PublicContentShell>
        <PublicTopBar />
        <PublicPageHero
          description="登录后可以创建个人关键词追踪规则，系统会从最新入库内容里聚合匹配条目。"
          eyebrow="Tracking"
          meta="需要登录"
          title="追踪"
        />
        <section className="rounded-2xl border border-slate-200 bg-white/90 px-6 py-12 text-center shadow-sm">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-slate-950 text-white">
            <LogIn aria-hidden="true" size={22} />
          </span>
          <h2 className="mt-5 font-serif text-2xl font-semibold">
            登录后使用追踪
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
            追踪规则归属于个人账号，适合关注公司、产品、人物或长期关键词。
          </p>
          <Link
            className="mt-5 inline-flex min-h-10 items-center rounded-full bg-slate-950 px-4 text-sm font-semibold text-white no-underline transition-colors hover:bg-black"
            href="/login"
          >
            登录
          </Link>
        </section>
      </PublicContentShell>
    )
  }

  const rules = await getUserTrackingDashboard(user.id)
  const matchCount = rules.reduce(
    (total, rule) => total + rule.matches.length,
    0,
  )

  return (
    <PublicContentShell>
      <PublicTopBar />
      <PublicPageHero
        description="为自己关心的关键词建立追踪规则，系统会从最新公开内容中聚合匹配条目。"
        eyebrow="Tracking"
        meta={`${rules.length} 条规则 / ${matchCount} 条匹配`}
        title="追踪"
      />

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/90 px-5 py-4 shadow-sm">
        <p className="text-sm font-semibold text-slate-700">
          命中结果会在采集入库后自动记录；开启通知的规则也会写入站内通知。
        </p>
        <Link
          className="inline-flex min-h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 no-underline transition-colors hover:bg-slate-900 hover:text-white"
          href="/notifications"
        >
          查看通知
        </Link>
      </section>

      {query?.notice ? (
        <p
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
          role="status"
        >
          {query.notice}
        </p>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
        <form
          action={createTrackingRuleAction}
          className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]"
        >
          <input name="backTo" type="hidden" value="/tracking" />
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            关键词
            <input
              className={inputClassName}
              name="keyword"
              placeholder="例如：Next.js, OpenAI"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            备注
            <input
              className={inputClassName}
              name="description"
              placeholder="可选"
            />
          </label>
          <div className="flex items-end gap-3">
            <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 text-sm font-semibold text-slate-600">
              <input
                className="h-4 w-4 cursor-pointer accent-slate-950"
                name="notifyEnabled"
                type="checkbox"
              />
              通知
            </label>
            <button
              className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-black"
              type="submit"
            >
              <Plus aria-hidden="true" size={16} />
              添加
            </button>
          </div>
        </form>
      </section>

      {rules.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center">
          <h2 className="font-serif text-2xl font-semibold">还没有追踪规则</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
            添加一个关键词后，这里会显示最新匹配内容。
          </p>
        </section>
      ) : (
        <section className="grid gap-4">
          {rules.map((rule) => (
            <article
              className="grid gap-4 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm"
              key={rule.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-serif text-2xl font-semibold">
                      {rule.keyword}
                    </h2>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                      {rule.isEnabled ? "启用" : "停用"}
                    </span>
                    {rule.notifyEnabled ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        通知
                      </span>
                    ) : null}
                  </div>
                  {rule.description ? (
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {rule.description}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-slate-500">
                    更新：{formatDateTime(rule.updatedAt)}
                  </p>
                </div>
                <form action={deleteTrackingRuleAction}>
                  <input name="id" type="hidden" value={rule.id} />
                  <input name="backTo" type="hidden" value="/tracking" />
                  <button
                    className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50"
                    type="submit"
                  >
                    <Trash2 aria-hidden="true" size={16} />
                    删除
                  </button>
                </form>
              </div>

              {rule.matches.length === 0 ? (
                <p className="rounded-xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  暂无匹配内容。
                </p>
              ) : (
                <ol className="grid gap-3">
                  {rule.matches.map((item, index) => (
                    <li
                      className="grid grid-cols-[32px_1fr_auto] gap-3 rounded-xl border border-slate-200 px-4 py-3"
                      key={`${rule.id}-${item.id}`}
                    >
                      <span className="grid h-8 place-items-center rounded-md bg-slate-100 font-mono text-xs font-semibold text-slate-500">
                        {index + 1}
                      </span>
                      <span className="min-w-0">
                        <a
                          className="line-clamp-2 font-semibold leading-6 text-slate-950 no-underline transition-colors hover:text-brand"
                          href={item.url}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {item.title}
                        </a>
                        <Link
                          className="mt-1 block text-xs text-slate-500 no-underline transition-colors hover:text-slate-950"
                          href={item.channelHref}
                        >
                          {item.siteName} / {item.channelName}
                        </Link>
                        <span className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                          <span>命中：{item.matchedKeyword}</span>
                          <span>{formatDateTime(item.matchedAt)}</span>
                          {!item.isRead ? <span>未读</span> : null}
                        </span>
                      </span>
                      <ExternalLink
                        aria-hidden="true"
                        className="mt-1 text-slate-400"
                        size={16}
                      />
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

const inputClassName =
  "min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none transition-colors focus:border-slate-400"
