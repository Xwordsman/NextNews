import { defineChannel } from "../definition"

export default defineChannel({
  key: "zhihu.hot-list",
  siteSlug: "zhihu",
  channelSlug: "hot-list",
  collectorType: "adapter",
  defaults: {
    name: "知乎热榜",
    intervalSeconds: 300,
    categorySlugs: ["general"],
    isHomeVisible: true,
    isSubscribable: true,
  },
  async collect() {
    return []
  },
})
