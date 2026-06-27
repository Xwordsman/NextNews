export const channelMetaDisplayModes = [
  "auto",
  "heat",
  "tag",
  "time",
  "none",
] as const

export const channelBadgeModes = ["source", "none"] as const

export type ChannelMetaDisplayMode = (typeof channelMetaDisplayModes)[number]
export type ChannelBadgeMode = (typeof channelBadgeModes)[number]

export type ChannelDisplayConfig = {
  cardColor?: string
  logoColor?: string
  metaDisplay: ChannelMetaDisplayMode
  badgeMode: ChannelBadgeMode
}

const fallbackPalettes = [
  { color: "#456a9e", logoColor: "#1777ff" },
  { color: "#954b4d", logoColor: "#f0443e" },
  { color: "#426795", logoColor: "#2478e6" },
  { color: "#2d3644", logoColor: "#0f172a" },
  { color: "#513b57", logoColor: "#da552f" },
  { color: "#2f6f86", logoColor: "#00aeec" },
  { color: "#375879", logoColor: "#2563eb" },
  { color: "#8f5a58", logoColor: "#ef4444" },
]

const hexColorPattern = /^#[0-9a-f]{6}$/i

export function getChannelFallbackPalette(key: string) {
  const index =
    Array.from(key).reduce((total, char) => total + char.charCodeAt(0), 0) %
    fallbackPalettes.length

  return fallbackPalettes[index] ?? fallbackPalettes[0]
}

export function getChannelDisplayConfig(extra: unknown): ChannelDisplayConfig {
  const display = getRawDisplayConfig(extra)

  return {
    cardColor: normalizeHexColor(display.cardColor),
    logoColor: normalizeHexColor(display.logoColor),
    metaDisplay: normalizeMetaDisplay(display.metaDisplay),
    badgeMode: normalizeBadgeMode(display.badgeMode),
  }
}

export function mergeChannelDisplayConfig(
  extra: unknown,
  displayConfig: ChannelDisplayConfig,
) {
  const nextExtra = isRecord(extra) ? { ...extra } : {}

  nextExtra.homeDisplay = {
    cardColor: displayConfig.cardColor,
    logoColor: displayConfig.logoColor,
    metaDisplay: displayConfig.metaDisplay,
    badgeMode: displayConfig.badgeMode,
  }

  return nextExtra
}

function getRawDisplayConfig(extra: unknown) {
  if (!isRecord(extra)) {
    return {}
  }

  if (isRecord(extra.homeDisplay)) {
    return extra.homeDisplay
  }

  return extra
}

function normalizeHexColor(value: unknown) {
  if (typeof value !== "string") {
    return undefined
  }

  const color = value.trim()
  return hexColorPattern.test(color) ? color.toLowerCase() : undefined
}

function normalizeMetaDisplay(value: unknown): ChannelMetaDisplayMode {
  return channelMetaDisplayModes.includes(value as ChannelMetaDisplayMode)
    ? (value as ChannelMetaDisplayMode)
    : "auto"
}

function normalizeBadgeMode(value: unknown): ChannelBadgeMode {
  return channelBadgeModes.includes(value as ChannelBadgeMode)
    ? (value as ChannelBadgeMode)
    : "source"
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
