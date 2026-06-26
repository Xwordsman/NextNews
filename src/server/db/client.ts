import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to create a database client")
  }

  return databaseUrl
}

export function createDatabaseClient(databaseUrl = getDatabaseUrl()) {
  const client = postgres(databaseUrl, {
    max: 10,
    prepare: false,
  })

  return {
    db: drizzle(client, { schema }),
    client,
  }
}

const globalForDb = globalThis as unknown as {
  nextnewsDb?: ReturnType<typeof createDatabaseClient>
}

export function getDatabaseConnection() {
  if (!globalForDb.nextnewsDb) {
    globalForDb.nextnewsDb = createDatabaseClient()
  }

  return globalForDb.nextnewsDb
}

export function getDb() {
  return getDatabaseConnection().db
}

export function getSqlClient() {
  return getDatabaseConnection().client
}

export async function closeDatabaseConnection() {
  if (!globalForDb.nextnewsDb) {
    return
  }

  await globalForDb.nextnewsDb.client.end()
  globalForDb.nextnewsDb = undefined
}
