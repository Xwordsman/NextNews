import { eq } from "drizzle-orm"
import { hashPassword } from "@/server/auth/password"
import { closeDatabaseConnection, getDb } from "./client"
import {
  bizCategory,
  bizChannel,
  bizSite,
  relChannelCategory,
  sysUser,
} from "./schema"

type SiteInsert = typeof bizSite.$inferInsert
type CategoryInsert = typeof bizCategory.$inferInsert
type ChannelInsert = typeof bizChannel.$inferInsert

const db = getDb()

async function ensureAdminUser() {
  const email = process.env.ADMIN_EMAIL ?? "admin@example.com"
  const password = process.env.ADMIN_PASSWORD ?? "change-me"

  const [existing] = await db
    .select()
    .from(sysUser)
    .where(eq(sysUser.email, email))
    .limit(1)

  if (existing) {
    return existing
  }

  const [created] = await db
    .insert(sysUser)
    .values({
      email,
      passwordHash: hashPassword(password),
      displayName: "NextNews Admin",
      role: "admin",
    })
    .returning()

  return created
}

async function upsertSite(values: SiteInsert) {
  const [existing] = await db
    .select()
    .from(bizSite)
    .where(eq(bizSite.slug, values.slug))
    .limit(1)

  if (existing) {
    return existing
  }

  const [created] = await db.insert(bizSite).values(values).returning()
  return created
}

async function upsertCategory(values: CategoryInsert) {
  const [existing] = await db
    .select()
    .from(bizCategory)
    .where(eq(bizCategory.slug, values.slug))
    .limit(1)

  if (existing) {
    return existing
  }

  const [created] = await db.insert(bizCategory).values(values).returning()
  return created
}

async function upsertChannel(values: ChannelInsert) {
  const [existing] = await db
    .select()
    .from(bizChannel)
    .where(eq(bizChannel.definitionKey, values.definitionKey))
    .limit(1)

  if (existing) {
    return existing
  }

  const [created] = await db.insert(bizChannel).values(values).returning()
  return created
}

async function bindChannelCategory(channelId: string, categoryId: string) {
  await db
    .insert(relChannelCategory)
    .values({
      channelId,
      categoryId,
    })
    .onConflictDoNothing({
      target: [relChannelCategory.channelId, relChannelCategory.categoryId],
    })
}

async function seed() {
  await ensureAdminUser()

  const general = await upsertCategory({
    categoryName: "综合",
    slug: "general",
    icon: "newspaper",
    color: "#1E40AF",
    sort: 10,
  })
  const tech = await upsertCategory({
    categoryName: "科技",
    slug: "tech",
    icon: "cpu",
    color: "#047857",
    sort: 20,
  })
  const entertainment = await upsertCategory({
    categoryName: "娱乐",
    slug: "entertainment",
    icon: "sparkles",
    color: "#DC2626",
    sort: 30,
  })

  const weibo = await upsertSite({
    siteName: "微博",
    slug: "weibo",
    homepageUrl: "https://weibo.com",
    description: "微博热点与热搜来源",
    sort: 10,
    isVisible: true,
  })
  const zhihu = await upsertSite({
    siteName: "知乎",
    slug: "zhihu",
    homepageUrl: "https://www.zhihu.com",
    description: "知乎社区热榜来源",
    sort: 20,
    isVisible: true,
  })
  const github = await upsertSite({
    siteName: "GitHub",
    slug: "github",
    homepageUrl: "https://github.com",
    description: "开源项目趋势来源",
    sort: 30,
    isVisible: true,
  })
  const solidot = await upsertSite({
    siteName: "Solidot",
    slug: "solidot",
    homepageUrl: "https://www.solidot.org",
    description: "Solidot 科技资讯 RSS 来源",
    sort: 40,
    isVisible: true,
  })

  const weiboHot = await upsertChannel({
    siteId: weibo.id,
    channelName: "微博热搜",
    slug: "hot-search",
    definitionKey: "weibo.hot-search",
    collectorType: "adapter",
    homepageUrl: "https://s.weibo.com/top/summary",
    crawlIntervalSeconds: 120,
    isCrawlEnabled: false,
    isPublic: true,
    isHomeVisible: true,
    isSubscribable: true,
    sort: 10,
    status: "draft",
  })
  const zhihuHot = await upsertChannel({
    siteId: zhihu.id,
    channelName: "知乎热榜",
    slug: "hot-list",
    definitionKey: "zhihu.hot-list",
    collectorType: "adapter",
    homepageUrl: "https://www.zhihu.com/hot",
    crawlIntervalSeconds: 300,
    isCrawlEnabled: false,
    isPublic: true,
    isHomeVisible: true,
    isSubscribable: true,
    sort: 20,
    status: "draft",
  })
  const githubTrending = await upsertChannel({
    siteId: github.id,
    channelName: "GitHub Trending",
    slug: "trending-today",
    definitionKey: "github.trending-today",
    collectorType: "adapter",
    homepageUrl: "https://github.com/trending",
    crawlIntervalSeconds: 1800,
    isCrawlEnabled: false,
    isPublic: true,
    isHomeVisible: true,
    isSubscribable: true,
    sort: 30,
    status: "draft",
  })
  const solidotNews = await upsertChannel({
    siteId: solidot.id,
    channelName: "Solidot",
    slug: "news",
    definitionKey: "solidot.news",
    collectorType: "rss",
    homepageUrl: "https://www.solidot.org",
    crawlIntervalSeconds: 1800,
    isCrawlEnabled: true,
    isPublic: true,
    isHomeVisible: true,
    isSubscribable: true,
    sort: 40,
    status: "active",
  })

  await bindChannelCategory(weiboHot.id, general.id)
  await bindChannelCategory(weiboHot.id, entertainment.id)
  await bindChannelCategory(zhihuHot.id, general.id)
  await bindChannelCategory(githubTrending.id, tech.id)
  await bindChannelCategory(solidotNews.id, tech.id)

  console.log("Seed completed")
}

seed()
  .catch((error) => {
    console.error("Seed failed")
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await closeDatabaseConnection()
  })
