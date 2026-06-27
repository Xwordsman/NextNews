import assert from "node:assert/strict"
import test from "node:test"
import { formatAppDateTime } from "./date-format"

test("formatAppDateTime displays timestamps in Asia/Shanghai", () => {
  assert.equal(
    formatAppDateTime(new Date("2026-06-27T08:19:00.000Z")),
    "06/27 16:19",
  )
})
