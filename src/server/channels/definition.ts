import type { NewsItem } from "@/types"

export type ChannelCollectorType = "rss" | "adapter"

export type ChannelDefinition = {
  key: string
  siteSlug: string
  channelSlug: string
  collectorType: ChannelCollectorType
  defaults: {
    name: string
    intervalSeconds: number
    categorySlugs?: string[]
    isHomeVisible?: boolean
    isSubscribable?: boolean
  }
  rss?: {
    url: string
  }
  collect?: () => Promise<NewsItem[]>
}

const definitions = new Map<string, ChannelDefinition>()

export function defineChannel(definition: ChannelDefinition) {
  if (definitions.has(definition.key)) {
    throw new Error(`Duplicate channel definition key: ${definition.key}`)
  }

  definitions.set(definition.key, definition)
  return definition
}

export function getChannelDefinition(key: string) {
  return definitions.get(key)
}

export function listChannelDefinitions() {
  return Array.from(definitions.values()).sort((a, b) =>
    a.key.localeCompare(b.key),
  )
}
