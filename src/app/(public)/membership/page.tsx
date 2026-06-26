import { Lock, Sparkles } from "lucide-react"
import { notFound } from "next/navigation"
import { createMembershipOrderAction } from "@/features/account/actions"
import {
  PublicContentShell,
  PublicPageHero,
  PublicTopBar,
} from "@/features/public-content/components/public-content-ui"
import { listPublicMembershipPlans } from "@/server/membership/plans"
import { requireUser } from "@/server/auth/session"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "会员套餐",
}

export default async function MembershipPage({
  searchParams,
}: {
  searchParams?: Promise<{ notice?: string }>
}) {
  await requireUser()

  const query = await searchParams
  const data = await listPublicMembershipPlans()

  if (!data.commerceEnabled) {
    notFound()
  }

  return (
    <PublicContentShell>
      <PublicTopBar />
      <PublicPageHero
        description="会员商业化由后台开关控制。当前版本支持创建待支付订单，并由管理员在后台确认收款后开通权益。"
        eyebrow="Membership"
        meta={`${data.plans.length} 个可选套餐`}
        title="会员套餐"
      />

      {query?.notice ? (
        <p
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
          role="status"
        >
          {query.notice}
        </p>
      ) : null}

      {data.plans.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center">
          <h2 className="font-serif text-2xl font-semibold">暂无可购买套餐</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
            后台启用会员商业化后，还需要至少启用一个套餐才会展示在这里。
          </p>
        </section>
      ) : (
        <section className="grid gap-4 lg:grid-cols-3">
          {data.plans.map((plan) => (
            <article
              className={`grid gap-5 rounded-2xl border bg-white/90 p-6 shadow-sm ${
                plan.isFeatured ? "border-brand" : "border-slate-200"
              }`}
              key={plan.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-brand">
                    {plan.isFeatured ? "Featured" : "Plan"}
                  </p>
                  <h2 className="mt-2 font-serif text-2xl font-semibold">
                    {plan.planName}
                  </h2>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-white">
                  {plan.isFeatured ? (
                    <Sparkles aria-hidden="true" size={18} />
                  ) : (
                    <Lock aria-hidden="true" size={18} />
                  )}
                </span>
              </div>

              <div>
                <p className="text-3xl font-semibold">
                  {formatMoney(plan.priceCents, plan.currency)}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  有效期 {plan.durationDays} 天，历史快照权限 {plan.historyDays}{" "}
                  天
                </p>
              </div>

              {plan.description ? (
                <p className="min-h-16 text-sm leading-6 text-slate-500">
                  {plan.description}
                </p>
              ) : null}

              <form action={createMembershipOrderAction}>
                <input name="planId" type="hidden" value={plan.id} />
                <input name="backTo" type="hidden" value="/membership" />
                <button
                  className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition-colors hover:bg-black"
                  type="submit"
                >
                  创建待支付订单
                </button>
              </form>
            </article>
          ))}
        </section>
      )}
    </PublicContentShell>
  )
}

function formatMoney(priceCents: number, currency: string) {
  if (priceCents === 0) {
    return "免费"
  }

  return `${currency} ${(priceCents / 100).toFixed(2)}`
}
