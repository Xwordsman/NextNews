import { asc, and, eq, inArray, isNull } from "drizzle-orm"
import {
  getChannelDisplayConfig,
  getChannelFallbackColorPreset,
  getChannelPalette,
  type ChannelMetaDisplayMode,
} from "@/server/channels/display-config"
import { getDb } from "@/server/db/client"
import {
  bizCategory,
  bizChannel,
  bizContentBlock,
  bizHomeModule,
  bizSite,
  bizSnapshotItem,
  relChannelCategory,
} from "@/server/db/schema"
import { defaultHomeModules } from "@/server/home/modules"
import { formatAppDateTime } from "@/lib/date-format"
import type { HomeSource } from "./mock-data"

type NavItem = {
  label: string
  href: string
}

export type PublicHomeData = {
  sources: HomeSource[]
  categoryNavItems: NavItem[]
  homeModules: HomeModule[]
}

export type HomeModule = {
  moduleKey: string
  title: string
  subtitle: string | null
  displayLimit: number
  sort: number
  status: "draft" | "active" | "disabled"
}

type HomeChannelRow = {
  id: string
  siteSlug: string
  siteName: string
  channelSlug: string
  channelName: string
  extra: Record<string, unknown> | null
  lastSnapshotId: string | null
  lastSuccessAt: Date | null
  sort: number
}

type HomeSnapshotItemRow = {
  id: string
  snapshotId: string
  rankNo: number | null
  title: string
  url: string
  summary: string | null
  hotValue: string | null
  hotLabel: string | null
  tag: string | null
  publishedAt: Date | null
  createdAt: Date
}

export async function getPublicHomeData(): Promise<PublicHomeData> {
  const db = getDb()

  const [channels, categories, homeModules] = await Promise.all([
    db
      .select({
        id: bizChannel.id,
        siteSlug: bizSite.slug,
        siteName: bizSite.siteName,
        channelSlug: bizChannel.slug,
        channelName: bizChannel.channelName,
        extra: bizChannel.extra,
        lastSnapshotId: bizChannel.lastSnapshotId,
        lastSuccessAt: bizChannel.lastSuccessAt,
        sort: bizChannel.sort,
      })
      .from(bizChannel)
      .innerJoin(bizSite, eq(bizChannel.siteId, bizSite.id))
      .where(
        and(
          isNull(bizChannel.deletedAt),
          isNull(bizSite.deletedAt),
          eq(bizChannel.status, "active"),
          eq(bizChannel.isPublic, true),
          eq(bizSite.status, "active"),
          eq(bizSite.isVisible, true),
        ),
      )
      .orderBy(asc(bizSite.sort), asc(bizChannel.sort)),
    db
      .select({
        categoryName: bizCategory.categoryName,
        slug: bizCategory.slug,
      })
      .from(bizCategory)
      .where(
        and(
          isNull(bizCategory.deletedAt),
          eq(bizCategory.status, "active"),
          eq(bizCategory.isNavVisible, true),
        ),
      )
      .orderBy(asc(bizCategory.sort), asc(bizCategory.categoryName)),
    listHomeModules(),
  ])

  if (channels.length === 0) {
    return {
      sources: [],
      categoryNavItems: categories.map((category) => ({
        label: category.categoryName,
        href: `/categories/${category.slug}`,
      })),
      homeModules,
    }
  }

  return {
    sources: await mapChannelsToHomeSources(channels),
    categoryNavItems: categories.map((category) => ({
      label: category.categoryName,
      href: `/categories/${category.slug}`,
    })),
    homeModules,
  }
}

export async function getPublicCategoryHomeData(categorySlug: string) {
  const db = getDb()
  const [category] = await db
    .select({
      id: bizCategory.id,
      categoryName: bizCategory.categoryName,
      slug: bizCategory.slug,
    })
    .from(bizCategory)
    .where(
      and(
        isNull(bizCategory.deletedAt),
        eq(bizCategory.slug, categorySlug),
        eq(bizCategory.status, "active"),
        eq(bizCategory.isNavVisible, true),
      ),
    )
    .limit(1)

  if (!category) {
    return null
  }

  const [channels, categories, homeModules] = await Promise.all([
    db
      .select({
        id: bizChannel.id,
        siteSlug: bizSite.slug,
        siteName: bizSite.siteName,
        channelSlug: bizChannel.slug,
        channelName: bizChannel.channelName,
        extra: bizChannel.extra,
        lastSnapshotId: bizChannel.lastSnapshotId,
        lastSuccessAt: bizChannel.lastSuccessAt,
        sort: bizChannel.sort,
      })
      .from(relChannelCategory)
      .innerJoin(bizChannel, eq(relChannelCategory.channelId, bizChannel.id))
      .innerJoin(bizSite, eq(bizChannel.siteId, bizSite.id))
      .where(
        and(
          eq(relChannelCategory.categoryId, category.id),
          isNull(bizChannel.deletedAt),
          isNull(bizSite.deletedAt),
          eq(bizChannel.status, "active"),
          eq(bizChannel.isPublic, true),
          eq(bizChannel.isHomeVisible, true),
          eq(bizSite.status, "active"),
          eq(bizSite.isVisible, true),
        ),
      )
      .orderBy(
        asc(relChannelCategory.sort),
        asc(bizSite.sort),
        asc(bizChannel.sort),
      ),
    listCategoryNavItems(),
    listHomeModules(),
  ])

  return {
    category,
    data: {
      sources: await mapChannelsToHomeSources(channels, category.slug),
      categoryNavItems: categories,
      homeModules,
    },
  }
}

async function listCategoryNavItems(): Promise<NavItem[]> {
  return getDb()
    .select({
      label: bizCategory.categoryName,
      slug: bizCategory.slug,
    })
    .from(bizCategory)
    .where(
      and(
        isNull(bizCategory.deletedAt),
        eq(bizCategory.status, "active"),
        eq(bizCategory.isNavVisible, true),
      ),
    )
    .orderBy(asc(bizCategory.sort), asc(bizCategory.categoryName))
    .then((categories) =>
      categories.map((category) => ({
        label: category.label,
        href: `/categories/${category.slug}`,
      })),
    )
}

async function mapChannelsToHomeSources(
  channels: HomeChannelRow[],
  fallbackCategorySlug?: string,
): Promise<HomeSource[]> {
  if (channels.length === 0) {
    return []
  }

  const db = getDb()
  const channelIds = channels.map((channel) => channel.id)
  const snapshotIds = channels
    .map((channel) => channel.lastSnapshotId)
    .filter((id): id is string => Boolean(id))

  const [categoryRows, itemRows] = await Promise.all([
    db
      .select({
        channelId: relChannelCategory.channelId,
        categorySlug: bizCategory.slug,
      })
      .from(relChannelCategory)
      .innerJoin(bizCategory, eq(relChannelCategory.categoryId, bizCategory.id))
      .where(inArray(relChannelCategory.channelId, channelIds))
      .orderBy(asc(relChannelCategory.sort), asc(bizCategory.sort)),
    snapshotIds.length > 0
      ? db
          .select({
            id: bizSnapshotItem.id,
            snapshotId: bizSnapshotItem.snapshotId,
            rankNo: bizSnapshotItem.rankNo,
            title: bizSnapshotItem.title,
            url: bizSnapshotItem.url,
            summary: bizSnapshotItem.summary,
            hotValue: bizSnapshotItem.hotValue,
            hotLabel: bizSnapshotItem.hotLabel,
            tag: bizSnapshotItem.tag,
            publishedAt: bizSnapshotItem.publishedAt,
            createdAt: bizSnapshotItem.createdAt,
          })
          .from(bizSnapshotItem)
          .leftJoin(
            bizContentBlock,
            and(
              eq(bizSnapshotItem.urlHash, bizContentBlock.urlHash),
              isNull(bizContentBlock.deletedAt),
            ),
          )
          .where(
            and(
              inArray(bizSnapshotItem.snapshotId, snapshotIds),
              isNull(bizContentBlock.id),
            ),
          )
          .orderBy(asc(bizSnapshotItem.snapshotId), asc(bizSnapshotItem.rankNo))
      : ([] as HomeSnapshotItemRow[]),
  ])

  const categoryByChannelId = new Map<string, string>()
  const itemsBySnapshotId = new Map<string, HomeSnapshotItemRow[]>()

  for (const row of categoryRows) {
    if (!categoryByChannelId.has(row.channelId)) {
      categoryByChannelId.set(row.channelId, row.categorySlug)
    }
  }

  for (const item of itemRows) {
    const items = itemsBySnapshotId.get(item.snapshotId) ?? []
    items.push(item)
    itemsBySnapshotId.set(item.snapshotId, items)
  }

  return channels.map((channel, index) => {
    const fallbackColorPreset = getChannelFallbackColorPreset(
      `${channel.siteSlug}.${channel.channelSlug}`,
    )
    const displayConfig = getChannelDisplayConfig(
      channel.extra,
      fallbackColorPreset,
    )
    const palette = getChannelPalette(displayConfig.colorPreset)
    const items = channel.lastSnapshotId
      ? (itemsBySnapshotId.get(channel.lastSnapshotId) ?? [])
      : []

    return {
      id: channel.id,
      name: channel.channelName,
      logo: getLogoText(channel.siteName),
      tag: getChannelSubtitle(
        channel.channelName,
        channel.siteName,
        displayConfig.subtitle,
      ),
      updatedLabel: displayConfig.showUpdatedAt
        ? formatUpdateTag(channel.lastSuccessAt)
        : undefined,
      category:
        categoryByChannelId.get(channel.id) ??
        fallbackCategorySlug ??
        "general",
      color: palette.color,
      logoColor: palette.logoColor,
      favorite: index < 3,
      href: `/channels/${channel.siteSlug}/${channel.channelSlug}`,
      items: items.slice(0, displayConfig.itemLimit).map((item) => {
        const meta = getItemMeta(item, displayConfig.metaDisplay)

        return {
          id: item.id,
          title: item.title,
          url: item.url,
          meta: meta.value,
          metaVariant: meta.variant,
          metaPosition: displayConfig.metaPosition,
        }
      }),
    }
  })
}

async function listHomeModules(): Promise<HomeModule[]> {
  const rows = await getDb()
    .select({
      moduleKey: bizHomeModule.moduleKey,
      title: bizHomeModule.title,
      subtitle: bizHomeModule.subtitle,
      status: bizHomeModule.status,
      sort: bizHomeModule.sort,
      displayLimit: bizHomeModule.displayLimit,
    })
    .from(bizHomeModule)
    .where(isNull(bizHomeModule.deletedAt))
    .orderBy(asc(bizHomeModule.sort))

  const moduleByKey = new Map(rows.map((row) => [row.moduleKey, row]))

  return defaultHomeModules
    .map((module) => {
      const saved = moduleByKey.get(module.moduleKey)

      return {
        moduleKey: module.moduleKey,
        title: saved?.title ?? module.title,
        subtitle: saved?.subtitle ?? module.subtitle,
        status: saved?.status ?? "active",
        sort: saved?.sort ?? module.sort,
        displayLimit: saved?.displayLimit ?? module.displayLimit,
      }
    })
    .filter((module) => module.status === "active")
    .sort((a, b) => a.sort - b.sort)
}

function getLogoText(name: string) {
  return Array.from(name.trim())[0]?.toUpperCase() ?? "N"
}

function getChannelSubtitle(
  channelName: string,
  siteName: string,
  configuredSubtitle?: string | null,
) {
  const subtitle = configuredSubtitle?.trim()

  if (subtitle) {
    return subtitle
  }

  const normalizedChannelName = channelName.trim()
  const normalizedSiteName = siteName.trim()
  const inferredSubtitle = normalizedChannelName.startsWith(normalizedSiteName)
    ? normalizedChannelName.slice(normalizedSiteName.length).trim()
    : ""

  return inferredSubtitle || normalizedSiteName || normalizedChannelName
}

function formatUpdateTag(value: Date | null) {
  if (!value) {
    return "等待采集"
  }

  const diffMinutes = Math.max(
    0,
    Math.floor((Date.now() - value.getTime()) / 60000),
  )

  if (diffMinutes < 1) {
    return "刚刚更新"
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} 分钟前`
  }

  const diffHours = Math.floor(diffMinutes / 60)

  if (diffHours < 24) {
    return `${diffHours} 小时前`
  }

  return `${Math.floor(diffHours / 24)} 天前`
}

function formatPublishedAt(value: Date | null) {
  if (!value) {
    return undefined
  }

  return formatAppDateTime(value, "")
}

type ItemMetaInput = {
  hotValue: string | null
  hotLabel: string | null
  tag: string | null
  publishedAt: Date | null
  createdAt: Date
}

function getItemMeta(item: ItemMetaInput, metaDisplay: ChannelMetaDisplayMode) {
  if (metaDisplay === "none") {
    return { value: undefined, variant: "muted" as const }
  }

  if (metaDisplay === "heat") {
    return {
      value: item.hotValue ?? item.hotLabel ?? undefined,
      variant: "heat" as const,
    }
  }

  if (metaDisplay === "tag") {
    return { value: getItemTag(item), variant: "tag" as const }
  }

  if (metaDisplay === "time") {
    return {
      value: formatPublishedAt(item.publishedAt ?? item.createdAt),
      variant: "muted" as const,
    }
  }

  if (item.hotValue || item.hotLabel) {
    return {
      value: item.hotValue ?? item.hotLabel ?? undefined,
      variant: "heat" as const,
    }
  }

  return { value: getItemTag(item), variant: "tag" as const }
}

function getItemTag(item: ItemMetaInput) {
  if (item.tag) {
    return item.tag
  }

  const marker = item.hotLabel ?? ""

  if (marker.includes("沸")) {
    return "沸"
  }

  if (marker.includes("爆")) {
    return "爆"
  }

  if (marker.includes("新")) {
    return "新"
  }

  if (marker.includes("热")) {
    return "热"
  }

  return undefined
}
