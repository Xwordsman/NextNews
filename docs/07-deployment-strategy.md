# 部署策略

NextNews 第一阶段只重点支持服务器自部署，推荐使用宝塔面板的 Docker 容器编排能力。部署形态参考 new-api、sub2api 这类项目：准备一份 `docker-compose.yml`，在宝塔中创建编排，启动后得到一组长期运行的容器。

## 部署结论

第一版推荐 4 个容器：

```txt
nextnews-web       Next.js 前台、后台、API
nextnews-worker    抓取调度、快照入库、日报、话题、追踪等后台任务
nextnews-postgres  PostgreSQL 数据库
nextnews-redis     缓存、后续任务队列、限流和分布式调度扩展
```

如果强行压缩，也可以临时做成 3 个容器：`web`、`postgres`、`redis`。但这意味着抓取调度要跑在 `web` 容器里，后续会带来页面服务和抓取任务互相影响的问题。因此项目设计上以 4 个容器为标准。

## 为什么需要 Worker

NextNews 不是纯展示站，核心能力依赖定时和异步任务：

- 定时抓取各频道榜单。
- 写入频道快照和快照条目。
- 失败重试、退避、暂停异常频道。
- 生成日报、榜中榜、话题。
- 匹配用户追踪规则。
- 刷新首页和频道缓存。

这些任务不适合放在 Web 请求中执行。Web 容器应该专注处理页面、后台和 API；Worker 容器应该专注处理后台任务。二者可以使用同一个 Docker 镜像，只是启动命令不同。

## 容器职责

### nextnews-web

职责：

- 提供前台页面。
- 提供 `/admin` 后台。
- 提供 public/admin API。
- 处理登录、订阅、后台配置等用户请求。
- 读取 PostgreSQL 和 Redis。

不负责：

- 长时间抓取第三方站点。
- 常驻调度器。
- 批量生成日报、话题、榜中榜。

### nextnews-worker

职责：

- 扫描需要抓取的频道。
- 根据 `definition_key` 查找频道定义文件。
- 执行 RSS 或自定义采集逻辑。
- 写入 `biz_channel_snapshot`、`biz_snapshot_item`、`biz_content_item`。
- 写入 `log_crawl_run`。
- 执行派生任务。
- 使用 PostgreSQL advisory lock 做同频道防重入。
- 后续可接入 Redis 队列和缓存刷新。

Worker 不对公网暴露端口。

### nextnews-postgres

职责：

- 保存业务数据。
- 保存频道历史快照。
- 保存用户、订阅、追踪、后台配置。
- 作为未来会员历史查询、统计分析和归档的基础。

PostgreSQL 必须挂载持久化 volume，并设置定期备份。

### nextnews-redis

职责：

- 首页、频道最新快照等高频读取缓存。
- 首页、频道最新快照等高频读取缓存。
- 后续轻量队列或任务状态。
- 登录态、限流、后台操作节流等扩展能力。

MVP 早期同频道防重入已经由 PostgreSQL advisory lock 承担，Redis 先作为部署架构中的缓存与后续队列预留。后续抓取量变大时，再把 Redis 队列和分布式调度能力正式做重。

## 宝塔部署方式

建议在宝塔中使用“Docker 容器编排”创建项目，而不是手动一个个创建容器。

项目需要提供：

```txt
docker-compose.yml
.env.docker.example
Dockerfile
```

宝塔编排时只需要用户填写 `.env`，然后启动编排。域名、HTTPS、反向代理可以交给宝塔面板处理。

外部访问只开放 Web：

```txt
https://your-domain.com -> 宝塔 Nginx/反向代理 -> nextnews-web:3000
```

PostgreSQL、Redis、Worker 默认不暴露公网端口。

## 镜像构建流程

项目不要求在本地启动 PostgreSQL 做集成测试。开发机只做代码检查和生产构建验证：

```txt
pnpm check
pnpm build
```

代码推送到 GitHub 后，由 GitHub Actions 构建 Docker 镜像并推送到 GitHub Container Registry：

```txt
ghcr.io/xwordsman/nextnews:latest
ghcr.io/xwordsman/nextnews:sha-<commit>
```

服务器测试流程：

1. 在 GitHub 仓库开启 Packages 写入权限。
2. 推送代码到 `main` 或 `master`。
3. 等待 Actions 生成镜像。
4. 在服务器的 `.env` 中设置 `NEXTNEWS_IMAGE=ghcr.io/xwordsman/nextnews:latest`。
5. 宝塔 Docker 编排拉取镜像并启动 `web`、`worker`、`postgres`、`redis`。
6. 首次启动后执行迁移服务或进入 Web 容器运行 `pnpm db:migrate`。

## 推荐 Compose 形态

当前仓库已经提供正式 `docker-compose.yml`。结构如下：

```yaml
services:
  web:
    image: ${NEXTNEWS_IMAGE}
    command: pnpm start
    ports:
      - "${WEB_PORT:-3000}:3000"
    depends_on:
      - postgres
      - redis

  worker:
    image: ${NEXTNEWS_IMAGE}
    command: pnpm worker
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

正式文件以仓库根目录的 `docker-compose.yml` 为准。`migrate` 服务使用 profile，不会默认常驻启动，需要迁移时单独运行。

## 环境变量

第一版至少需要：

```txt
APP_URL=https://your-domain.com
DATABASE_URL=postgresql://nextnews:password@postgres:5432/nextnews
REDIS_URL=redis://redis:6379
AUTH_SECRET=
ADMIN_EMAIL=
ADMIN_PASSWORD=
WORKER_POLL_INTERVAL_SECONDS=30
CRAWL_BATCH_SIZE=5
CRAWL_CONCURRENCY=3
CRAWL_DEFAULT_INTERVAL_SECONDS=300
CRAWL_RUNNING_TIMEOUT_SECONDS=900
```

正式上线后，`ADMIN_PASSWORD` 只用于初始化第一个管理员账号，不应该每次启动都覆盖已有账号。

## 数据备份

PostgreSQL 是最重要的数据资产，必须从第一版就规划备份。

建议：

- 每日自动备份 PostgreSQL。
- 备份文件保留至少 7 天。
- 每周保留一个长期备份。
- 宝塔面板本地备份之外，最好同步一份到对象存储或另一台服务器。
- Redis 不是核心历史数据来源，丢失后应该可以从 PostgreSQL 重建缓存。

## Vercel 和 Cloudflare Pages

第一阶段不把 Vercel、Cloudflare Pages 作为正式支持目标。

原因：

- NextNews 需要 PostgreSQL 保存历史快照。
- 需要常驻 Worker 执行定时抓取。
- 需要 Redis 作为缓存、队列和分布式调度的扩展基础；当前同频道抓取锁由 PostgreSQL advisory lock 承担。
- 后台管理、抓取日志、失败重试都更适合服务器自部署。
- Vercel 和 Cloudflare Pages 更适合纯前端或轻量 Serverless，不适合作为完整抓取系统的唯一运行环境。

未来可以考虑一种折中方案：主服务仍部署在服务器，Vercel 或 Cloudflare 只作为只读前台镜像，通过 API 读取主服务数据。但这不是 MVP 目标。

## 阶段策略

MVP：

- Docker Compose 自部署。
- 4 个容器：Web、Worker、PostgreSQL、Redis。
- 宝塔负责域名、HTTPS、反向代理。
- Worker 使用简单数据库扫描、`CRAWL_CONCURRENCY` 并发控制和 PostgreSQL advisory lock。

第二阶段：

- 增加更完整的队列系统。
- 增加自动备份脚本。
- 增加一键初始化管理员。
- 增加健康检查和任务监控。

第三阶段：

- 支持读写分离或独立搜索服务。
- 支持只读前台镜像部署。
- 支持更复杂的历史归档策略。
