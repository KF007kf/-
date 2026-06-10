window.REVIEWFORK_DATA = {
  site: {
    brand: "ReviewFork",
    subtitle: "NTRGAME Editorial Archive",
    issue: "Issue 2026.06",
    volume: "NTRGAME-01",
    editor: "BlackTeaLab",
    footer: "ReviewFork / Adult Game Criticism",
    theme: {
      red: "#ff3530",
      black: "#070707",
      paper: "#f5f3ee",
      white: "#ffffff",
      muted: "#6f6f6f",
      line: "#cfcac1"
    },
    navigation: [
      { label: "Reviews", href: "#reviews" },
      { label: "Watchlist", href: "#watchlist" },
      { label: "Rankings", href: "#rankings" },
      { label: "Community", href: "#community" },
      { label: "Notes", href: "#notes" }
    ],
    hero: {
      eyebrow: "Featured Review",
      titleBefore: "NTRGAME",
      titleHighlight: "Review",
      titleAfter: "Archive",
      primaryAction: "Read Review",
      secondaryAction: "Browse Archive",
      useFeaturedPullquote: true
    },
    sections: {
      reviews: { enabled: true, kicker: "Reviews", title: "Latest Criticism" },
      watchlist: { enabled: true, kicker: "Watchlist", title: "New Release Radar" },
      rankings: { enabled: true, kicker: "Rankings", title: "Editor's Board" },
      community: { enabled: true, kicker: "Community", title: "Likes & Polls" },
      notes: { enabled: true, kicker: "Archive", title: "Design references" }
    },
    animation: {
      enabled: true,
      intensity: 1,
      intro: "editorial-rise",
      scrollReveal: true,
      hover: true,
      respectReducedMotion: true
    }
  },

  // 图片必须放在仓库里，例如 ./assets/images/covers/xxx.jpg。
  // GitHub Pages 发布后，别人才能通过网页看到这些图片。
  featuredSlug: "after-rain-terminal",

  reviews: [
    {
      slug: "after-rain-terminal",
      title: "After Rain Terminal",
      titleCn: "雨后终端",
      studio: "Nocturne Rail",
      type: "ADV / 社会人群像",
      releaseDate: "2026-05-24",
      cover: "./assets/images/covers/after-rain-terminal.svg",
      rating: 8.7,
      verdict: "Best New Drama",
      pullquote:
        "它把关系崩坏写成一套冷静的城市系统，最锋利的部分不是刺激，而是每个人都知道自己正在失去什么。",
      summary:
        "一部更偏剧情派的成人向视觉小说。节奏慢，但人物动机扎实，适合喜欢长线心理变化和强编辑感排版记录的读者。",
      tags: ["剧情派", "社会人", "心理压迫", "长篇", "无下载"],
      specs: {
        length: "32H",
        cg: "86 files",
        scenes: "24 scenes",
        voiced: "Main cast",
        gallery: "Yes"
      },
      scores: [
        { label: "Story", value: 9.1 },
        { label: "Art", value: 8.4 },
        { label: "NTR Tension", value: 8.8 },
        { label: "Pacing", value: 8.2 },
        { label: "Replay", value: 7.6 }
      ],
      pros: ["人物关系推进自然", "配色和 UI 有高级杂志感", "中后段伏笔回收稳定"],
      cons: ["前两小时铺垫偏慢", "部分支线结尾略急"],
      body: [
        "《雨后终端》的优点不是把情绪推到最大声，而是把所有角色放在同一条湿冷的通勤线上，让他们的选择被工作、债务、旧情和自尊逐渐挤压。它的 NTR 表达更接近心理悬疑：关系并不是突然破裂，而是先被解释、再被合理化，最后才被角色自己承认。",
        "美术部分用大量玻璃反光、站台灯箱和低饱和室内光，和作品的城市感非常贴合。CG 数量不是夸张堆料，但关键场景的构图明显经过设计，适合做截图式评论和长文分析。",
        "如果你的博客未来要做 Pitchfork 式评分，这类作品很适合当样板：它有明确的关键词、可拆分的维度，也有足够多可以写成长评的情绪节点。"
      ]
    },
    {
      slug: "velvet-household",
      title: "Velvet Household",
      titleCn: "绒夜家事",
      studio: "Pearl Case",
      type: "VN / 婚后生活",
      releaseDate: "2026-04-18",
      cover: "./assets/images/covers/velvet-household.svg",
      rating: 7.9,
      verdict: "Recommended",
      pullquote:
        "它不是最激进的作品，但在日常细节里埋线的能力很稳，读完会记住那些餐桌和玄关。",
      summary:
        "中等篇幅、完成度较好的家庭题材作品。适合做标签索引，也适合作为入门推荐中的温和档。",
      tags: ["婚后", "日常崩坏", "中篇", "入门推荐", "无下载"],
      specs: {
        length: "18H",
        cg: "54 files",
        scenes: "16 scenes",
        voiced: "Full",
        gallery: "Yes"
      },
      scores: [
        { label: "Story", value: 7.7 },
        { label: "Art", value: 8.1 },
        { label: "NTR Tension", value: 8.0 },
        { label: "Pacing", value: 7.8 },
        { label: "Replay", value: 7.3 }
      ],
      pros: ["日常文本舒服", "角色口吻区分明显", "雷点控制清楚"],
      cons: ["后期分支数量一般", "音乐记忆点不强"],
      body: [
        "《绒夜家事》更像一部稳定发挥的类型片。它没有过度追求震撼转折，而是靠日常生活的轻微错位制造不安：一顿晚饭、一条未读消息、一段被跳过的解释，慢慢变成整部作品的情绪底色。",
        "它的优势在于容易写，也容易归档。标签清楚、体量适中、雷点不乱，作为博客早期内容很合适。读者可以很快判断自己要不要继续看，而你也能用它测试评分条、封面图和文章页的排版。",
        "缺点是上限没有特别高，后半段的选择设计更像服务剧情，而不是给玩家强烈分歧。但作为一篇推荐测评，它足够稳。"
      ]
    },
    {
      slug: "glassroom-index",
      title: "Glassroom Index",
      titleCn: "玻璃室索引",
      studio: "Moth Signal",
      type: "RPG / 调查档案",
      releaseDate: "2026-02-02",
      cover: "./assets/images/covers/glassroom-index.svg",
      rating: 8.2,
      verdict: "Deep Cut",
      pullquote:
        "系统比剧情更强，调查日志、回想和评分路线让它很适合做数据库式评测。",
      summary:
        "带轻 RPG 探索的档案式作品。玩法存在感更高，适合在博客里拆系统、拆路线、拆可回收内容。",
      tags: ["RPG", "调查", "路线管理", "系统向", "无下载"],
      specs: {
        length: "26H",
        cg: "72 files",
        scenes: "21 scenes",
        voiced: "Partial",
        gallery: "Yes"
      },
      scores: [
        { label: "Story", value: 7.8 },
        { label: "Art", value: 8.0 },
        { label: "NTR Tension", value: 8.1 },
        { label: "Pacing", value: 7.4 },
        { label: "Replay", value: 8.7 }
      ],
      pros: ["系统可写点多", "路线回收清楚", "资料页设计感强"],
      cons: ["文本有时被玩法打断", "初期引导略碎"],
      body: [
        "《玻璃室索引》的核心不是单一路线，而是资料如何被收集、命名、归类。它有一种档案馆式的快感：每推进一段关系，系统都会给出新的记录，逼迫玩家把情绪当成证据来整理。",
        "这让它非常适合你要做的博客方向。普通短评可以写推荐度，长评可以拆系统结构，榜单页可以把它放进“玩法存在感较高”的分组里。图片素材也适合做封面拼贴。",
        "它的问题同样来自系统。部分节点会因为调查流程过密而削弱情绪连续性，如果读者只想看纯剧情，可能会觉得被菜单和回收要素打断。"
      ]
    }
  ],

  watchlist: [
    {
      month: "2026.08",
      items: [
        {
          title: "Mercy Loop",
          studio: "Canal Room",
          date: "Aug 22",
          score: "A-",
          cover: "./assets/images/covers/mercy-loop.svg",
          note: "长篇 ADV，宣传文案强调多视角叙事和成年角色关系修罗场。"
        },
        {
          title: "Hotel Static",
          studio: "Quiet Floor",
          date: "Aug 30",
          score: "B+",
          cover: "./assets/images/covers/hotel-static.svg",
          note: "短篇合集形式，适合观察它的节奏控制和单元剧结构。"
        }
      ]
    },
    {
      month: "2026.10",
      items: [
        {
          title: "Signal Bride",
          studio: "North Window",
          date: "Oct 14",
          score: "A",
          cover: "./assets/images/covers/signal-bride.svg",
          note: "婚后题材新作，官方图透不多，先放入高优先级观察。"
        }
      ]
    }
  ],

  rankings: [
    {
      title: "入门推荐",
      rows: [
        { title: "Velvet Household", label: "温和档", score: "7.9" },
        { title: "After Rain Terminal", label: "剧情档", score: "8.7" },
        { title: "Glassroom Index", label: "系统档", score: "8.2" }
      ]
    },
    {
      title: "剧情优先",
      rows: [
        { title: "After Rain Terminal", label: "长线心理", score: "9.1" },
        { title: "Velvet Household", label: "日常细节", score: "7.7" },
        { title: "Glassroom Index", label: "档案叙事", score: "7.8" }
      ]
    },
    {
      title: "适合长评",
      rows: [
        { title: "Glassroom Index", label: "系统拆解", score: "A" },
        { title: "After Rain Terminal", label: "角色分析", score: "A+" },
        { title: "Signal Bride", label: "前瞻观察", score: "A" }
      ]
    }
  ],

  polls: [
    {
      id: "next-review-focus",
      title: "下期优先写什么？",
      note: "用于决定下一篇长评方向。每个访客在同一设备上默认保留一个选择。",
      options: [
        { id: "plot", label: "剧情党长评" },
        { id: "ranking", label: "入门榜单" },
        { id: "studio", label: "社团研究" },
        { id: "watchlist", label: "新作前瞻" }
      ]
    },
    {
      id: "site-feature-priority",
      title: "你最想先加哪个功能？",
      note: "后续改站时可以根据这个投票判断优先级。",
      options: [
        { id: "comments", label: "评论区" },
        { id: "filters", label: "更细标签筛选" },
        { id: "gallery", label: "图片画廊" },
        { id: "newsletter", label: "更新订阅" }
      ]
    }
  ]
};
