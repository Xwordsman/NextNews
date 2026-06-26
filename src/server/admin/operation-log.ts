import { headers } from "next/headers"
import { getDb } from "@/server/db/client"
import { sysOperationLog } from "@/server/db/schema"

export async function recordAdminOperation(input: {
  action: string
  adminId?: string | null
  summary?: string | null
  targetId?: string | null
  targetType?: string | null
}) {
  try {
    const requestHeaders = await headers()
    const forwardedFor = requestHeaders.get("x-forwarded-for")

    await getDb()
      .insert(sysOperationLog)
      .values({
        action: input.action,
        adminId: input.adminId ?? null,
        summary: input.summary ?? null,
        targetId: input.targetId ?? null,
        targetType: input.targetType ?? null,
        sourceIp: forwardedFor?.split(",")[0]?.trim() ?? null,
      })
  } catch (error) {
    console.error("[nextnews] admin operation log failed", error)
  }
}
