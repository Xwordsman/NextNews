"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireAdmin } from "@/server/auth/session"
import { getChannelDefinition } from "@/server/channels/registry"
import { runChannelCrawl } from "@/server/crawling/run-channel"
import { getDb } from "@/server/db/client"
import {
  bizCategory,
  bizChannel,
  bizSite,
  relChannelCategory,
} from "@/server/db/schema"
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
    channelType:
      optionalString(formData, "channelType", "频道类型", 80) ?? "rank",
    homepageUrl: optionalString(formData, "homepageUrl", "频道地址"),
    crawlIntervalSeconds: optionalInteger(
      formData,
      "crawlIntervalSeconds",
      "采集间隔",
      300,
      30,
    ),
    isCrawlEnabled: booleanField(formData, "isCrawlEnabled"),
    isPublic: booleanField(formData, "isPublic"),
    isHomeVisible: booleanField(formData, "isHomeVisible"),
    isSubscribable: booleanField(formData, "isSubscribable"),
    displayStyle:
      optionalString(formData, "displayStyle", "展示样式", 80) ?? "rank",
    weight: optionalInteger(formData, "weight", "权重", 0),
    sort: optionalInteger(formData, "sort", "排序", 0),
    status: selectValue(formData, "status", "状态", entityStatuses),
    categoryIds: uuidList(formData, "categoryIds", "所属分类"),
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

  const { categoryIds, ...channelValues } = values

  try {
    const [channel] = await getDb()
      .insert(bizChannel)
      .values(channelValues)
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

  const { categoryIds, ...channelValues } = values

  try {
    await getDb()
      .update(bizChannel)
      .set({ ...channelValues, updatedAt: new Date() })
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
}

export async function runChannelCrawlAction(formData: FormData) {
  await requireAdmin()

  const id = uuidString(formData, "id", "频道 ID")
  let result: Awaited<ReturnType<typeof runChannelCrawl>>

  try {
    result = await runChannelCrawl(id, { runType: "manual" })
  } catch (error) {
    const message = error instanceof Error ? error.message : "采集失败"
    redirectWithError("/admin/channels", new AdminFormError(message))
  }

  const message =
    result.status === "skipped"
      ? (result.skippedReason ?? "该频道已有采集任务正在运行")
      : result.createdSnapshot
        ? `采集完成，写入 ${result.insertedCount} 条快照明细`
        : "采集完成，内容未变化，复用已有快照"

  revalidatePath("/admin")
  revalidatePath("/admin/channels")
  redirect(`/admin/channels?notice=${encodeURIComponent(message)}`)
}
