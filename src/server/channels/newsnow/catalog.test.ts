import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { legacyNewsnowDefinitionKeys, newsnowChannelCatalog } from "./catalog"
import { implementedNewsnowCollectorKeys } from "./sources"

const reviewRequiredDefinitionKeys = new Set([
  "kaopu.news",
  "sputniknewscn.news",
  "zaobao.realtime",
])

describe("newsnow channel catalog", () => {
  it("contains every non-redirect NewsNow source once", () => {
    assert.equal(
      new Set(newsnowChannelCatalog.map((item) => item.sourceId)).size,
      51,
    )
    assert.equal(newsnowChannelCatalog.length, 51)
  })

  it("uses unique definition keys", () => {
    assert.equal(
      new Set(newsnowChannelCatalog.map((item) => item.definitionKey)).size,
      newsnowChannelCatalog.length,
    )
  })

  it("enables ordinary builtin sources for crawling and home display by default", () => {
    const disabled = newsnowChannelCatalog
      .filter((item) => !reviewRequiredDefinitionKeys.has(item.definitionKey))
      .filter(
        (item) =>
          item.status !== "active" ||
          !item.isCrawlEnabled ||
          !item.isHomeVisible ||
          !item.isSubscribable,
      )
      .map((item) => item.definitionKey)

    assert.deepEqual(disabled, [])
  })

  it("keeps review-required sources disabled by default", () => {
    const enabled = newsnowChannelCatalog
      .filter((item) => reviewRequiredDefinitionKeys.has(item.definitionKey))
      .filter(
        (item) =>
          item.status !== "draft" ||
          item.isCrawlEnabled ||
          item.isHomeVisible ||
          !item.isSubscribable,
      )
      .map((item) => item.definitionKey)

    assert.deepEqual(enabled, [])
  })

  it("uses the site name as the channel name and keeps qualifiers in subtitles", () => {
    const duplicated = newsnowChannelCatalog
      .filter((item) => item.channelName !== item.siteName)
      .map((item) => item.definitionKey)

    assert.deepEqual(duplicated, [])
    assert.equal(
      newsnowChannelCatalog.find(
        (item) => item.definitionKey === "wallstreetcn.quick",
      )?.channelName,
      "华尔街见闻",
    )
    assert.equal(
      newsnowChannelCatalog.find(
        (item) => item.definitionKey === "wallstreetcn.quick",
      )?.subtitle,
      "快讯",
    )
  })

  it("implements collectors for every non-legacy adapter source", () => {
    const missing = newsnowChannelCatalog
      .filter(
        (item) =>
          item.collectorType === "adapter" &&
          !legacyNewsnowDefinitionKeys.has(item.definitionKey),
      )
      .filter(
        (item) => !implementedNewsnowCollectorKeys.has(item.definitionKey),
      )
      .map((item) => item.definitionKey)

    assert.deepEqual(missing, [])
  })
})
