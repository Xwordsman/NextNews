"use server"

import { and, eq, isNull } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireUser } from "@/server/auth/session"
import { getDb } from "@/server/db/client"
import {
  bizChannel,
  bizSite,
  relUserChannelSubscription,
  userNotification,
  userTrackingRule,
} from "@/server/db/schema"
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
