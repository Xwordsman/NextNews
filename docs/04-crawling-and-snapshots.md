# 抓取与历史快照

NextNews 的前台不直接实时请求第三方站点。系统通过 Worker 抓取第三方站点，解析结果，写入 PostgreSQL，然后前台从数据库读取最新快照和历史数据。

## 抓取流程

```txt
调度器选择到期频道
  -> 使用 definition_key 查找频道定义
  -> 创建 crawl run 并做同频道防重入
  -> 执行频道定义中的采集逻辑
  -> 解析为统一 NewsItem
  -> 计算内容 hash
  -> 写入频道快照
  -> 写入快照条目
  -> 更新内容主表
  -> 更新频道 latest 指针
  -> 更新抓取日志
```

## 频道定义

采集代码放在代码仓库中，不通过后台在线编辑。RSS 和复杂适配器都统一封装为频道定义文件。

频道定义负责“怎么采集”，后台数据库负责“怎么运营和展示”。

示例：

```ts
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
  async collect(ctx) {
    // 采集逻辑
  },
})
```

RSS 频道也使用相同形式：

```ts
export default defineChannel({
  key: "solidot.news",
  siteSlug: "solidot",
  channelSlug: "news",
  collectorType: "rss",
  defaults: {
    name: "Solidot",
    intervalSeconds: 1800,
    categorySlugs: ["tech"],
  },
  rss: {
    url: "https://www.solidot.org/index.rss",
  },
})
```

后台可以控制：

- 频道是否启用。
- 抓取间隔。
- 所属分类。
- 是否前台展示。
- 是否允许订阅。
- 是否立即抓取。

后台不控制：

- 抓取器源码。
- 任意 JavaScript 代码执行。
- 动态文件路径拼接。
- 第三方 Cookie 的任意公开展示。

调度器必须通过白名单注册表查找频道定义：

```txt
读取 biz_channel.definition_key
  -> registry 查找频道定义
  -> 找不到则标记频道不可执行
  -> 找到则执行 collect 或 RSS 解析
```

## 统一数据结构

抓取器输出统一为内部结构：

```ts
interface NewsItem {
  sourceItemId?: string
  title: string
  url: string
  mobileUrl?: string
  imageUrl?: string
  summary?: string
  rankNo?: number
  hotValue?: string | number
  hotLabel?: string
  tag?: string
  publishedAt?: string
  extra?: Record<string, unknown>
}
```

`extra` 用于保存来源侧特殊字段，例如微博热搜标记、知乎热度、GitHub star 数等。

## 防重入与并发

当前 MVP 使用 PostgreSQL advisory transaction lock 做同频道防重入：

- 每个频道在创建 `log_crawl_run` 前先尝试拿锁。
- 同频道已有 `running` 任务时，本次任务返回 `skipped`。
- 超过 `CRAWL_RUNNING_TIMEOUT_SECONDS` 的 running 任务会标记为 failed。
- Worker 使用 `CRAWL_CONCURRENCY` 控制并发数量。

Redis 仍保留在部署架构中，后续可用于缓存、队列和更复杂的分布式调度。

## 快照策略

每次成功抓取会尝试生成一条 `biz_channel_snapshot`。

第一版策略：

- 计算榜单内容 hash。
- 同频道相同 hash 不重复写入快照。
- 内容未变化时复用已有快照，并更新频道最近成功时间。
- 新内容会写入快照和快照条目。

这样既能保存历史，又能避免高频频道在内容不变时快速膨胀。

## 条目入库

每条抓取结果写入两层数据：

### biz_snapshot_item

保存当时榜单状态，包括排名、标题、URL、图片、摘要、热度、标签等。

### biz_content_item

保存去重后的内容主记录，用于跨快照统计、话题聚合和追踪。

## 去重策略

优先级：

1. 第三方稳定 ID。
2. 规范化 URL hash。
3. 标题 hash。
4. 标题相似度，后续再做。

当前实现以 URL hash 为主，标题 hash 作为辅助字段。

## 最新数据读取

前台首页和频道页默认读取：

- `biz_channel.last_snapshot_id`
- 对应的 `biz_snapshot_item`

这样可以避免每次都扫描历史范围。

## 失败处理

抓取失败时写入 `log_crawl_run`。

失败策略：

- 每次失败记录错误信息和堆栈。
- 频道 `last_crawl_at` 会更新，避免失败频道被瞬时反复重试。
- 后台提供失败记录页，便于定位问题，并支持对失败记录发起 `retry` 抓取。
- 后台抓取任务页支持对任意频道立即采集。
- 后续可以扩展连续失败自动暂停频道。

## 内容屏蔽

后台可以对快照条目或手动 URL 建立屏蔽记录，记录保存在 `biz_content_block`。

屏蔽按 `url_hash` 生效：

- 首页不展示被屏蔽条目。
- 站点页、分类页、频道页和历史快照页过滤被屏蔽条目。
- `/daily`、`/topics`、`/feed`、`/tracking` 都复用同一过滤逻辑。
- 取消屏蔽使用软删除，保留审核记录。

## 派生任务

快照写入后可以触发后续任务：

- 更新榜中榜。
- 生成用户动态。
- 匹配追踪规则。
- 更新话题。
- 生成日报草稿。

这些任务不应该阻塞抓取主流程，可在后续通过队列异步执行。

## 历史保留

历史快照是未来会员能力基础，不建议轻易删除。

建议策略：

- 最近 90 天保持热数据。
- 90 天之前按月份归档或分区。
- 免费用户只开放近期历史。
- 会员用户开放更长时间范围。
