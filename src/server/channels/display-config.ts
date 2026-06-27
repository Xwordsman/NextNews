export const channelColorPresets = [
  "slate",
  "gray",
  "red",
  "orange",
  "amber",
  "yellow",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "rose",
] as const

export const channelMetaDisplayModes = [
  "auto",
  "heat",
  "tag",
  "time",
  "none",
] as const

export const channelBadgeModes = ["source", "none"] as const

export type ChannelColorPreset = (typeof channelColorPresets)[number]
export type ChannelMetaDisplayMode = (typeof channelMetaDisplayModes)[number]
export type ChannelBadgeMode = (typeof channelBadgeModes)[number]

export type ChannelDisplayConfig = {
  colorPreset: ChannelColorPreset
  metaDisplay: ChannelMetaDisplayMode
  badgeMode: ChannelBadgeMode
}

export type ChannelPalette = {
  color: string
  logoColor: string
}

export const channelColorPresetOptions: Array<
  ChannelPalette & {
    value: ChannelColorPreset
    label: string
  }
> = [
  { value: "slate", label: "石板", color: "#475569", logoColor: "#334155" },
  { value: "gray", label: "灰色", color: "#4b5563", logoColor: "#374151" },
  { value: "red", label: "红色", color: "#954b4d", logoColor: "#f0443e" },
  { value: "orange", label: "橙色", color: "#9a5a34", logoColor: "#f97316" },
  { value: "amber", label: "琥珀", color: "#8a6a2d", logoColor: "#f59e0b" },
  { value: "yellow", label: "黄色", color: "#8a6d1e", logoColor: "#ca8a04" },
  { value: "green", label: "绿色", color: "#3f7656", logoColor: "#22c55e" },
  { value: "emerald", label: "翠绿", color: "#2f765f", logoColor: "#10b981" },
  { value: "teal", label: "青绿", color: "#2f6f6f", logoColor: "#14b8a6" },
  { value: "cyan", label: "青色", color: "#2f6f86", logoColor: "#06b6d4" },
  { value: "sky", label: "天蓝", color: "#375879", logoColor: "#0ea5e9" },
  { value: "blue", label: "蓝色", color: "#456a9e", logoColor: "#1777ff" },
  { value: "indigo", label: "靛蓝", color: "#4a5d96", logoColor: "#6366f1" },
  { value: "violet", label: "紫罗兰", color: "#5f5192", logoColor: "#8b5cf6" },
  { value: "purple", label: "紫色", color: "#654477", logoColor: "#a855f7" },
  { value: "rose", label: "玫红", color: "#95445e", logoColor: "#f43f5e" },
]

const colorPresetOptionByValue = new Map(
  channelColorPresetOptions.map((option) => [option.value, option]),
)

export function getChannelFallbackColorPreset(key: string) {
  const index =
    Array.from(key).reduce((total, char) => total + char.charCodeAt(0), 0) %
    channelColorPresets.length

  return channelColorPresets[index] ?? "blue"
}

export function getChannelPalette(colorPreset: ChannelColorPreset) {
  const option = colorPresetOptionByValue.get(colorPreset)

  return {
    color: option?.color ?? "#456a9e",
    logoColor: option?.logoColor ?? "#1777ff",
  }
}

export function getChannelDisplayConfig(
  extra: unknown,
  fallbackColorPreset: ChannelColorPreset = "blue",
): ChannelDisplayConfig {
  const display = getRawDisplayConfig(extra)
  const colorPreset =
    normalizeColorPreset(display.colorPreset) ??
    inferColorPresetFromLegacyColors(display) ??
    fallbackColorPreset

  return {
    colorPreset,
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
    colorPreset: displayConfig.colorPreset,
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

function normalizeColorPreset(value: unknown) {
  return channelColorPresets.includes(value as ChannelColorPreset)
    ? (value as ChannelColorPreset)
    : undefined
}

function inferColorPresetFromLegacyColors(display: Record<string, unknown>) {
  const cardColor = normalizeHexColor(display.cardColor)
  const logoColor = normalizeHexColor(display.logoColor)

  return channelColorPresetOptions.find(
    (option) => option.color === cardColor || option.logoColor === logoColor,
  )?.value
}

function normalizeHexColor(value: unknown) {
  if (typeof value !== "string") {
    return undefined
  }

  const color = value.trim().toLowerCase()
  return /^#[0-9a-f]{6}$/i.test(color) ? color : undefined
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
