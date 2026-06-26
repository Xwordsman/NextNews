import assert from "node:assert/strict"
import test from "node:test"
import { getJobRetryDelayMs, parseSnapshotCreatedPayload } from "./queue"

test("parseSnapshotCreatedPayload accepts a valid snapshot id", () => {
  const snapshotId = "11111111-1111-4111-8111-111111111111"

  assert.deepEqual(parseSnapshotCreatedPayload({ snapshotId }), { snapshotId })
})

test("parseSnapshotCreatedPayload rejects missing or invalid snapshot id", () => {
  assert.throws(() => parseSnapshotCreatedPayload({}), /snapshotId/)
  assert.throws(
    () => parseSnapshotCreatedPayload({ snapshotId: "not-a-uuid" }),
    /invalid/,
  )
})

test("getJobRetryDelayMs uses capped exponential backoff", () => {
  assert.equal(getJobRetryDelayMs(1), 60_000)
  assert.equal(getJobRetryDelayMs(2), 120_000)
  assert.equal(getJobRetryDelayMs(7), 3_600_000)
  assert.equal(getJobRetryDelayMs(20), 3_600_000)
})
