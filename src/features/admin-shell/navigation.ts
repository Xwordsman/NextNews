export type AdminNavigationGroup = {
  title: string
  items: Array<{
    title: string
    href: string
  }>
}

export const adminNavigation: AdminNavigationGroup[] = [
  {
    title: "工作台",
    items: [{ title: "总览", href: "/admin" }],
  },
  {
    title: "内容源",
    items: [
      { title: "站点管理", href: "/admin/sites" },
      { title: "分类管理", href: "/admin/categories" },
      { title: "频道管理", href: "/admin/channels" },
    ],
  },
  {
    title: "抓取中心",
    items: [
      { title: "抓取任务", href: "/admin/crawls/tasks" },
      { title: "抓取日志", href: "/admin/crawls/logs" },
      { title: "失败记录", href: "/admin/crawls/failures" },
    ],
  },
  {
    title: "内容库",
    items: [
      { title: "最新内容", href: "/admin/contents/latest" },
      { title: "历史快照", href: "/admin/contents/snapshots" },
      { title: "屏蔽内容", href: "/admin/contents/blocked" },
    ],
  },
  {
    title: "前台运营",
    items: [
      { title: "首页配置", href: "/admin/operations/home" },
      { title: "运营统计", href: "/admin/operations/analytics" },
      { title: "导航配置", href: "/admin/operations/nav" },
      { title: "热门站点", href: "/admin/operations/sites" },
      { title: "榜中榜配置", href: "/admin/operations/rankings" },
      { title: "日报配置", href: "/admin/operations/daily" },
      { title: "话题配置", href: "/admin/operations/topics" },
    ],
  },
  {
    title: "用户中心",
    items: [
      { title: "用户列表", href: "/admin/users" },
      { title: "频道订阅", href: "/admin/users/subscriptions" },
      { title: "追踪规则", href: "/admin/users/tracking" },
      { title: "站内通知", href: "/admin/users/notifications" },
    ],
  },
  {
    title: "系统设置",
    items: [{ title: "基础设置", href: "/admin/settings" }],
  },
]
