import { defineChannel } from "../definition"

export default defineChannel({
  key: "weibo.hot-search",
  siteSlug: "weibo",
  channelSlug: "hot-search",
  collectorType: "adapter",
  defaults: {
    name: "微博热搜",
    intervalSeconds: 120,
    categorySlugs: ["general", "entertainment"],
    isHomeVisible: true,
    isSubscribable: true,
  },
  async collect() {
    return []
  },
})
