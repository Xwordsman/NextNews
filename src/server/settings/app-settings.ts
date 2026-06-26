import { inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getDb } from "@/server/db/client"
import { sysSetting } from "@/server/db/schema"

export const appSettingDefinitions = [
  {
    key: "commerce.enabled",
    label: "会员商业化",
    description: "开启后前台展示会员套餐入口；关闭后只保留后台手动授权。",
    type: "boolean",
    defaultValue: "false",
    isPublic: true,
  },
  {
    key: "search.logging_enabled",
    label: "搜索日志",
    description: "记录前台搜索关键词和筛选条件，用于热门搜索和运营分析。",
    type: "boolean",
    defaultValue: "true",
    isPublic: false,
  },
  {
    key: "notification.subscription_enabled",
    label: "订阅通知",
    description: "频道生成新快照后，为开启提醒的订阅用户生成站内通知。",
    type: "boolean",
    defaultValue: "true",
    isPublic: false,
  },
  {
    key: "notification.tracking_enabled",
    label: "追踪通知",
    description: "关键词追踪命中后，为开启提醒的用户生成站内通知。",
    type: "boolean",
    defaultValue: "true",
    isPublic: false,
  },
  {
    key: "notification.subscription_min_interval_minutes",
    label: "订阅通知间隔",
    description: "同一用户同一频道订阅通知的最小间隔分钟数，0 表示不限制。",
    type: "number",
    defaultValue: "0",
    isPublic: false,
  },
  {
    key: "notification.subscription_top_change_only",
    label: "仅榜单变化提醒",
    description:
      "开启后，订阅通知只在频道 Top N 出现足够多新条目时生成，减少无意义刷新提醒。",
    type: "boolean",
    defaultValue: "false",
    isPublic: false,
  },
  {
    key: "notification.subscription_top_rank_limit",
    label: "提醒比较名次",
    description: "订阅通知策略比较前 N 名榜单条目，默认比较前 10 名。",
    type: "number",
    defaultValue: "10",
    isPublic: false,
  },
  {
    key: "notification.subscription_min_new_top_items",
    label: "最少新增条目",
    description: "仅榜单变化提醒开启时，Top N 至少出现多少个新条目才通知。",
    type: "number",
    defaultValue: "1",
    isPublic: false,
  },
  {
    key: "daily.auto_generate_enabled",
    label: "日报自动生成",
    description: "开启后 Worker 可以按模板自动创建当日草稿或发布日报。",
    type: "boolean",
    defaultValue: "false",
    isPublic: false,
  },
  {
    key: "daily.require_review",
    label: "日报需要审核",
    description: "开启后自动生成的日报先进入草稿，关闭后可直接发布。",
    type: "boolean",
    defaultValue: "true",
    isPublic: false,
  },
  {
    key: "analytics.export_enabled",
    label: "统计导出",
    description: "允许后台导出运营统计 CSV。",
    type: "boolean",
    defaultValue: "true",
    isPublic: false,
  },
  {
    key: "jobs.async_enabled",
    label: "异步任务队列",
    description: "开启后派生任务可写入任务队列表，后续由 Worker 消费。",
    type: "boolean",
    defaultValue: "false",
    isPublic: false,
  },
] as const

export type AppSettingDefinition = (typeof appSettingDefinitions)[number]
export type AppSettings = Record<AppSettingDefinition["key"], string>

const defaultSettings = Object.fromEntries(
  appSettingDefinitions.map((definition) => [
    definition.key,
    definition.defaultValue,
  ]),
) as AppSettings

export async function getAppSettings(): Promise<AppSettings> {
  const keys = appSettingDefinitions.map((definition) => definition.key)
  const rows = await getDb()
    .select({
      settingKey: sysSetting.settingKey,
      settingValue: sysSetting.settingValue,
    })
    .from(sysSetting)
    .where(inArray(sysSetting.settingKey, keys))

  const values = { ...defaultSettings }

  for (const row of rows) {
    if (row.settingKey in values) {
      values[row.settingKey as keyof AppSettings] = row.settingValue
    }
  }

  return values
}

export async function saveAppSettings(values: Record<string, string>) {
  const db = getDb()
  const now = new Date()

  for (const definition of appSettingDefinitions) {
    const rawValue = values[definition.key] ?? definition.defaultValue
    const settingValue =
      definition.type === "boolean"
        ? rawValue === "true"
          ? "true"
          : "false"
        : normalizeNumberSetting(rawValue, definition.defaultValue)

    await db
      .insert(sysSetting)
      .values({
        settingKey: definition.key,
        settingValue,
        description: definition.description,
        isPublic: definition.isPublic,
      })
      .onConflictDoUpdate({
        target: sysSetting.settingKey,
        set: {
          settingValue,
          description: definition.description,
          isPublic: definition.isPublic,
          updatedAt: now,
        },
      })
  }

  revalidatePath("/")
  revalidatePath("/account")
  revalidatePath("/membership")
  revalidatePath("/admin/settings")
}

export function settingBoolean(settings: AppSettings, key: keyof AppSettings) {
  return settings[key] === "true"
}

export function settingNumber(
  settings: AppSettings,
  key: keyof AppSettings,
  fallback = 0,
) {
  const value = Number(settings[key])

  return Number.isFinite(value) ? value : fallback
}

export async function isCommerceEnabled() {
  const settings = await getAppSettings()

  return settingBoolean(settings, "commerce.enabled")
}

function normalizeNumberSetting(value: string, fallback: string) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback
  }

  return String(Math.floor(parsed))
}
