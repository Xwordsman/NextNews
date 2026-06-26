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
  userTrackingRule,
} from "@/server/db/schema"

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

  await getDb()
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
