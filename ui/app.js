const sources = [
  {
    id: "zhihu",
    name: "知乎",
    logo: "知",
    tag: "刚刚更新",
    category: "community",
    color: "#456a9e",
    logoColor: "#1777ff",
    favorite: true,
    items: [
      ["如何看待阿里团建，马云带队下田插秧？", "452 万热度", "热"],
      ["腾讯市值跌破 4 万亿港元，年内股价累计跌 27.72%，原因是什么？", "392 万热度", ""],
      ["世俱杯小组赛 K 组，葡萄牙 5-0 克兹别克斯坦，如何评价？", "376 万热度", ""],
      ["中国赴日游客连续 6 个月减少，5 月同比暴跌 60.4%，原因为何？", "315 万热度", ""],
      ["今年不热？", "234 万热度", ""],
      ["任盈盈一句你做乞丐也能活下去，为何让令狐冲动容？", "206 万热度", ""],
      ["AI 时代普通人还需要学习编程吗？", "178 万热度", "新"],
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
    items: [
      ["高考分数线", "爆", "热"],
      ["广东高考分数线", "新", "新"],
      ["最新一批灯塔工厂一半在中国", "", ""],
      ["千万不要买路边切好的半个西瓜", "热", "热"],
      ["孟子义李昀锐双人拍立得", "热", "热"],
      ["你只是高考完了不是来里发财了", "新", "新"],
      ["C罗 siu 完装振东 siu", "新", "新"],
      ["宋祖儿本名有重新练号的感觉", "热", "热"],
    ],
  },
  {
    id: "coolapk",
    name: "酷安",
    logo: "酷",
    tag: "今日最热",
    category: "tech",
    color: "#3b8050",
    logoColor: "#11c989",
    favorite: false,
    items: [
      ["#酷安夜话# 想离婚的念头到达了顶点", "长帖", "热"],
      ["小米 REDMI 新机外观曝光，主打轻薄性能", "8.6 万浏览", ""],
      ["安卓 16 首批适配名单更新", "7.9 万浏览", "新"],
      ["国产折叠屏在电池和影像上继续堆料", "6.8 万浏览", ""],
      ["你现在还会给手机刷第三方 ROM 吗？", "5.9 万浏览", ""],
      ["AI 眼镜真实体验：像玩具还是生产力？", "5.3 万浏览", "热"],
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
      ["科技热潮降温，纳指跌超 2%，芯片指数跌近 8%，美债美元齐涨", "市场", "热"],
      ["华尔街见闻早餐 FM-Radio | 2026年6月24日", "早报", ""],
      ["高盛警告 AI 泡沫：首个削减支出的巨头出现时，全市场将重新定价", "观点", ""],
      ["存储暴跌的导火索之一：韩媒小作文", "芯片", ""],
      ["创业板跌逾 3%，算力硬件、有色金属重挫", "A股", ""],
      ["高盛复盘韩股暴跌：养老金融退、散户杠杆爆仓引发芯片股雪崩", "全球", ""],
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
    favorite: true,
    items: [
      ["智谱据悉考虑在香港发售数十亿美元的股票", "IPO", "热"],
      ["SpaceX 发射星落返回舱，演示再入返回技术", "航天", ""],
      ["阿里 QoderWork 推峰谷 Token", "AI", ""],
      ["顺丰控股下半年拟投等成立无人机公司，注册资本 1000 万", "低空经济", ""],
      ["清研精准完成数亿元 B3 轮融资", "融资", ""],
      ["恒指午间休盘涨 0.04%，仙工智能涨超 13%", "港股", ""],
    ],
  },
  {
    id: "douyin",
    name: "抖音",
    logo: "抖",
    tag: "热点榜",
    category: "entertainment",
    color: "#545961",
    logoColor: "#111827",
    favorite: false,
    items: [
      ["我的高考出分时刻", "直播", "热"],
      ["Seedance 2.0 直出 4K", "AI视频", ""],
      ["让汽车消费跑起来", "政策", ""],
      ["葡萄牙 5:0 乌兹别克斯坦", "体育", ""],
      ["C罗梅开二度", "体育", "热"],
      ["上海高考分数线公布", "教育", "新"],
    ],
  },
  {
    id: "hupu",
    name: "虎扑",
    logo: "虎",
    tag: "主干道热帖",
    category: "community",
    color: "#93484a",
    logoColor: "#e31616",
    favorite: false,
    items: [
      ["突然很好奇，在那个信息不发达的年代，80、90 后没手机暑假是怎么熬过来的？", "热帖", "热"],
      ["韩国人和朝鲜人谁过得更好？", "讨论", ""],
      ["不理解那些一个月挣 4000、5000 还要结婚生孩子的", "热议", ""],
      ["遇到正缘了，家人们", "情感", ""],
      ["每天都要洗澡的地方是不是说明这个地方气候不太好？", "生活", ""],
      ["看球二十年，你心中最强的 11 人是谁？", "体育", ""],
    ],
  },
  {
    id: "tieba",
    name: "百度贴吧",
    logo: "百",
    tag: "热议",
    category: "community",
    color: "#426795",
    logoColor: "#2b75d6",
    favorite: false,
    items: [
      ["高考分数出炉，考生集体报喜", "热议", "热"],
      ["六届世界杯进球，C罗再创历史", "体育", ""],
      ["误删乙游妹妹摆烂不去上学", "游戏", ""],
      ["小伙 cos 上帝，吓退嘴臭老外", "整活", ""],
      ["国 gal 魔改历史，王安石成奸臣", "二创", ""],
      ["海贼王搞 NTR，亲生崽变养女", "漫画", ""],
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
    items: [
      ["open-source-ai / browser-agent", "15.2k stars", "热"],
      ["next-runtime / edge-cache-lab", "8.7k stars", ""],
      ["data-viz / canvas-grid", "6.1k stars", ""],
      ["docs-ai / markdown-indexer", "5.8k stars", "新"],
      ["oss-tools / release-note-kit", "4.9k stars", ""],
      ["frontend-labs / tiny-motion", "4.1k stars", ""],
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
      ["Briefly AI - meeting notes that write themselves", "1,204 upvotes", "热"],
      ["CanvasDesk - collaborative planning board", "982 upvotes", ""],
      ["StackPilot - deploy internal tools faster", "744 upvotes", ""],
      ["TabSage - browser research assistant", "681 upvotes", "新"],
      ["FlowMail - inbox for product teams", "620 upvotes", ""],
      ["TinyCast - private team podcasting", "488 upvotes", ""],
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
      ["这一代年轻人为什么重新爱上实体书店", "播放 243 万", "热"],
      ["做一个真正好用的个人知识库", "播放 178 万", ""],
      ["国产游戏美术幕后全流程拆解", "播放 156 万", ""],
      ["AI 修复老电影到底做对了什么", "播放 132 万", "新"],
      ["三分钟看懂高考志愿专业差异", "播放 119 万", ""],
      ["城市夜骑路线推荐", "播放 88 万", ""],
    ],
  },
  {
    id: "ithome",
    name: "IT之家",
    logo: "I",
    tag: "日榜",
    category: "tech",
    color: "#375879",
    logoColor: "#2563eb",
    favorite: false,
    items: [
      ["微软发布 Windows 新一轮预览更新", "系统", ""],
      ["英伟达下一代 GPU 功耗信息曝光", "硬件", "热"],
      ["苹果新款 Vision 设备供应链消息更新", "苹果", ""],
      ["国产数据库通过关键行业压测", "软件", ""],
      ["大模型推理成本继续下降", "AI", "新"],
      ["新能源车智能座舱 UI 趋势观察", "汽车", ""],
    ],
  },
];

const activeCategory = "all";
let query = "";
let draggedId = null;
let isDragging = false;
let lastDragOverId = null;
let isDarkMode = false;

const lightBodyBackground = `
  radial-gradient(circle at top left, rgba(255, 116, 116, 0.18), transparent 26rem),
  radial-gradient(circle at top right, rgba(34, 197, 94, 0.12), transparent 30rem),
  #f1f5f9
`;
const darkBodyBackground = `
  radial-gradient(circle at top left, rgba(255, 82, 82, 0.18), transparent 28rem),
  radial-gradient(circle at top right, rgba(38, 216, 133, 0.12), transparent 32rem),
  #0b1118
`;
const lightPanelBackground = "linear-gradient(120deg, rgba(78, 142, 232, 0.08), transparent 44%), rgba(255, 255, 255, 0.9)";
const darkPanelBackground = "linear-gradient(120deg, rgba(78, 142, 232, 0.12), transparent 44%), rgba(255, 255, 255, 0.05)";
const appBody = document.querySelector("#appBody");
const hotSitesPanel = document.querySelector("#hotSitesPanel");
const grid = document.querySelector("#newsGrid");
const template = document.querySelector("#sourceCardTemplate");
const headerSearch = document.querySelector("#headerSearch");
const searchInput = document.querySelector("#searchInput");
const searchToggle = document.querySelector("#searchToggle");
const sourceCount = document.querySelector("#sourceCount");
const storyCount = document.querySelector("#storyCount");
const siteRail = document.querySelector("#siteRail");
const themeToggle = document.querySelector("#themeToggle");

function setSearchOpen(isOpen) {
  headerSearch.classList.toggle("w-11", !isOpen);
  headerSearch.classList.toggle("w-72", isOpen);
  headerSearch.classList.toggle("border-transparent", !isOpen);
  headerSearch.classList.toggle("border-slate-200", isOpen);
  headerSearch.classList.toggle("bg-transparent", !isOpen);
  headerSearch.classList.toggle("bg-white", isOpen);
  headerSearch.classList.toggle("dark:border-line", isOpen);
  headerSearch.classList.toggle("dark:bg-white/[0.06]", isOpen);
  searchInput.classList.toggle("pointer-events-none", !isOpen);
  searchInput.classList.toggle("opacity-0", !isOpen);
  searchInput.classList.toggle("opacity-100", isOpen);
  searchToggle.setAttribute("aria-expanded", String(isOpen));
  searchToggle.setAttribute("aria-label", isOpen ? "聚焦搜索" : "展开搜索");

  if (isOpen) {
    searchInput.focus();
  }
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  const normalized =
    value.length === 3
      ? value
          .split("")
          .map((char) => char + char)
          .join("")
      : value;
  const numeric = Number.parseInt(normalized, 16);

  return {
    r: (numeric >> 16) & 255,
    g: (numeric >> 8) & 255,
    b: numeric & 255,
  };
}

function getSourceCardBackground(source) {
  if (isDarkMode) {
    return `linear-gradient(145deg, ${source.color}, rgba(18, 26, 38, 0.92))`;
  }

  const { r, g, b } = hexToRgb(source.color);
  return `
    radial-gradient(circle at 16% 0%, rgba(${r}, ${g}, ${b}, 0.24), transparent 15rem),
    linear-gradient(145deg, rgba(${r}, ${g}, ${b}, 0.18), rgba(255, 255, 255, 0.94) 46%, rgba(${r}, ${g}, ${b}, 0.12)),
    #ffffff
  `;
}

function getFilteredSources() {
  return sources.filter((source) => {
    const text = `${source.name} ${source.tag} ${source.items.map((item) => item.join(" ")).join(" ")}`.toLowerCase();
    const matchesCategory = activeCategory === "all" || source.category === activeCategory;
    const matchesQuery = !query || text.includes(query);

    return matchesCategory && matchesQuery;
  });
}

function renderSiteRail(filtered) {
  siteRail.innerHTML = filtered
    .map(
      (source) => `
        <button
          class="grid min-h-28 w-[92px] shrink-0 place-items-center gap-2 rounded-lg bg-transparent px-2 py-3 text-center text-slate-950 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-900/10 focus-visible:-translate-y-0.5 focus-visible:bg-slate-900/10 focus-visible:outline-none dark:text-slate-50 dark:hover:bg-white/10 dark:focus-visible:bg-white/10"
          type="button"
          aria-label="${source.name} ${source.tag}"
        >
          <span
            class="grid h-12 w-12 place-items-center rounded-[14px] border border-line text-xl font-extrabold text-white shadow-[0_12px_24px_rgba(0,0,0,0.22)]"
            style="background: ${source.logoColor}"
          >${source.logo}</span>
          <span class="block max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
            <strong class="block max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm leading-tight">${source.name}</strong>
            <span class="mt-1 block max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">${source.tag}</span>
          </span>
        </button>
      `,
    )
    .join("");
}

function render() {
  const filtered = getFilteredSources();
  grid.innerHTML = "";

  sourceCount.textContent = filtered.length;
  storyCount.textContent = filtered.reduce((total, source) => total + source.items.length, 0);
  renderSiteRail(filtered.length ? filtered : sources);

  if (!filtered.length) {
    grid.innerHTML = '<div class="col-span-full rounded-[14px] border border-dashed border-slate-300 p-12 text-center text-slate-500 dark:border-line dark:text-slate-400">没有找到匹配的热榜，换个关键词或分类试试。</div>';
    return;
  }

  filtered.forEach((source) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.dataset.id = source.id;
    node.classList.toggle("opacity-50", isDragging && draggedId === source.id);
    node.style.background = getSourceCardBackground(source);
    node.querySelector(".source-logo").style.background = source.logoColor;
    node.querySelector(".source-logo").textContent = source.logo;
    node.querySelector(".source-name").textContent = source.name;
    node.querySelector(".source-update").textContent = source.tag === "实时热搜" ? "正在追踪" : "12 分钟内更新";
    node.querySelector(".badge").textContent = source.tag;

    const favoriteButton = node.querySelector(".favorite-button");
    const favoriteIcon = node.querySelector(".favorite-icon");
    favoriteButton.setAttribute("aria-pressed", String(source.favorite));
    favoriteButton.setAttribute("aria-label", source.favorite ? "取消收藏来源" : "收藏来源");
    favoriteIcon.classList.toggle("fill-[#f5bb48]", source.favorite);
    favoriteIcon.classList.toggle("text-[#f5bb48]", source.favorite);
    favoriteIcon.classList.toggle("fill-none", !source.favorite);
    favoriteButton.addEventListener("click", () => {
      source.favorite = !source.favorite;
      render();
    });

    node.querySelector(".refresh-button").addEventListener("click", () => {
      node.animate(
        [
          { transform: "translateY(0)", opacity: 1 },
          { transform: "translateY(-4px)", opacity: 0.72 },
          { transform: "translateY(0)", opacity: 1 },
        ],
        { duration: 320, easing: "ease-out" },
      );
    });

    const list = node.querySelector(".story-list");
    source.items.forEach((item, index) => {
      const li = document.createElement("li");
      li.className = "grid grid-cols-[30px_1fr_auto] items-start gap-2.5 list-none";
      li.innerHTML = `
        <span class="grid min-h-[30px] place-items-center rounded-md bg-slate-900/10 text-slate-600 dark:bg-white/10 dark:text-white/80">${index + 1}</span>
        <span class="min-w-0">
          <strong class="block text-[15px] leading-6 text-slate-900 dark:text-white/90">${item[0]}</strong>
          <small class="text-slate-500 dark:text-white/50">${item[1]}</small>
        </span>
        ${item[2] ? `<span class="rounded-md bg-[#f5bb48] px-1.5 py-0.5 text-[11px] font-bold text-[#23180a]">${item[2]}</span>` : ""}
      `;
      list.appendChild(li);
    });

    node.addEventListener("dragstart", (event) => {
      draggedId = source.id;
      isDragging = true;
      lastDragOverId = null;
      event.dataTransfer.effectAllowed = "move";
      node.classList.add("opacity-50");
    });

    node.addEventListener("dragend", () => {
      draggedId = null;
      isDragging = false;
      lastDragOverId = null;
      node.classList.remove("opacity-50");
      render();
    });

    node.addEventListener("dragover", (event) => {
      event.preventDefault();
      if (!draggedId || draggedId === source.id) return;
      if (lastDragOverId === source.id) return;

      const fromIndex = sources.findIndex((item) => item.id === draggedId);
      const toIndex = sources.findIndex((item) => item.id === source.id);
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;

      const [moved] = sources.splice(fromIndex, 1);
      sources.splice(toIndex, 0, moved);
      lastDragOverId = source.id;
      render();
    });

    grid.appendChild(node);
  });
}

searchInput.addEventListener("input", (event) => {
  query = event.target.value.trim().toLowerCase();
  render();
});

searchToggle.addEventListener("click", () => {
  setSearchOpen(true);
});

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !searchInput.value.trim()) {
    setSearchOpen(false);
    searchToggle.focus();
  }
});

document.addEventListener("click", (event) => {
  if (!headerSearch.contains(event.target) && !searchInput.value.trim()) {
    setSearchOpen(false);
  }
});

themeToggle.addEventListener("click", () => {
  isDarkMode = !isDarkMode;
  document.documentElement.classList.toggle("dark", isDarkMode);
  appBody.style.background = isDarkMode ? darkBodyBackground : lightBodyBackground;
  hotSitesPanel.style.background = isDarkMode ? darkPanelBackground : lightPanelBackground;
  themeToggle.setAttribute("aria-label", isDarkMode ? "切换日间模式" : "切换夜间模式");
  render();
});

document.querySelector("#refreshAll").addEventListener("click", () => {
  document.querySelectorAll(".source-card").forEach((card, index) => {
    card.animate(
      [
        { opacity: 0.5, transform: "translateY(8px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 260, delay: index * 24, easing: "ease-out" },
    );
  });
});

render();
