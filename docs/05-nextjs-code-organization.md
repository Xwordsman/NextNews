# Next.js 代码组织

项目使用 Next.js 16.2.9 和 App Router。`app` 目录只负责路由、布局和页面组合，业务逻辑放到 `features` 和 `server`。

## 推荐目录

```txt
src/
  app/
    (public)/
      page.tsx
      sites/
      categories/
      channels/
      daily/
      feed/
      tracking/
      rankings/
      topics/
      me/
    admin/
      layout.tsx
      page.tsx
      sites/
      categories/
      channels/
      crawls/
      contents/
      operations/
      users/
      settings/
    api/
      public/
      admin/
      webhooks/

  features/
    sites/
    categories/
    channels/
    snapshots/
    daily/
    topics/
    subscriptions/
    tracking/
    admin-shell/

  server/
    auth/
    db/
    channels/
    crawlers/
    jobs/
    worker/
    repositories/
    services/
    cache/

  components/
    ui/
    layout/
    charts/

  lib/
    constants/
    utils/
    validators/

  types/
```

## app 目录职责

`app` 目录只做这些：

- 定义路由。
- 定义布局。
- 调用查询函数获取数据。
- 组合页面组件。
- 处理 metadata。

不要把抓取器、数据库 SQL、复杂业务逻辑直接写在 `app` 页面里。

## features 目录职责

`features` 以业务模块组织代码。

每个模块可以包含：

```txt
components/
queries.ts
actions.ts
schemas.ts
types.ts
```

例如 `features/channels` 负责频道列表、频道表单、频道详情、频道查询和后台操作。

## server 目录职责

`server` 只放服务端代码。

### server/db

数据库连接、schema、迁移和事务工具。

### server/channels

频道定义文件目录。RSS 和复杂爬虫都统一在这里声明，每个频道一个文件。

```txt
server/channels/
  registry.ts
  weibo/
    hot-search.ts
  zhihu/
    hot-list.ts
  github/
    trending-today.ts
  rss/
    solidot-news.ts
```

每个频道定义文件声明稳定的 `key`，例如 `weibo.hot-search`。后台频道记录通过 `definition_key` 绑定该定义。

### server/crawlers

底层采集工具和可复用适配器。复杂频道定义可以调用这里的工具，但后台不直接绑定这里的实现。

```txt
server/crawlers/
  adapters/
    zhihu.ts
    weibo.ts
    github.ts
```

### server/jobs

后台任务。

```txt
server/jobs/
  crawl-channel.ts
  crawl-scheduler.ts
  build-daily-report.ts
  build-ranking.ts
  build-topics.ts
  match-track-rules.ts
```

### server/worker

生产环境中的常驻 Worker 入口。Worker 不提供 HTTP 页面，只负责启动调度器、消费队列、执行抓取任务和派生任务。

建议第一版就保留独立 Worker 进程，部署时使用和 Web 相同的代码镜像，但启动命令不同：

```txt
web     -> pnpm start
worker  -> pnpm worker
```

这样页面访问、后台操作和抓取任务互不抢占进程生命周期。即使 MVP 早期抓取量不大，也不要把长期调度任务塞进 Next.js 页面请求或 Route Handler 里。

### server/repositories

数据库访问层。负责读写表，不包含复杂业务编排。

### server/services

业务服务层。负责编排 repository、cache、crawler 和派生任务。

## 前台路由

建议路由：

```txt
/                         首页
/sites                    站点列表
/sites/[slug]             站点详情
/categories/[slug]        分类详情
/channels/[slug]          频道详情
/daily                    日报
/feed                     订阅动态
/tracking                 追踪
/rankings                 榜中榜
/topics                   话题
/topics/[slug]            话题详情
/me                       个人中心
```

## 后台路由

建议路由：

```txt
/admin                    工作台
/admin/sites              站点管理
/admin/categories         分类管理
/admin/channels           频道管理
/admin/crawls/tasks       抓取任务
/admin/crawls/logs        抓取日志
/admin/contents/latest    最新内容
/admin/contents/snapshots 历史快照
/admin/operations/home    首页配置
/admin/operations/nav     导航配置
/admin/operations/daily   日报配置
/admin/operations/topics  话题配置
/admin/users              用户列表
/admin/users/subscriptions 频道订阅
/admin/settings           系统设置
```

## API 分组

建议 API 区分 public 和 admin：

```txt
/api/public/home
/api/public/sites
/api/public/channels/[slug]
/api/public/snapshots
/api/public/feed

/api/admin/sites
/api/admin/categories
/api/admin/channels
/api/admin/crawls
/api/admin/page-blocks
```

如果页面使用 Server Component 直接查库，部分 public API 可以不做。后台表格和表单可以根据需要使用 Server Actions 或 Route Handlers。

## 抓取任务运行方式

抓取任务代码放在 Next.js 仓库里，但不依赖 React。

可以提供脚本：

```txt
pnpm crawl:once
pnpm crawl:scheduler
pnpm daily:build
pnpm topics:build
```

生产环境由独立 Worker 容器运行调度器。cron 可以作为早期辅助方案，但不作为最终推荐形态。

调度器执行频道时只读取 `biz_channel.definition_key`，然后从 `server/channels/registry.ts` 的白名单注册表中查找频道定义。禁止根据后台输入动态拼接文件路径导入模块。

## 客户端和服务端边界

- 抓取器只能在服务端运行。
- 数据库访问只能在服务端运行。
- 后台表单可以使用 Server Actions。
- 前台交互组件如订阅按钮、收藏按钮、搜索框是 Client Component。
- 展示型页面优先 Server Component。

## 从现有资料迁移

Newsnow 可参考：

- 数据源类型。
- 抓取器组织。
- 卡片 UI。
- 刷新和缓存思路。

`ui` 静态稿可参考：

- 首页整体布局。
- 热门站点横向栏。
- 频道导航。
- 热榜卡片视觉。
- 暗色模式和搜索交互。

正式项目不直接复制静态脚本，而是拆成 React 组件和服务端查询。
