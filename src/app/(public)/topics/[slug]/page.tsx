import Link from "next/link"
import { notFound } from "next/navigation"
import { ExternalLink } from "lucide-react"
import {
  PublicContentShell,
  PublicPageHero,
  PublicTopBar,
  formatDateTime,
} from "@/features/public-content/components/public-content-ui"
import { getPublicTopic } from "@/features/public-operations/queries"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return {
    title: `话题 ${slug}`,
  }
}

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const topic = await getPublicTopic(slug)

  if (!topic) {
    notFound()
  }

  const manualIds = new Set(topic.manualItems.map((item) => item.id))

  return (
    <PublicContentShell>
      <PublicTopBar />
      <PublicPageHero
        description={topic.description}
        eyebrow="Topic"
        meta={`${topic.items.length} 条线索 / 更新于 ${formatDateTime(topic.updatedAt)}`}
        title={topic.topicName}
      />

      <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {topic.keywords.length > 0 ? (
              topic.keywords.map((keyword) => (
                <span
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500"
                  key={keyword}
                >
                  {keyword}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-500">暂无关键词</span>
            )}
          </div>
          <Link
            className="inline-flex min-h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 no-underline transition-colors hover:bg-slate-900 hover:text-white"
            href="/topics"
          >
            返回话题
          </Link>
        </div>
      </section>

      {topic.items.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center">
          <h2 className="font-serif text-2xl font-semibold">暂无相关内容</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
            后台可以手动挂载内容，也可以通过关键词自动聚合最新快照。
          </p>
        </section>
      ) : (
        <section className="grid gap-3">
          {topic.items.map((item, index) => (
            <article
              className="grid grid-cols-[42px_1fr_auto] items-start gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm"
              key={item.id}
            >
              <span className="grid h-10 place-items-center rounded-lg bg-slate-900/10 font-mono text-sm font-semibold text-slate-600">
                {index + 1}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {manualIds.has(item.id) ? (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      手动收录
                    </span>
                  ) : null}
                  <Link
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 no-underline transition-colors hover:bg-slate-900 hover:text-white"
                    href={item.channelHref}
                  >
                    {item.siteName} / {item.channelName}
                  </Link>
                </div>
                <a
                  className="mt-3 block font-serif text-xl font-semibold leading-7 text-slate-950 no-underline transition-colors hover:text-brand"
                  href={`/go/${item.id}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  {item.title}
                </a>
                {item.summary ? (
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                    {item.summary}
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
