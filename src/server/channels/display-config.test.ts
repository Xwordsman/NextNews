import assert from "node:assert/strict"
import test from "node:test"
import {
  getChannelDisplayConfig,
  mergeChannelDisplayConfig,
} from "./display-config"

test("channel home display config keeps a trimmed subtitle", () => {
  const extra = mergeChannelDisplayConfig(null, {
    badgeMode: "source",
    colorPreset: "red",
    metaDisplay: "heat",
    subtitle: "  热搜  ",
  })

  const displayConfig = getChannelDisplayConfig(extra)

  assert.equal(displayConfig.subtitle, "热搜")
})

test("channel home display config normalizes an empty subtitle", () => {
  const extra = mergeChannelDisplayConfig(null, {
    badgeMode: "source",
    colorPreset: "blue",
    metaDisplay: "auto",
    subtitle: "   ",
  })

  const displayConfig = getChannelDisplayConfig(extra)

  assert.equal(displayConfig.subtitle, null)
})
