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

## Docker 部署

服务器部署推荐使用宝塔 Docker 容器编排，镜像为：

```txt
ghcr.io/xwordsman/nextnews:latest
```

首次启动后访问站点地址会自动进入 `/install` 安装向导。填写网站名称、网址和管理员账号后，系统会自动完成数据库迁移、默认数据写入和管理员创建。

## 文档

项目设计文档位于 [docs](./docs)。
