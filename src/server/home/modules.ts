export const defaultHomeModules = [
  {
    moduleKey: "hot-sites",
    title: "热门站点",
    subtitle: "Hot Sites",
    sort: 10,
    displayLimit: 12,
  },
  {
    moduleKey: "live-rankings",
    title: "实时热榜",
    subtitle: "Sources",
    sort: 20,
    displayLimit: 24,
  },
  {
    moduleKey: "daily",
    title: "日报入口",
    subtitle: "Daily",
    sort: 30,
    displayLimit: 1,
  },
  {
    moduleKey: "rankings",
    title: "榜中榜",
    subtitle: "Rankings",
    sort: 40,
    displayLimit: 10,
  },
  {
    moduleKey: "topics",
    title: "话题",
    subtitle: "Topics",
    sort: 50,
    displayLimit: 6,
  },
] as const

export type DefaultHomeModuleKey =
  (typeof defaultHomeModules)[number]["moduleKey"]
