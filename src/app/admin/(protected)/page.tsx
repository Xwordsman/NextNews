import Link from "next/link"
import {
  AdminPageHeader,
  AdminSection,
} from "@/features/admin-content/components/admin-ui"
import { getAdminDashboardStats } from "@/features/admin-content/queries"

export const dynamic = "force-dynamic"

const nextSteps = [
  "完善内容源基础管理并接入频道定义注册表",
  "实现 Worker 抓取闭环和手动触发",
  "让前台首页读取后台配置与最新快照",
  "补齐个人中心订阅与订阅动态",
]

export default async function AdminPage() {
  const stats = await getAdminDashboardStats()
  const statCards = [
    { label: "站点", value: stats.sites, detail: "可控制前台来源入口" },
    { label: "分类", value: stats.categories, detail: "用于导航和频道归组" },
    { label: "频道", value: stats.channels, detail: "绑定采集定义与展示策略" },
    { label: "快照", value: stats.snapshots, detail: "历史榜单数据沉淀" },
    {
      label: "失败任务",
      value: stats.failedRuns,
      detail: "需要排查的采集运行",
    },
  ]

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        description="这里先保留最关键的运营入口：站点、分类、频道。后续 Worker、前台首页、订阅动态都会从这些基础数据继续往前走。"
        eyebrow="阶段 4"
        title="内容源控制台"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {statCards.map((item) => (
          <article
            className="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm backdrop-blur-xl"
            key={item.label}
          >
            <p className="text-sm font-medium text-slate-500">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold">{item.value}</p>
            <p className="mt-2 text-sm text-slate-500">{item.detail}</p>
          </article>
        ))}
      </section>

      <AdminSection>
        <div className="grid gap-4 border-b border-slate-200 p-5 md:grid-cols-3">
          <Link
            className="rounded-xl border border-slate-200 bg-white/85 p-4 transition-colors hover:bg-slate-50"
            href="/admin/sites"
          >
            <h2 className="font-semibold">站点管理</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              管理微博、知乎、GitHub 这类内容来源。
            </p>
          </Link>
          <Link
            className="rounded-xl border border-slate-200 bg-white/85 p-4 transition-colors hover:bg-slate-50"
            href="/admin/categories"
          >
            <h2 className="font-semibold">分类管理</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              控制导航、首页分组和频道归类。
            </p>
          </Link>
          <Link
            className="rounded-xl border border-slate-200 bg-white/85 p-4 transition-colors hover:bg-slate-50"
            href="/admin/channels"
          >
            <h2 className="font-semibold">频道管理</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              绑定 definition_key、采集频率和前台展示策略。
            </p>
          </Link>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="p-5">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-brand">
              下一步
            </p>
            <h2 className="mt-2 text-2xl font-semibold">数据闭环优先</h2>
          </div>
          <span className="m-5 rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-500">
            phase 4
          </span>
        </div>
        <div className="grid gap-3 px-5 pb-5">
          {nextSteps.map((step, index) => (
            <div
              className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white/60 px-4 py-3"
              key={step}
            >
              <span className="text-sm font-medium">{step}</span>
              <span className="text-sm text-slate-500">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>
          ))}
        </div>
      </AdminSection>
    </div>
  )
}
