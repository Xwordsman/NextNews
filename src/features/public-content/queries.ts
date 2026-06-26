import { asc, and, desc, eq, gte, inArray, isNull, lte } from "drizzle-orm"
import { getDb } from "@/server/db/client"
import {
  bizCategory,
  bizChannel,
  bizChannelSnapshot,
  bizContentBlock,
  bizSite,
  bizSnapshotItem,
  relChannelCategory,
} from "@/server/db/schema"

export type PublicRankItem = {
  id: string
  rankNo: number | null
  title: string
  url: string
  summary: string | null
  hotValue: string | null
  hotLabel: string | null
  tag: string | null
  publishedAt: Date | null
}

export async function getPublicSite(siteSlug: string) {
  const db = getDb()
  const [site] = await db
    .select({
      id: bizSite.id,
      siteName: bizSite.siteName,
      slug: bizSite.slug,
      homepageUrl: bizSite.homepageUrl,
      description: bizSite.description,
    })
    .from(bizSite)
    .where(
      and(
        isNull(bizSite.deletedAt),
        eq(bizSite.slug, siteSlug),
        eq(bizSite.status, "active"),
        eq(bizSite.isVisible, true),
      ),
    )
    .limit(1)

  if (!site) {
    return null
  }

  const channels = await db
    .select({
      id: bizChannel.id,
      channelName: bizChannel.channelName,
      slug: bizChannel.slug,
      definitionKey: bizChannel.definitionKey,
      lastSnapshotId: bizChannel.lastSnapshotId,
      lastSuccessAt: bizChannel.lastSuccessAt,
    })
    .from(bizChannel)
    .where(
      and(
        isNull(bizChannel.deletedAt),
        eq(bizChannel.siteId, site.id),
        eq(bizChannel.status, "active"),
        eq(bizChannel.isPublic, true),
      ),
    )
    .orderBy(asc(bizChannel.sort), asc(bizChannel.channelName))

  const snapshotIds = channels
    .map((channel) => channel.lastSnapshotId)
    .filter((id): id is string => Boolean(id))

  const items =
    snapshotIds.length > 0
      ? await db
          .select({
            snapshotId: bizSnapshotItem.snapshotId,
            id: bizSnapshotItem.id,
            rankNo: bizSnapshotItem.rankNo,
            title: bizSnapshotItem.title,
            url: bizSnapshotItem.url,
            summary: bizSnapshotItem.summary,
            hotValue: bizSnapshotItem.hotValue,
            hotLabel: bizSnapshotItem.hotLabel,
            tag: bizSnapshotItem.tag,
            publishedAt: bizSnapshotItem.publishedAt,
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
      : []

  const itemsBySnapshotId = new Map<string, PublicRankItem[]>()

  for (const item of items) {
    const snapshotItems = itemsBySnapshotId.get(item.snapshotId) ?? []
    snapshotItems.push(toPublicRankItem(item))
    itemsBySnapshotId.set(item.snapshotId, snapshotItems)
  }

  return {
    ...site,
    channels: channels.map((channel) => ({
      ...channel,
      href: `/channels/${site.slug}/${channel.slug}`,
      items: channel.lastSnapshotId
        ? (itemsBySnapshotId.get(channel.lastSnapshotId) ?? []).slice(0, 6)
        : [],
    })),
  }
}

export async function getPublicChannel(siteSlug: string, channelSlug: string) {
  const db = getDb()
  const [channel] = await db
    .select({
      id: bizChannel.id,
      channelName: bizChannel.channelName,
      slug: bizChannel.slug,
      definitionKey: bizChannel.definitionKey,
      homepageUrl: bizChannel.homepageUrl,
      isSubscribable: bizChannel.isSubscribable,
      lastSnapshotId: bizChannel.lastSnapshotId,
      lastSuccessAt: bizChannel.lastSuccessAt,
      siteName: bizSite.siteName,
      siteSlug: bizSite.slug,
      siteHomepageUrl: bizSite.homepageUrl,
    })
    .from(bizChannel)
    .innerJoin(bizSite, eq(bizChannel.siteId, bizSite.id))
    .where(
      and(
        isNull(bizChannel.deletedAt),
        isNull(bizSite.deletedAt),
        eq(bizSite.slug, siteSlug),
        eq(bizChannel.slug, channelSlug),
        eq(bizChannel.status, "active"),
        eq(bizChannel.isPublic, true),
        eq(bizSite.status, "active"),
        eq(bizSite.isVisible, true),
      ),
    )
    .limit(1)

  if (!channel) {
    return null
  }

  const [items, snapshots] = await Promise.all([
    channel.lastSnapshotId
      ? listSnapshotItems(channel.lastSnapshotId)
      : Promise.resolve([]),
    db
      .select({
        id: bizChannelSnapshot.id,
        snapshotTime: bizChannelSnapshot.snapshotTime,
        snapshotDate: bizChannelSnapshot.snapshotDate,
        itemCount: bizChannelSnapshot.itemCount,
        status: bizChannelSnapshot.status,
      })
      .from(bizChannelSnapshot)
      .where(eq(bizChannelSnapshot.channelId, channel.id))
      .orderBy(desc(bizChannelSnapshot.snapshotTime))
      .limit(30),
  ])

  return {
    ...channel,
    items,
    snapshots: snapshots.map((snapshot) => ({
      ...snapshot,
      href: `/channels/${channel.siteSlug}/${channel.slug}/snapshots/${snapshot.id}`,
    })),
  }
}

export async function getPublicChannelSnapshot(
  siteSlug: string,
  channelSlug: string,
  snapshotId: string,
) {
  if (!isUuid(snapshotId)) {
    return null
  }

  const channel = await getPublicChannel(siteSlug, channelSlug)

  if (!channel) {
    return null
  }

  const db = getDb()
  const [snapshot] = await db
    .select({
      id: bizChannelSnapshot.id,
      snapshotTime: bizChannelSnapshot.snapshotTime,
      snapshotDate: bizChannelSnapshot.snapshotDate,
      itemCount: bizChannelSnapshot.itemCount,
      status: bizChannelSnapshot.status,
    })
    .from(bizChannelSnapshot)
    .where(
      and(
        eq(bizChannelSnapshot.id, snapshotId),
        eq(bizChannelSnapshot.channelId, channel.id),
      ),
    )
    .limit(1)

  if (!snapshot) {
    return null
  }

  return {
    channel,
    snapshot,
    items: await listSnapshotItems(snapshot.id),
  }
}

export async function getPublicChannelHistory(
  siteSlug: string,
  channelSlug: string,
  options: { month?: string; year?: string } = {},
) {
  const channel = await getPublicChannel(siteSlug, channelSlug)

  if (!channel) {
    return null
  }

  const db = getDb()
  const filters = [eq(bizChannelSnapshot.channelId, channel.id)]
  const normalizedYear = options.year?.match(/^\d{4}$/)
    ? options.year
    : undefined
  const normalizedMonth = options.month?.match(/^\d{4}-\d{2}$/)
    ? options.month
    : undefined

  if (normalizedMonth) {
    filters.push(gte(bizChannelSnapshot.snapshotDate, `${normalizedMonth}-01`))
    filters.push(lte(bizChannelSnapshot.snapshotDate, `${normalizedMonth}-31`))
  } else if (normalizedYear) {
    filters.push(
      gte(bizChannelSnapshot.snapshotDate, `${normalizedYear}-01-01`),
    )
    filters.push(
      lte(bizChannelSnapshot.snapshotDate, `${normalizedYear}-12-31`),
    )
  }

  const [snapshots, allSnapshots] = await Promise.all([
    db
      .select({
        id: bizChannelSnapshot.id,
        snapshotTime: bizChannelSnapshot.snapshotTime,
        snapshotDate: bizChannelSnapshot.snapshotDate,
        itemCount: bizChannelSnapshot.itemCount,
        status: bizChannelSnapshot.status,
      })
      .from(bizChannelSnapshot)
      .where(and(...filters))
      .orderBy(desc(bizChannelSnapshot.snapshotTime))
      .limit(180),
    db
      .select({
        snapshotDate: bizChannelSnapshot.snapshotDate,
      })
      .from(bizChannelSnapshot)
      .where(eq(bizChannelSnapshot.channelId, channel.id))
      .orderBy(desc(bizChannelSnapshot.snapshotDate)),
  ])

  const years = Array.from(
    new Set(allSnapshots.map((snapshot) => snapshot.snapshotDate.slice(0, 4))),
  )
  const months = Array.from(
    new Set(allSnapshots.map((snapshot) => snapshot.snapshotDate.slice(0, 7))),
  )

  return {
    channel,
    filters: {
      month: normalizedMonth,
      year: normalizedYear,
    },
    months,
    snapshots: snapshots.map((snapshot) => ({
      ...snapshot,
      href: `/channels/${channel.siteSlug}/${channel.slug}/snapshots/${snapshot.id}`,
    })),
    years,
  }
}

export async function getPublicCategory(categorySlug: string) {
  const db = getDb()
  const [category] = await db
    .select({
      id: bizCategory.id,
      categoryName: bizCategory.categoryName,
      slug: bizCategory.slug,
      color: bizCategory.color,
      icon: bizCategory.icon,
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

  const channels = await db
    .select({
      id: bizChannel.id,
      channelName: bizChannel.channelName,
      slug: bizChannel.slug,
      definitionKey: bizChannel.definitionKey,
      lastSnapshotId: bizChannel.lastSnapshotId,
      lastSuccessAt: bizChannel.lastSuccessAt,
      siteName: bizSite.siteName,
      siteSlug: bizSite.slug,
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
        eq(bizSite.status, "active"),
        eq(bizSite.isVisible, true),
      ),
    )
    .orderBy(
      asc(relChannelCategory.sort),
      asc(bizSite.sort),
      asc(bizChannel.sort),
    )

  const snapshotIds = channels
    .map((channel) => channel.lastSnapshotId)
    .filter((id): id is string => Boolean(id))

  const items =
    snapshotIds.length > 0
      ? await db
          .select({
            snapshotId: bizSnapshotItem.snapshotId,
            id: bizSnapshotItem.id,
            rankNo: bizSnapshotItem.rankNo,
            title: bizSnapshotItem.title,
            url: bizSnapshotItem.url,
            summary: bizSnapshotItem.summary,
            hotValue: bizSnapshotItem.hotValue,
            hotLabel: bizSnapshotItem.hotLabel,
            tag: bizSnapshotItem.tag,
            publishedAt: bizSnapshotItem.publishedAt,
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
      : []

  const itemsBySnapshotId = new Map<string, PublicRankItem[]>()

  for (const item of items) {
    const snapshotItems = itemsBySnapshotId.get(item.snapshotId) ?? []
    snapshotItems.push(toPublicRankItem(item))
    itemsBySnapshotId.set(item.snapshotId, snapshotItems)
  }

  return {
    ...category,
    channels: channels.map((channel) => ({
      ...channel,
      href: `/channels/${channel.siteSlug}/${channel.slug}`,
      items: channel.lastSnapshotId
        ? (itemsBySnapshotId.get(channel.lastSnapshotId) ?? []).slice(0, 6)
        : [],
    })),
  }
}

async function listSnapshotItems(
  snapshotId: string,
): Promise<PublicRankItem[]> {
  const db = getDb()
  const items = await db
    .select({
      id: bizSnapshotItem.id,
      rankNo: bizSnapshotItem.rankNo,
      title: bizSnapshotItem.title,
      url: bizSnapshotItem.url,
      summary: bizSnapshotItem.summary,
      hotValue: bizSnapshotItem.hotValue,
      hotLabel: bizSnapshotItem.hotLabel,
      tag: bizSnapshotItem.tag,
      publishedAt: bizSnapshotItem.publishedAt,
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
        eq(bizSnapshotItem.snapshotId, snapshotId),
        isNull(bizContentBlock.id),
      ),
    )
    .orderBy(asc(bizSnapshotItem.rankNo), asc(bizSnapshotItem.createdAt))

  return items.map(toPublicRankItem)
}

function toPublicRankItem(item: PublicRankItem): PublicRankItem {
  return {
    id: item.id,
    rankNo: item.rankNo,
    title: item.title,
    url: item.url,
    summary: item.summary,
    hotValue: item.hotValue,
    hotLabel: item.hotLabel,
    tag: item.tag,
    publishedAt: item.publishedAt,
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
}
