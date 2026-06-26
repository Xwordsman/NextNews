import { defineChannel } from "../definition"

export default defineChannel({
  key: "github.trending-today",
  siteSlug: "github",
  channelSlug: "trending-today",
  collectorType: "adapter",
  defaults: {
    name: "GitHub Trending",
    intervalSeconds: 1800,
    categorySlugs: ["tech"],
    isHomeVisible: true,
    isSubscribable: true,
  },
  async collect() {
    return []
  },
})
