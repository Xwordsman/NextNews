import { and, eq } from "drizzle-orm"
import { getDb } from "@/server/db/client"
import {
  membershipOrder,
  membershipPlan,
  userMembership,
} from "@/server/db/schema"

export async function markMembershipOrderPaid(orderId: string) {
  return getDb().transaction(async (tx) => {
    const [order] = await tx
      .select({
        id: membershipOrder.id,
        userId: membershipOrder.userId,
        planId: membershipOrder.planId,
        planKey: membershipOrder.planKey,
        planName: membershipOrder.planName,
        status: membershipOrder.status,
        paymentProvider: membershipOrder.paymentProvider,
        paidAt: membershipOrder.paidAt,
        expiresAt: membershipOrder.expiresAt,
        planHistoryDays: membershipPlan.historyDays,
        planDurationDays: membershipPlan.durationDays,
      })
      .from(membershipOrder)
      .leftJoin(membershipPlan, eq(membershipOrder.planId, membershipPlan.id))
      .where(eq(membershipOrder.id, orderId))
      .limit(1)

    if (!order) {
      throw new Error("会员订单不存在")
    }

    if (order.status === "canceled" || order.status === "refunded") {
      throw new Error("已取消或已退款的订单不能确认支付")
    }

    const now = new Date()
    const paidAt = order.paidAt ?? now
    const expiresAt =
      order.expiresAt ??
      new Date(
        now.getTime() + (order.planDurationDays ?? 30) * 24 * 60 * 60 * 1000,
      )
    const historyDays = order.planHistoryDays ?? 30

    await tx
      .update(membershipOrder)
      .set({
        status: "paid",
        paymentProvider: order.paymentProvider ?? "manual",
        paidAt,
        expiresAt,
        updatedAt: now,
      })
      .where(eq(membershipOrder.id, order.id))

    await tx
      .insert(userMembership)
      .values({
        userId: order.userId,
        planKey: order.planKey,
        planName: order.planName,
        status: "active",
        historyDays,
        startedAt: paidAt,
        expiresAt,
        note: `Paid by order ${order.id}`,
      })
      .onConflictDoUpdate({
        target: userMembership.userId,
        set: {
          planKey: order.planKey,
          planName: order.planName,
          status: "active",
          historyDays,
          startedAt: paidAt,
          expiresAt,
          note: `Paid by order ${order.id}`,
          updatedAt: now,
        },
      })

    return {
      expiresAt,
      orderId: order.id,
      planKey: order.planKey,
      userId: order.userId,
    }
  })
}

export async function cancelMembershipOrder(orderId: string) {
  const [order] = await getDb()
    .select({
      id: membershipOrder.id,
      status: membershipOrder.status,
    })
    .from(membershipOrder)
    .where(eq(membershipOrder.id, orderId))
    .limit(1)

  if (!order) {
    throw new Error("会员订单不存在")
  }

  if (order.status !== "pending") {
    throw new Error("只有待支付订单可以取消")
  }

  await getDb()
    .update(membershipOrder)
    .set({
      status: "canceled",
      updatedAt: new Date(),
    })
    .where(eq(membershipOrder.id, orderId))
}

export async function refundMembershipOrder(orderId: string) {
  return getDb().transaction(async (tx) => {
    const [order] = await tx
      .select({
        id: membershipOrder.id,
        userId: membershipOrder.userId,
        planKey: membershipOrder.planKey,
        status: membershipOrder.status,
        expiresAt: membershipOrder.expiresAt,
      })
      .from(membershipOrder)
      .where(eq(membershipOrder.id, orderId))
      .limit(1)

    if (!order) {
      throw new Error("会员订单不存在")
    }

    if (order.status !== "paid") {
      throw new Error("只有已支付订单可以退款")
    }

    const now = new Date()

    await tx
      .update(membershipOrder)
      .set({
        status: "refunded",
        updatedAt: now,
      })
      .where(eq(membershipOrder.id, order.id))

    if (order.expiresAt) {
      await tx
        .update(userMembership)
        .set({
          status: "canceled",
          note: `Refunded order ${order.id}`,
          updatedAt: now,
        })
        .where(
          and(
            eq(userMembership.userId, order.userId),
            eq(userMembership.planKey, order.planKey),
            eq(userMembership.expiresAt, order.expiresAt),
          ),
        )
    }
  })
}
