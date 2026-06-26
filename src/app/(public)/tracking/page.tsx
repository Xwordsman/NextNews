import Link from "next/link"
import {
  PublicContentShell,
  PublicPageHero,
  PublicTopBar,
} from "@/features/public-content/components/public-content-ui"
import { getCurrentUser } from "@/server/auth/session"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "追踪",
}

export default async function TrackingPage() {
  const user = await getCurrentUser()

  return (
    <PublicContentShell>
      <PublicTopBar />
      <PublicPageHero
        description="追踪关键词、站点和话题的个人规则入口。"
        eyebrow="Tracking"
        meta={user ? user.displayName : "需要登录"}
        title="追踪"
      />
      <section className="rounded-2xl border border-slate-200 bg-white/90 px-6 py-12 text-center shadow-sm">
        <h2 className="font-serif text-2xl font-semibold">
          {user ? "追踪规则准备接入" : "登录后使用追踪"}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
          订阅频道已经可用，关键词追踪会继续基于用户中心扩展。
        </p>
        <Link
          className="mt-5 inline-flex min-h-10 items-center rounded-full bg-slate-950 px-4 text-sm font-semibold text-white no-underline transition-colors hover:bg-black"
          href={user ? "/account" : "/login"}
        >
          {user ? "返回个人中心" : "登录"}
        </Link>
      </section>
    </PublicContentShell>
  )
}
