import Link from "next/link"
import {
  PublicContentShell,
  PublicPageHero,
  PublicTopBar,
} from "@/features/public-content/components/public-content-ui"
import { getPublicRankingPageData } from "@/features/public-operations/queries"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "榜中榜",
}

export default async function RankingsPage() {
  const data = await getPublicRankingPageData()

  return (
    <PublicContentShell>
      <PublicTopBar />
      <PublicPageHero
        description={
          data.config?.description ??
          "把不同来源的榜单集中到一个页面，按频道权重、原榜排名和更新时间聚合热点。"
        }
        eyebrow="Rankings"
        meta={
          data.config
            ? `${data.channelCount} 个频道 / ${data.items.length} 条内容 / ${data.config.timeWindowHours} 小时`
            : "等待后台配置"
        }
        title={data.config?.configName ?? "榜中榜"}
      />
      {data.items.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center">
          <h2 className="font-serif text-2xl font-semibold">暂无榜单</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
            后台创建榜中榜配置、选择频道并完成采集后，这里会展示跨频道聚合结果。
          </p>
        </section>
      ) : (
        <section className="grid gap-3">
          {data.items.map((item) => (
            <article
              className="grid grid-cols-[44px_1fr_auto] items-start gap-4 rounded-2xl border border-slate-200 bg-white/90 p-4 text-slate-950 shadow-sm"
              key={item.id}
            >
              <span className="grid h-11 place-items-center rounded-xl bg-slate-950 font-mono text-sm font-semibold text-white">
                {item.rankNo}
              </span>
              <span className="min-w-0">
                <a
                  className="block font-serif text-xl font-semibold text-slate-950 no-underline transition-colors hover:text-brand"
                  href={item.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  {item.title}
                </a>
                <Link
                  className="mt-2 block text-sm text-slate-500 no-underline transition-colors hover:text-slate-950"
                  href={item.channelHref}
                >
                  {item.siteName} / {item.channelName}
                </Link>
                <span className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span>分数 {Math.round(item.score)}</span>
                  <span>来源 {item.matchedChannels}</span>
                  {item.hotValue ? <span>{item.hotValue}</span> : null}
                  {item.hotLabel ? <span>{item.hotLabel}</span> : null}
                </span>
              </span>
              <span className="text-sm font-semibold text-slate-500">
                #{item.sourceRank ?? "-"}
              </span>
            </article>
          ))}
        </section>
      )}
    </PublicContentShell>
  )
}
