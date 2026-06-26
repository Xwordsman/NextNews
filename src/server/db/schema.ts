import { sql } from "drizzle-orm"
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}

const emptyJson = sql`'{}'::jsonb`

export const userRoleEnum = pgEnum("user_role", ["admin", "user"])
export const userStatusEnum = pgEnum("user_status", ["active", "disabled"])
export const entityStatusEnum = pgEnum("entity_status", [
  "draft",
  "active",
  "disabled",
])
export const collectorTypeEnum = pgEnum("collector_type", ["rss", "adapter"])
export const crawlRunStatusEnum = pgEnum("crawl_run_status", [
  "running",
  "success",
  "failed",
  "skipped",
])
export const crawlRunTypeEnum = pgEnum("crawl_run_type", [
  "scheduled",
  "manual",
  "retry",
])
export const snapshotStatusEnum = pgEnum("snapshot_status", [
  "active",
  "duplicate",
  "ignored",
])

export const sysUser = pgTable(
  "sys_user",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    displayName: varchar("display_name", { length: 120 }).notNull(),
    role: userRoleEnum("role").default("user").notNull(),
    status: userStatusEnum("status").default("active").notNull(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    extra: jsonb("extra").$type<Record<string, unknown>>().default(emptyJson),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("uk_sys_user_email").on(table.email),
    index("idx_sys_user_status").on(table.status),
  ],
)

export const sysSetting = pgTable(
  "sys_setting",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    settingKey: varchar("setting_key", { length: 160 }).notNull(),
    settingValue: text("setting_value").default("").notNull(),
    description: text("description"),
    isPublic: boolean("is_public").default(false).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("uk_sys_setting_key").on(table.settingKey),
    index("idx_sys_setting_public").on(table.isPublic),
  ],
)

export const bizSite = pgTable(
  "biz_site",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    siteName: varchar("site_name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 160 }).notNull(),
    homepageUrl: text("homepage_url"),
    logoUrl: text("logo_url"),
    description: text("description"),
    status: entityStatusEnum("status").default("active").notNull(),
    sort: integer("sort").default(0).notNull(),
    isVisible: boolean("is_visible").default(true).notNull(),
    extra: jsonb("extra").$type<Record<string, unknown>>().default(emptyJson),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("uk_biz_site_slug").on(table.slug),
    index("idx_biz_site_status_sort").on(table.status, table.sort),
  ],
)

export const bizCategory = pgTable(
  "biz_category",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    categoryName: varchar("category_name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 160 }).notNull(),
    parentId: uuid("parent_id"),
    icon: varchar("icon", { length: 80 }),
    color: varchar("color", { length: 32 }),
    sort: integer("sort").default(0).notNull(),
    isNavVisible: boolean("is_nav_visible").default(true).notNull(),
    isHomeVisible: boolean("is_home_visible").default(true).notNull(),
    status: entityStatusEnum("status").default("active").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("uk_biz_category_slug").on(table.slug),
    index("idx_biz_category_parent_sort").on(table.parentId, table.sort),
  ],
)

export const bizChannel = pgTable(
  "biz_channel",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => bizSite.id),
    channelName: varchar("channel_name", { length: 160 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull(),
    definitionKey: varchar("definition_key", { length: 180 }).notNull(),
    collectorType: collectorTypeEnum("collector_type").notNull(),
    channelType: varchar("channel_type", { length: 80 }).default("rank"),
    homepageUrl: text("homepage_url"),
    crawlIntervalSeconds: integer("crawl_interval_seconds")
      .default(300)
      .notNull(),
    isCrawlEnabled: boolean("is_crawl_enabled").default(true).notNull(),
    isPublic: boolean("is_public").default(true).notNull(),
    isHomeVisible: boolean("is_home_visible").default(false).notNull(),
    isSubscribable: boolean("is_subscribable").default(true).notNull(),
    displayStyle: varchar("display_style", { length: 80 }).default("rank"),
    weight: integer("weight").default(0).notNull(),
    sort: integer("sort").default(0).notNull(),
    status: entityStatusEnum("status").default("active").notNull(),
    lastSnapshotId: uuid("last_snapshot_id"),
    lastCrawlAt: timestamp("last_crawl_at", { withTimezone: true }),
    lastSuccessAt: timestamp("last_success_at", { withTimezone: true }),
    extra: jsonb("extra").$type<Record<string, unknown>>().default(emptyJson),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("uk_biz_channel_site_slug").on(table.siteId, table.slug),
    uniqueIndex("uk_biz_channel_definition_key").on(table.definitionKey),
    index("idx_biz_channel_site_status").on(table.siteId, table.status),
    index("idx_biz_channel_home_sort").on(
      table.isHomeVisible,
      table.status,
      table.sort,
    ),
    index("idx_biz_channel_crawl_enabled").on(
      table.isCrawlEnabled,
      table.status,
      table.lastCrawlAt,
    ),
  ],
)

export const relChannelCategory = pgTable(
  "rel_channel_category",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    channelId: uuid("channel_id")
      .notNull()
      .references(() => bizChannel.id),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => bizCategory.id),
    sort: integer("sort").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uk_rel_channel_category").on(
      table.channelId,
      table.categoryId,
    ),
    index("idx_rel_channel_category_category").on(table.categoryId),
  ],
)

export const relUserChannelSubscription = pgTable(
  "rel_user_channel_subscription",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => sysUser.id),
    channelId: uuid("channel_id")
      .notNull()
      .references(() => bizChannel.id),
    sort: integer("sort").default(0).notNull(),
    isPinned: boolean("is_pinned").default(false).notNull(),
    notifyEnabled: boolean("notify_enabled").default(false).notNull(),
    extra: jsonb("extra").$type<Record<string, unknown>>().default(emptyJson),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uk_rel_user_channel_subscription").on(
      table.userId,
      table.channelId,
    ),
    index("idx_rel_user_channel_subscription_user").on(
      table.userId,
      table.sort,
    ),
    index("idx_rel_user_channel_subscription_channel").on(table.channelId),
  ],
)

export const logCrawlRun = pgTable(
  "log_crawl_run",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    channelId: uuid("channel_id")
      .notNull()
      .references(() => bizChannel.id),
    runType: crawlRunTypeEnum("run_type").default("scheduled").notNull(),
    status: crawlRunStatusEnum("status").default("running").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    durationMs: integer("duration_ms"),
    fetchedCount: integer("fetched_count").default(0).notNull(),
    insertedCount: integer("inserted_count").default(0).notNull(),
    snapshotId: uuid("snapshot_id"),
    errorMessage: text("error_message"),
    errorStack: text("error_stack"),
    extra: jsonb("extra").$type<Record<string, unknown>>().default(emptyJson),
  },
  (table) => [
    index("idx_log_crawl_run_channel_time").on(
      table.channelId,
      table.startedAt,
    ),
    index("idx_log_crawl_run_status_time").on(table.status, table.startedAt),
  ],
)

export const bizChannelSnapshot = pgTable(
  "biz_channel_snapshot",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    channelId: uuid("channel_id")
      .notNull()
      .references(() => bizChannel.id),
    crawlRunId: uuid("crawl_run_id"),
    snapshotTime: timestamp("snapshot_time", { withTimezone: true })
      .defaultNow()
      .notNull(),
    snapshotDate: date("snapshot_date").notNull(),
    itemCount: integer("item_count").default(0).notNull(),
    contentHash: varchar("content_hash", { length: 128 }).notNull(),
    status: snapshotStatusEnum("status").default("active").notNull(),
    extra: jsonb("extra").$type<Record<string, unknown>>().default(emptyJson),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_biz_channel_snapshot_channel_time").on(
      table.channelId,
      table.snapshotTime,
    ),
    index("idx_biz_channel_snapshot_date").on(table.snapshotDate),
    uniqueIndex("uk_biz_channel_snapshot_hash").on(
      table.channelId,
      table.contentHash,
    ),
  ],
)

export const bizContentItem = pgTable(
  "biz_content_item",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    canonicalTitle: text("canonical_title").notNull(),
    canonicalUrl: text("canonical_url").notNull(),
    urlHash: varchar("url_hash", { length: 128 }).notNull(),
    titleHash: varchar("title_hash", { length: 128 }).notNull(),
    firstChannelId: uuid("first_channel_id").references(() => bizChannel.id),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    imageUrl: text("image_url"),
    extra: jsonb("extra").$type<Record<string, unknown>>().default(emptyJson),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("uk_biz_content_item_url_hash").on(table.urlHash),
    index("idx_biz_content_item_title_hash").on(table.titleHash),
    index("idx_biz_content_item_last_seen").on(table.lastSeenAt),
  ],
)

export const bizSnapshotItem = pgTable(
  "biz_snapshot_item",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    snapshotId: uuid("snapshot_id")
      .notNull()
      .references(() => bizChannelSnapshot.id),
    channelId: uuid("channel_id")
      .notNull()
      .references(() => bizChannel.id),
    contentItemId: uuid("content_item_id").references(() => bizContentItem.id),
    rankNo: integer("rank_no"),
    title: text("title").notNull(),
    url: text("url").notNull(),
    urlHash: varchar("url_hash", { length: 128 }).notNull(),
    imageUrl: text("image_url"),
    summary: text("summary"),
    hotValue: varchar("hot_value", { length: 120 }),
    hotLabel: varchar("hot_label", { length: 120 }),
    tag: varchar("tag", { length: 80 }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    extra: jsonb("extra").$type<Record<string, unknown>>().default(emptyJson),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_biz_snapshot_item_snapshot_rank").on(
      table.snapshotId,
      table.rankNo,
    ),
    index("idx_biz_snapshot_item_channel_time").on(
      table.channelId,
      table.createdAt,
    ),
    index("idx_biz_snapshot_item_url_hash").on(table.urlHash),
  ],
)
