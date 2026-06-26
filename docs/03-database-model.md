# 数据库模型

NextNews 使用 PostgreSQL。选择 PostgreSQL 的原因是：项目需要长期保存历史快照，后续还会继续扩展榜中榜、话题聚合、日报、订阅动态、追踪规则和会员历史查询。

## 设计约定

- 表名使用小写蛇形命名。
- 业务表使用 `biz_` 前缀。
- 关系表使用 `rel_` 前缀。
- 日志表使用 `log_` 前缀。
- 系统表使用 `sys_` 前缀。
- 时间字段使用 `timestamptz`。
- 扩展字段使用 `jsonb`。
- 软删除字段使用 `deleted_at`，默认不物理删除核心资料。
- 高频查询必须有组合索引。

## 已落地核心表

```txt
系统
  sys_user
  sys_setting

内容源
  biz_site
  biz_category
  biz_channel
  rel_channel_category

抓取与历史
  log_crawl_run
  biz_channel_snapshot
  biz_snapshot_item
  biz_content_item

用户能力
  rel_user_channel_subscription
  user_tracking_rule
  user_tracking_match
  user_notification
  user_membership

运营与审核
  biz_content_block
  biz_daily_report
  biz_daily_report_item
  biz_home_module
  biz_ranking_config
  rel_ranking_channel
  biz_topic
  rel_topic_snapshot_item
```

## sys_user

系统用户表，当前同时承载后台管理员和前台读者。

关键字段：

- `email`
- `password_hash`
- `display_name`
- `role`: `admin` 或 `user`
- `status`: `active` 或 `disabled`
- `last_login_at`

说明：

- 后台登录只允许 `role = admin`。
- 前台个人中心只允许 `role = user`。
- 后台 session 和前台 session 使用不同 cookie，避免权限混用。

## biz_site

站点表，表示微博、知乎、GitHub、Solidot 这类内容来源品牌。

关键字段：

- `site_name`
- `slug`
- `homepage_url`
- `logo_url`
- `description`
- `status`
- `sort`
- `is_visible`

关键索引：

- `uk_biz_site_slug`
- `idx_biz_site_status_sort`

## biz_category

分类表，用于前台导航、首页模块和频道归类。

关键字段：

- `category_name`
- `slug`
- `parent_id`
- `icon`
- `color`
- `sort`
- `is_nav_visible`
- `is_home_visible`
- `status`

关键索引：

- `uk_biz_category_slug`
- `idx_biz_category_parent_sort`

## biz_channel

频道表，表示一个具体可抓取的榜单或信息流。一个站点可以有多个频道。

关键字段：

- `site_id`
- `channel_name`
- `slug`
- `definition_key`
- `collector_type`
- `channel_type`
- `homepage_url`
- `crawl_interval_seconds`
- `is_crawl_enabled`
- `is_public`
- `is_home_visible`
- `is_subscribable`
- `display_style`
- `weight`
- `sort`
- `status`
- `last_snapshot_id`
- `last_crawl_at`
- `last_success_at`

`definition_key` 对应代码仓库中的频道定义，例如：

- `weibo.hot-search`
- `zhihu.hot-list`
- `github.trending-today`
- `solidot.news`

后台只填写频道基础信息和 `definition_key`。采集执行器只能从注册表中查找该 key，禁止根据后台输入动态拼接文件路径或执行任意代码。

关键索引：

- `uk_biz_channel_site_slug`
- `uk_biz_channel_definition_key`
- `idx_biz_channel_site_status`
- `idx_biz_channel_home_sort`
- `idx_biz_channel_crawl_enabled`

## rel_channel_category

频道和分类的多对多关系。

关键字段：

- `channel_id`
- `category_id`
- `sort`

关键索引：

- `uk_rel_channel_category`
- `idx_rel_channel_category_category`

## log_crawl_run

抓取日志表。每次手动或定时抓取都会生成一条记录。

关键字段：

- `channel_id`
- `run_type`: `scheduled`、`manual`、`retry`
- `status`: `running`、`success`、`failed`、`skipped`
- `started_at`
- `finished_at`
- `duration_ms`
- `fetched_count`
- `inserted_count`
- `snapshot_id`
- `error_message`
- `error_stack`

说明：

- 当前实现会在同频道已有 `running` 任务时跳过新任务。
- 超过 `CRAWL_RUNNING_TIMEOUT_SECONDS` 的 running 任务会被标记为 failed，避免永久占用运行状态。

## biz_channel_snapshot

频道快照表。一次成功抓取对应一个快照。

关键字段：

- `channel_id`
- `crawl_run_id`
- `snapshot_time`
- `snapshot_date`
- `item_count`
- `content_hash`
- `status`

关键索引：

- `idx_biz_channel_snapshot_channel_time`
- `idx_biz_channel_snapshot_date`
- `uk_biz_channel_snapshot_hash`

说明：

- 同一频道、相同 `content_hash` 不重复写入快照。
- 内容未变化时复用已有快照，并更新频道最近采集时间。

## biz_snapshot_item

快照条目表，保存某次快照中的排名、标题、URL、图片、摘要和热度。

关键字段：

- `snapshot_id`
- `channel_id`
- `content_item_id`
- `rank_no`
- `title`
- `url`
- `url_hash`
- `image_url`
- `summary`
- `hot_value`
- `hot_label`
- `tag`
- `published_at`

关键索引：

- `idx_biz_snapshot_item_snapshot_rank`
- `idx_biz_snapshot_item_channel_time`
- `idx_biz_snapshot_item_url_hash`

## biz_content_item

内容主表，用于跨快照去重和后续话题聚合。

关键字段：

- `canonical_title`
- `canonical_url`
- `url_hash`
- `title_hash`
- `first_channel_id`
- `first_seen_at`
- `last_seen_at`
- `image_url`

关键索引：

- `uk_biz_content_item_url_hash`
- `idx_biz_content_item_title_hash`
- `idx_biz_content_item_last_seen`

## rel_user_channel_subscription

前台用户频道订阅关系表。

关键字段：

- `user_id`
- `channel_id`
- `sort`
- `is_pinned`
- `notify_enabled`
- `extra`
- `created_at`
- `updated_at`

关键索引：

- `uk_rel_user_channel_subscription`
- `idx_rel_user_channel_subscription_user`
- `idx_rel_user_channel_subscription_channel`

说明：

- 用于个人中心和 `/feed` 动态页。
- `notify_enabled` 已用于订阅频道更新通知，Worker 写入新快照后会为开启通知的用户生成 `user_notification`。
- `is_pinned` 继续预留给订阅排序。

## user_membership

用户会员权益表。后台直接给前台用户配置套餐、历史查询天数和到期时间。

关键字段：

- `user_id`
- `plan_key`
- `plan_name`
- `status`: `active`、`expired`、`canceled`
- `history_days`
- `started_at`
- `expires_at`
- `note`

关键索引：

- `uk_user_membership_user`
- `idx_user_membership_status_expiry`

说明：

- 访客默认可看最近 7 天历史。
- 登录普通用户默认可看最近 30 天历史。
- 有效会员按 `history_days` 控制历史快照和日报详情访问边界。

## user_tracking_rule

用户追踪规则表。用户在前台 `/tracking` 创建关键词规则，后台可以查看并停用。

关键字段：

- `user_id`
- `keyword`
- `description`
- `is_enabled`
- `notify_enabled`
- `last_matched_at`

关键索引：

- `uk_user_tracking_rule_keyword`
- `idx_user_tracking_rule_user`

说明：

- 当前实现以关键词匹配最新公开快照条目。
- 通知字段先作为策略开关保留，后续可接入邮件、站内通知或 Webhook。

## biz_content_block

内容屏蔽表。后台可以从最新内容页一键屏蔽，也可以手动添加 URL。

关键字段：

- `content_item_id`
- `snapshot_item_id`
- `title`
- `url`
- `url_hash`
- `reason`
- `created_by`
- `deleted_at`

关键索引：

- `idx_biz_content_block_url_hash`
- `idx_biz_content_block_deleted`
- `idx_biz_content_block_snapshot_item`

说明：

- 前台首页、频道、站点、分类、日报、话题和个人动态都会过滤 active 屏蔽记录。
- 取消屏蔽使用软删除，保留审核痕迹。

## biz_daily_report

日报发布表。后台负责发布/下线日报，前台 `/daily` 读取最新 active 日报，并聚合当前首页频道最新快照。

关键字段：

- `report_date`
- `title`
- `summary`
- `status`
- `published_at`
- `channel_limit`
- `item_limit_per_channel`

关键索引：

- `uk_biz_daily_report_date`
- `idx_biz_daily_report_status_date`

## biz_daily_report_item

日报人工精选关系表。后台可以把已经入库的快照条目挂载到某一份日报，前台日报详情页会优先展示这些人工精选内容。

关键字段：

- `report_id`
- `snapshot_item_id`
- `sort`
- `note`
- `created_by`
- `created_at`

关键索引：

- `uk_biz_daily_report_item`
- `idx_biz_daily_report_item_report_sort`
- `idx_biz_daily_report_item_snapshot`

## biz_topic

话题配置表。后台维护话题名称、slug、关键词和展示状态，前台 `/topics` 基于关键词匹配最新入库内容。

关键字段：

- `topic_name`
- `slug`
- `description`
- `keywords`
- `status`
- `is_home_visible`
- `sort`

关键索引：

- `uk_biz_topic_slug`
- `idx_biz_topic_status_sort`

## 阶段 10 新增运营表

### biz_home_module

首页模块配置表。后台可以控制首页模块是否启用、标题、副标题、排序和展示数量。

关键字段：

- `module_key`
- `title`
- `subtitle`
- `status`
- `sort`
- `display_limit`
- `config`

关键索引：

- `uk_biz_home_module_key`
- `idx_biz_home_module_status_sort`

### biz_ranking_config / rel_ranking_channel

榜中榜配置表和榜中榜频道关系表。一个榜中榜配置可以绑定多个频道，并为每个频道设置权重和排序。

关键字段：

- `config_name`
- `slug`
- `description`
- `status`
- `is_default`
- `time_window_hours`
- `item_limit`
- `per_channel_limit`
- `channel_id`
- `weight`

说明：

- 前台 `/rankings` 优先读取 active 且默认的榜中榜配置。
- 榜中榜只聚合已入库快照，不实时请求第三方站点。
- 排名分数由频道权重、原榜排名和快照新鲜度综合计算。

### rel_topic_snapshot_item

话题和快照条目的人工关联表。后台可以把重要内容手动挂载到指定话题，前台话题详情页会把人工关联内容放在自动匹配内容之前。

关键字段：

- `topic_id`
- `snapshot_item_id`
- `sort`
- `is_pinned`
- `note`
- `created_by`

关键索引：

- `uk_rel_topic_snapshot_item`
- `idx_rel_topic_snapshot_item_topic_sort`
- `idx_rel_topic_snapshot_item_snapshot`

### user_tracking_match

用户追踪命中记录表。Worker 写入新快照后，会把命中的追踪规则结果落库，避免每次打开 `/tracking` 都重新扫最新内容。

关键字段：

- `rule_id`
- `user_id`
- `snapshot_item_id`
- `title`
- `url`
- `matched_keyword`
- `is_read`
- `matched_at`

关键索引：

- `uk_user_tracking_match_rule_item`
- `idx_user_tracking_match_user_time`
- `idx_user_tracking_match_rule_time`

### user_notification

站内通知表。当前主要承载追踪命中通知，后续可以扩展订阅提醒、系统消息和会员提醒。

关键字段：

- `user_id`
- `notification_type`
- `title`
- `body`
- `href`
- `source_type`
- `source_id`
- `is_read`
- `read_at`

关键索引：

- `idx_user_notification_user_time`
- `idx_user_notification_unread`

## 本轮新增商业化与运营控制表

### membership_plan

可售会员套餐表。商业化默认关闭，但套餐配置可以先在后台维护，等待后续接入支付网关。

关键字段：

- `plan_key`
- `plan_name`
- `description`
- `price_cents`
- `currency`
- `history_days`
- `duration_days`
- `is_enabled`
- `is_featured`
- `sort`
- `extra`

关键索引：

- `uk_membership_plan_key`
- `idx_membership_plan_enabled_sort`

### membership_order

会员订单预留表。当前前台只创建 `pending` 订单，不接真实支付；后续支付回调会更新订单状态并授予 `user_membership`。

关键字段：

- `user_id`
- `plan_id`
- `plan_key`
- `plan_name`
- `amount_cents`
- `currency`
- `status`: `pending`、`paid`、`closed`、`refunded`
- `payment_provider`
- `provider_trade_no`
- `paid_at`
- `expires_at`
- `raw_payload`

关键索引：

- `idx_membership_order_user_time`
- `idx_membership_order_status_time`
- `idx_membership_order_provider_trade`

### biz_daily_report_template

日报模板表。用于后台预先配置日报标题、摘要、频道数量、每频道条目数、自动发布和审核策略。当前先落库配置，自动生成由后续任务消费实现。

关键字段：

- `template_name`
- `status`
- `title_pattern`
- `summary_pattern`
- `channel_limit`
- `item_limit_per_channel`
- `auto_publish`
- `require_review`
- `schedule_time`
- `sort`
- `extra`

关键索引：

- `idx_biz_daily_report_template_status_sort`

### user_bookmark

用户收藏表。前台主要榜单入口可以把快照条目加入收藏，个人中心通过 `/bookmarks` 查看。

关键字段：

- `user_id`
- `snapshot_item_id`
- `channel_id`
- `title`
- `url`
- `note`
- `created_at`
- `updated_at`

关键索引：

- `uk_user_bookmark_item`
- `idx_user_bookmark_user_time`

### user_read_history

用户阅读历史表。前台内容链接统一尽量走 `/go/[snapshotItemId]`，登录用户跳转第三方 URL 前写入阅读历史。

关键字段：

- `user_id`
- `snapshot_item_id`
- `channel_id`
- `title`
- `url`
- `read_count`
- `first_read_at`
- `last_read_at`

关键索引：

- `uk_user_read_history_item`
- `idx_user_read_history_user_time`

### log_search_query

搜索日志表。是否记录由 `search.logging_enabled` 控制，用于后台分析热门关键词、筛选条件和搜索结果质量。

关键字段：

- `user_id`
- `keyword`
- `site_slug`
- `channel_id`
- `date_from`
- `date_to`
- `result_count`
- `source_ip`
- `user_agent`
- `created_at`

关键索引：

- `idx_log_search_query_keyword_time`
- `idx_log_search_query_user_time`

### sys_operation_log

后台操作日志表。用于记录管理员关键操作，例如更新系统设置、维护会员套餐、调整日报模板等。

关键字段：

- `admin_id`
- `action`
- `target_type`
- `target_id`
- `summary`
- `source_ip`
- `created_at`

关键索引：

- `idx_sys_operation_log_admin_time`
- `idx_sys_operation_log_action_time`

### sys_job_queue

系统任务队列表。当前作为异步任务预留，`jobs.async_enabled` 开启后新快照会写入 `snapshot.created` 任务；后续 Worker 可消费日报生成、通知聚合和异常预警。

关键字段：

- `job_type`
- `status`: `pending`、`running`、`success`、`failed`
- `payload`
- `attempts`
- `max_attempts`
- `available_at`
- `locked_at`
- `finished_at`
- `error_message`
- `created_at`
- `updated_at`

关键索引：

- `idx_sys_job_queue_status_available`
- `idx_sys_job_queue_type_time`

## 后续规划表

```txt
前台配置
  cfg_nav_item
  cfg_page_block
  rel_page_block_channel

搜索增强
  PostgreSQL 全文索引或独立搜索服务
```

## 大表策略

`biz_snapshot_item` 会是增长最快的表，需要从第一版就注意：

- 首页和频道页默认读取 `biz_channel.last_snapshot_id` 对应的最新快照，不扫全历史。
- 历史查询必须按频道和时间范围过滤。
- 后续数据变大后，可按 `snapshot_time` 或 `created_at` 月份分区。
- 全文搜索、相似标题搜索、话题聚合可以后续交给专门服务。
