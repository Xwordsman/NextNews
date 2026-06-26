# NextNews

NextNews 是一个带后台运营能力的新闻与热榜聚合系统。

当前开发阶段：项目骨架。

## 本地开发

```bash
pnpm install
docker compose -f docker-compose.dev.yml up -d
pnpm dev
```

## 常用命令

```bash
pnpm dev
pnpm build
pnpm start
pnpm check
pnpm worker
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

## 文档

项目设计文档位于 [docs](./docs)。
