import Link from "next/link"
import {
  PublicContentShell,
  PublicPageHero,
  PublicTopBar,
} from "@/features/public-content/components/public-content-ui"
import { initialSources } from "@/features/public-home/mock-data"
import { getPublicHomeData } from "@/features/public-home/queries"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "话题",
}

export default async function TopicsPage() {
  const data = await getPublicHomeData()
  const sources = data.sources.length > 0 ? data.sources : initialSources
  const topics = sources
    .flatMap((source) =>
      source.items.map((item) => item.badge ?? source.category),
    )
    .filter(Boolean)
    .slice(0, 12)

  return (
    <PublicContentShell>
      <PublicTopBar />
      <PublicPageHero
        description="从频道条目中提取可聚合的话题入口。"
        eyebrow="Topics"
        meta={`${topics.length} 个话题线索`}
        title="话题"
      />
      <section className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
        {topics.map((topic, index) => (
          <Link
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 no-underline transition-colors hover:bg-slate-900 hover:text-white"
            href="/rankings"
            key={`${topic}-${index}`}
          >
            {topic}
          </Link>
        ))}
      </section>
    </PublicContentShell>
  )
}
