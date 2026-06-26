import { defineChannel } from "../definition"

export default defineChannel({
  key: "solidot.news",
  siteSlug: "solidot",
  channelSlug: "news",
  collectorType: "rss",
  defaults: {
    name: "Solidot",
    intervalSeconds: 1800,
    categorySlugs: ["tech"],
    isHomeVisible: false,
    isSubscribable: true,
  },
  rss: {
    url: "https://www.solidot.org/index.rss",
  },
})
