import assert from "node:assert/strict"
import test from "node:test"
import {
  defaultChannelHomeItemLimit,
  getChannelDisplayConfig,
  maxChannelHomeItemLimit,
  mergeChannelDisplayConfig,
} from "./display-config"

test("channel home display config keeps a trimmed subtitle", () => {
  const extra = mergeChannelDisplayConfig(null, {
    badgeMode: "source",
    colorPreset: "red",
    itemLimit: 30,
    metaDisplay: "heat",
    showUpdatedAt: true,
    subtitle: "  热搜  ",
  })

  const displayConfig = getChannelDisplayConfig(extra)

  assert.equal(displayConfig.subtitle, "热搜")
})

test("channel home display config normalizes an empty subtitle", () => {
  const extra = mergeChannelDisplayConfig(null, {
    badgeMode: "source",
    colorPreset: "blue",
    itemLimit: 30,
    metaDisplay: "auto",
    showUpdatedAt: true,
    subtitle: "   ",
  })

  const displayConfig = getChannelDisplayConfig(extra)

  assert.equal(displayConfig.subtitle, null)
})

test("channel home display config defaults item meta to hidden", () => {
  const displayConfig = getChannelDisplayConfig(null)

  assert.equal(displayConfig.metaDisplay, "none")
})

test("channel home display config defaults item limit to 30", () => {
  const displayConfig = getChannelDisplayConfig(null)

  assert.equal(displayConfig.itemLimit, defaultChannelHomeItemLimit)
})

test("channel home display config can hide the card update label", () => {
  const extra = mergeChannelDisplayConfig(null, {
    badgeMode: "none",
    colorPreset: "teal",
    itemLimit: 50,
    metaDisplay: "none",
    showUpdatedAt: false,
    subtitle: "资讯",
  })

  const displayConfig = getChannelDisplayConfig(extra)

  assert.equal(displayConfig.showUpdatedAt, false)
  assert.equal(displayConfig.itemLimit, 50)
})

test("channel home display config keeps existing update labels visible", () => {
  const displayConfig = getChannelDisplayConfig({
    homeDisplay: {
      colorPreset: "red",
      itemLimit: 999,
      metaDisplay: "heat",
      badgeMode: "source",
    },
  })

  assert.equal(displayConfig.showUpdatedAt, true)
  assert.equal(displayConfig.itemLimit, maxChannelHomeItemLimit)
})
