# Customization Guide

Most site changes live in:

```text
data/site-data.js
```

## Theme

Edit `site.theme`:

```js
theme: {
  red: "#ff3530",
  black: "#070707",
  paper: "#f5f3ee",
  white: "#ffffff",
  muted: "#6f6f6f",
  line: "#cfcac1"
}
```

These values update CSS variables automatically.

## Navigation

Edit `site.navigation`:

```js
navigation: [
  { label: "Reviews", href: "#reviews" },
  { label: "Watchlist", href: "#watchlist" }
]
```

Add, remove, or rename items here.

## Hero

Edit `site.hero`:

```js
hero: {
  eyebrow: "Featured Review",
  titleBefore: "NTRGAME",
  titleHighlight: "Review",
  titleAfter: "Archive",
  primaryAction: "Read Review",
  secondaryAction: "Browse Archive",
  useFeaturedPullquote: true
}
```

Change `featuredSlug` to choose which review appears in the hero panel.

## Sections

Edit `site.sections` to rename or hide blocks:

```js
sections: {
  community: { enabled: true, kicker: "Community", title: "Likes & Polls" }
}
```

Set `enabled: false` to hide a section.

## Animation

All motion is driven by GSAP in `scripts/app.js`.

Edit `site.animation`:

```js
animation: {
  enabled: true,
  intensity: 1,
  intro: "editorial-rise",
  scrollReveal: true,
  hover: true,
  respectReducedMotion: true
}
```

Use `intensity: 0.5` for calmer motion, or `enabled: false` to disable GSAP animation.

## Reviews

Each review object controls one card and one article modal. The current NTRGAME review structure supports the same blocks as your long images:

```js
{
  slug: "my-game",
  title: "My Game",
  titleCn: "我的游戏",
  studio: "Studio Name",
  cover: "./assets/images/user-reviews/my-game-title.jpg",
  displayCover: "./assets/images/user-reviews/my-game-title.jpg",
  poster: "./assets/images/user-reviews/my-game.png",
  coverHasScore: true,
  rating: 8.4,
  radarTotal: "8.36",
  sourceStatus: "以站内测评图为准",
  tags: ["剧情", "长篇"],
  specs: {
    length: "短篇",
    cg: "52张",
    scenes: "10个",
    animated: "部分有",
    voiced: "有配音",
    gallery: "有"
  },
  scores: [
    { label: "剧情", value: 7.0, note: "这一项的短评。" }
  ],
  directories: {
    heroines: [{ name: "女主名", role: "妻子", portrait: "./assets/images/characters/placeholder-heroine.svg", comment: "人物短评。" }],
    antagonists: [{ name: "同男名", role: "同男", portrait: "./assets/images/characters/placeholder-antagonist.svg", comment: "人物短评。" }]
  },
  body: ["第一段", "第二段"]
}
```

Use unique `slug` values. `cover` is for homepage cards, `displayCover` is for the article, and `poster` is the original long layout image. If the title image already includes the score circle, set `coverHasScore: true` so the hero does not draw a duplicate score badge.

## Writing Style

The site is set up for a strong personal review voice, not neutral product copy. A useful pattern is:

- Start with a direct verdict, for example "短但成型", "罐头但能卖", "起飞不能".
- Use concrete structure first: specs, tags, characters, radar scores.
- Let the long review say what you really think, including社团习惯、同类对比、值不值得玩.
- Keep unknown release data marked in `sourceStatus` instead of inventing it.

## Annual Tier List

The "年度牛油排名" tool is seeded by `annualTier` in `data/site-data.js`:

```js
annualTier: {
  activeYear: "2026",
  defaultTiers: [
    { id: "s", label: "S / 年度级", color: "#ff3530" }
  ],
  boards: [
    {
      year: "2026",
      title: "2026 年度牛油排名",
      subtitle: "说明文字",
      tiers: [
        { id: "a", label: "A / 强推荐", color: "#111111", itemIds: ["my-game"] }
      ],
      poolItemIds: [],
      items: [
        { id: "my-game", title: "作品名", studio: "社团", score: "8.0", cover: "./assets/images/covers/my-game.jpg", note: "短评" }
      ]
    }
  ]
}
```

On the website you can also create years, upload images, drag items between tiers, rename rows, change row colors, edit item text, and save. That save is browser-local. Use "导出 JSON" for backup; to make a finished ranking public for every visitor, put the exported board back into `annualTier.boards` or ask Codex to merge it.

## Polls

Edit `polls`:

```js
{
  id: "next-review-focus",
  title: "下期优先写什么？",
  options: [
    { id: "plot", label: "剧情党长评" },
    { id: "ranking", label: "入门榜单" }
  ]
}
```

If Firebase is configured, votes sync across visitors.
