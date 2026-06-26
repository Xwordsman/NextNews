import assert from "node:assert/strict"
import test from "node:test"
import {
  countNewTopItems,
  shouldNotifyForTopChanges,
  type RankedSnapshotIdentity,
} from "./notification-strategy"

const previousItems: RankedSnapshotIdentity[] = [
  { rankNo: 1, url: "https://example.com/a", urlHash: "a" },
  { rankNo: 2, url: "https://example.com/b", urlHash: "b" },
  { rankNo: 3, url: "https://example.com/c", urlHash: "c" },
]

test("countNewTopItems compares only the configured top range", () => {
  const currentItems: RankedSnapshotIdentity[] = [
    { rankNo: 1, url: "https://example.com/a", urlHash: "a" },
    { rankNo: 2, url: "https://example.com/d", urlHash: "d" },
    { rankNo: 3, url: "https://example.com/e", urlHash: "e" },
  ]

  assert.equal(
    countNewTopItems({
      currentItems,
      previousItems,
      rankLimit: 2,
    }),
    1,
  )
})

test("shouldNotifyForTopChanges bypasses comparison when strategy is off", () => {
  assert.deepEqual(
    shouldNotifyForTopChanges({
      currentItems: [],
      minNewTopItems: 3,
      previousItems,
      rankLimit: 10,
      topChangeOnly: false,
    }),
    {
      newTopItemCount: null,
      shouldNotify: true,
    },
  )
})

test("shouldNotifyForTopChanges honors the minimum new item threshold", () => {
  const currentItems: RankedSnapshotIdentity[] = [
    { rankNo: 1, url: "https://example.com/a", urlHash: "a" },
    { rankNo: 2, url: "https://example.com/d", urlHash: "d" },
  ]

  assert.deepEqual(
    shouldNotifyForTopChanges({
      currentItems,
      minNewTopItems: 2,
      previousItems,
      rankLimit: 10,
      topChangeOnly: true,
    }),
    {
      newTopItemCount: 1,
      shouldNotify: false,
    },
  )
})
