import assert from "node:assert/strict"
import test from "node:test"
import {
  countTopIdentityChanges,
  hashSnapshotIdentity,
  normalizeSnapshotPolicy,
  shouldCreateSnapshot,
  type SnapshotIdentityItem,
} from "./snapshot-policy"

const previousItems: SnapshotIdentityItem[] = [
  {
    rankNo: 1,
    title: "A",
    titleHash: "ta",
    url: "https://example.com/a",
    urlHash: "a",
  },
  {
    rankNo: 2,
    title: "B",
    titleHash: "tb",
    url: "https://example.com/b",
    urlHash: "b",
  },
  {
    rankNo: 3,
    title: "C",
    titleHash: "tc",
    url: "https://example.com/c",
    urlHash: "c",
  },
]

test("normalizeSnapshotPolicy defaults snapshot archiving to two hours", () => {
  assert.equal(normalizeSnapshotPolicy().minIntervalSeconds, 7200)
})

test("hashSnapshotIdentity ignores heat-only changes", () => {
  const firstHash = hashSnapshotIdentity(previousItems)
  const secondHash = hashSnapshotIdentity(
    previousItems.map((item) => ({
      ...item,
      hotLabel: "999万热度",
    })),
  )

  assert.equal(firstHash, secondHash)
})

test("countTopIdentityChanges compares new items and rank movement", () => {
  assert.deepEqual(
    countTopIdentityChanges({
      currentItems: [
        { rankNo: 1, url: "https://example.com/b", urlHash: "b" },
        { rankNo: 2, url: "https://example.com/d", urlHash: "d" },
        { rankNo: 3, url: "https://example.com/e", urlHash: "e" },
      ],
      previousItems,
      rankLimit: 3,
    }),
    {
      newTopItemCount: 2,
      rankChangedCount: 3,
    },
  )
})

test("shouldCreateSnapshot throttles minor changes inside the minimum interval", () => {
  const now = new Date("2026-06-27T08:10:00.000Z")

  assert.deepEqual(
    shouldCreateSnapshot({
      currentItems: [
        ...previousItems.slice(0, 2),
        { rankNo: 3, url: "https://example.com/d", urlHash: "d" },
      ],
      latestSnapshotTime: new Date("2026-06-27T08:05:00.000Z"),
      now,
      policy: {
        minIntervalSeconds: 600,
        significantTopChangeCount: 3,
        significantTopLimit: 10,
      },
      previousItems,
    }),
    {
      ageSeconds: 300,
      newTopItemCount: 1,
      rankChangedCount: 1,
      reason: "minor_change_throttled",
      shouldCreate: false,
    },
  )
})

test("shouldCreateSnapshot allows significant top changes inside the interval", () => {
  const decision = shouldCreateSnapshot({
    currentItems: [
      { rankNo: 1, url: "https://example.com/d", urlHash: "d" },
      { rankNo: 2, url: "https://example.com/e", urlHash: "e" },
      { rankNo: 3, url: "https://example.com/f", urlHash: "f" },
    ],
    latestSnapshotTime: new Date("2026-06-27T08:05:00.000Z"),
    now: new Date("2026-06-27T08:10:00.000Z"),
    policy: {
      minIntervalSeconds: 600,
      significantTopChangeCount: 3,
      significantTopLimit: 10,
    },
    previousItems,
  })

  assert.equal(decision.shouldCreate, true)
  assert.equal(decision.reason, "significant_top_change")
})
