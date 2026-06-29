"use server"

import { and, eq, inArray, isNull } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { recordAdminOperation } from "@/server/admin/operation-log"
import { hashPassword, verifyPassword } from "@/server/auth/password"
import { requireAdmin } from "@/server/auth/session"
import {
  channelColorPresets,
  channelDisplayStyles,
  channelMetaDisplayModes,
  channelMetaPositions,
  channelTypes,
  defaultChannelHomeItemLimit,
  maxChannelHomeItemLimit,
  mergeChannelDisplayConfig,
} from "@/server/channels/display-config"
import { getChannelDefinition } from "@/server/channels/registry"
import { hashContentUrl, normalizeContentUrl } from "@/server/content/hash"
import { runChannelCrawl } from "@/server/crawling/run-channel"
import { getDb } from "@/server/db/client"
import { syncBuiltinNewsSources } from "@/server/db/initial-data"
import {
  bizCategory,
  bizChannel,
  bizContentBlock,
  bizDailyReport,
  bizDailyReportItem,
  bizDailyReportTemplate,
  bizHomeModule,
  bizRankingConfig,
  bizSnapshotItem,
  bizSite,
  bizTopic,
  logCrawlRun,
  membershipPlan,
  relRankingChannel,
  relChannelCategory,
  relTopicSnapshotItem,
  sysJobQueue,
  sysUser,
  userMembership,
  userTrackingRule,
} from "@/server/db/schema"
import {
  cancelMembershipOrder,
  markMembershipOrderPaid,
  refundMembershipOrder,
} from "@/server/membership/orders"
import {
  appSettingDefinitions,
  saveAppSettings,
} from "@/server/settings/app-settings"
import {
  AdminFormError,
  booleanField,
  definitionKeyString,
  optionalInteger,
  optionalString,
  optionalUuidString,
  requiredString,
  selectValue,
  slugString,
  uuidList,
  uuidString,
} from "./validation"

const entityStatuses = ["draft", "active", "disabled"] as const
const membershipStatuses = ["active", "expired", "canceled"] as const
const userStatuses = ["active", "disabled"] as const

function redirectWithError(pathname: string, error: unknown): never {
  const message =
    error instanceof AdminFormError
      ? error.message
      : "保存失败，请检查输入后重试"

  redirect(`${pathname}?error=${encodeURIComponent(message)}`)
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  )
}

function formString(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim()
}

function safeAdminBackTo(value: string, fallback = "/admin") {
  if (
    value.startsWith("//") ||
    (value !== "/admin" && !value.startsWith("/admin/"))
  ) {
    return fallback
  }

  return value
}

function redirectWithMessage(
  pathname: string,
  key: "error" | "notice",
  message: string,
): never {
  const [path, search = ""] = pathname.split("?")
  const params = new URLSearchParams(search)
  params.set(key, message)

  redirect(`${path}?${params.toString()}`)
}

function formatLocalDate(value: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Shanghai",
    year: "numeric",
  }).format(value)
}

function parseOptionalDateTime(formData: FormData, name: string) {
  const value = formString(formData, name)

  if (!value) {
    return null
  }

  const date = new Date(`${value}T23:59:59+08:00`)

  if (Number.isNaN(date.getTime())) {
    throw new AdminFormError("到期时间格式不正确")
  }

  return date
}

function planKeyString(formData: FormData) {
  const value = requiredString(formData, "planKey", "套餐 key", 80)
    .toLowerCase()
    .trim()

  if (!/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(value)) {
    throw new AdminFormError(
      "套餐 key 只能使用小写字母、数字、点、下划线和短横线",
    )
  }

  return value
}

function scheduleTimeString(formData: FormData) {
  const value = formString(formData, "scheduleTime") || "09:00"

  if (!/^\d{2}:\d{2}$/.test(value)) {
    throw new AdminFormError("执行时间格式不正确")
  }

  const [hour, minute] = value.split(":").map(Number)

  if (hour > 23 || minute > 59) {
    throw new AdminFormError("执行时间超出范围")
  }

  return value
}

function parseSiteForm(formData: FormData) {
  return {
    siteName: requiredString(formData, "siteName", "站点名称", 120),
    slug: slugString(formData, "slug", "站点 slug"),
    homepageUrl: optionalString(formData, "homepageUrl", "官网地址"),
    logoUrl: optionalString(formData, "logoUrl", "Logo 地址"),
    description: optionalString(formData, "description", "站点描述"),
    status: selectValue(formData, "status", "状态", entityStatuses),
    sort: optionalInteger(formData, "sort", "排序", 0),
    isVisible: booleanField(formData, "isVisible"),
  }
}

function parseCategoryForm(formData: FormData, currentId?: string) {
  const parentId = optionalUuidString(formData, "parentId", "父级分类")

  if (currentId && parentId === currentId) {
    throw new AdminFormError("父级分类不能选择自己")
  }

  return {
    categoryName: requiredString(formData, "categoryName", "分类名称", 120),
    slug: slugString(formData, "slug", "分类 slug"),
    parentId,
    icon: optionalString(formData, "icon", "图标", 80),
    color: optionalString(formData, "color", "颜色", 32),
    sort: optionalInteger(formData, "sort", "排序", 0),
    isNavVisible: booleanField(formData, "isNavVisible"),
    isHomeVisible: booleanField(formData, "isHomeVisible"),
    status: selectValue(formData, "status", "状态", entityStatuses),
  }
}

function parseChannelForm(formData: FormData) {
  const definitionKey = definitionKeyString(formData)
  const definition = getChannelDefinition(definitionKey)

  if (!definition) {
    throw new AdminFormError("请选择已注册的频道定义")
  }

  return {
    siteId: uuidString(formData, "siteId", "所属站点"),
    channelName: requiredString(formData, "channelName", "频道名称", 160),
    slug: slugString(formData, "slug", "频道 slug"),
    definitionKey,
    collectorType: definition.collectorType,
    channelType: selectValue(formData, "channelType", "频道类型", channelTypes),
    homepageUrl: optionalString(formData, "homepageUrl", "频道地址"),
    crawlIntervalSeconds: optionalInteger(
      formData,
      "crawlIntervalSeconds",
      "采集间隔",
      300,
      30,
    ),
    snapshotIntervalSeconds: optionalInteger(
      formData,
      "snapshotIntervalSeconds",
      "快照间隔",
      7200,
      300,
    ),
    isCrawlEnabled: booleanField(formData, "isCrawlEnabled"),
    isPublic: booleanField(formData, "isPublic"),
    isHomeVisible: booleanField(formData, "isHomeVisible"),
    isSubscribable: booleanField(formData, "isSubscribable"),
    displayStyle: selectValue(
      formData,
      "displayStyle",
      "展示样式",
      channelDisplayStyles,
    ),
    homeDisplay: {
      subtitle: optionalString(formData, "displaySubtitle", "首页副标题", 40),
      itemLimit: optionalInteger(
        formData,
        "displayItemLimit",
        "首页条数",
        defaultChannelHomeItemLimit,
        1,
        maxChannelHomeItemLimit,
      ),
      colorPreset: selectValue(
        formData,
        "displayColorPreset",
        "颜色预设",
        channelColorPresets,
      ),
      metaDisplay: selectValue(
        formData,
        "displayMeta",
        "元信息",
        channelMetaDisplayModes,
      ),
      metaPosition: selectValue(
        formData,
        "displayMetaPosition",
        "条目副信息位置",
        channelMetaPositions,
      ),
      showUpdatedAt: booleanField(formData, "displayUpdatedAt"),
    },
    weight: optionalInteger(formData, "weight", "权重", 0),
    sort: optionalInteger(formData, "sort", "排序", 0),
    status: selectValue(formData, "status", "状态", entityStatuses),
    categoryIds: uuidList(formData, "categoryIds", "所属分类"),
  }
}

function parseTopicForm(formData: FormData) {
  const topicName = requiredString(formData, "topicName", "话题名称", 160)

  return {
    topicName,
    slug: slugString(formData, "slug", "话题 slug"),
    description: optionalString(formData, "description", "话题描述"),
    keywords: optionalString(formData, "keywords", "关键词", 500) ?? topicName,
    status: selectValue(formData, "status", "状态", entityStatuses),
    isHomeVisible: booleanField(formData, "isHomeVisible"),
    sort: optionalInteger(formData, "sort", "排序", 0),
  }
}

function parseRankingConfigForm(formData: FormData) {
  return {
    configName: requiredString(formData, "configName", "榜单名称", 160),
    slug: slugString(formData, "slug", "榜单 slug"),
    description: optionalString(formData, "description", "榜单描述", 500),
    status: selectValue(formData, "status", "状态", entityStatuses),
    isDefault: booleanField(formData, "isDefault"),
    timeWindowHours: optionalInteger(
      formData,
      "timeWindowHours",
      "时间窗口",
      24,
      1,
    ),
    itemLimit: optionalInteger(formData, "itemLimit", "展示数量", 50, 1),
    perChannelLimit: optionalInteger(
      formData,
      "perChannelLimit",
      "单频道数量",
      10,
      1,
    ),
    sort: optionalInteger(formData, "sort", "排序", 0),
    channelIds: uuidList(formData, "channelIds", "参与频道"),
  }
}

async function replaceChannelCategories(
  channelId: string,
  categoryIds: string[],
) {
  const db = getDb()

  await db
    .delete(relChannelCategory)
    .where(eq(relChannelCategory.channelId, channelId))

  if (categoryIds.length === 0) {
    return
  }

  await db.insert(relChannelCategory).values(
    categoryIds.map((categoryId, index) => ({
      channelId,
      categoryId,
      sort: index + 1,
    })),
  )
}

async function replaceRankingChannels(rankingId: string, channelIds: string[]) {
  const db = getDb()

  await db
    .delete(relRankingChannel)
    .where(eq(relRankingChannel.rankingId, rankingId))

  if (channelIds.length === 0) {
    return
  }

  const channels = await db
    .select({
      id: bizChannel.id,
      weight: bizChannel.weight,
      sort: bizChannel.sort,
    })
    .from(bizChannel)
    .where(inArray(bizChannel.id, channelIds))

  const channelMap = new Map(channels.map((channel) => [channel.id, channel]))

  await db.insert(relRankingChannel).values(
    channelIds.map((channelId, index) => {
      const channel = channelMap.get(channelId)

      return {
        rankingId,
        channelId,
        weight: channel?.weight ?? 0,
        sort: channel?.sort ?? index + 1,
      }
    }),
  )
}

export async function createSiteAction(formData: FormData) {
  await requireAdmin()

  let values: ReturnType<typeof parseSiteForm>

  try {
    values = parseSiteForm(formData)
  } catch (error) {
    redirectWithError("/admin/sites/new", error)
  }

  try {
    await getDb().insert(bizSite).values(values)
  } catch (error) {
    if (isUniqueViolation(error)) {
      redirectWithError(
        "/admin/sites/new",
        new AdminFormError("站点 slug 已存在"),
      )
    }

    throw error
  }

  revalidatePath("/admin/sites")
  redirect("/admin/sites")
}

export async function updateSiteAction(formData: FormData) {
  await requireAdmin()

  const id = uuidString(formData, "id", "站点 ID")
  let values: ReturnType<typeof parseSiteForm>

  try {
    values = parseSiteForm(formData)
  } catch (error) {
    redirectWithError(`/admin/sites/${id}/edit`, error)
  }

  try {
    await getDb()
      .update(bizSite)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(bizSite.id, id))
  } catch (error) {
    if (isUniqueViolation(error)) {
      redirectWithError(
        `/admin/sites/${id}/edit`,
        new AdminFormError("站点 slug 已存在"),
      )
    }

    throw error
  }

  revalidatePath("/admin/sites")
  redirect("/admin/sites")
}

export async function deleteSiteAction(formData: FormData) {
  await requireAdmin()

  const id = uuidString(formData, "id", "站点 ID")

  await getDb()
    .update(bizSite)
    .set({
      deletedAt: new Date(),
      isVisible: false,
      status: "disabled",
      updatedAt: new Date(),
    })
    .where(eq(bizSite.id, id))

  revalidatePath("/admin/sites")
}

export async function createCategoryAction(formData: FormData) {
  await requireAdmin()

  let values: ReturnType<typeof parseCategoryForm>

  try {
    values = parseCategoryForm(formData)
  } catch (error) {
    redirectWithError("/admin/categories/new", error)
  }

  try {
    await getDb().insert(bizCategory).values(values)
  } catch (error) {
    if (isUniqueViolation(error)) {
      redirectWithError(
        "/admin/categories/new",
        new AdminFormError("分类 slug 已存在"),
      )
    }

    throw error
  }

  revalidatePath("/admin/categories")
  redirect("/admin/categories")
}

export async function updateCategoryAction(formData: FormData) {
  await requireAdmin()

  const id = uuidString(formData, "id", "分类 ID")
  let values: ReturnType<typeof parseCategoryForm>

  try {
    values = parseCategoryForm(formData, id)
  } catch (error) {
    redirectWithError(`/admin/categories/${id}/edit`, error)
  }

  try {
    await getDb()
      .update(bizCategory)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(bizCategory.id, id))
  } catch (error) {
    if (isUniqueViolation(error)) {
      redirectWithError(
        `/admin/categories/${id}/edit`,
        new AdminFormError("分类 slug 已存在"),
      )
    }

    throw error
  }

  revalidatePath("/admin/categories")
  redirect("/admin/categories")
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin()

  const id = uuidString(formData, "id", "分类 ID")

  await getDb()
    .update(bizCategory)
    .set({
      deletedAt: new Date(),
      isNavVisible: false,
      isHomeVisible: false,
      status: "disabled",
      updatedAt: new Date(),
    })
    .where(eq(bizCategory.id, id))

  revalidatePath("/admin/categories")
}

export async function createChannelAction(formData: FormData) {
  await requireAdmin()

  let values: ReturnType<typeof parseChannelForm>

  try {
    values = parseChannelForm(formData)
  } catch (error) {
    redirectWithError("/admin/channels/new", error)
  }

  const { categoryIds, homeDisplay, ...channelValues } = values

  try {
    const [channel] = await getDb()
      .insert(bizChannel)
      .values({
        ...channelValues,
        extra: mergeChannelDisplayConfig(null, homeDisplay),
      })
      .returning({ id: bizChannel.id })

    await replaceChannelCategories(channel.id, categoryIds)
  } catch (error) {
    if (isUniqueViolation(error)) {
      redirectWithError(
        "/admin/channels/new",
        new AdminFormError("频道 slug 或 definition_key 已存在"),
      )
    }

    throw error
  }

  revalidatePath("/admin/channels")
  revalidatePath("/")
  redirect("/admin/channels")
}

export async function updateChannelAction(formData: FormData) {
  await requireAdmin()

  const id = uuidString(formData, "id", "频道 ID")
  let values: ReturnType<typeof parseChannelForm>

  try {
    values = parseChannelForm(formData)
  } catch (error) {
    redirectWithError(`/admin/channels/${id}/edit`, error)
  }

  const { categoryIds, homeDisplay, ...channelValues } = values

  try {
    const [currentChannel] = await getDb()
      .select({ extra: bizChannel.extra })
      .from(bizChannel)
      .where(eq(bizChannel.id, id))
      .limit(1)

    await getDb()
      .update(bizChannel)
      .set({
        ...channelValues,
        extra: mergeChannelDisplayConfig(currentChannel?.extra, homeDisplay),
        updatedAt: new Date(),
      })
      .where(eq(bizChannel.id, id))

    await replaceChannelCategories(id, categoryIds)
  } catch (error) {
    if (isUniqueViolation(error)) {
      redirectWithError(
        `/admin/channels/${id}/edit`,
        new AdminFormError("频道 slug 或 definition_key 已存在"),
      )
    }

    throw error
  }

  revalidatePath("/admin/channels")
  revalidatePath("/")
  redirect("/admin/channels")
}

export async function deleteChannelAction(formData: FormData) {
  await requireAdmin()

  const id = uuidString(formData, "id", "频道 ID")

  await getDb()
    .update(bizChannel)
    .set({
      deletedAt: new Date(),
      isCrawlEnabled: false,
      status: "disabled",
      updatedAt: new Date(),
    })
    .where(eq(bizChannel.id, id))

  revalidatePath("/admin/channels")
  revalidatePath("/")
}

export async function runChannelCrawlAction(formData: FormData) {
  await requireAdmin()

  const id = uuidString(formData, "id", "频道 ID")
  const backTo = safeAdminBackTo(
    formString(formData, "backTo"),
    "/admin/channels",
  )
  let result: Awaited<ReturnType<typeof runChannelCrawl>>

  try {
    result = await runChannelCrawl(id, { runType: "manual" })
  } catch (error) {
    const message = error instanceof Error ? error.message : "采集失败"
    redirectWithMessage(backTo, "error", message)
  }

  const message =
    result.status === "skipped"
      ? (result.skippedReason ?? "该频道已有采集任务正在运行")
      : result.createdSnapshot
        ? `采集完成，写入 ${result.insertedCount} 条快照明细`
        : "采集完成，内容未变化，复用已有快照"

  revalidatePath("/admin")
  revalidatePath("/admin/channels")
  revalidatePath("/admin/crawls/tasks")
  revalidatePath("/admin/crawls/logs")
  redirectWithMessage(backTo, "notice", message)
}

export async function retryCrawlRunAction(formData: FormData) {
  await requireAdmin()

  const id = uuidString(formData, "id", "采集记录 ID")
  const backTo = safeAdminBackTo(
    formString(formData, "backTo"),
    "/admin/crawls/failures",
  )
  const db = getDb()
  const [run] = await db
    .select({ channelId: logCrawlRun.channelId })
    .from(logCrawlRun)
    .where(eq(logCrawlRun.id, id))
    .limit(1)

  if (!run) {
    redirectWithMessage(backTo, "error", "采集记录不存在")
  }

  let result: Awaited<ReturnType<typeof runChannelCrawl>>

  try {
    result = await runChannelCrawl(run.channelId, { runType: "retry" })
  } catch (error) {
    const message = error instanceof Error ? error.message : "重试失败"
    redirectWithMessage(backTo, "error", message)
  }

  const message =
    result.status === "skipped"
      ? (result.skippedReason ?? "该频道已有采集任务正在运行")
      : result.createdSnapshot
        ? `重试完成，写入 ${result.insertedCount} 条快照明细`
        : "重试完成，内容未变化，复用已有快照"

  revalidatePath("/admin")
  revalidatePath("/admin/crawls/failures")
  revalidatePath("/admin/crawls/logs")
  revalidatePath("/admin/contents/latest")
  redirectWithMessage(backTo, "notice", message)
}

export async function blockSnapshotItemAction(formData: FormData) {
  const admin = await requireAdmin()
  const id = uuidString(formData, "id", "内容 ID")
  const reason = optionalString(formData, "reason", "屏蔽原因", 300)
  const backTo = safeAdminBackTo(
    formString(formData, "backTo"),
    "/admin/contents/latest",
  )
  const db = getDb()
  const [item] = await db
    .select({
      id: bizSnapshotItem.id,
      contentItemId: bizSnapshotItem.contentItemId,
      title: bizSnapshotItem.title,
      url: bizSnapshotItem.url,
      urlHash: bizSnapshotItem.urlHash,
    })
    .from(bizSnapshotItem)
    .where(eq(bizSnapshotItem.id, id))
    .limit(1)

  if (!item) {
    redirectWithMessage(backTo, "error", "内容不存在")
  }

  await upsertContentBlock({
    contentItemId: item.contentItemId,
    createdBy: admin.id,
    reason,
    snapshotItemId: item.id,
    title: item.title,
    url: item.url,
    urlHash: item.urlHash,
  })

  revalidateContentViews()
  redirectWithMessage(backTo, "notice", "已屏蔽该内容，前台将不再展示")
}

export async function createManualContentBlockAction(formData: FormData) {
  const admin = await requireAdmin()
  const backTo = safeAdminBackTo(
    formString(formData, "backTo"),
    "/admin/contents/blocked",
  )
  const title = requiredString(formData, "title", "标题", 240)
  const url = normalizeContentUrl(requiredString(formData, "url", "链接"))
  const reason = optionalString(formData, "reason", "屏蔽原因", 300)

  if (!url) {
    redirectWithMessage(backTo, "error", "请填写有效链接")
  }

  await upsertContentBlock({
    contentItemId: null,
    createdBy: admin.id,
    reason,
    snapshotItemId: null,
    title,
    url,
    urlHash: hashContentUrl(url),
  })

  revalidateContentViews()
  redirectWithMessage(backTo, "notice", "已添加屏蔽链接")
}

export async function unblockContentAction(formData: FormData) {
  await requireAdmin()

  const id = uuidString(formData, "id", "屏蔽记录 ID")
  const backTo = safeAdminBackTo(
    formString(formData, "backTo"),
    "/admin/contents/blocked",
  )

  await getDb()
    .update(bizContentBlock)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(bizContentBlock.id, id))

  revalidateContentViews()
  redirectWithMessage(backTo, "notice", "已取消屏蔽")
}

export async function publishTodayDailyReportAction(formData: FormData) {
  await requireAdmin()

  const backTo = safeAdminBackTo(
    formString(formData, "backTo"),
    "/admin/operations/daily",
  )
  const now = new Date()
  const reportDate = formatLocalDate(now)

  await getDb()
    .insert(bizDailyReport)
    .values({
      reportDate,
      title: `NextNews 日报 ${reportDate}`,
      summary: "由当前首页频道与最近入库快照生成。",
      status: "active",
      publishedAt: now,
    })
    .onConflictDoUpdate({
      target: bizDailyReport.reportDate,
      set: {
        status: "active",
        publishedAt: now,
        updatedAt: now,
      },
    })

  revalidatePath("/daily")
  revalidatePath("/admin/operations/daily")
  redirectWithMessage(backTo, "notice", "今日日报已发布")
}

export async function updateDailyReportStatusAction(formData: FormData) {
  await requireAdmin()

  const id = uuidString(formData, "id", "日报 ID")
  const status = selectValue(formData, "status", "状态", entityStatuses)
  const backTo = safeAdminBackTo(
    formString(formData, "backTo"),
    "/admin/operations/daily",
  )

  await getDb()
    .update(bizDailyReport)
    .set({
      status,
      publishedAt: status === "active" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(bizDailyReport.id, id))

  revalidatePath("/daily")
  revalidatePath("/admin/operations/daily")
  redirectWithMessage(backTo, "notice", "日报状态已更新")
}

export async function addDailyReportItemAction(formData: FormData) {
  const admin = await requireAdmin()

  const reportId = uuidString(formData, "reportId", "日报 ID")
  const snapshotItemId = uuidString(formData, "snapshotItemId", "内容 ID")
  const sort = optionalInteger(formData, "sort", "排序", 0)
  const note = optionalString(formData, "note", "推荐语", 240)
  const backTo = safeAdminBackTo(
    formString(formData, "backTo"),
    `/admin/operations/daily/${reportId}`,
  )

  await getDb()
    .insert(bizDailyReportItem)
    .values({
      reportId,
      snapshotItemId,
      sort,
      note,
      createdBy: admin.id,
    })
    .onConflictDoUpdate({
      target: [bizDailyReportItem.reportId, bizDailyReportItem.snapshotItemId],
      set: {
        note,
        sort,
      },
    })

  await revalidateDailyReportViews(reportId, backTo)
  redirectWithMessage(backTo, "notice", "已加入日报精选")
}

export async function removeDailyReportItemAction(formData: FormData) {
  await requireAdmin()

  const id = uuidString(formData, "id", "精选内容 ID")
  const reportId = uuidString(formData, "reportId", "日报 ID")
  const backTo = safeAdminBackTo(
    formString(formData, "backTo"),
    `/admin/operations/daily/${reportId}`,
  )

  await getDb().delete(bizDailyReportItem).where(eq(bizDailyReportItem.id, id))

  await revalidateDailyReportViews(reportId, backTo)
  redirectWithMessage(backTo, "notice", "已移除日报精选")
}

export async function saveUserMembershipAction(formData: FormData) {
  await requireAdmin()

  const userId = uuidString(formData, "userId", "用户 ID")
  const backTo = safeAdminBackTo(formString(formData, "backTo"), "/admin/users")

  let values: {
    expiresAt: Date | null
    historyDays: number
    note: string | null
    planKey: string
    planName: string
    status: (typeof membershipStatuses)[number]
  }

  try {
    values = {
      expiresAt: parseOptionalDateTime(formData, "expiresAt"),
      historyDays: optionalInteger(formData, "historyDays", "历史天数", 30, 1),
      note: optionalString(formData, "note", "备注", 300),
      planKey: planKeyString(formData),
      planName: requiredString(formData, "planName", "套餐名称", 120),
      status: selectValue(formData, "status", "会员状态", membershipStatuses),
    }
  } catch (error) {
    const message =
      error instanceof AdminFormError ? error.message : "会员权益保存失败"
    redirectWithMessage(backTo, "error", message)
  }

  await getDb()
    .insert(userMembership)
    .values({
      userId,
      ...values,
    })
    .onConflictDoUpdate({
      target: userMembership.userId,
      set: {
        ...values,
        updatedAt: new Date(),
      },
    })

  revalidatePath("/admin/users")
  redirectWithMessage(backTo, "notice", "会员权益已保存")
}

export async function updateUserStatusAction(formData: FormData) {
  const admin = await requireAdmin()
  const userId = uuidString(formData, "userId", "用户 ID")
  const status = selectValue(formData, "status", "用户状态", userStatuses)
  const backTo = safeAdminBackTo(formString(formData, "backTo"), "/admin/users")

  if (admin.id === userId && status === "disabled") {
    redirectWithMessage(backTo, "error", "不能停用当前登录的管理员")
  }

  await getDb()
    .update(sysUser)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(sysUser.id, userId))

  await recordAdminOperation({
    action: "user.status.update",
    adminId: admin.id,
    summary: `更新用户状态为 ${status}`,
    targetId: userId,
    targetType: "sys_user",
  })

  revalidatePath("/admin/users")
  redirectWithMessage(backTo, "notice", "用户状态已更新")
}

export async function syncBuiltinNewsSourcesAction(formData: FormData) {
  const admin = await requireAdmin()
  const backTo = safeAdminBackTo(
    formString(formData, "backTo"),
    "/admin/settings",
  )
  const result = await syncBuiltinNewsSources()

  await recordAdminOperation({
    action: "builtin_sources.sync",
    adminId: admin.id,
    summary: `同步内置数据源：新增 ${result.createdSiteCount} 个站点、${result.createdChannelCount} 个频道，更新 ${result.updatedChannelCount} 个频道，共 ${result.siteCount} 个站点、${result.channelCount} 个频道定义`,
    targetType: "biz_channel",
  })

  revalidatePath("/admin/settings")
  revalidatePath("/admin/sites")
  revalidatePath("/admin/categories")
  revalidatePath("/admin/channels")
  revalidatePath("/admin/crawls/tasks")
  redirectWithMessage(
    backTo,
    "notice",
    `内置数据源同步完成：新增 ${result.createdSiteCount} 个站点、${result.createdChannelCount} 个频道，更新 ${result.updatedChannelCount} 个频道；当前内置定义共 ${result.siteCount} 个站点、${result.channelCount} 个频道`,
  )
}

export async function saveSystemSettingsAction(formData: FormData) {
  const admin = await requireAdmin()
  const backTo = safeAdminBackTo(
    formString(formData, "backTo"),
    "/admin/settings",
  )
  const values = Object.fromEntries(
    appSettingDefinitions.map((definition) => [
      definition.key,
      formString(formData, definition.key),
    ]),
  )

  await saveAppSettings(values)
  await recordAdminOperation({
    action: "settings.update",
    adminId: admin.id,
    summary: "更新系统业务开关",
    targetType: "sys_setting",
  })

  redirectWithMessage(backTo, "notice", "系统设置已保存")
}

export async function retrySystemJobAction(formData: FormData) {
  const admin = await requireAdmin()
  const id = uuidString(formData, "id", "任务 ID")
  const backTo = safeAdminBackTo(
    formString(formData, "backTo"),
    "/admin/settings/operations",
  )

  await getDb()
    .update(sysJobQueue)
    .set({
      status: "pending",
      attempts: 0,
      availableAt: new Date(),
      lockedAt: null,
      finishedAt: null,
      errorMessage: null,
      updatedAt: new Date(),
    })
    .where(eq(sysJobQueue.id, id))

  await recordAdminOperation({
    action: "system_job.retry",
    adminId: admin.id,
    summary: `重试系统任务 ${id}`,
    targetId: id,
    targetType: "sys_job_queue",
  })

  revalidatePath("/admin/settings/operations")
  redirectWithMessage(backTo, "notice", "任务已重新放回队列")
}

export async function cancelSystemJobAction(formData: FormData) {
  const admin = await requireAdmin()
  const id = uuidString(formData, "id", "任务 ID")
  const backTo = safeAdminBackTo(
    formString(formData, "backTo"),
    "/admin/settings/operations",
  )

  await getDb()
    .update(sysJobQueue)
    .set({
      status: "canceled",
      lockedAt: null,
      finishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(sysJobQueue.id, id))

  await recordAdminOperation({
    action: "system_job.cancel",
    adminId: admin.id,
    summary: `取消系统任务 ${id}`,
    targetId: id,
    targetType: "sys_job_queue",
  })

  revalidatePath("/admin/settings/operations")
  redirectWithMessage(backTo, "notice", "任务已取消")
}

export async function changeAdminPasswordAction(formData: FormData) {
  const admin = await requireAdmin()
  const backTo = safeAdminBackTo(
    formString(formData, "backTo"),
    "/admin/settings/security",
  )
  const currentPassword = formString(formData, "currentPassword")
  const newPassword = formString(formData, "newPassword")
  const confirmPassword = formString(formData, "confirmPassword")

  if (!currentPassword || !newPassword || !confirmPassword) {
    redirectWithMessage(backTo, "error", "请完整填写密码表单")
  }

  if (newPassword.length < 10) {
    redirectWithMessage(backTo, "error", "新密码至少需要 10 个字符")
  }

  if (newPassword !== confirmPassword) {
    redirectWithMessage(backTo, "error", "两次输入的新密码不一致")
  }

  const [user] = await getDb()
    .select({
      passwordHash: sysUser.passwordHash,
    })
    .from(sysUser)
    .where(eq(sysUser.id, admin.id))
    .limit(1)

  if (!user || !verifyPassword(currentPassword, user.passwordHash)) {
    redirectWithMessage(backTo, "error", "当前密码不正确")
  }

  await getDb()
    .update(sysUser)
    .set({
      passwordHash: hashPassword(newPassword),
      updatedAt: new Date(),
    })
    .where(eq(sysUser.id, admin.id))

  await recordAdminOperation({
    action: "admin.password.update",
    adminId: admin.id,
    summary: "管理员修改登录密码",
    targetId: admin.id,
    targetType: "sys_user",
  })

  revalidatePath("/admin/settings/security")
  redirectWithMessage(backTo, "notice", "管理员密码已更新")
}

export async function saveMembershipPlanAction(formData: FormData) {
  const admin = await requireAdmin()
  const backTo = safeAdminBackTo(
    formString(formData, "backTo"),
    "/admin/users/memberships",
  )
  const id = optionalUuidString(formData, "id", "套餐 ID")

  let values: typeof membershipPlan.$inferInsert

  try {
    values = {
      planKey: planKeyString(formData),
      planName: requiredString(formData, "planName", "套餐名称", 120),
      description: optionalString(formData, "description", "套餐说明", 500),
      priceCents: optionalInteger(formData, "priceCents", "价格分", 0, 0),
      currency: optionalString(formData, "currency", "币种", 12) ?? "CNY",
      historyDays: optionalInteger(formData, "historyDays", "历史天数", 30, 1),
      durationDays: optionalInteger(
        formData,
        "durationDays",
        "有效天数",
        30,
        1,
      ),
      isEnabled: formString(formData, "isEnabled") === "true",
      isFeatured: formString(formData, "isFeatured") === "true",
      sort: optionalInteger(formData, "sort", "排序", 0),
    }
  } catch (error) {
    const message =
      error instanceof AdminFormError ? error.message : "会员套餐保存失败"
    redirectWithMessage(backTo, "error", message)
  }

  try {
    if (id) {
      await getDb()
        .update(membershipPlan)
        .set({
          ...values,
          deletedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(membershipPlan.id, id))
    } else {
      await getDb().insert(membershipPlan).values(values)
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      redirectWithMessage(backTo, "error", "套餐 key 已存在")
    }

    throw error
  }

  await recordAdminOperation({
    action: id ? "membership_plan.update" : "membership_plan.create",
    adminId: admin.id,
    summary: `保存会员套餐 ${values.planKey}`,
    targetId: id,
    targetType: "membership_plan",
  })

  revalidatePath("/membership")
  revalidatePath("/admin/users/memberships")
  redirectWithMessage(backTo, "notice", "会员套餐已保存")
}

export async function markMembershipOrderPaidAction(formData: FormData) {
  const admin = await requireAdmin()
  const id = uuidString(formData, "id", "会员订单 ID")
  const backTo = safeAdminBackTo(
    formString(formData, "backTo"),
    "/admin/users/memberships",
  )

  try {
    await markMembershipOrderPaid(id)
  } catch (error) {
    const message = error instanceof Error ? error.message : "订单确认失败"
    redirectWithMessage(backTo, "error", message)
  }

  await recordAdminOperation({
    action: "membership_order.mark_paid",
    adminId: admin.id,
    summary: `确认会员订单已支付 ${id}`,
    targetId: id,
    targetType: "membership_order",
  })

  revalidatePath("/account")
  revalidatePath("/membership")
  revalidatePath("/admin/users")
  revalidatePath("/admin/users/memberships")
  redirectWithMessage(backTo, "notice", "订单已确认支付，会员权益已生效")
}

export async function cancelMembershipOrderAction(formData: FormData) {
  const admin = await requireAdmin()
  const id = uuidString(formData, "id", "会员订单 ID")
  const backTo = safeAdminBackTo(
    formString(formData, "backTo"),
    "/admin/users/memberships",
  )

  try {
    await cancelMembershipOrder(id)
  } catch (error) {
    const message = error instanceof Error ? error.message : "订单取消失败"
    redirectWithMessage(backTo, "error", message)
  }

  await recordAdminOperation({
    action: "membership_order.cancel",
    adminId: admin.id,
    summary: `取消会员订单 ${id}`,
    targetId: id,
    targetType: "membership_order",
  })

  revalidatePath("/account")
  revalidatePath("/membership")
  revalidatePath("/admin/users/memberships")
  redirectWithMessage(backTo, "notice", "订单已取消")
}

export async function refundMembershipOrderAction(formData: FormData) {
  const admin = await requireAdmin()
  const id = uuidString(formData, "id", "会员订单 ID")
  const backTo = safeAdminBackTo(
    formString(formData, "backTo"),
    "/admin/users/memberships",
  )

  try {
    await refundMembershipOrder(id)
  } catch (error) {
    const message = error instanceof Error ? error.message : "订单退款失败"
    redirectWithMessage(backTo, "error", message)
  }

  await recordAdminOperation({
    action: "membership_order.refund",
    adminId: admin.id,
    summary: `退款会员订单 ${id}`,
    targetId: id,
    targetType: "membership_order",
  })

  revalidatePath("/account")
  revalidatePath("/membership")
  revalidatePath("/admin/users")
  revalidatePath("/admin/users/memberships")
  redirectWithMessage(backTo, "notice", "订单已标记退款")
}

export async function saveDailyReportTemplateAction(formData: FormData) {
  const admin = await requireAdmin()
  const backTo = safeAdminBackTo(
    formString(formData, "backTo"),
    "/admin/operations/daily",
  )
  const id = optionalUuidString(formData, "id", "日报模板 ID")

  let values: typeof bizDailyReportTemplate.$inferInsert

  try {
    values = {
      templateName: requiredString(formData, "templateName", "模板名称", 160),
      status: selectValue(formData, "status", "状态", entityStatuses),
      titlePattern: requiredString(formData, "titlePattern", "标题模板", 200),
      summaryPattern: optionalString(
        formData,
        "summaryPattern",
        "摘要模板",
        500,
      ),
      channelLimit: optionalInteger(formData, "channelLimit", "频道数", 8, 1),
      itemLimitPerChannel: optionalInteger(
        formData,
        "itemLimitPerChannel",
        "单频道条目数",
        5,
        1,
      ),
      autoPublish: formString(formData, "autoPublish") === "true",
      requireReview: formString(formData, "requireReview") === "true",
      scheduleTime: scheduleTimeString(formData),
      sort: optionalInteger(formData, "sort", "排序", 0),
    }
  } catch (error) {
    const message =
      error instanceof AdminFormError ? error.message : "日报模板保存失败"
    redirectWithMessage(backTo, "error", message)
  }

  if (id) {
    await getDb()
      .update(bizDailyReportTemplate)
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where(eq(bizDailyReportTemplate.id, id))
  } else {
    await getDb().insert(bizDailyReportTemplate).values(values)
  }

  await recordAdminOperation({
    action: id ? "daily_template.update" : "daily_template.create",
    adminId: admin.id,
    summary: `保存日报模板 ${values.templateName}`,
    targetId: id,
    targetType: "biz_daily_report_template",
  })

  revalidatePath("/daily")
  revalidatePath("/admin/operations/daily")
  redirectWithMessage(backTo, "notice", "日报模板已保存")
}

export async function saveHomeModuleAction(formData: FormData) {
  await requireAdmin()

  const backTo = safeAdminBackTo(
    formString(formData, "backTo"),
    "/admin/operations/home",
  )
  const moduleKey = requiredString(formData, "moduleKey", "模块 key", 120)
  const title = requiredString(formData, "title", "模块标题", 160)
  const subtitle = optionalString(formData, "subtitle", "模块副标题", 160)
  const status = selectValue(formData, "status", "状态", entityStatuses)
  const sort = optionalInteger(formData, "sort", "排序", 0)
  const displayLimit = optionalInteger(
    formData,
    "displayLimit",
    "展示数量",
    8,
    1,
  )
  const now = new Date()

  await getDb()
    .insert(bizHomeModule)
    .values({
      moduleKey,
      title,
      subtitle,
      status,
      sort,
      displayLimit,
    })
    .onConflictDoUpdate({
      target: bizHomeModule.moduleKey,
      set: {
        title,
        subtitle,
        status,
        sort,
        displayLimit,
        deletedAt: null,
        updatedAt: now,
      },
    })

  revalidatePath("/")
  revalidatePath("/admin/operations/home")
  redirectWithMessage(backTo, "notice", "首页模块已保存")
}

export async function createRankingConfigAction(formData: FormData) {
  await requireAdmin()

  const backTo = safeAdminBackTo(
    formString(formData, "backTo"),
    "/admin/operations/rankings",
  )
  let values: ReturnType<typeof parseRankingConfigForm>

  try {
    values = parseRankingConfigForm(formData)
  } catch (error) {
    const message =
      error instanceof AdminFormError ? error.message : "榜中榜保存失败"
    redirectWithMessage(backTo, "error", message)
  }

  const { channelIds, ...configValues } = values
  const db = getDb()

  try {
    const [config] = await db
      .insert(bizRankingConfig)
      .values(configValues)
      .returning({ id: bizRankingConfig.id })

    if (configValues.isDefault) {
      await db
        .update(bizRankingConfig)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(
          and(
            eq(bizRankingConfig.isDefault, true),
            isNull(bizRankingConfig.deletedAt),
          ),
        )
      await db
        .update(bizRankingConfig)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(eq(bizRankingConfig.id, config.id))
    }

    await replaceRankingChannels(config.id, channelIds)
  } catch (error) {
    if (isUniqueViolation(error)) {
      redirectWithMessage(backTo, "error", "榜单 slug 已存在")
    }

    throw error
  }

  revalidatePath("/rankings")
  revalidatePath("/admin/operations/rankings")
  redirectWithMessage(backTo, "notice", "榜中榜配置已创建")
}

export async function updateRankingConfigStatusAction(formData: FormData) {
  await requireAdmin()

  const id = uuidString(formData, "id", "榜单 ID")
  const status = selectValue(formData, "status", "状态", entityStatuses)
  const isDefault = formString(formData, "isDefault") === "true"
  const backTo = safeAdminBackTo(
    formString(formData, "backTo"),
    "/admin/operations/rankings",
  )
  const db = getDb()

  if (isDefault) {
    await db
      .update(bizRankingConfig)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(
        and(
          eq(bizRankingConfig.isDefault, true),
          isNull(bizRankingConfig.deletedAt),
        ),
      )
  }

  await db
    .update(bizRankingConfig)
    .set({
      status,
      isDefault,
      updatedAt: new Date(),
    })
    .where(eq(bizRankingConfig.id, id))

  revalidatePath("/rankings")
  revalidatePath("/admin/operations/rankings")
  redirectWithMessage(backTo, "notice", "榜中榜状态已更新")
}

export async function createTopicAction(formData: FormData) {
  await requireAdmin()

  const backTo = safeAdminBackTo(
    formString(formData, "backTo"),
    "/admin/operations/topics",
  )
  let values: ReturnType<typeof parseTopicForm>

  try {
    values = parseTopicForm(formData)
  } catch (error) {
    const message =
      error instanceof AdminFormError ? error.message : "话题保存失败"
    redirectWithMessage(backTo, "error", message)
  }

  try {
    await getDb().insert(bizTopic).values(values)
  } catch (error) {
    if (isUniqueViolation(error)) {
      redirectWithMessage(backTo, "error", "话题 slug 已存在")
    }

    throw error
  }

  revalidatePath("/topics")
  revalidatePath("/admin/operations/topics")
  redirectWithMessage(backTo, "notice", "话题已创建")
}

export async function addTopicSnapshotItemAction(formData: FormData) {
  const admin = await requireAdmin()

  const topicId = uuidString(formData, "topicId", "话题 ID")
  const snapshotItemId = uuidString(formData, "snapshotItemId", "内容 ID")
  const sort = optionalInteger(formData, "sort", "排序", 0)
  const backTo = safeAdminBackTo(
    formString(formData, "backTo"),
    `/admin/operations/topics/${topicId}`,
  )

  await getDb()
    .insert(relTopicSnapshotItem)
    .values({
      topicId,
      snapshotItemId,
      sort,
      isPinned: true,
      createdBy: admin.id,
    })
    .onConflictDoUpdate({
      target: [
        relTopicSnapshotItem.topicId,
        relTopicSnapshotItem.snapshotItemId,
      ],
      set: {
        isPinned: true,
        sort,
      },
    })

  revalidatePath("/topics")
  revalidatePath(backTo)
  redirectWithMessage(backTo, "notice", "已加入话题关联")
}

export async function removeTopicSnapshotItemAction(formData: FormData) {
  await requireAdmin()

  const id = uuidString(formData, "id", "关联 ID")
  const topicId = uuidString(formData, "topicId", "话题 ID")
  const backTo = safeAdminBackTo(
    formString(formData, "backTo"),
    `/admin/operations/topics/${topicId}`,
  )

  await getDb()
    .delete(relTopicSnapshotItem)
    .where(eq(relTopicSnapshotItem.id, id))

  revalidatePath("/topics")
  revalidatePath(backTo)
  redirectWithMessage(backTo, "notice", "已移除话题关联")
}

export async function updateTopicStatusAction(formData: FormData) {
  await requireAdmin()

  const id = uuidString(formData, "id", "话题 ID")
  const status = selectValue(formData, "status", "状态", entityStatuses)
  const isHomeVisible = formString(formData, "isHomeVisible") === "true"
  const backTo = safeAdminBackTo(
    formString(formData, "backTo"),
    "/admin/operations/topics",
  )

  await getDb()
    .update(bizTopic)
    .set({
      isHomeVisible,
      status,
      updatedAt: new Date(),
    })
    .where(eq(bizTopic.id, id))

  revalidatePath("/topics")
  revalidatePath("/admin/operations/topics")
  redirectWithMessage(backTo, "notice", "话题状态已更新")
}

export async function deleteTopicAction(formData: FormData) {
  await requireAdmin()

  const id = uuidString(formData, "id", "话题 ID")
  const backTo = safeAdminBackTo(
    formString(formData, "backTo"),
    "/admin/operations/topics",
  )

  await getDb()
    .update(bizTopic)
    .set({
      deletedAt: new Date(),
      status: "disabled",
      updatedAt: new Date(),
    })
    .where(eq(bizTopic.id, id))

  revalidatePath("/topics")
  revalidatePath("/admin/operations/topics")
  redirectWithMessage(backTo, "notice", "话题已删除")
}

export async function updateTrackingRuleEnabledAction(formData: FormData) {
  await requireAdmin()

  const id = uuidString(formData, "id", "追踪规则 ID")
  const isEnabled = formString(formData, "isEnabled") === "true"
  const backTo = safeAdminBackTo(
    formString(formData, "backTo"),
    "/admin/users/tracking",
  )

  await getDb()
    .update(userTrackingRule)
    .set({
      isEnabled,
      updatedAt: new Date(),
    })
    .where(eq(userTrackingRule.id, id))

  revalidatePath("/tracking")
  revalidatePath("/admin/users/tracking")
  redirectWithMessage(backTo, "notice", "追踪规则已更新")
}

async function revalidateDailyReportViews(reportId: string, adminPath: string) {
  const [report] = await getDb()
    .select({ reportDate: bizDailyReport.reportDate })
    .from(bizDailyReport)
    .where(eq(bizDailyReport.id, reportId))
    .limit(1)

  revalidatePath("/daily")
  revalidatePath("/admin/operations/daily")
  revalidatePath(adminPath)

  if (report) {
    revalidatePath(`/daily/${report.reportDate}`)
  }
}

async function upsertContentBlock(values: {
  contentItemId: string | null
  createdBy: string
  reason: string | null
  snapshotItemId: string | null
  title: string
  url: string
  urlHash: string
}) {
  const db = getDb()
  const [existing] = await db
    .select({ id: bizContentBlock.id })
    .from(bizContentBlock)
    .where(
      and(
        eq(bizContentBlock.urlHash, values.urlHash),
        isNull(bizContentBlock.deletedAt),
      ),
    )
    .limit(1)

  if (existing) {
    await db
      .update(bizContentBlock)
      .set({
        contentItemId: values.contentItemId,
        reason: values.reason,
        snapshotItemId: values.snapshotItemId,
        title: values.title,
        updatedAt: new Date(),
        url: values.url,
      })
      .where(eq(bizContentBlock.id, existing.id))
    return
  }

  await db.insert(bizContentBlock).values(values)
}

function revalidateContentViews() {
  revalidatePath("/")
  revalidatePath("/daily")
  revalidatePath("/feed")
  revalidatePath("/rankings")
  revalidatePath("/topics")
  revalidatePath("/admin/contents/latest")
  revalidatePath("/admin/contents/blocked")
}
