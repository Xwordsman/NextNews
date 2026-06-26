import assert from "node:assert/strict"
import test from "node:test"
import { normalizeSearchTerms } from "./terms"

test("normalizeSearchTerms lowercases, trims, deduplicates, and limits terms", () => {
  assert.deepEqual(normalizeSearchTerms(" AI  news,AI  search postgres ", 3), [
    "ai",
    "news",
    "search",
  ])
})

test("normalizeSearchTerms supports common CJK separators", () => {
  assert.deepEqual(normalizeSearchTerms("微博，热搜、新闻"), [
    "微博",
    "热搜",
    "新闻",
  ])
})

test("normalizeSearchTerms always returns at least one limited item when present", () => {
  assert.deepEqual(normalizeSearchTerms("one two", 0), ["one"])
})
