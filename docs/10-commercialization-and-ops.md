# 商业化与运营控制

本阶段补齐的是“可商业化、可观察、可沉淀用户行为”的第一版能力。商业化默认关闭，后台可以随时开启或关闭；关闭时不影响后台手动配置会员权益，也不会在前台暴露购买入口。

## 后台业务开关

入口：`/admin/settings`

当前开关：

- `commerce.enabled`：会员商业化。关闭时 `/membership` 不开放，个人中心不展示套餐入口。
- `search.logging_enabled`：前台搜索日志。开启后记录关键词、筛选条件、结果数量、用户和请求信息。
- `notification.subscription_enabled`：订阅频道通知。关闭后 Worker 不再为频道新快照生成订阅通知。
- `notification.tracking_enabled`：追踪命中通知。关闭后仍记录命中结果，但不生成站内通知。
- `notification.subscription_min_interval_minutes`：同一用户同一频道订阅通知最小间隔。
- `daily.auto_generate_enabled`：日报自动生成预留开关。
- `daily.require_review`：日报自动生成后的审核策略预留。
- `analytics.export_enabled`：运营统计 CSV 导出。
- `jobs.async_enabled`：异步任务队列预留。开启后新快照可写入 `sys_job_queue`。

## 会员商业化

后台入口：`/admin/users/memberships`

前台入口：`/membership`

数据表：

- `membership_plan`：可售套餐，包含价格、币种、历史天数、有效期、启用和推荐状态。
- `membership_order`：订单预留，当前只创建 `pending` 订单，不接真实支付。
- `user_membership`：用户当前权益，仍由后台手动授权或后续支付回调写入。

当前边界：

- 商业化关闭时，套餐和订单后台仍可管理，但前台不展示购买入口。
- 前台创建订单后跳回个人中心提示，真实支付网关后续再接入。
- 历史快照权限仍以 `user_membership.history_days` 为准。

## 搜索分析

后台入口：`/admin/operations/search`

数据表：`log_search_query`

当前能力：

- `/search` 查询成功后记录关键词、站点、频道、日期范围、结果数量。
- 后台展示热门关键词、平均结果数、最近搜索日志。
- 是否记录由 `search.logging_enabled` 控制。

## 收藏与阅读历史

前台入口：

- `/bookmarks`
- `/history`
- `/go/[snapshotItemId]`

数据表：

- `user_bookmark`：用户收藏的快照条目。
- `user_read_history`：通过 `/go/[snapshotItemId]` 打开的阅读记录。

当前能力：

- 频道榜单、快照、首页、搜索、日报、榜中榜、话题、动态和追踪等主要入口尽量统一走 `/go`。
- 登录用户打开内容时记录阅读次数、首次阅读时间和最近阅读时间。
- 收藏使用 Server Action 表单，未登录用户会被引导到登录页。

## 日报模板与任务队列

后台入口：`/admin/operations/daily`

数据表：

- `biz_daily_report_template`：日报模板，包含标题模板、摘要模板、频道数、每频道条目数、执行时间、是否自动发布和是否需要审核。
- `sys_job_queue`：系统任务队列预留。

当前边界：

- 日报模板先作为后台配置落库，Worker 自动生成策略后续再消费。
- 新快照生成后，在 `jobs.async_enabled` 开启时会写入 `snapshot.created` 任务。
- 任务队列页面在 `/admin/settings/operations`，用于查看 pending/running/success/failed 等状态。

## 操作日志与导出

后台入口：

- `/admin/settings/operations`
- `/admin/operations/analytics/export`

数据表：

- `sys_operation_log`：管理员关键操作日志。
- `sys_job_queue`：任务队列。

当前能力：

- 基础设置、会员套餐、日报模板等关键后台操作会记录日志。
- 运营统计支持 CSV 导出，受 `analytics.export_enabled` 控制。

## 后续扩展顺序

1. 支付网关：接入支付创建、回调验签、订单状态变更和 `user_membership` 自动授权。
2. 任务队列消费：Worker 消费 `sys_job_queue`，处理日报生成、通知聚合和异常预警。
3. 搜索增强：PostgreSQL 全文索引、`pg_trgm` 或独立搜索服务。
4. 通知策略：按排名变化、热度变化、时间窗口和用户偏好生成通知。
5. 管理员审计：把更多关键后台操作接入 `sys_operation_log`。
