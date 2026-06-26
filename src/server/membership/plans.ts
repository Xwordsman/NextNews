import { and, asc, eq, isNull } from "drizzle-orm"
import { getDb } from "@/server/db/client"
import { membershipPlan } from "@/server/db/schema"
import { isCommerceEnabled } from "@/server/settings/app-settings"

export async function listPublicMembershipPlans() {
  const enabled = await isCommerceEnabled()

  if (!enabled) {
    return {
      commerceEnabled: false,
      plans: [],
    }
  }

  const plans = await getDb()
    .select({
      id: membershipPlan.id,
      planKey: membershipPlan.planKey,
      planName: membershipPlan.planName,
      description: membershipPlan.description,
      priceCents: membershipPlan.priceCents,
      currency: membershipPlan.currency,
      historyDays: membershipPlan.historyDays,
      durationDays: membershipPlan.durationDays,
      isFeatured: membershipPlan.isFeatured,
    })
    .from(membershipPlan)
    .where(
      and(eq(membershipPlan.isEnabled, true), isNull(membershipPlan.deletedAt)),
    )
    .orderBy(asc(membershipPlan.sort), asc(membershipPlan.priceCents))

  return {
    commerceEnabled: true,
    plans,
  }
}

export async function listAdminMembershipPlans() {
  return getDb()
    .select()
    .from(membershipPlan)
    .where(isNull(membershipPlan.deletedAt))
    .orderBy(asc(membershipPlan.sort), asc(membershipPlan.priceCents))
}
