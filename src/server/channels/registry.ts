import "./github/trending-today"
import "./newsnow"
import "./rss/solidot-news"
import "./weibo/hot-search"
import "./zhihu/hot-list"

export {
  defineChannel,
  getChannelDefinition,
  listChannelDefinitions,
} from "./definition"
export type { ChannelCollectorType, ChannelDefinition } from "./definition"
