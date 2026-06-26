import Link from "next/link"
import { notFound } from "next/navigation"
import {
  PublicContentShell,
  PublicPageHero,
  PublicRankList,
  PublicTopBar,
  formatDateTime,
} from "@/features/public-content/components/public-content-ui"
import { getPublicCategory } from "@/features/public-content/queries"

export const dynamic = "force-dynamic"

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>
}) {
  const { categorySlug } = await params
  const category = await getPublicCategory(categorySlug)

  if (!category) {
    notFound()
  }

  return (
    <PublicContentShell>
      <PublicTopBar />
      <PublicPageHero
        description="按后台分类聚合公开频道，展示各频道最新快照。"
        eyebrow="Category"
        meta={`${category.channels.length} 个频道`}
        title={category.categoryName}
      />

      <section className="grid gap-4">
        {category.channels.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center text-sm text-slate-500">
            这个分类暂时没有公开频道。
          </div>
        ) : (
          category.channels.map((channel) => (
            <article
              className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm"
              key={channel.id}
            >
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    className="font-serif text-2xl font-semibold text-slate-950 no-underline transition-colors hover:text-brand"
                    href={channel.href}
                  >
                    {channel.channelName}
                  </Link>
                  <p className="mt-2 text-sm text-slate-500">
                    {channel.siteName} / {channel.definitionKey} / 最近成功：
                    {formatDateTime(channel.lastSuccessAt)}
                  </p>
                </div>
                <Link
                  className="inline-flex min-h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-900 hover:text-white"
                  href={channel.href}
                >
                  查看频道
                </Link>
              </div>
              <PublicRankList items={channel.items} />
            </article>
          ))
        )}
      </section>
    </PublicContentShell>
  )
}
