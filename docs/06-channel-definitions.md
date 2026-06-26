# 频道定义文件

频道定义文件是 NextNews 的核心约定之一。

一句话原则：

> 频道定义文件负责“怎么采集”，后台数据库负责“怎么运营和展示”。

RSS 和复杂爬虫都统一使用频道定义文件。后台不支持在线编写代码，也不暴露 JSON path、CSS selector 等技术参数给普通管理界面。

## 为什么这样设计

后台新增频道时，只填写运营信息：

- 频道名称。
- 频道 slug。
- 所属站点。
- 所属分类。
- 是否首页展示。
- 是否允许订阅。
- 采集频率。
- 是否启用。

真正的采集逻辑放在代码仓库中。这样可以获得：

- 版本管理。
- 类型检查。
- 代码审查。
- 可测试性。
- 可回滚。
- 更低的线上安全风险。

## 目录约定

推荐目录：

```txt
src/server/channels/
  registry.ts
  weibo/
    hot-search.ts
  zhihu/
    hot-list.ts
  github/
    trending-today.ts
  bilibili/
    hot-search.ts
  rss/
    solidot-news.ts
```

每个频道一个文件。文件名使用小写短横线命名。频道 key 使用点号分隔。

示例：

```txt
src/server/channels/weibo/hot-search.ts
key: "weibo.hot-search"

src/server/channels/github/trending-today.ts
key: "github.trending-today"
```

## 频道定义结构

复杂采集频道：

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
    // 请求第三方站点并返回统一 NewsItem[]
  },
})
```

RSS 频道：

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
    isHomeVisible: false,
    isSubscribable: true,
  },
  rss: {
    url: "https://www.solidot.org/index.rss",
  },
})
```

## key、slug 和 URL

三个概念需要分清：

### definition key

采集定义身份，例如：

```txt
weibo.hot-search
github.trending-today
solidot.news
```

它存入 `biz_channel.definition_key`，用于调度器查找频道定义。这个值不应该随便修改。

### site slug

站点 URL 身份，例如：

```txt
weibo
github
solidot
```

站点页 URL：

```txt
/sites/weibo
```

### channel slug

频道 URL 身份，例如：

```txt
hot-search
trending-today
news
```

频道页 URL：

```txt
/channels/weibo/hot-search
```

## 后台新增频道流程

### 从已支持频道添加

后台从 `registry` 读取可用频道定义，展示为可选择列表：

```txt
微博 / 热搜 / weibo.hot-search
知乎 / 热榜 / zhihu.hot-list
GitHub / Trending Today / github.trending-today
```

选择后后台自动填充默认值，你只需要调整：

- 名称。
- 所属分类。
- 是否首页展示。
- 是否允许订阅。
- 采集频率。
- 状态。

### 添加 RSS 频道

RSS 也使用频道定义文件。为了保持所有频道一致，RSS 不直接只存在数据库里。

流程：

1. 创建 RSS 频道定义文件。
2. 在 `registry` 注册。
3. 后台从已支持频道列表中选择并启用。

第一版可以由开发者或 Codex 根据 RSS 地址生成这个文件。

### 提交待接入频道

如果一个频道还没有定义文件，后台只记录需求：

- 频道名称。
- 页面地址。
- 所属站点。
- 期望分类。
- 备注。

状态为 `pending`。等代码仓库补充频道定义文件后，再绑定 `definition_key` 并启用。

## 注册表

调度器只能使用注册表中的白名单。

```ts
export const channelRegistry = {
  "weibo.hot-search": weiboHotSearch,
  "zhihu.hot-list": zhihuHotList,
  "github.trending-today": githubTrendingToday,
}
```

执行流程：

```txt
读取 biz_channel.definition_key
  -> registry 查找频道定义
  -> 合并后台运营配置
  -> 执行 collect 或 RSS 解析
  -> 写入抓取日志
  -> 写入快照
```

禁止根据后台输入动态拼接路径导入模块：

```ts
// 禁止
import(`src/server/channels/${adminInput}.ts`)
```

这样可以避免任意文件加载和任意代码执行风险。

## 后台和频道定义的边界

频道定义文件提供默认值：

- 默认频道名称。
- 默认分类。
- 默认采集频率。
- 默认是否首页展示。
- 默认是否允许订阅。
- 采集逻辑。

后台可以覆盖运营值：

- 实际频道名称。
- 分类。
- 排序。
- 是否启用。
- 是否首页展示。
- 是否允许订阅。
- 采集频率。

后台不能覆盖采集逻辑。

