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

test("channel home display config can hide the card update label", () => {
  const extra = mergeChannelDisplayConfig(null, {
    badgeMode: "none",
    colorPreset: "teal",
    metaDisplay: "none",
    showUpdatedAt: false,
    subtitle: "资讯",
  })

  const displayConfig = getChannelDisplayConfig(extra)

  assert.equal(displayConfig.showUpdatedAt, false)
})

test("channel home display config keeps existing update labels visible", () => {
  const displayConfig = getChannelDisplayConfig({
    homeDisplay: {
      colorPreset: "red",
      metaDisplay: "heat",
      badgeMode: "source",
    },
  })

  assert.equal(displayConfig.showUpdatedAt, true)
})
