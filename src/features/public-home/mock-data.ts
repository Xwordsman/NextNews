export type HomeStory = {
  id?: string
  title: string
  meta?: string
  metaVariant?: "muted" | "heat" | "tag"
  url?: string
  badge?: string
  badgeVariant?: "label" | "heat"
}

export type HomeSource = {
  id: string
  name: string
  logo: string
  tag: string
  updatedLabel?: string
  category: string
  color: string
  logoColor: string
  favorite: boolean
  href?: string
  items: HomeStory[]
}

export const primaryNavItems = [
  { label: "首页", href: "/" },
  { label: "日报", href: "/daily" },
  { label: "动态", href: "/feed" },
  { label: "追踪", href: "/tracking" },
  { label: "榜中榜", href: "/rankings" },
  { label: "话题", href: "/topics" },
]

export const categoryNavItems = [
  { label: "综合", href: "/categories/general" },
  { label: "科技", href: "/categories/tech" },
  { label: "娱乐", href: "/categories/entertainment" },
  { label: "社区", href: "/categories/community" },
  { label: "购物", href: "/categories/shopping" },
  { label: "财经", href: "/categories/finance" },
  { label: "开发", href: "/categories/dev" },
  { label: "简报", href: "/categories/brief" },
  { label: "AI", href: "/categories/ai" },
]

export const moreNavItems = [
  { label: "全球", href: "/categories/global" },
  { label: "体育", href: "/categories/sports" },
  { label: "汽车", href: "/categories/auto" },
]

export const initialSources: HomeSource[] = [
  {
    id: "zhihu",
    name: "知乎",
    logo: "知",
    tag: "刚刚更新",
    category: "community",
    color: "#456a9e",
    logoColor: "#1777ff",
    favorite: true,
    href: "/channels/zhihu/hot-list",
    items: [
      {
        title: "如何看待今天科技圈的几条重要变化？",
        meta: "452 万热度",
        badge: "热",
      },
      { title: "AI 时代普通人还需要学习编程吗？", meta: "392 万热度" },
      { title: "有哪些长期主义的个人知识管理方法？", meta: "376 万热度" },
      { title: "年轻人为什么重新爱上实体书店？", meta: "315 万热度" },
      { title: "远程协作团队如何保持高质量沟通？", meta: "234 万热度" },
      {
        title: "大模型产品怎样判断是否真的有用？",
        meta: "206 万热度",
        badge: "新",
      },
    ],
  },
  {
    id: "weibo",
    name: "微博",
    logo: "微",
    tag: "实时热搜",
    category: "entertainment",
    color: "#954b4d",
    logoColor: "#f0443e",
    favorite: true,
    href: "/channels/weibo/hot-search",
    items: [
      { title: "暑期档电影票房刷新单日纪录", meta: "爆", badge: "热" },
      { title: "多地公布高考录取分数线", meta: "新", badge: "新" },
      { title: "不要买路边切好的半个西瓜", meta: "热" },
      { title: "热门综艺最新一期讨论度拉满", meta: "热" },
      { title: "城市夜骑路线推荐", meta: "新" },
      { title: "年轻人开始重新整理自己的房间", meta: "热" },
    ],
  },
  {
    id: "github",
    name: "GitHub",
    logo: "G",
    tag: "Trending",
    category: "dev",
    color: "#2d3644",
    logoColor: "#0f172a",
    favorite: true,
    href: "/channels/github/trending-today",
    items: [
      {
        title: "open-source-ai / browser-agent",
        meta: "15.2k stars",
        badge: "热",
      },
      { title: "next-runtime / edge-cache-lab", meta: "8.7k stars" },
      { title: "data-viz / canvas-grid", meta: "6.1k stars" },
      { title: "docs-ai / markdown-indexer", meta: "5.8k stars", badge: "新" },
      { title: "oss-tools / release-note-kit", meta: "4.9k stars" },
      { title: "frontend-labs / tiny-motion", meta: "4.1k stars" },
    ],
  },
  {
    id: "solidot",
    name: "Solidot",
    logo: "S",
    tag: "科技资讯",
    category: "tech",
    color: "#375879",
    logoColor: "#2563eb",
    favorite: false,
    href: "/channels/solidot/news",
    items: [
      { title: "研究团队发布新的开源数据集", meta: "科技" },
      { title: "浏览器隐私功能迎来新一轮更新", meta: "软件", badge: "新" },
      { title: "开源社区讨论长期维护资金问题", meta: "开源" },
      { title: "芯片制程路线图出现新的节点", meta: "硬件", badge: "热" },
      { title: "新的数据库版本通过行业压测", meta: "数据库" },
      { title: "科学家改进电池回收流程", meta: "科学" },
    ],
  },
  {
    id: "wallstreetcn",
    name: "华尔街见闻",
    logo: "W",
    tag: "最热",
    category: "finance",
    color: "#426795",
    logoColor: "#2478e6",
    favorite: false,
    items: [
      { title: "科技股回调，市场重新评估增长预期", meta: "市场", badge: "热" },
      { title: "早报：全球资产价格出现分化", meta: "早报" },
      { title: "机构讨论 AI 投资周期的下一阶段", meta: "观点" },
      { title: "人民币汇率保持双向波动", meta: "外汇" },
      { title: "消费板块午后走强", meta: "A股" },
      { title: "原油价格小幅反弹", meta: "全球" },
    ],
  },
  {
    id: "bilibili",
    name: "哔哩哔哩",
    logo: "B",
    tag: "热门",
    category: "entertainment",
    color: "#2f6f86",
    logoColor: "#00aeec",
    favorite: false,
    items: [
      {
        title: "三分钟看懂新一代 AI 视频模型",
        meta: "播放 243 万",
        badge: "热",
      },
      { title: "做一个真正好用的个人知识库", meta: "播放 178 万" },
      { title: "国产游戏美术幕后流程拆解", meta: "播放 156 万" },
      {
        title: "AI 修复老电影到底做对了什么",
        meta: "播放 132 万",
        badge: "新",
      },
      { title: "高考志愿专业差异简明解释", meta: "播放 119 万" },
      { title: "周末城市散步路线推荐", meta: "播放 88 万" },
    ],
  },
  {
    id: "36kr",
    name: "36氪",
    logo: "K",
    tag: "人气榜",
    category: "finance",
    color: "#426795",
    logoColor: "#2d8cff",
    favorite: false,
    items: [
      { title: "智能硬件公司考虑新一轮融资", meta: "融资", badge: "热" },
      { title: "低空经济公司密集发布新品", meta: "产业" },
      { title: "AI 办公工具进入团队协作场景", meta: "AI" },
      { title: "本地生活平台优化商家工具", meta: "消费" },
      { title: "创业公司开始重视现金流管理", meta: "创业" },
      { title: "机器人零部件供应链继续升温", meta: "硬件" },
    ],
  },
  {
    id: "producthunt",
    name: "Product Hunt",
    logo: "P",
    tag: "Today",
    category: "ai",
    color: "#513b57",
    logoColor: "#da552f",
    favorite: false,
    items: [
      {
        title: "Briefly AI - meeting notes that write themselves",
        meta: "1,204 upvotes",
        badge: "热",
      },
      {
        title: "CanvasDesk - collaborative planning board",
        meta: "982 upvotes",
      },
      {
        title: "StackPilot - deploy internal tools faster",
        meta: "744 upvotes",
      },
      {
        title: "TabSage - browser research assistant",
        meta: "681 upvotes",
        badge: "新",
      },
      { title: "FlowMail - inbox for product teams", meta: "620 upvotes" },
      { title: "TinyCast - private team podcasting", meta: "488 upvotes" },
    ],
  },
]
