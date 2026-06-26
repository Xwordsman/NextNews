import Link from "next/link"
import { ExternalLink } from "lucide-react"
import {
  PublicContentShell,
  PublicPageHero,
  PublicTopBar,
} from "@/features/public-content/components/public-content-ui"
import { getPublicTopics } from "@/features/public-operations/queries"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "话题",
}

export default async function TopicsPage() {
  const topics = await getPublicTopics()
  const matchCount = topics.reduce(
    (total, topic) => total + topic.items.length,
    0,
  )

  return (
    <PublicContentShell>
      <PublicTopBar />
      <PublicPageHero
        description="由后台配置话题关键词，自动从最新入库内容中聚合相关线索。"
        eyebrow="Topics"
        meta={`${topics.length} 个话题 / ${matchCount} 条线索`}
        title="话题"
      />

      {topics.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center">
          <h2 className="font-serif text-2xl font-semibold">暂无话题</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
            后台创建并启用话题后，这里会按关键词展示相关内容。
          </p>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {topics.map((topic) => (
            <article
              className="grid gap-4 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm"
              key={topic.id}
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    className="font-serif text-2xl font-semibold text-slate-950 no-underline transition-colors hover:text-brand"
                    href={`/topics/${topic.slug}`}
                  >
                    {topic.topicName}
                  </Link>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-500">
                    {topic.slug}
                  </span>
                </div>
                {topic.description ? (
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {topic.description}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  {topic.keywords.map((keyword) => (
                    <span
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500"
                      key={keyword}
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              {topic.items.length === 0 ? (
                <p className="rounded-xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  暂无匹配内容，等待更多频道快照入库。
                </p>
              ) : (
                <ol className="grid gap-3">
                  {topic.items.map((item, index) => (
                    <li
                      className="grid grid-cols-[28px_1fr_auto] gap-2"
                      key={`${topic.id}-${item.id}`}
                    >
                      <span className="grid h-7 place-items-center rounded-md bg-slate-100 font-mono text-xs font-semibold text-slate-500">
                        {index + 1}
                      </span>
                      <span className="min-w-0">
                        <a
                          className="line-clamp-2 text-sm font-semibold leading-6 text-slate-950 no-underline transition-colors hover:text-brand"
                          href={`/go/${item.id}`}
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
              <Link
                className="inline-flex min-h-10 w-fit items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 no-underline transition-colors hover:bg-slate-900 hover:text-white"
                href={`/topics/${topic.slug}`}
              >
                查看全部线索
              </Link>
            </article>
          ))}
        </section>
      )}
    </PublicContentShell>
  )
}
