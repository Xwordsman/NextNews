import { eq } from "drizzle-orm"
import { hashPassword } from "@/server/auth/password"
import { mergeChannelDisplayConfig } from "@/server/channels/display-config"
import {
  newsnowCategorySeeds,
  newsnowChannelCatalog,
} from "@/server/channels/newsnow/catalog"
import { getDb } from "./client"
import {
  bizCategory,
  bizChannel,
  bizSite,
  relChannelCategory,
  sysSetting,
  sysUser,
} from "./schema"

type SiteInsert = typeof bizSite.$inferInsert
type SiteSelect = typeof bizSite.$inferSelect
type CategoryInsert = typeof bizCategory.$inferInsert
type CategorySelect = typeof bizCategory.$inferSelect
type ChannelInsert = typeof bizChannel.$inferInsert
type ChannelSelect = typeof bizChannel.$inferSelect
type BuiltinChannelEntry = (typeof newsnowChannelCatalog)[number]
type BuiltinChannelUpdate = {
  channelName?: string
  isCrawlEnabled?: boolean
  isHomeVisible?: boolean
  isSubscribable?: boolean
  status?: ChannelSelect["status"]
  updatedAt: Date
}

export type SeedInitialDataOptions = {
  adminEmail?: string
  adminPassword?: string
  appName?: string
  appUrl?: string
  markInstalled?: boolean
  resetAdminPassword?: boolean
}

export async function seedInitialData(options: SeedInitialDataOptions = {}) {
  const admin = await ensureAdminUser({
    email: options.adminEmail ?? process.env.ADMIN_EMAIL ?? "admin@example.com",
    password:
      options.adminPassword ?? process.env.ADMIN_PASSWORD ?? "change-me",
    resetPassword: options.resetAdminPassword ?? false,
  })

  await syncBuiltinNewsSources()

  if (options.markInstalled ?? true) {
    await upsertSetting("app.name", options.appName ?? "NextNews", true)
    await upsertSetting(
      "app.url",
      options.appUrl ?? process.env.APP_URL ?? "",
      true,
    )
    await upsertSetting("install.completed", "true", false)
    await upsertSetting("install.completed_at", new Date().toISOString(), false)
  }

  return { admin }
}

export async function syncBuiltinNewsSources() {
  const categoriesBySlug = new Map<string, CategorySelect>()
  const sitesBySlug = new Map<string, SiteSelect>()
  let createdCategoryCount = 0
  let createdSiteCount = 0
  let createdChannelCount = 0
  let updatedChannelCount = 0

  for (const category of newsnowCategorySeeds) {
    const result = await upsertCategory({
      categoryName: category.categoryName,
      color: category.color,
      icon: category.icon,
      slug: category.slug,
      sort: category.sort,
    })
    const row = result.row
    if (result.created) {
      createdCategoryCount += 1
    }
    categoriesBySlug.set(row.slug, row)
  }

  for (const entry of newsnowChannelCatalog) {
    if (!sitesBySlug.has(entry.siteSlug)) {
      const result = await upsertSite({
        description: entry.description,
        homepageUrl: entry.homepageUrl,
        isVisible: true,
        siteName: entry.siteName,
        slug: entry.siteSlug,
        sort: entry.siteSort,
      })
      const site = result.row
      if (result.created) {
        createdSiteCount += 1
      }
      sitesBySlug.set(site.slug, site)
    }

    const site = sitesBySlug.get(entry.siteSlug)

    if (!site) {
      continue
    }

    const result = await upsertChannel({
      channelName: entry.channelName,
      channelType: entry.channelType,
      collectorType: entry.collectorType,
      crawlIntervalSeconds: entry.crawlIntervalSeconds,
      definitionKey: entry.definitionKey,
      displayStyle: entry.displayStyle,
      extra: mergeChannelDisplayConfig(null, {
        colorPreset: entry.colorPreset,
        itemLimit: entry.itemLimit,
        metaDisplay: entry.metaDisplay,
        metaPosition: entry.metaPosition,
        showUpdatedAt: entry.showUpdatedAt,
        subtitle: entry.subtitle,
      }),
      homepageUrl: entry.homepageUrl,
      isCrawlEnabled: entry.isCrawlEnabled,
      isHomeVisible: entry.isHomeVisible,
      isPublic: true,
      isSubscribable: entry.isSubscribable,
      siteId: site.id,
      slug: entry.channelSlug,
      snapshotIntervalSeconds: entry.snapshotIntervalSeconds,
      sort: entry.sort,
      status: entry.status,
    })
    let channel = result.row
    if (result.created) {
      createdChannelCount += 1
    } else {
      const updates = getBuiltinChannelUpdates(channel, entry)

      if (updates) {
        channel = await updateBuiltinChannel(channel.id, entry, updates)
        updatedChannelCount += 1
      }
    }

    for (const categorySlug of entry.categorySlugs) {
      const category = categoriesBySlug.get(categorySlug)

      if (category) {
        await bindChannelCategory(channel.id, category.id)
      }
    }
  }

  return {
    categoryCount: newsnowCategorySeeds.length,
    channelCount: newsnowChannelCatalog.length,
    createdCategoryCount,
    createdChannelCount,
    createdSiteCount,
    updatedChannelCount,
    siteCount: sitesBySlug.size,
  }
}

async function ensureAdminUser({
  email,
  password,
  resetPassword,
}: {
  email: string
  password: string
  resetPassword: boolean
}) {
  const db = getDb()
  const normalizedEmail = email.trim().toLowerCase()
  const [existing] = await db
    .select()
    .from(sysUser)
    .where(eq(sysUser.email, normalizedEmail))
    .limit(1)

  if (existing) {
    if (
      resetPassword ||
      existing.role !== "admin" ||
      existing.status !== "active"
    ) {
      const [updated] = await db
        .update(sysUser)
        .set({
          passwordHash: hashPassword(password),
          role: "admin",
          status: "active",
          updatedAt: new Date(),
        })
        .where(eq(sysUser.id, existing.id))
        .returning()

      return updated ?? existing
    }

    return existing
  }

  const [created] = await db
    .insert(sysUser)
    .values({
      displayName: "NextNews Admin",
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      role: "admin",
    })
    .returning()

  return created
}

async function upsertSite(values: SiteInsert) {
  const db = getDb()
  const [existing] = await db
    .select()
    .from(bizSite)
    .where(eq(bizSite.slug, values.slug))
    .limit(1)

  if (existing) {
    return { created: false, row: existing }
  }

  const [created] = await db.insert(bizSite).values(values).returning()
  return { created: true, row: created }
}

async function upsertCategory(values: CategoryInsert) {
  const db = getDb()
  const [existing] = await db
    .select()
    .from(bizCategory)
    .where(eq(bizCategory.slug, values.slug))
    .limit(1)

  if (existing) {
    return { created: false, row: existing }
  }

  const [created] = await db.insert(bizCategory).values(values).returning()
  return { created: true, row: created }
}

async function upsertChannel(values: ChannelInsert) {
  const db = getDb()
  const [existing] = await db
    .select()
    .from(bizChannel)
    .where(eq(bizChannel.definitionKey, values.definitionKey))
    .limit(1)

  if (existing) {
    return { created: false, row: existing }
  }

  const [created] = await db.insert(bizChannel).values(values).returning()
  return { created: true, row: created }
}

function getBuiltinChannelUpdates(
  channel: ChannelSelect,
  entry: BuiltinChannelEntry,
) {
  const updates: BuiltinChannelUpdate = { updatedAt: new Date() }

  if (
    entry.sourceChannelName !== entry.channelName &&
    channel.channelName === entry.sourceChannelName
  ) {
    updates.channelName = entry.channelName
  }

  if (
    entry.status === "active" &&
    entry.isCrawlEnabled &&
    entry.isHomeVisible &&
    channel.status === "draft" &&
    !channel.isCrawlEnabled &&
    !channel.isHomeVisible
  ) {
    updates.isCrawlEnabled = entry.isCrawlEnabled
    updates.isHomeVisible = entry.isHomeVisible
    updates.isSubscribable = entry.isSubscribable
    updates.status = entry.status
  }

  return Object.keys(updates).length > 1 ? updates : null
}

async function updateBuiltinChannel(
  channelId: string,
  entry: BuiltinChannelEntry,
  updates: BuiltinChannelUpdate,
) {
  const db = getDb()
  const [updated] = await db
    .update(bizChannel)
    .set(updates)
    .where(eq(bizChannel.id, channelId))
    .returning()

  if (!updated) {
    throw new Error(`未能更新内置频道默认配置：${entry.definitionKey}`)
  }

  return updated
}

async function bindChannelCategory(channelId: string, categoryId: string) {
  const db = getDb()
  await db
    .insert(relChannelCategory)
    .values({
      categoryId,
      channelId,
    })
    .onConflictDoNothing({
      target: [relChannelCategory.channelId, relChannelCategory.categoryId],
    })
}

async function upsertSetting(
  settingKey: string,
  settingValue: string,
  isPublic: boolean,
) {
  const db = getDb()
  await db
    .insert(sysSetting)
    .values({
      isPublic,
      settingKey,
      settingValue,
    })
    .onConflictDoUpdate({
      target: sysSetting.settingKey,
      set: {
        isPublic,
        settingValue,
        updatedAt: new Date(),
      },
    })
}
