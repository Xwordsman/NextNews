export const serverEnv = {
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  authSecret: process.env.AUTH_SECRET,
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
  crawlConcurrency: Number(process.env.CRAWL_CONCURRENCY ?? 3),
  crawlDefaultIntervalSeconds: Number(
    process.env.CRAWL_DEFAULT_INTERVAL_SECONDS ?? 300,
  ),
  crawlMinSnapshotIntervalSeconds: Number(
    process.env.CRAWL_MIN_SNAPSHOT_INTERVAL_SECONDS ?? 600,
  ),
  crawlSignificantTopChangeCount: Number(
    process.env.CRAWL_SIGNIFICANT_TOP_CHANGE_COUNT ?? 3,
  ),
  crawlSignificantTopLimit: Number(
    process.env.CRAWL_SIGNIFICANT_TOP_LIMIT ?? 10,
  ),
}
