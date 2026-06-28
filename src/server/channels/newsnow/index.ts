import { defineChannel } from "../definition"
import { legacyNewsnowDefinitionKeys, newsnowChannelCatalog } from "./catalog"
import { collectNewsnowSource } from "./sources"

for (const entry of newsnowChannelCatalog) {
  if (legacyNewsnowDefinitionKeys.has(entry.definitionKey)) {
    continue
  }

  defineChannel({
    key: entry.definitionKey,
    siteSlug: entry.siteSlug,
    channelSlug: entry.channelSlug,
    collectorType: entry.collectorType,
    defaults: {
      categorySlugs: entry.categorySlugs,
      intervalSeconds: entry.crawlIntervalSeconds,
      isHomeVisible: entry.isHomeVisible,
      isSubscribable: entry.isSubscribable,
      name: entry.channelName,
    },
    collect:
      entry.collectorType === "adapter"
        ? () => collectNewsnowSource(entry.definitionKey)
        : undefined,
    rss: entry.rssUrl ? { url: entry.rssUrl } : undefined,
  })
}
