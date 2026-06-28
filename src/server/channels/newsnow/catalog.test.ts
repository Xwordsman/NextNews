import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { legacyNewsnowDefinitionKeys, newsnowChannelCatalog } from "./catalog"
import { implementedNewsnowCollectorKeys } from "./sources"

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
