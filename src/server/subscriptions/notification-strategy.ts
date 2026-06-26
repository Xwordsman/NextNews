export type RankedSnapshotIdentity = {
  rankNo: number | null
  url: string
  urlHash: string
}

export type SubscriptionNotificationDecision = {
  newTopItemCount: number | null
  shouldNotify: boolean
}

export function shouldNotifyForTopChanges(input: {
  currentItems: RankedSnapshotIdentity[]
  minNewTopItems: number
  previousItems: RankedSnapshotIdentity[]
  rankLimit: number
  topChangeOnly: boolean
}): SubscriptionNotificationDecision {
  if (!input.topChangeOnly) {
    return {
      newTopItemCount: null,
      shouldNotify: true,
    }
  }

  const newTopItemCount = countNewTopItems({
    currentItems: input.currentItems,
    previousItems: input.previousItems,
    rankLimit: input.rankLimit,
  })

  return {
    newTopItemCount,
    shouldNotify: newTopItemCount >= Math.max(1, input.minNewTopItems),
  }
}

export function countNewTopItems(input: {
  currentItems: RankedSnapshotIdentity[]
  previousItems: RankedSnapshotIdentity[]
  rankLimit: number
}) {
  const rankLimit = Math.max(1, input.rankLimit)
  const previousIdentities = new Set(
    topRankedItems(input.previousItems, rankLimit).map(itemIdentity),
  )

  return topRankedItems(input.currentItems, rankLimit).filter(
    (item) => !previousIdentities.has(itemIdentity(item)),
  ).length
}

function topRankedItems(items: RankedSnapshotIdentity[], rankLimit: number) {
  return [...items]
    .sort(
      (a, b) =>
        (a.rankNo ?? Number.MAX_SAFE_INTEGER) -
        (b.rankNo ?? Number.MAX_SAFE_INTEGER),
    )
    .slice(0, rankLimit)
}

function itemIdentity(item: RankedSnapshotIdentity) {
  return item.urlHash || item.url
}
