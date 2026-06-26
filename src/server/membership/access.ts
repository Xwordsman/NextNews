import { eq } from "drizzle-orm"
import { getDb } from "@/server/db/client"
import { userMembership } from "@/server/db/schema"

const DAY_MS = 24 * 60 * 60 * 1000

export const HISTORY_ACCESS_DAYS = {
  guest: 7,
  user: 30,
  member: 3650,
} as const

export type HistoryAccess = {
  planKey: string
  planName: string
  historyDays: number
  earliestDate: string
  isMember: boolean
  expiresAt: Date | null
}

export async function getHistoryAccessForUser(
  userId?: string | null,
): Promise<HistoryAccess> {
  if (!userId) {
    return buildAccess({
      historyDays: HISTORY_ACCESS_DAYS.guest,
      isMember: false,
      planKey: "guest",
      planName: "访客",
    })
  }

  const [membership] = await getDb()
    .select({
      planKey: userMembership.planKey,
      planName: userMembership.planName,
      status: userMembership.status,
      historyDays: userMembership.historyDays,
      expiresAt: userMembership.expiresAt,
    })
    .from(userMembership)
    .where(eq(userMembership.userId, userId))
    .limit(1)

  const now = new Date()
  const isActiveMembership =
    membership?.status === "active" &&
    (!membership.expiresAt || membership.expiresAt.getTime() > now.getTime())

  if (isActiveMembership) {
    return buildAccess({
      expiresAt: membership.expiresAt,
      historyDays: Math.max(membership.historyDays, HISTORY_ACCESS_DAYS.user),
      isMember: membership.historyDays > HISTORY_ACCESS_DAYS.user,
      planKey: membership.planKey,
      planName: membership.planName,
    })
  }

  return buildAccess({
    historyDays: HISTORY_ACCESS_DAYS.user,
    isMember: false,
    planKey: "free",
    planName: "免费用户",
  })
}

export function canAccessSnapshotDate(
  snapshotDate: string,
  access: Pick<HistoryAccess, "earliestDate">,
) {
  return snapshotDate >= access.earliestDate
}

function buildAccess(input: {
  planKey: string
  planName: string
  historyDays: number
  isMember: boolean
  expiresAt?: Date | null
}): HistoryAccess {
  return {
    planKey: input.planKey,
    planName: input.planName,
    historyDays: input.historyDays,
    earliestDate: dateDaysAgo(Math.max(input.historyDays - 1, 0)),
    isMember: input.isMember,
    expiresAt: input.expiresAt ?? null,
  }
}

function dateDaysAgo(days: number) {
  const date = new Date(Date.now() - days * DAY_MS)

  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Shanghai",
    year: "numeric",
  }).format(date)
}
