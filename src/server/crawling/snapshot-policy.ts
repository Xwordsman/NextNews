import { hashText } from "@/server/content/hash"

export type SnapshotIdentityItem = {
  rankNo?: number | null
  title?: string
  titleHash?: string
  url?: string
  urlHash?: string
  hotLabel?: string
  hotValue?: string
}

export type SnapshotPolicy = {
  minIntervalSeconds: number
  significantTopChangeCount: number
  significantTopLimit: number
}

export type SnapshotDecision = {
  ageSeconds: number | null
  newTopItemCount: number
  rankChangedCount: number
  reason:
    | "first_snapshot"
    | "minimum_interval_elapsed"
    | "minor_change_throttled"
  shouldCreate: boolean
}

const DEFAULT_SNAPSHOT_POLICY: SnapshotPolicy = {
  minIntervalSeconds: 2 * 60 * 60,
  significantTopChangeCount: 3,
  significantTopLimit: 10,
}

export function normalizeSnapshotPolicy(
  policy: Partial<SnapshotPolicy> = {},
): SnapshotPolicy {
  return {
    minIntervalSeconds: normalizePositiveInteger(
      policy.minIntervalSeconds,
      DEFAULT_SNAPSHOT_POLICY.minIntervalSeconds,
    ),
    significantTopChangeCount: normalizePositiveInteger(
      policy.significantTopChangeCount,
      DEFAULT_SNAPSHOT_POLICY.significantTopChangeCount,
    ),
    significantTopLimit: normalizePositiveInteger(
      policy.significantTopLimit,
      DEFAULT_SNAPSHOT_POLICY.significantTopLimit,
    ),
  }
}

export function hashSnapshotIdentity(items: SnapshotIdentityItem[]) {
  return hashText(
    JSON.stringify(
      rankedItems(items).map((item) => ({
        rankNo: item.rankNo ?? null,
        title: item.titleHash || item.title || "",
        url: itemIdentity(item),
      })),
    ),
  )
}

export function shouldCreateSnapshot(input: {
  currentItems: SnapshotIdentityItem[]
  latestSnapshotTime: Date | null
  now: Date
  policy?: Partial<SnapshotPolicy>
  previousItems: SnapshotIdentityItem[]
}): SnapshotDecision {
  const policy = normalizeSnapshotPolicy(input.policy)

  if (!input.latestSnapshotTime) {
    return {
      ageSeconds: null,
      newTopItemCount: input.currentItems.length,
      rankChangedCount: input.currentItems.length,
      reason: "first_snapshot",
      shouldCreate: true,
    }
  }

  const ageSeconds = Math.max(
    0,
    Math.floor(
      (input.now.getTime() - input.latestSnapshotTime.getTime()) / 1000,
    ),
  )

  if (ageSeconds >= policy.minIntervalSeconds) {
    return {
      ageSeconds,
      newTopItemCount: 0,
      rankChangedCount: 0,
      reason: "minimum_interval_elapsed",
      shouldCreate: true,
    }
  }

  const { newTopItemCount, rankChangedCount } = countTopIdentityChanges({
    currentItems: input.currentItems,
    previousItems: input.previousItems,
    rankLimit: policy.significantTopLimit,
  })
  return {
    ageSeconds,
    newTopItemCount,
    rankChangedCount,
    reason: "minor_change_throttled",
    shouldCreate: false,
  }
}

export function countTopIdentityChanges(input: {
  currentItems: SnapshotIdentityItem[]
  previousItems: SnapshotIdentityItem[]
  rankLimit: number
}) {
  const rankLimit = Math.max(1, input.rankLimit)
  const currentTop = rankedItems(input.currentItems)
    .slice(0, rankLimit)
    .map(itemIdentity)
  const previousTop = rankedItems(input.previousItems)
    .slice(0, rankLimit)
    .map(itemIdentity)
  const previousIdentities = new Set(previousTop)

  return {
    newTopItemCount: currentTop.filter(
      (identity) => !previousIdentities.has(identity),
    ).length,
    rankChangedCount: currentTop.filter(
      (identity, index) => previousTop[index] !== identity,
    ).length,
  }
}

function rankedItems(items: SnapshotIdentityItem[]) {
  return [...items].sort(
    (a, b) =>
      (a.rankNo ?? Number.MAX_SAFE_INTEGER) -
      (b.rankNo ?? Number.MAX_SAFE_INTEGER),
  )
}

function itemIdentity(item: SnapshotIdentityItem) {
  return item.urlHash || item.url || item.titleHash || item.title || ""
}

function normalizePositiveInteger(value: unknown, fallback: number) {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return fallback
  }

  return Math.max(1, Math.floor(number))
}
