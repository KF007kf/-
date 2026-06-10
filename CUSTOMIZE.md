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

Each review object controls one card and one article modal:

```js
{
  slug: "my-game",
  title: "My Game",
  titleCn: "我的游戏",
  studio: "Studio Name",
  cover: "./assets/images/covers/my-game.svg",
  rating: 8.4,
  tags: ["剧情", "长篇"],
  body: ["第一段", "第二段"]
}
```

Use unique `slug` values.

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
