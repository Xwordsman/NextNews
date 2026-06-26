import { migrate } from "drizzle-orm/postgres-js/migrator"
import { eq } from "drizzle-orm"
import { getDb, getSqlClient } from "@/server/db/client"
import { seedInitialData } from "@/server/db/initial-data"
import { sysSetting } from "@/server/db/schema"

const INSTALLED_CACHE_TTL_MS = 30_000
const MIGRATION_CACHE_TTL_MS = 60_000
const INSTALL_COMPLETED_KEY = "install.completed"
const MIGRATION_LOCK_ID = 0x4e4e4d47

type InstallStateCache = {
  checkedAt: number
  state: InstallState
}

let installedStateCache: InstallStateCache | undefined
let latestMigrationCheckedAt = 0
let migrationPromise: Promise<void> | undefined

export type InstallState = {
  databaseReady: boolean
  migrated: boolean
  installed: boolean
  error?: string
}

export type InstallApplicationInput = {
  appName: string
  appUrl: string
  adminEmail: string
  adminPassword: string
}

export async function getInstallState(
  options: { skipCache?: boolean } = {},
): Promise<InstallState> {
  if (
    !options.skipCache &&
    installedStateCache?.state.installed &&
    Date.now() - installedStateCache.checkedAt < INSTALLED_CACHE_TTL_MS
  ) {
    return installedStateCache.state
  }

  if (!process.env.DATABASE_URL) {
    return {
      databaseReady: false,
      migrated: false,
      installed: false,
      error: "DATABASE_URL 未配置，无法连接 PostgreSQL。",
    }
  }

  try {
    await ensureLatestMigrations()

    const migrated = await hasSettingTable()

    if (!migrated) {
      return {
        databaseReady: true,
        migrated: false,
        installed: false,
      }
    }

    const db = getDb()
    const [row] = await db
      .select({ settingValue: sysSetting.settingValue })
      .from(sysSetting)
      .where(eq(sysSetting.settingKey, INSTALL_COMPLETED_KEY))
      .limit(1)

    const state = {
      databaseReady: true,
      migrated: true,
      installed: row?.settingValue === "true",
    }

    if (state.installed) {
      installedStateCache = {
        checkedAt: Date.now(),
        state,
      }
    }

    return state
  } catch (error) {
    return {
      databaseReady: false,
      migrated: false,
      installed: false,
      error:
        error instanceof Error
          ? error.message
          : "数据库连接失败，请检查 PostgreSQL 容器和 DATABASE_URL。",
    }
  }
}

export async function installApplication(input: InstallApplicationInput) {
  await ensureLatestMigrations({ force: true })

  const { admin } = await seedInitialData({
    adminEmail: input.adminEmail,
    adminPassword: input.adminPassword,
    appName: input.appName,
    appUrl: input.appUrl,
    markInstalled: true,
    resetAdminPassword: true,
  })

  clearInstallStateCache()
  return { admin }
}

export async function migrateDatabase() {
  const sql = getSqlClient()
  const reservedSql = await sql.reserve()

  await reservedSql`select pg_advisory_lock(${MIGRATION_LOCK_ID})`

  try {
    const db = getDb()
    await migrate(db, {
      migrationsFolder: "drizzle",
    })
  } finally {
    try {
      await reservedSql`select pg_advisory_unlock(${MIGRATION_LOCK_ID})`
    } finally {
      reservedSql.release()
    }
  }
}

async function ensureLatestMigrations(
  options: { force?: boolean } = {},
): Promise<void> {
  if (
    !options.force &&
    Date.now() - latestMigrationCheckedAt < MIGRATION_CACHE_TTL_MS
  ) {
    return
  }

  migrationPromise ??= migrateDatabase()
    .then(() => {
      latestMigrationCheckedAt = Date.now()
    })
    .finally(() => {
      migrationPromise = undefined
    })

  await migrationPromise
}

export function clearInstallStateCache() {
  installedStateCache = undefined
}

async function hasSettingTable() {
  const sql = getSqlClient()
  const rows = (await sql`
    select exists (
      select 1
      from information_schema.tables
      where table_schema = 'public'
        and table_name = 'sys_setting'
    ) as "exists"
  `) as Array<{ exists: boolean }>

  return Boolean(rows[0]?.exists)
}
