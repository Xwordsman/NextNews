import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { findMatchedKeyword, matchesKeywords, parseKeywords } from "./keywords"

describe("keyword helpers", () => {
  it("parses common separators", () => {
    assert.deepEqual(parseKeywords("微博,知乎\nGitHub，OpenAI、Next.js；AI"), [
      "微博",
      "知乎",
      "GitHub",
      "OpenAI",
      "Next.js",
      "AI",
    ])
  })

  it("finds a keyword from title, summary, or tag", () => {
    const item = {
      title: "Next.js 16 发布新版本",
      summary: "React 服务端能力继续增强",
      tag: "Framework",
    }

    assert.equal(findMatchedKeyword(item, ["openai", "react"]), "react")
    assert.equal(findMatchedKeyword(item, ["framework"]), "framework")
    assert.equal(matchesKeywords(item, ["vue"]), false)
  })
})
