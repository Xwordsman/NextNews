import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  sql,
} from "drizzle-orm"
import { listChannelDefinitions } from "@/server/channels/registry"
import { getDb } from "@/server/db/client"
import {
  bizCategory,
  bizChannel,
  bizChannelSnapshot,
  bizContentBlock,
  bizDailyReport,
  bizDailyReportItem,
  bizDailyReportTemplate,
  bizHomeModule,
  bizRankingConfig,
  bizSite,
  bizSnapshotItem,
  bizTopic,
  logSearchQuery,
  logCrawlRun,
  membershipOrder,
  membershipPlan,
  relRankingChannel,
  relChannelCategory,
  relTopicSnapshotItem,
  relUserChannelSubscription,
  sysJobQueue,
  sysOperationLog,
  sysUser,
  userBookmark,
  userMembership,
  userNotification,
  userReadHistory,
  userTrackingMatch,
  userTrackingRule,
} from "@/server/db/schema"
import { matchesKeywords, parseKeywords } from "@/server/content/keywords"
import { serverEnv } from "@/server/env"
import {
  appSettingDefinitions,
  getAppSettings,
} from "@/server/settings/app-settings"

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

export async function listAdminHomeModules() {
  const { defaultHomeModules } = await import("@/server/home/modules")
  const rows = await getDb()
    .select({
      id: bizHomeModule.id,
      moduleKey: bizHomeModule.moduleKey,
      title: bizHomeModule.title,
      subtitle: bizHomeModule.subtitle,
      status: bizHomeModule.status,
      sort: bizHomeModule.sort,
      displayLimit: bizHomeModule.displayLimit,
      updatedAt: bizHomeModule.updatedAt,
    })
    .from(bizHomeModule)
    .where(isNull(bizHomeModule.deletedAt))
    .orderBy(asc(bizHomeModule.sort))

  const rowByKey = new Map(rows.map((row) => [row.moduleKey, row]))

  return defaultHomeModules
    .map((module) => {
      const saved = rowByKey.get(module.moduleKey)

      return {
        id: saved?.id ?? null,
        moduleKey: module.moduleKey,
        title: saved?.title ?? module.title,
        subtitle: saved?.subtitle ?? module.subtitle,
        status: saved?.status ?? "active",
        sort: saved?.sort ?? module.sort,
        displayLimit: saved?.displayLimit ?? module.displayLimit,
        updatedAt: saved?.updatedAt ?? null,
      }
    })
    .sort((a, b) => a.sort - b.sort)
}

export async function listAdminRankingConfigs() {
  const db = getDb()
  const configs = await db
    .select({
      id: bizRankingConfig.id,
      configName: bizRankingConfig.configName,
      slug: bizRankingConfig.slug,
      description: bizRankingConfig.description,
      status: bizRankingConfig.status,
      isDefault: bizRankingConfig.isDefault,
      timeWindowHours: bizRankingConfig.timeWindowHours,
      itemLimit: bizRankingConfig.itemLimit,
      perChannelLimit: bizRankingConfig.perChannelLimit,
      sort: bizRankingConfig.sort,
      updatedAt: bizRankingConfig.updatedAt,
    })
    .from(bizRankingConfig)
    .where(isNull(bizRankingConfig.deletedAt))
    .orderBy(desc(bizRankingConfig.isDefault), asc(bizRankingConfig.sort))

  if (configs.length === 0) {
    return []
  }

  const rankingIds = configs.map((config) => config.id)
  const channels = await db
    .select({
      rankingId: relRankingChannel.rankingId,
      channelName: bizChannel.channelName,
      siteName: bizSite.siteName,
      weight: relRankingChannel.weight,
    })
    .from(relRankingChannel)
    .innerJoin(bizChannel, eq(relRankingChannel.channelId, bizChannel.id))
    .innerJoin(bizSite, eq(bizChannel.siteId, bizSite.id))
    .where(inArray(relRankingChannel.rankingId, rankingIds))
    .orderBy(asc(relRankingChannel.sort))

  const channelMap = new Map<string, typeof channels>()

  for (const channel of channels) {
    const items = channelMap.get(channel.rankingId) ?? []
    items.push(channel)
    channelMap.set(channel.rankingId, items)
  }

  return configs.map((config) => ({
    ...config,
    channels: channelMap.get(config.id) ?? [],
  }))
}

export async function listAdminRankingChannelOptions() {
  return getDb()
    .select({
      id: bizChannel.id,
      channelName: bizChannel.channelName,
      siteName: bizSite.siteName,
      weight: bizChannel.weight,
      status: bizChannel.status,
      isPublic: bizChannel.isPublic,
      lastSuccessAt: bizChannel.lastSuccessAt,
    })
    .from(bizChannel)
    .innerJoin(bizSite, eq(bizChannel.siteId, bizSite.id))
    .where(and(isNull(bizChannel.deletedAt), isNull(bizSite.deletedAt)))
    .orderBy(asc(bizSite.sort), asc(bizChannel.sort))
}

export async function getAdminTopicOperation(id: string) {
  if (!isUuid(id)) {
    return null
  }

  const db = getDb()
  const [topic] = await db
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
    })
    .from(bizTopic)
    .where(and(eq(bizTopic.id, id), isNull(bizTopic.deletedAt)))
    .limit(1)

  if (!topic) {
    return null
  }

  const keywords = parseKeywords(topic.keywords || topic.topicName)
  const [manualItems, latestItems] = await Promise.all([
    db
      .select({
        relationId: relTopicSnapshotItem.id,
        snapshotItemId: bizSnapshotItem.id,
        title: bizSnapshotItem.title,
        url: bizSnapshotItem.url,
        rankNo: bizSnapshotItem.rankNo,
        siteName: bizSite.siteName,
        channelName: bizChannel.channelName,
        sort: relTopicSnapshotItem.sort,
        isPinned: relTopicSnapshotItem.isPinned,
        createdAt: relTopicSnapshotItem.createdAt,
      })
      .from(relTopicSnapshotItem)
      .innerJoin(
        bizSnapshotItem,
        eq(relTopicSnapshotItem.snapshotItemId, bizSnapshotItem.id),
      )
      .innerJoin(bizChannel, eq(bizSnapshotItem.channelId, bizChannel.id))
      .innerJoin(bizSite, eq(bizChannel.siteId, bizSite.id))
      .where(eq(relTopicSnapshotItem.topicId, topic.id))
      .orderBy(
        desc(relTopicSnapshotItem.isPinned),
        asc(relTopicSnapshotItem.sort),
      ),
    db
      .select({
        snapshotItemId: bizSnapshotItem.id,
        title: bizSnapshotItem.title,
        url: bizSnapshotItem.url,
        rankNo: bizSnapshotItem.rankNo,
        summary: bizSnapshotItem.summary,
        tag: bizSnapshotItem.tag,
        siteName: bizSite.siteName,
        channelName: bizChannel.channelName,
        createdAt: bizSnapshotItem.createdAt,
      })
      .from(bizSnapshotItem)
      .innerJoin(bizChannel, eq(bizSnapshotItem.channelId, bizChannel.id))
      .innerJoin(bizSite, eq(bizChannel.siteId, bizSite.id))
      .where(
        and(
          isNull(bizChannel.deletedAt),
          isNull(bizSite.deletedAt),
          eq(bizChannel.status, "active"),
          eq(bizChannel.isPublic, true),
        ),
      )
      .orderBy(desc(bizSnapshotItem.createdAt))
      .limit(300),
  ])

  const manualIds = new Set(manualItems.map((item) => item.snapshotItemId))
  const candidates = latestItems
    .filter((item) => !manualIds.has(item.snapshotItemId))
    .filter((item) => matchesKeywords(item, keywords))
    .slice(0, 30)

  return {
    topic: {
      ...topic,
      keywords,
    },
    manualItems,
    candidates,
  }
}

export async function listAdminTrackingMatches() {
  return getDb()
    .select({
      id: userTrackingMatch.id,
      title: userTrackingMatch.title,
      url: userTrackingMatch.url,
      matchedKeyword: userTrackingMatch.matchedKeyword,
      isRead: userTrackingMatch.isRead,
      matchedAt: userTrackingMatch.matchedAt,
      userEmail: sysUser.email,
      userDisplayName: sysUser.displayName,
      ruleKeyword: userTrackingRule.keyword,
    })
    .from(userTrackingMatch)
    .innerJoin(sysUser, eq(userTrackingMatch.userId, sysUser.id))
    .innerJoin(
      userTrackingRule,
      eq(userTrackingMatch.ruleId, userTrackingRule.id),
    )
    .orderBy(desc(userTrackingMatch.matchedAt))
    .limit(100)
}

export async function listAdminNotifications() {
  return getDb()
    .select({
      id: userNotification.id,
      notificationType: userNotification.notificationType,
      title: userNotification.title,
      body: userNotification.body,
      isRead: userNotification.isRead,
      createdAt: userNotification.createdAt,
      userEmail: sysUser.email,
      userDisplayName: sysUser.displayName,
    })
    .from(userNotification)
    .innerJoin(sysUser, eq(userNotification.userId, sysUser.id))
    .orderBy(desc(userNotification.createdAt))
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

export async function getAdminSystemSettings() {
  const settings = await getAppSettings()

  return appSettingDefinitions.map((definition) => ({
    ...definition,
    value: settings[definition.key],
  }))
}

export async function listAdminMembershipPlans() {
  return getDb()
    .select()
    .from(membershipPlan)
    .where(isNull(membershipPlan.deletedAt))
    .orderBy(asc(membershipPlan.sort), asc(membershipPlan.priceCents))
}

export async function listAdminMembershipOrders() {
  return getDb()
    .select({
      id: membershipOrder.id,
      planKey: membershipOrder.planKey,
      planName: membershipOrder.planName,
      amountCents: membershipOrder.amountCents,
      currency: membershipOrder.currency,
      status: membershipOrder.status,
      paymentProvider: membershipOrder.paymentProvider,
      providerTradeNo: membershipOrder.providerTradeNo,
      paidAt: membershipOrder.paidAt,
      expiresAt: membershipOrder.expiresAt,
      createdAt: membershipOrder.createdAt,
      userEmail: sysUser.email,
      userDisplayName: sysUser.displayName,
    })
    .from(membershipOrder)
    .innerJoin(sysUser, eq(membershipOrder.userId, sysUser.id))
    .orderBy(desc(membershipOrder.createdAt))
    .limit(100)
}

export async function getAdminSearchAnalytics() {
  const db = getDb()
  const trendDays = getRecentDateKeys(14)
  const trendSince = dateKeyToStart(trendDays[0] ?? formatDateKey(new Date()))
  const searchTrendDate = sql<string>`to_char(date_trunc('day', ${logSearchQuery.createdAt} AT TIME ZONE 'Asia/Shanghai'), 'YYYY-MM-DD')`

  const [recentLogs, hotKeywords, trendRows, zeroResultKeywords] =
    await Promise.all([
      db
        .select({
          id: logSearchQuery.id,
          keyword: logSearchQuery.keyword,
          siteSlug: logSearchQuery.siteSlug,
          channelId: logSearchQuery.channelId,
          dateFrom: logSearchQuery.dateFrom,
          dateTo: logSearchQuery.dateTo,
          resultCount: logSearchQuery.resultCount,
          createdAt: logSearchQuery.createdAt,
          userEmail: sysUser.email,
          userDisplayName: sysUser.displayName,
        })
        .from(logSearchQuery)
        .leftJoin(sysUser, eq(logSearchQuery.userId, sysUser.id))
        .orderBy(desc(logSearchQuery.createdAt))
        .limit(100),
      db
        .select({
          keyword: logSearchQuery.keyword,
          searchCount: count(),
          averageResultCount: sql<number>`round(avg(${logSearchQuery.resultCount}))`,
          zeroResultCount: sql<number>`sum(case when ${logSearchQuery.resultCount} = 0 then 1 else 0 end)`,
          lastSearchedAt: sql<Date>`max(${logSearchQuery.createdAt})`,
        })
        .from(logSearchQuery)
        .groupBy(logSearchQuery.keyword)
        .orderBy(desc(count()), desc(sql`max(${logSearchQuery.createdAt})`))
        .limit(30),
      db
        .select({
          date: searchTrendDate,
          searchCount: count(),
          averageResultCount: sql<number>`round(avg(${logSearchQuery.resultCount}))`,
          zeroResultCount: sql<number>`sum(case when ${logSearchQuery.resultCount} = 0 then 1 else 0 end)`,
        })
        .from(logSearchQuery)
        .where(gte(logSearchQuery.createdAt, trendSince))
        .groupBy(searchTrendDate)
        .orderBy(asc(searchTrendDate)),
      db
        .select({
          keyword: logSearchQuery.keyword,
          searchCount: count(),
          lastSearchedAt: sql<Date>`max(${logSearchQuery.createdAt})`,
        })
        .from(logSearchQuery)
        .where(eq(logSearchQuery.resultCount, 0))
        .groupBy(logSearchQuery.keyword)
        .orderBy(desc(count()), desc(sql`max(${logSearchQuery.createdAt})`))
        .limit(20),
    ])

  const trendByDate = new Map(trendRows.map((row) => [row.date, row]))
  const trend = trendDays.map((date) => {
    const row = trendByDate.get(date)

    return {
      date,
      averageResultCount: Number(row?.averageResultCount ?? 0),
      searchCount: Number(row?.searchCount ?? 0),
      zeroResultCount: Number(row?.zeroResultCount ?? 0),
    }
  })
  const totalSearches = trend.reduce((sum, item) => sum + item.searchCount, 0)
  const totalZeroResults = trend.reduce(
    (sum, item) => sum + item.zeroResultCount,
    0,
  )

  return {
    hotKeywords,
    quality: {
      totalSearches,
      totalZeroResults,
      zeroResultRate:
        totalSearches === 0
          ? 0
          : Math.round((totalZeroResults / totalSearches) * 1000) / 10,
    },
    recentLogs,
    trend,
    zeroResultKeywords,
  }
}

export async function listAdminDailyReportTemplates() {
  return getDb()
    .select()
    .from(bizDailyReportTemplate)
    .orderBy(
      asc(bizDailyReportTemplate.sort),
      asc(bizDailyReportTemplate.templateName),
    )
}

export async function getAdminSystemOperations() {
  const db = getDb()
  const [operationLogs, jobRows, jobCounts] = await Promise.all([
    db
      .select({
        id: sysOperationLog.id,
        action: sysOperationLog.action,
        targetType: sysOperationLog.targetType,
        targetId: sysOperationLog.targetId,
        summary: sysOperationLog.summary,
        sourceIp: sysOperationLog.sourceIp,
        createdAt: sysOperationLog.createdAt,
        adminEmail: sysUser.email,
        adminName: sysUser.displayName,
      })
      .from(sysOperationLog)
      .leftJoin(sysUser, eq(sysOperationLog.adminId, sysUser.id))
      .orderBy(desc(sysOperationLog.createdAt))
      .limit(100),
    db
      .select({
        id: sysJobQueue.id,
        jobType: sysJobQueue.jobType,
        status: sysJobQueue.status,
        attempts: sysJobQueue.attempts,
        maxAttempts: sysJobQueue.maxAttempts,
        availableAt: sysJobQueue.availableAt,
        finishedAt: sysJobQueue.finishedAt,
        errorMessage: sysJobQueue.errorMessage,
        createdAt: sysJobQueue.createdAt,
      })
      .from(sysJobQueue)
      .orderBy(desc(sysJobQueue.createdAt))
      .limit(100),
    db
      .select({
        status: sysJobQueue.status,
        value: count(),
      })
      .from(sysJobQueue)
      .groupBy(sysJobQueue.status),
  ])

  return {
    jobCounts,
    jobs: jobRows,
    operationLogs,
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
    return users.map((user) => ({
      ...user,
      membershipExpiresAt: null,
      membershipHistoryDays: 30,
      membershipPlanKey: "free",
      membershipPlanName: "免费用户",
      membershipStatus: null,
      subscriptionCount: 0,
    }))
  }

  const [subscriptionCounts, memberships] = await Promise.all([
    db
      .select({
        userId: relUserChannelSubscription.userId,
        value: count(),
      })
      .from(relUserChannelSubscription)
      .where(inArray(relUserChannelSubscription.userId, userIds))
      .groupBy(relUserChannelSubscription.userId),
    db
      .select({
        userId: userMembership.userId,
        planKey: userMembership.planKey,
        planName: userMembership.planName,
        status: userMembership.status,
        historyDays: userMembership.historyDays,
        expiresAt: userMembership.expiresAt,
      })
      .from(userMembership)
      .where(inArray(userMembership.userId, userIds)),
  ])

  const countByUserId = new Map(
    subscriptionCounts.map((row) => [row.userId, Number(row.value)]),
  )
  const membershipByUserId = new Map(
    memberships.map((membership) => [membership.userId, membership]),
  )

  return users.map((user) => ({
    ...user,
    membershipExpiresAt: membershipByUserId.get(user.id)?.expiresAt ?? null,
    membershipHistoryDays: membershipByUserId.get(user.id)?.historyDays ?? 30,
    membershipPlanKey: membershipByUserId.get(user.id)?.planKey ?? "free",
    membershipPlanName: membershipByUserId.get(user.id)?.planName ?? "免费用户",
    membershipStatus: membershipByUserId.get(user.id)?.status ?? null,
    subscriptionCount: countByUserId.get(user.id) ?? 0,
  }))
}

export async function getAdminOperationsAnalytics() {
  const db = getDb()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const trendDays = getRecentDateKeys(14)
  const trendSince = dateKeyToStart(trendDays[0] ?? formatDateKey(new Date()))
  const snapshotTrendDate = sql<string>`to_char(date_trunc('day', ${bizChannelSnapshot.snapshotTime} AT TIME ZONE 'Asia/Shanghai'), 'YYYY-MM-DD')`
  const itemTrendDate = sql<string>`to_char(date_trunc('day', ${bizSnapshotItem.createdAt} AT TIME ZONE 'Asia/Shanghai'), 'YYYY-MM-DD')`
  const crawlTrendDate = sql<string>`to_char(date_trunc('day', ${logCrawlRun.startedAt} AT TIME ZONE 'Asia/Shanghai'), 'YYYY-MM-DD')`
  const searchTrendDate = sql<string>`to_char(date_trunc('day', ${logSearchQuery.createdAt} AT TIME ZONE 'Asia/Shanghai'), 'YYYY-MM-DD')`
  const notificationTrendDate = sql<string>`to_char(date_trunc('day', ${userNotification.createdAt} AT TIME ZONE 'Asia/Shanghai'), 'YYYY-MM-DD')`
  const readTrendDate = sql<string>`to_char(date_trunc('day', ${userReadHistory.lastReadAt} AT TIME ZONE 'Asia/Shanghai'), 'YYYY-MM-DD')`

  const [
    [activeChannelCount],
    [homeChannelCount],
    [todaySnapshotCount],
    [todayItemCount],
    [todayFailedRunCount],
    [userCount],
    [subscriptionCount],
    [activeMembershipCount],
    [todayNotificationCount],
    [unreadNotificationCount],
    [todayTrackingMatchCount],
    [activeDailyReportCount],
    [todaySearchCount],
    [bookmarkCount],
    [todayReadCount],
    [pendingJobCount],
    [failedJobCount],
    snapshotTrendRows,
    itemTrendRows,
    failedRunTrendRows,
    searchTrendRows,
    notificationTrendRows,
    readTrendRows,
    failedRows,
    channelRows,
  ] = await Promise.all([
    db
      .select({ value: count() })
      .from(bizChannel)
      .where(
        and(isNull(bizChannel.deletedAt), eq(bizChannel.status, "active")),
      ),
    db
      .select({ value: count() })
      .from(bizChannel)
      .where(
        and(
          isNull(bizChannel.deletedAt),
          eq(bizChannel.status, "active"),
          eq(bizChannel.isHomeVisible, true),
        ),
      ),
    db
      .select({ value: count() })
      .from(bizChannelSnapshot)
      .where(gte(bizChannelSnapshot.snapshotTime, today)),
    db
      .select({ value: count() })
      .from(bizSnapshotItem)
      .where(gte(bizSnapshotItem.createdAt, today)),
    db
      .select({ value: count() })
      .from(logCrawlRun)
      .where(
        and(
          eq(logCrawlRun.status, "failed"),
          gte(logCrawlRun.startedAt, today),
        ),
      ),
    db.select({ value: count() }).from(sysUser),
    db.select({ value: count() }).from(relUserChannelSubscription),
    db
      .select({ value: count() })
      .from(userMembership)
      .where(eq(userMembership.status, "active")),
    db
      .select({ value: count() })
      .from(userNotification)
      .where(gte(userNotification.createdAt, today)),
    db
      .select({ value: count() })
      .from(userNotification)
      .where(eq(userNotification.isRead, false)),
    db
      .select({ value: count() })
      .from(userTrackingMatch)
      .where(gte(userTrackingMatch.matchedAt, today)),
    db
      .select({ value: count() })
      .from(bizDailyReport)
      .where(
        and(
          isNull(bizDailyReport.deletedAt),
          eq(bizDailyReport.status, "active"),
        ),
      ),
    db
      .select({ value: count() })
      .from(logSearchQuery)
      .where(gte(logSearchQuery.createdAt, today)),
    db.select({ value: count() }).from(userBookmark),
    db
      .select({ value: count() })
      .from(userReadHistory)
      .where(gte(userReadHistory.lastReadAt, today)),
    db
      .select({ value: count() })
      .from(sysJobQueue)
      .where(eq(sysJobQueue.status, "pending")),
    db
      .select({ value: count() })
      .from(sysJobQueue)
      .where(eq(sysJobQueue.status, "failed")),
    db
      .select({
        date: snapshotTrendDate,
        value: count(),
      })
      .from(bizChannelSnapshot)
      .where(gte(bizChannelSnapshot.snapshotTime, trendSince))
      .groupBy(snapshotTrendDate)
      .orderBy(asc(snapshotTrendDate)),
    db
      .select({
        date: itemTrendDate,
        value: count(),
      })
      .from(bizSnapshotItem)
      .where(gte(bizSnapshotItem.createdAt, trendSince))
      .groupBy(itemTrendDate)
      .orderBy(asc(itemTrendDate)),
    db
      .select({
        date: crawlTrendDate,
        value: count(),
      })
      .from(logCrawlRun)
      .where(
        and(
          eq(logCrawlRun.status, "failed"),
          gte(logCrawlRun.startedAt, trendSince),
        ),
      )
      .groupBy(crawlTrendDate)
      .orderBy(asc(crawlTrendDate)),
    db
      .select({
        date: searchTrendDate,
        value: count(),
      })
      .from(logSearchQuery)
      .where(gte(logSearchQuery.createdAt, trendSince))
      .groupBy(searchTrendDate)
      .orderBy(asc(searchTrendDate)),
    db
      .select({
        date: notificationTrendDate,
        value: count(),
      })
      .from(userNotification)
      .where(gte(userNotification.createdAt, trendSince))
      .groupBy(notificationTrendDate)
      .orderBy(asc(notificationTrendDate)),
    db
      .select({
        date: readTrendDate,
        value: count(),
      })
      .from(userReadHistory)
      .where(gte(userReadHistory.lastReadAt, trendSince))
      .groupBy(readTrendDate)
      .orderBy(asc(readTrendDate)),
    db
      .select({
        channelId: logCrawlRun.channelId,
        value: count(),
      })
      .from(logCrawlRun)
      .where(
        and(
          eq(logCrawlRun.status, "failed"),
          gte(logCrawlRun.startedAt, today),
        ),
      )
      .groupBy(logCrawlRun.channelId),
    db
      .select({
        id: bizChannel.id,
        siteName: bizSite.siteName,
        channelName: bizChannel.channelName,
        definitionKey: bizChannel.definitionKey,
        crawlIntervalSeconds: bizChannel.crawlIntervalSeconds,
        isCrawlEnabled: bizChannel.isCrawlEnabled,
        lastCrawlAt: bizChannel.lastCrawlAt,
        lastSuccessAt: bizChannel.lastSuccessAt,
        status: bizChannel.status,
        snapshotId: bizChannelSnapshot.id,
        snapshotItemCount: bizChannelSnapshot.itemCount,
        snapshotTime: bizChannelSnapshot.snapshotTime,
      })
      .from(bizChannel)
      .innerJoin(bizSite, eq(bizChannel.siteId, bizSite.id))
      .leftJoin(
        bizChannelSnapshot,
        eq(bizChannel.lastSnapshotId, bizChannelSnapshot.id),
      )
      .where(and(isNull(bizChannel.deletedAt), isNull(bizSite.deletedAt)))
      .orderBy(
        desc(bizChannel.lastSuccessAt),
        asc(bizSite.sort),
        asc(bizChannel.sort),
      )
      .limit(30),
  ])

  const failedCountByChannelId = new Map(
    failedRows.map((row) => [row.channelId, Number(row.value)]),
  )
  const dailyTrend = trendDays.map((date) => ({
    date,
    failedRuns: valueForDate(failedRunTrendRows, date),
    items: valueForDate(itemTrendRows, date),
    notifications: valueForDate(notificationTrendRows, date),
    reads: valueForDate(readTrendRows, date),
    searches: valueForDate(searchTrendRows, date),
    snapshots: valueForDate(snapshotTrendRows, date),
  }))
  const channelHealth = channelRows.map((channel) => ({
    ...channel,
    todayFailedRuns: failedCountByChannelId.get(channel.id) ?? 0,
  }))
  const stats = {
    activeChannels: Number(activeChannelCount?.value ?? 0),
    homeChannels: Number(homeChannelCount?.value ?? 0),
    todaySnapshots: Number(todaySnapshotCount?.value ?? 0),
    todayItems: Number(todayItemCount?.value ?? 0),
    todayFailedRuns: Number(todayFailedRunCount?.value ?? 0),
    users: Number(userCount?.value ?? 0),
    subscriptions: Number(subscriptionCount?.value ?? 0),
    activeMemberships: Number(activeMembershipCount?.value ?? 0),
    todayNotifications: Number(todayNotificationCount?.value ?? 0),
    unreadNotifications: Number(unreadNotificationCount?.value ?? 0),
    todayTrackingMatches: Number(todayTrackingMatchCount?.value ?? 0),
    activeDailyReports: Number(activeDailyReportCount?.value ?? 0),
    todaySearches: Number(todaySearchCount?.value ?? 0),
    bookmarks: Number(bookmarkCount?.value ?? 0),
    todayReads: Number(todayReadCount?.value ?? 0),
    pendingJobs: Number(pendingJobCount?.value ?? 0),
    failedJobs: Number(failedJobCount?.value ?? 0),
  }
  const alerts = buildOperationsAlerts({ channelHealth, stats })

  return {
    alerts,
    channelHealth,
    dailyTrend,
    stats,
  }
}

export async function getAdminDailyReportOperation(id: string) {
  if (!isUuid(id)) {
    return null
  }

  const db = getDb()
  const [report] = await db
    .select({
      id: bizDailyReport.id,
      reportDate: bizDailyReport.reportDate,
      title: bizDailyReport.title,
      summary: bizDailyReport.summary,
      status: bizDailyReport.status,
      channelLimit: bizDailyReport.channelLimit,
      itemLimitPerChannel: bizDailyReport.itemLimitPerChannel,
      publishedAt: bizDailyReport.publishedAt,
      updatedAt: bizDailyReport.updatedAt,
    })
    .from(bizDailyReport)
    .where(and(eq(bizDailyReport.id, id), isNull(bizDailyReport.deletedAt)))
    .limit(1)

  if (!report) {
    return null
  }

  const [manualItems, latestItems] = await Promise.all([
    db
      .select({
        relationId: bizDailyReportItem.id,
        snapshotItemId: bizSnapshotItem.id,
        title: bizSnapshotItem.title,
        url: bizSnapshotItem.url,
        rankNo: bizSnapshotItem.rankNo,
        hotValue: bizSnapshotItem.hotValue,
        hotLabel: bizSnapshotItem.hotLabel,
        tag: bizSnapshotItem.tag,
        note: bizDailyReportItem.note,
        sort: bizDailyReportItem.sort,
        siteName: bizSite.siteName,
        channelName: bizChannel.channelName,
        snapshotTime: bizChannelSnapshot.snapshotTime,
        createdAt: bizDailyReportItem.createdAt,
      })
      .from(bizDailyReportItem)
      .innerJoin(
        bizSnapshotItem,
        eq(bizDailyReportItem.snapshotItemId, bizSnapshotItem.id),
      )
      .innerJoin(bizChannel, eq(bizSnapshotItem.channelId, bizChannel.id))
      .innerJoin(bizSite, eq(bizChannel.siteId, bizSite.id))
      .innerJoin(
        bizChannelSnapshot,
        eq(bizSnapshotItem.snapshotId, bizChannelSnapshot.id),
      )
      .where(eq(bizDailyReportItem.reportId, report.id))
      .orderBy(
        asc(bizDailyReportItem.sort),
        desc(bizDailyReportItem.createdAt),
      ),
    db
      .select({
        snapshotItemId: bizSnapshotItem.id,
        title: bizSnapshotItem.title,
        url: bizSnapshotItem.url,
        rankNo: bizSnapshotItem.rankNo,
        summary: bizSnapshotItem.summary,
        hotValue: bizSnapshotItem.hotValue,
        hotLabel: bizSnapshotItem.hotLabel,
        tag: bizSnapshotItem.tag,
        siteName: bizSite.siteName,
        channelName: bizChannel.channelName,
        snapshotTime: bizChannelSnapshot.snapshotTime,
        createdAt: bizSnapshotItem.createdAt,
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
      .where(
        and(
          isNull(bizContentBlock.id),
          isNull(bizChannel.deletedAt),
          isNull(bizSite.deletedAt),
          eq(bizChannel.status, "active"),
          eq(bizChannel.isPublic, true),
          eq(bizSite.status, "active"),
          eq(bizSite.isVisible, true),
        ),
      )
      .orderBy(
        desc(bizChannelSnapshot.snapshotTime),
        asc(bizSnapshotItem.rankNo),
      )
      .limit(300),
  ])

  const manualIds = new Set(manualItems.map((item) => item.snapshotItemId))

  return {
    report,
    manualItems,
    candidates: latestItems
      .filter((item) => !manualIds.has(item.snapshotItemId))
      .slice(0, 80),
  }
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

function valueForDate(
  rows: Array<{ date: string; value: number | string | bigint }>,
  date: string,
) {
  return Number(rows.find((row) => row.date === date)?.value ?? 0)
}

function buildOperationsAlerts(input: {
  channelHealth: Array<{
    channelName: string
    crawlIntervalSeconds: number
    isCrawlEnabled: boolean
    lastSuccessAt: Date | null
    siteName: string
    status: string
    todayFailedRuns: number
  }>
  stats: {
    failedJobs: number
    pendingJobs: number
    todayFailedRuns: number
    unreadNotifications: number
  }
}) {
  const alerts: Array<{
    description: string
    level: "critical" | "info" | "warning"
    title: string
  }> = []

  if (input.stats.failedJobs > 0) {
    alerts.push({
      description: `系统队列中有 ${input.stats.failedJobs} 个失败任务，需要在操作日志页面排查或重试。`,
      level: "critical",
      title: "队列存在失败任务",
    })
  }

  if (input.stats.pendingJobs > 50) {
    alerts.push({
      description: `当前有 ${input.stats.pendingJobs} 个待处理任务，可能需要增加 Worker 或缩短轮询间隔。`,
      level: "warning",
      title: "队列积压偏高",
    })
  }

  if (input.stats.todayFailedRuns > 0) {
    alerts.push({
      description: `今天已有 ${input.stats.todayFailedRuns} 次采集失败，请优先查看失败记录。`,
      level: "warning",
      title: "今日采集失败",
    })
  }

  const now = Date.now()
  const staleChannels = input.channelHealth
    .filter((channel) => {
      if (
        channel.status !== "active" ||
        !channel.isCrawlEnabled ||
        channel.todayFailedRuns > 0
      ) {
        return false
      }

      if (!channel.lastSuccessAt) {
        return true
      }

      const thresholdMs = Math.max(
        24 * 60 * 60 * 1000,
        channel.crawlIntervalSeconds * 2 * 1000,
      )

      return now - channel.lastSuccessAt.getTime() > thresholdMs
    })
    .slice(0, 5)

  if (staleChannels.length > 0) {
    alerts.push({
      description: staleChannels
        .map((channel) => `${channel.siteName}/${channel.channelName}`)
        .join("、"),
      level: "warning",
      title: "频道长时间未成功采集",
    })
  }

  if (alerts.length === 0) {
    alerts.push({
      description: "采集、队列和通知核心指标暂无明显异常。",
      level: "info",
      title: "系统运行正常",
    })
  }

  return alerts
}

function getRecentDateKeys(days: number) {
  const result: string[] = []
  const base = new Date()
  base.setHours(0, 0, 0, 0)

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(base)
    date.setDate(base.getDate() - index)
    result.push(formatDateKey(date))
  }

  return result
}

function formatDateKey(value: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Shanghai",
    year: "numeric",
  }).format(value)
}

function dateKeyToStart(value: string) {
  return new Date(`${value}T00:00:00+08:00`)
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
}
