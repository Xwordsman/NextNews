"use server"

import { and, eq, isNull } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireUser } from "@/server/auth/session"
import { getDb } from "@/server/db/client"
import {
  bizChannel,
  bizSite,
  bizSnapshotItem,
  membershipOrder,
  membershipPlan,
  relUserChannelSubscription,
  userBookmark,
  userNotification,
  userTrackingRule,
} from "@/server/db/schema"
import { isCommerceEnabled } from "@/server/settings/app-settings"
import { recordTrackingMatchesForRule } from "@/server/tracking/matches"

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim()
}

function safeBackTo(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/"
  }

  return value
}

function withNotice(pathname: string, message: string) {
  const [path, search = ""] = pathname.split("?")
  const params = new URLSearchParams(search)
  params.set("notice", message)

  return `${path}?${params.toString()}`
}

async function getSubscribableChannel(channelId: string) {
  const [channel] = await getDb()
    .select({ id: bizChannel.id })
    .from(bizChannel)
    .innerJoin(bizSite, eq(bizChannel.siteId, bizSite.id))
    .where(
      and(
        eq(bizChannel.id, channelId),
        isNull(bizChannel.deletedAt),
        isNull(bizSite.deletedAt),
        eq(bizChannel.status, "active"),
        eq(bizChannel.isPublic, true),
        eq(bizChannel.isSubscribable, true),
        eq(bizSite.status, "active"),
        eq(bizSite.isVisible, true),
      ),
    )
    .limit(1)

  return channel
}

export async function subscribeChannelAction(formData: FormData) {
  const user = await requireUser()
  const channelId = formString(formData, "channelId")
  const backTo = safeBackTo(formString(formData, "backTo"))

  if (!channelId) {
    redirect(withNotice(backTo, "频道参数缺失"))
  }

  const channel = await getSubscribableChannel(channelId)

  if (!channel) {
    redirect(withNotice(backTo, "该频道暂不支持订阅"))
  }

  await getDb()
    .insert(relUserChannelSubscription)
    .values({
      userId: user.id,
      channelId,
    })
    .onConflictDoNothing({
      target: [
        relUserChannelSubscription.userId,
        relUserChannelSubscription.channelId,
      ],
    })

  revalidatePath(backTo)
  revalidatePath("/account")
  revalidatePath("/feed")
  redirect(withNotice(backTo, "已订阅该频道"))
}

export async function unsubscribeChannelAction(formData: FormData) {
  const user = await requireUser()
  const channelId = formString(formData, "channelId")
  const backTo = safeBackTo(formString(formData, "backTo"))

  if (!channelId) {
    redirect(withNotice(backTo, "频道参数缺失"))
  }

  await getDb()
    .delete(relUserChannelSubscription)
    .where(
      and(
        eq(relUserChannelSubscription.userId, user.id),
        eq(relUserChannelSubscription.channelId, channelId),
      ),
    )

  revalidatePath(backTo)
  revalidatePath("/account")
  revalidatePath("/feed")
  redirect(withNotice(backTo, "已取消订阅"))
}

export async function updateSubscriptionNotifyAction(formData: FormData) {
  const user = await requireUser()
  const channelId = formString(formData, "channelId")
  const backTo = safeBackTo(formString(formData, "backTo") || "/account")
  const notifyEnabled = formString(formData, "notifyEnabled") === "true"

  if (!channelId) {
    redirect(withNotice(backTo, "频道参数缺失"))
  }

  await getDb()
    .update(relUserChannelSubscription)
    .set({
      notifyEnabled,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(relUserChannelSubscription.userId, user.id),
        eq(relUserChannelSubscription.channelId, channelId),
      ),
    )

  revalidatePath("/account")
  redirect(
    withNotice(backTo, notifyEnabled ? "已开启频道通知" : "已关闭频道通知"),
  )
}

export async function createTrackingRuleAction(formData: FormData) {
  const user = await requireUser()
  const keyword = formString(formData, "keyword")
  const description = formString(formData, "description")
  const backTo = safeBackTo(formString(formData, "backTo") || "/tracking")
  const notifyEnabled = formData.get("notifyEnabled") === "on"

  if (!keyword) {
    redirect(withNotice(backTo, "请填写追踪关键词"))
  }

  if (keyword.length > 160) {
    redirect(withNotice(backTo, "追踪关键词不能超过 160 个字符"))
  }

  const [rule] = await getDb()
    .insert(userTrackingRule)
    .values({
      userId: user.id,
      keyword,
      description: description || null,
      isEnabled: true,
      notifyEnabled,
    })
    .onConflictDoUpdate({
      target: [userTrackingRule.userId, userTrackingRule.keyword],
      set: {
        description: description || null,
        isEnabled: true,
        notifyEnabled,
        updatedAt: new Date(),
      },
    })
    .returning({ id: userTrackingRule.id })

  if (rule) {
    await recordTrackingMatchesForRule(rule.id)
  }

  revalidatePath("/tracking")
  revalidatePath("/account")
  redirect(withNotice(backTo, "追踪规则已保存"))
}

export async function deleteTrackingRuleAction(formData: FormData) {
  const user = await requireUser()
  const id = formString(formData, "id")
  const backTo = safeBackTo(formString(formData, "backTo") || "/tracking")

  if (!id) {
    redirect(withNotice(backTo, "追踪规则参数缺失"))
  }

  await getDb()
    .delete(userTrackingRule)
    .where(
      and(eq(userTrackingRule.id, id), eq(userTrackingRule.userId, user.id)),
    )

  revalidatePath("/tracking")
  revalidatePath("/account")
  redirect(withNotice(backTo, "追踪规则已删除"))
}

export async function markNotificationReadAction(formData: FormData) {
  const user = await requireUser()
  const id = formString(formData, "id")
  const backTo = safeBackTo(formString(formData, "backTo") || "/notifications")

  if (!id) {
    redirect(withNotice(backTo, "通知参数缺失"))
  }

  await getDb()
    .update(userNotification)
    .set({
      isRead: true,
      readAt: new Date(),
    })
    .where(
      and(eq(userNotification.id, id), eq(userNotification.userId, user.id)),
    )

  revalidatePath("/notifications")
  redirect(withNotice(backTo, "通知已标记为已读"))
}

export async function markAllNotificationsReadAction(formData: FormData) {
  const user = await requireUser()
  const backTo = safeBackTo(formString(formData, "backTo") || "/notifications")

  await getDb()
    .update(userNotification)
    .set({
      isRead: true,
      readAt: new Date(),
    })
    .where(
      and(
        eq(userNotification.userId, user.id),
        eq(userNotification.isRead, false),
      ),
    )

  revalidatePath("/notifications")
  redirect(withNotice(backTo, "全部通知已标记为已读"))
}

export async function createMembershipOrderAction(formData: FormData) {
  const user = await requireUser()
  const planId = formString(formData, "planId")
  const backTo = safeBackTo(formString(formData, "backTo") || "/membership")

  if (!(await isCommerceEnabled())) {
    redirect(withNotice(backTo, "会员商业化暂未开放"))
  }

  if (!isUuid(planId)) {
    redirect(withNotice(backTo, "请选择会员套餐"))
  }

  const [plan] = await getDb()
    .select({
      id: membershipPlan.id,
      planKey: membershipPlan.planKey,
      planName: membershipPlan.planName,
      priceCents: membershipPlan.priceCents,
      currency: membershipPlan.currency,
      durationDays: membershipPlan.durationDays,
    })
    .from(membershipPlan)
    .where(
      and(
        eq(membershipPlan.id, planId),
        eq(membershipPlan.isEnabled, true),
        isNull(membershipPlan.deletedAt),
      ),
    )
    .limit(1)

  if (!plan) {
    redirect(withNotice(backTo, "套餐不存在或已停用"))
  }

  await getDb()
    .insert(membershipOrder)
    .values({
      userId: user.id,
      planId: plan.id,
      planKey: plan.planKey,
      planName: plan.planName,
      amountCents: plan.priceCents,
      currency: plan.currency,
      status: "pending",
      expiresAt: new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000),
    })

  revalidatePath("/account")
  revalidatePath("/membership")
  redirect(withNotice("/account", "会员订单已创建，支付网关会在后续版本接入"))
}

export async function toggleBookmarkAction(formData: FormData) {
  const user = await requireUser()
  const snapshotItemId = formString(formData, "snapshotItemId")
  const backTo = safeBackTo(formString(formData, "backTo") || "/")

  if (!isUuid(snapshotItemId)) {
    redirect(withNotice(backTo, "内容参数缺失"))
  }

  const db = getDb()
  const [item] = await db
    .select({
      id: bizSnapshotItem.id,
      channelId: bizSnapshotItem.channelId,
      title: bizSnapshotItem.title,
      url: bizSnapshotItem.url,
    })
    .from(bizSnapshotItem)
    .innerJoin(bizChannel, eq(bizSnapshotItem.channelId, bizChannel.id))
    .innerJoin(bizSite, eq(bizChannel.siteId, bizSite.id))
    .where(
      and(
        eq(bizSnapshotItem.id, snapshotItemId),
        isNull(bizChannel.deletedAt),
        isNull(bizSite.deletedAt),
        eq(bizChannel.status, "active"),
        eq(bizChannel.isPublic, true),
        eq(bizSite.status, "active"),
        eq(bizSite.isVisible, true),
      ),
    )
    .limit(1)

  if (!item) {
    redirect(withNotice(backTo, "内容不存在或不可收藏"))
  }

  const [existing] = await db
    .select({ id: userBookmark.id })
    .from(userBookmark)
    .where(
      and(
        eq(userBookmark.userId, user.id),
        eq(userBookmark.snapshotItemId, item.id),
      ),
    )
    .limit(1)

  if (existing) {
    await db.delete(userBookmark).where(eq(userBookmark.id, existing.id))
    revalidatePath("/bookmarks")
    revalidatePath(backTo)
    redirect(withNotice(backTo, "已取消收藏"))
  }

  await db.insert(userBookmark).values({
    userId: user.id,
    snapshotItemId: item.id,
    channelId: item.channelId,
    title: item.title,
    url: item.url,
  })

  revalidatePath("/bookmarks")
  revalidatePath(backTo)
  redirect(withNotice(backTo, "已加入收藏"))
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
}
