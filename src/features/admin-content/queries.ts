import { and, asc, count, desc, eq, inArray, isNull } from "drizzle-orm"
import { listChannelDefinitions } from "@/server/channels/registry"
import { getDb } from "@/server/db/client"
import {
  bizCategory,
  bizChannel,
  bizChannelSnapshot,
  bizContentBlock,
  bizDailyReport,
  bizSite,
  bizSnapshotItem,
  bizTopic,
  logCrawlRun,
  relChannelCategory,
  relUserChannelSubscription,
  sysUser,
  userTrackingRule,
} from "@/server/db/schema"
import { serverEnv } from "@/server/env"

type CrawlRunStatus = typeof logCrawlRun.$inferSelect.status

export async function getAdminDashboardStats() {
  const db = getDb()
  const [[siteCount], [categoryCount], [channelCount], [snapshotCount]] =
    await Promise.all([
      db
        .select({ value: count() })
        .from(bizSite)
        .where(isNull(bizSite.deletedAt)),
      db
        .select({ value: count() })
        .from(bizCategory)
        .where(isNull(bizCategory.deletedAt)),
      db
        .select({ value: count() })
        .from(bizChannel)
        .where(isNull(bizChannel.deletedAt)),
      db.select({ value: count() }).from(bizChannelSnapshot),
    ])

  const [failedRunCount] = await db
    .select({ value: count() })
    .from(logCrawlRun)
    .where(eq(logCrawlRun.status, "failed"))

  return {
    sites: Number(siteCount?.value ?? 0),
    categories: Number(categoryCount?.value ?? 0),
    channels: Number(channelCount?.value ?? 0),
    snapshots: Number(snapshotCount?.value ?? 0),
    failedRuns: Number(failedRunCount?.value ?? 0),
  }
}

export async function listAdminSites() {
  const db = getDb()

  return db
    .select()
    .from(bizSite)
    .where(isNull(bizSite.deletedAt))
    .orderBy(asc(bizSite.sort), asc(bizSite.siteName))
}

export async function getAdminSite(id: string) {
  const db = getDb()
  const [site] = await db
    .select()
    .from(bizSite)
    .where(eq(bizSite.id, id))
    .limit(1)

  if (!site || site.deletedAt) {
    return null
  }

  return site
}

export async function listAdminCategories() {
  const db = getDb()
  const rows = await db
    .select()
    .from(bizCategory)
    .where(isNull(bizCategory.deletedAt))
    .orderBy(asc(bizCategory.sort), asc(bizCategory.categoryName))

  const categoryById = new Map(rows.map((row) => [row.id, row]))

  return rows.map((row) => ({
    ...row,
    parentName: row.parentId
      ? (categoryById.get(row.parentId)?.categoryName ?? null)
      : null,
  }))
}

export async function getAdminCategory(id: string) {
  const db = getDb()
  const [category] = await db
    .select()
    .from(bizCategory)
    .where(eq(bizCategory.id, id))
    .limit(1)

  if (!category || category.deletedAt) {
    return null
  }

  return category
}

export async function listChannelFormOptions() {
  const [sites, categories] = await Promise.all([
    listAdminSites(),
    listAdminCategories(),
  ])

  return {
    sites,
    categories,
    definitions: listChannelDefinitions(),
  }
}

export async function listAdminChannels() {
  const db = getDb()
  const rows = await db
    .select({
      id: bizChannel.id,
      siteName: bizSite.siteName,
      siteSlug: bizSite.slug,
      channelName: bizChannel.channelName,
      slug: bizChannel.slug,
      definitionKey: bizChannel.definitionKey,
      collectorType: bizChannel.collectorType,
      crawlIntervalSeconds: bizChannel.crawlIntervalSeconds,
      isCrawlEnabled: bizChannel.isCrawlEnabled,
      isHomeVisible: bizChannel.isHomeVisible,
      isSubscribable: bizChannel.isSubscribable,
      status: bizChannel.status,
      sort: bizChannel.sort,
      lastCrawlAt: bizChannel.lastCrawlAt,
      lastSuccessAt: bizChannel.lastSuccessAt,
    })
    .from(bizChannel)
    .innerJoin(bizSite, eq(bizChannel.siteId, bizSite.id))
    .where(isNull(bizChannel.deletedAt))
    .orderBy(
      asc(bizSite.sort),
      asc(bizChannel.sort),
      asc(bizChannel.channelName),
    )

  const channelIds = rows.map((row) => row.id)

  if (channelIds.length === 0) {
    return rows.map((row) => ({ ...row, categories: [] as string[] }))
  }

  const categoryRows = await db
    .select({
      channelId: relChannelCategory.channelId,
      categoryName: bizCategory.categoryName,
    })
    .from(relChannelCategory)
    .innerJoin(bizCategory, eq(relChannelCategory.categoryId, bizCategory.id))
    .where(inArray(relChannelCategory.channelId, channelIds))
    .orderBy(asc(relChannelCategory.sort), asc(bizCategory.sort))

  const categoryMap = new Map<string, string[]>()

  for (const row of categoryRows) {
    const categories = categoryMap.get(row.channelId) ?? []
    categories.push(row.categoryName)
    categoryMap.set(row.channelId, categories)
  }

  return rows.map((row) => ({
    ...row,
    categories: categoryMap.get(row.id) ?? [],
  }))
}

export async function getAdminChannel(id: string) {
  const db = getDb()
  const [channel] = await db
    .select()
    .from(bizChannel)
    .where(eq(bizChannel.id, id))
    .limit(1)

  if (!channel || channel.deletedAt) {
    return null
  }

  const categories = await db
    .select({
      categoryId: relChannelCategory.categoryId,
    })
    .from(relChannelCategory)
    .where(eq(relChannelCategory.channelId, id))

  return {
    ...channel,
    categoryIds: categories.map((category) => category.categoryId),
  }
}

export async function listAdminCrawlTasks() {
  const db = getDb()

  return db
    .select({
      id: bizChannel.id,
      siteName: bizSite.siteName,
      channelName: bizChannel.channelName,
      definitionKey: bizChannel.definitionKey,
      crawlIntervalSeconds: bizChannel.crawlIntervalSeconds,
      isCrawlEnabled: bizChannel.isCrawlEnabled,
      status: bizChannel.status,
      lastCrawlAt: bizChannel.lastCrawlAt,
      lastSuccessAt: bizChannel.lastSuccessAt,
    })
    .from(bizChannel)
    .innerJoin(bizSite, eq(bizChannel.siteId, bizSite.id))
    .where(isNull(bizChannel.deletedAt))
    .orderBy(
      asc(bizSite.sort),
      asc(bizChannel.sort),
      asc(bizChannel.channelName),
    )
}

export async function listAdminCrawlRuns(options?: {
  status?: CrawlRunStatus
}) {
  const db = getDb()
  const query = db
    .select({
      id: logCrawlRun.id,
      channelId: logCrawlRun.channelId,
      channelName: bizChannel.channelName,
      siteName: bizSite.siteName,
      definitionKey: bizChannel.definitionKey,
      runType: logCrawlRun.runType,
      status: logCrawlRun.status,
      startedAt: logCrawlRun.startedAt,
      finishedAt: logCrawlRun.finishedAt,
      durationMs: logCrawlRun.durationMs,
      fetchedCount: logCrawlRun.fetchedCount,
      insertedCount: logCrawlRun.insertedCount,
      snapshotId: logCrawlRun.snapshotId,
      errorMessage: logCrawlRun.errorMessage,
    })
    .from(logCrawlRun)
    .innerJoin(bizChannel, eq(logCrawlRun.channelId, bizChannel.id))
    .innerJoin(bizSite, eq(bizChannel.siteId, bizSite.id))
    .$dynamic()

  if (options?.status) {
    query.where(eq(logCrawlRun.status, options.status))
  }

  return query.orderBy(desc(logCrawlRun.startedAt)).limit(100)
}

export async function listAdminSnapshots() {
  const db = getDb()

  return db
    .select({
      id: bizChannelSnapshot.id,
      channelId: bizChannelSnapshot.channelId,
      channelName: bizChannel.channelName,
      siteName: bizSite.siteName,
      definitionKey: bizChannel.definitionKey,
      itemCount: bizChannelSnapshot.itemCount,
      contentHash: bizChannelSnapshot.contentHash,
      status: bizChannelSnapshot.status,
      snapshotTime: bizChannelSnapshot.snapshotTime,
      snapshotDate: bizChannelSnapshot.snapshotDate,
      createdAt: bizChannelSnapshot.createdAt,
    })
    .from(bizChannelSnapshot)
    .innerJoin(bizChannel, eq(bizChannelSnapshot.channelId, bizChannel.id))
    .innerJoin(bizSite, eq(bizChannel.siteId, bizSite.id))
    .orderBy(desc(bizChannelSnapshot.snapshotTime))
    .limit(100)
}

export async function getAdminSnapshot(id: string) {
  if (!isUuid(id)) {
    return null
  }

  const db = getDb()
  const [snapshot] = await db
    .select({
      id: bizChannelSnapshot.id,
      channelId: bizChannelSnapshot.channelId,
      channelName: bizChannel.channelName,
      siteName: bizSite.siteName,
      definitionKey: bizChannel.definitionKey,
      itemCount: bizChannelSnapshot.itemCount,
      contentHash: bizChannelSnapshot.contentHash,
      status: bizChannelSnapshot.status,
      snapshotTime: bizChannelSnapshot.snapshotTime,
      snapshotDate: bizChannelSnapshot.snapshotDate,
      createdAt: bizChannelSnapshot.createdAt,
    })
    .from(bizChannelSnapshot)
    .innerJoin(bizChannel, eq(bizChannelSnapshot.channelId, bizChannel.id))
    .innerJoin(bizSite, eq(bizChannel.siteId, bizSite.id))
    .where(eq(bizChannelSnapshot.id, id))
    .limit(1)

  if (!snapshot) {
    return null
  }

  const items = await db
    .select({
      id: bizSnapshotItem.id,
      rankNo: bizSnapshotItem.rankNo,
      title: bizSnapshotItem.title,
      url: bizSnapshotItem.url,
      imageUrl: bizSnapshotItem.imageUrl,
      summary: bizSnapshotItem.summary,
      hotValue: bizSnapshotItem.hotValue,
      hotLabel: bizSnapshotItem.hotLabel,
      tag: bizSnapshotItem.tag,
      publishedAt: bizSnapshotItem.publishedAt,
      createdAt: bizSnapshotItem.createdAt,
    })
    .from(bizSnapshotItem)
    .where(eq(bizSnapshotItem.snapshotId, id))
    .orderBy(asc(bizSnapshotItem.rankNo), asc(bizSnapshotItem.createdAt))

  return {
    ...snapshot,
    items,
  }
}

export async function listAdminLatestContents() {
  const db = getDb()

  return db
    .select({
      id: bizSnapshotItem.id,
      snapshotId: bizSnapshotItem.snapshotId,
      siteName: bizSite.siteName,
      siteSlug: bizSite.slug,
      channelName: bizChannel.channelName,
      channelSlug: bizChannel.slug,
      title: bizSnapshotItem.title,
      url: bizSnapshotItem.url,
      rankNo: bizSnapshotItem.rankNo,
      hotValue: bizSnapshotItem.hotValue,
      hotLabel: bizSnapshotItem.hotLabel,
      tag: bizSnapshotItem.tag,
      publishedAt: bizSnapshotItem.publishedAt,
      snapshotTime: bizChannelSnapshot.snapshotTime,
      createdAt: bizSnapshotItem.createdAt,
      blockedId: bizContentBlock.id,
    })
    .from(bizSnapshotItem)
    .innerJoin(bizChannel, eq(bizSnapshotItem.channelId, bizChannel.id))
    .innerJoin(bizSite, eq(bizChannel.siteId, bizSite.id))
    .innerJoin(
      bizChannelSnapshot,
      eq(bizSnapshotItem.snapshotId, bizChannelSnapshot.id),
    )
    .leftJoin(
      bizContentBlock,
      and(
        eq(bizSnapshotItem.urlHash, bizContentBlock.urlHash),
        isNull(bizContentBlock.deletedAt),
      ),
    )
    .where(and(isNull(bizChannel.deletedAt), isNull(bizSite.deletedAt)))
    .orderBy(desc(bizSnapshotItem.createdAt))
    .limit(100)
}

export async function listAdminHomeChannels() {
  const db = getDb()

  return db
    .select({
      id: bizChannel.id,
      siteName: bizSite.siteName,
      siteSlug: bizSite.slug,
      channelName: bizChannel.channelName,
      channelSlug: bizChannel.slug,
      definitionKey: bizChannel.definitionKey,
      status: bizChannel.status,
      isPublic: bizChannel.isPublic,
      isHomeVisible: bizChannel.isHomeVisible,
      isSubscribable: bizChannel.isSubscribable,
      weight: bizChannel.weight,
      sort: bizChannel.sort,
      lastSuccessAt: bizChannel.lastSuccessAt,
      snapshotId: bizChannel.lastSnapshotId,
      snapshotItemCount: bizChannelSnapshot.itemCount,
      snapshotTime: bizChannelSnapshot.snapshotTime,
    })
    .from(bizChannel)
    .innerJoin(bizSite, eq(bizChannel.siteId, bizSite.id))
    .leftJoin(
      bizChannelSnapshot,
      eq(bizChannel.lastSnapshotId, bizChannelSnapshot.id),
    )
    .where(
      and(isNull(bizChannel.deletedAt), eq(bizChannel.isHomeVisible, true)),
    )
    .orderBy(
      desc(bizChannel.weight),
      asc(bizSite.sort),
      asc(bizChannel.sort),
      asc(bizChannel.channelName),
    )
}

export async function listAdminHotSitesOperation() {
  const db = getDb()
  const sites = await db
    .select({
      id: bizSite.id,
      siteName: bizSite.siteName,
      slug: bizSite.slug,
      homepageUrl: bizSite.homepageUrl,
      status: bizSite.status,
      isVisible: bizSite.isVisible,
      sort: bizSite.sort,
      updatedAt: bizSite.updatedAt,
    })
    .from(bizSite)
    .where(isNull(bizSite.deletedAt))
    .orderBy(asc(bizSite.sort), asc(bizSite.siteName))

  const siteIds = sites.map((site) => site.id)

  if (siteIds.length === 0) {
    return []
  }

  const [channelCounts, homeChannelCounts] = await Promise.all([
    db
      .select({
        siteId: bizChannel.siteId,
        value: count(),
      })
      .from(bizChannel)
      .where(
        and(
          inArray(bizChannel.siteId, siteIds),
          isNull(bizChannel.deletedAt),
          eq(bizChannel.status, "active"),
          eq(bizChannel.isPublic, true),
        ),
      )
      .groupBy(bizChannel.siteId),
    db
      .select({
        siteId: bizChannel.siteId,
        value: count(),
      })
      .from(bizChannel)
      .where(
        and(
          inArray(bizChannel.siteId, siteIds),
          isNull(bizChannel.deletedAt),
          eq(bizChannel.status, "active"),
          eq(bizChannel.isPublic, true),
          eq(bizChannel.isHomeVisible, true),
        ),
      )
      .groupBy(bizChannel.siteId),
  ])

  const channelCountBySiteId = new Map(
    channelCounts.map((row) => [row.siteId, Number(row.value)]),
  )
  const homeChannelCountBySiteId = new Map(
    homeChannelCounts.map((row) => [row.siteId, Number(row.value)]),
  )

  return sites.map((site) => ({
    ...site,
    activePublicChannelCount: channelCountBySiteId.get(site.id) ?? 0,
    homeChannelCount: homeChannelCountBySiteId.get(site.id) ?? 0,
  }))
}

export async function listAdminNavCategoriesOperation() {
  const db = getDb()
  const categories = await db
    .select({
      id: bizCategory.id,
      categoryName: bizCategory.categoryName,
      slug: bizCategory.slug,
      icon: bizCategory.icon,
      color: bizCategory.color,
      status: bizCategory.status,
      isNavVisible: bizCategory.isNavVisible,
      isHomeVisible: bizCategory.isHomeVisible,
      sort: bizCategory.sort,
    })
    .from(bizCategory)
    .where(isNull(bizCategory.deletedAt))
    .orderBy(asc(bizCategory.sort), asc(bizCategory.categoryName))

  const categoryIds = categories.map((category) => category.id)

  if (categoryIds.length === 0) {
    return []
  }

  const channelCounts = await db
    .select({
      categoryId: relChannelCategory.categoryId,
      value: count(),
    })
    .from(relChannelCategory)
    .innerJoin(bizChannel, eq(relChannelCategory.channelId, bizChannel.id))
    .where(
      and(
        inArray(relChannelCategory.categoryId, categoryIds),
        isNull(bizChannel.deletedAt),
        eq(bizChannel.status, "active"),
        eq(bizChannel.isPublic, true),
      ),
    )
    .groupBy(relChannelCategory.categoryId)

  const channelCountByCategoryId = new Map(
    channelCounts.map((row) => [row.categoryId, Number(row.value)]),
  )

  return categories.map((category) => ({
    ...category,
    activePublicChannelCount: channelCountByCategoryId.get(category.id) ?? 0,
  }))
}

export async function listAdminBlockedContents() {
  const db = getDb()

  return db
    .select({
      id: bizContentBlock.id,
      title: bizContentBlock.title,
      url: bizContentBlock.url,
      reason: bizContentBlock.reason,
      urlHash: bizContentBlock.urlHash,
      createdAt: bizContentBlock.createdAt,
      updatedAt: bizContentBlock.updatedAt,
      creatorEmail: sysUser.email,
      creatorName: sysUser.displayName,
    })
    .from(bizContentBlock)
    .leftJoin(sysUser, eq(bizContentBlock.createdBy, sysUser.id))
    .where(isNull(bizContentBlock.deletedAt))
    .orderBy(desc(bizContentBlock.createdAt))
    .limit(100)
}

export async function listAdminDailyReports() {
  const db = getDb()

  return db
    .select({
      id: bizDailyReport.id,
      reportDate: bizDailyReport.reportDate,
      title: bizDailyReport.title,
      summary: bizDailyReport.summary,
      status: bizDailyReport.status,
      publishedAt: bizDailyReport.publishedAt,
      channelLimit: bizDailyReport.channelLimit,
      itemLimitPerChannel: bizDailyReport.itemLimitPerChannel,
      updatedAt: bizDailyReport.updatedAt,
    })
    .from(bizDailyReport)
    .where(isNull(bizDailyReport.deletedAt))
    .orderBy(desc(bizDailyReport.reportDate))
    .limit(60)
}

export async function listAdminTopics() {
  const db = getDb()

  return db
    .select({
      id: bizTopic.id,
      topicName: bizTopic.topicName,
      slug: bizTopic.slug,
      description: bizTopic.description,
      keywords: bizTopic.keywords,
      status: bizTopic.status,
      isHomeVisible: bizTopic.isHomeVisible,
      sort: bizTopic.sort,
      updatedAt: bizTopic.updatedAt,
      createdAt: bizTopic.createdAt,
    })
    .from(bizTopic)
    .where(isNull(bizTopic.deletedAt))
    .orderBy(asc(bizTopic.sort), asc(bizTopic.topicName))
}

export async function listAdminTrackingRules() {
  const db = getDb()

  return db
    .select({
      id: userTrackingRule.id,
      keyword: userTrackingRule.keyword,
      description: userTrackingRule.description,
      isEnabled: userTrackingRule.isEnabled,
      notifyEnabled: userTrackingRule.notifyEnabled,
      lastMatchedAt: userTrackingRule.lastMatchedAt,
      createdAt: userTrackingRule.createdAt,
      updatedAt: userTrackingRule.updatedAt,
      userEmail: sysUser.email,
      userDisplayName: sysUser.displayName,
    })
    .from(userTrackingRule)
    .innerJoin(sysUser, eq(userTrackingRule.userId, sysUser.id))
    .orderBy(desc(userTrackingRule.createdAt))
    .limit(100)
}

export function getAdminSystemOverview() {
  const definitions = listChannelDefinitions()

  return {
    appUrl: serverEnv.appUrl,
    nodeEnv: process.env.NODE_ENV ?? "development",
    databaseConfigured: Boolean(serverEnv.databaseUrl),
    redisConfigured: Boolean(serverEnv.redisUrl),
    authSecretConfigured: Boolean(serverEnv.authSecret),
    adminEmail: serverEnv.adminEmail ?? null,
    crawlConcurrency: serverEnv.crawlConcurrency,
    crawlDefaultIntervalSeconds: serverEnv.crawlDefaultIntervalSeconds,
    crawlRunningTimeoutSeconds: Number(
      process.env.CRAWL_RUNNING_TIMEOUT_SECONDS ?? 15 * 60,
    ),
    channelDefinitionCount: definitions.length,
    channelDefinitions: definitions,
  }
}

export async function listAdminUsers() {
  const db = getDb()
  const users = await db
    .select({
      id: sysUser.id,
      email: sysUser.email,
      displayName: sysUser.displayName,
      role: sysUser.role,
      status: sysUser.status,
      lastLoginAt: sysUser.lastLoginAt,
      createdAt: sysUser.createdAt,
    })
    .from(sysUser)
    .orderBy(desc(sysUser.createdAt))
    .limit(100)

  const userIds = users.map((user) => user.id)

  if (userIds.length === 0) {
    return users.map((user) => ({ ...user, subscriptionCount: 0 }))
  }

  const subscriptionCounts = await db
    .select({
      userId: relUserChannelSubscription.userId,
      value: count(),
    })
    .from(relUserChannelSubscription)
    .where(inArray(relUserChannelSubscription.userId, userIds))
    .groupBy(relUserChannelSubscription.userId)

  const countByUserId = new Map(
    subscriptionCounts.map((row) => [row.userId, Number(row.value)]),
  )

  return users.map((user) => ({
    ...user,
    subscriptionCount: countByUserId.get(user.id) ?? 0,
  }))
}

export async function listAdminUserSubscriptions() {
  const db = getDb()

  return db
    .select({
      id: relUserChannelSubscription.id,
      userEmail: sysUser.email,
      userDisplayName: sysUser.displayName,
      siteName: bizSite.siteName,
      channelName: bizChannel.channelName,
      definitionKey: bizChannel.definitionKey,
      isPinned: relUserChannelSubscription.isPinned,
      notifyEnabled: relUserChannelSubscription.notifyEnabled,
      createdAt: relUserChannelSubscription.createdAt,
    })
    .from(relUserChannelSubscription)
    .innerJoin(sysUser, eq(relUserChannelSubscription.userId, sysUser.id))
    .innerJoin(
      bizChannel,
      eq(relUserChannelSubscription.channelId, bizChannel.id),
    )
    .innerJoin(bizSite, eq(bizChannel.siteId, bizSite.id))
    .orderBy(desc(relUserChannelSubscription.createdAt))
    .limit(100)
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
}
