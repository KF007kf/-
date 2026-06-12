const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const siteUrl = "https://kf007kf.github.io/-";

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function write(file, content) {
  const target = path.join(root, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content.replace(/[ \t]+$/gm, ""), "utf8");
}

function loadData() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(read("data/site-data.js"), context);
  return context.window.REVIEWFORK_DATA;
}

const data = loadData();

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function score(value) {
  return Number(value || 0).toFixed(1);
}

function stripDot(src = "") {
  return src.replace(/^\.\//, "");
}

function asset(src, depth = "./") {
  if (!src) return "";
  if (/^https?:\/\//.test(src) || src.startsWith("data:")) return src;
  return `${depth}${stripDot(src)}`;
}

function absolute(src) {
  if (!src) return `${siteUrl}/`;
  if (/^https?:\/\//.test(src)) return src;
  return `${siteUrl}/${stripDot(src)}`;
}

function reviewHref(slug, depth = "./") {
  return `${depth}reviews/${encodeURIComponent(slug)}/`;
}

function image(src, alt, depth = "./", options = {}) {
  const loading = options.loading || "lazy";
  const fetchPriority = options.fetchpriority ? ` fetchpriority="${escapeAttr(options.fetchpriority)}"` : "";
  return `<img src="${escapeAttr(asset(src, depth))}" alt="${escapeAttr(alt)}" loading="${escapeAttr(loading)}"${fetchPriority} />`;
}

function likeButton(slug, label = "Like") {
  return `
    <button class="like-button" data-like="${escapeAttr(slug)}" data-like-label="${escapeAttr(label)}" aria-pressed="false">
      <span>${escapeHtml(label)}</span>
      <b data-like-count="${escapeAttr(slug)}">0</b>
    </button>
  `;
}

function sectionText(id, key, fallback) {
  return data.site.sections?.[id]?.[key] || fallback;
}

function renderHero() {
  const item = data.reviews.find((review) => review.slug === data.featuredSlug) || data.reviews[0];
  const hero = data.site.hero || {};
  const heroImage = item.displayCover || item.cover;
  const heroScoreBadge = item.coverHasScore
    ? ""
    : `<div class="score-badge"><div><small>Rating</small><strong>${score(item.rating)}</strong></div></div>`;
  const lede = hero.useFeaturedPullquote === false && hero.lede ? hero.lede : item.pullquote;

  return `
      <div class="hero-copy">
        <div>
          <span class="eyebrow">${escapeHtml(hero.eyebrow || "Featured Review")} / ${escapeHtml(item.verdict)}</span>
          <h1 class="hero-title">
            <span class="word">${escapeHtml(hero.titleBefore || "NTRGAME")}</span>
            <em class="word">${escapeHtml(hero.titleHighlight || "Review")}</em>
            <span class="word">${escapeHtml(hero.titleAfter || "Archive")}</span>
          </h1>
          <p class="hero-lede">${escapeHtml(lede)}</p>
        </div>
        <div class="hero-meta">
          <span>Editor <b>${escapeHtml(data.site.editor)}</b></span>
          <span>Featured <b>${escapeHtml(item.titleCn)}</b></span>
          <span>Studio <b>${escapeHtml(item.studio)}</b></span>
          <span>Score <b>${score(item.rating)}</b></span>
        </div>
      </div>
      <article class="hero-panel">
        <div class="hero-image">
          ${image(heroImage, item.title, "./", { loading: "eager", fetchpriority: "high" })}
          ${heroScoreBadge}
        </div>
        <div class="hero-panel-body">
          <div class="review-card-kicker">
            <span>${escapeHtml(item.type)}</span>
            <span>${escapeHtml(item.releaseDate)}</span>
          </div>
          <h2>${escapeHtml(item.title)}<br />${escapeHtml(item.titleCn)}</h2>
          <p>${escapeHtml(item.summary)}</p>
          <div class="button-row">
            <a class="rf-button primary" href="${reviewHref(item.slug)}" data-open="${escapeAttr(item.slug)}">${escapeHtml(hero.primaryAction || "打开测评")}</a>
            ${likeButton(item.slug)}
            <a class="rf-button" href="#reviews">${escapeHtml(hero.secondaryAction || "Browse Archive")}</a>
          </div>
        </div>
      </article>`;
}

function allTags() {
  const set = new Set(["All"]);
  data.reviews.forEach((review) => review.tags.forEach((tag) => set.add(tag)));
  return Array.from(set);
}

function renderTags() {
  return allTags()
    .map((tag) => {
      const active = tag === "All";
      return `<button class="tag-button${active ? " is-active" : ""}" data-tag="${escapeAttr(tag)}" aria-pressed="${active ? "true" : "false"}">${escapeHtml(tag)}</button>`;
    })
    .join("\n          ");
}

function renderReviews() {
  return data.reviews
    .map(
      (item) => `
        <article class="review-card">
          <a class="review-card-image" href="${reviewHref(item.slug)}" data-open="${escapeAttr(item.slug)}">
            ${image(item.cover, item.title)}
            <div class="card-score">${score(item.rating)}</div>
          </a>
          <div class="review-card-body">
            <div class="review-card-kicker">
              <span>${escapeHtml(item.studio)}</span>
              <span>${escapeHtml(item.releaseDate)}</span>
            </div>
            <h3>${escapeHtml(item.title)}<br />${escapeHtml(item.titleCn)}</h3>
            <p>${escapeHtml(item.summary)}</p>
            <div class="chip-row">
              ${item.tags.map((tag, index) => `<span class="chip${index === 0 ? " red" : ""}">${escapeHtml(tag)}</span>`).join("")}
            </div>
            ${item.sourceStatus ? `<p class="source-note">${escapeHtml(item.sourceStatus)}</p>` : ""}
            <div class="button-row">
              <a class="rf-button primary" href="${reviewHref(item.slug)}" data-open="${escapeAttr(item.slug)}">打开测评</a>
              ${likeButton(item.slug)}
            </div>
          </div>
        </article>`
    )
    .join("\n");
}

function renderWatchlist() {
  return data.watchlist
    .map(
      (month) => `
          <article class="watch-month">
            <h3>${escapeHtml(month.month)}</h3>
            <div class="watch-items">
              ${month.items
                .map(
                  (item) => `
              <div class="watch-item">
                ${image(item.cover, item.title)}
                <div>
                  <div class="review-card-kicker">
                    <span>${escapeHtml(item.studio)}</span>
                    <span>${escapeHtml(item.date)}</span>
                  </div>
                  <h4>${escapeHtml(item.title)}</h4>
                  <p>${escapeHtml(item.note)}</p>
                </div>
                <div class="watch-score">${escapeHtml(item.score)}</div>
              </div>`
                )
                .join("")}
            </div>
          </article>`
    )
    .join("\n");
}

function renderRankings() {
  return data.rankings
    .map(
      (list) => `
          <article class="ranking-list">
            <h3>${escapeHtml(list.title)}</h3>
            <ol>
              ${list.rows
                .map(
                  (row, index) => `
              <li>
                <b>${String(index + 1).padStart(2, "0")}</b>
                <strong>${escapeHtml(row.title)}<br /><span>${escapeHtml(row.label)}</span></strong>
                <b>${escapeHtml(row.score)}</b>
              </li>`
                )
                .join("")}
            </ol>
          </article>`
    )
    .join("\n");
}

function renderPolls() {
  return (data.polls || [])
    .map(
      (poll) => `
          <article class="poll-card">
            <div>
              <span class="eyebrow">Reader Poll</span>
              <h3>${escapeHtml(poll.title)}</h3>
            </div>
            <p>${escapeHtml(poll.note)}</p>
            <div class="poll-options">
              ${poll.options
                .map(
                  (option) => `
              <button class="poll-option" data-poll="${escapeAttr(poll.id)}" data-option="${escapeAttr(option.id)}" style="--poll-width:0%" aria-pressed="false">
                <strong>${escapeHtml(option.label)}</strong>
                <span>0% / 0</span>
              </button>`
                )
                .join("")}
            </div>
            <div class="poll-total">0 votes</div>
          </article>`
    )
    .join("\n");
}

function renderNoscriptLinks() {
  return data.reviews
    .map((item) => `<li><a href="${reviewHref(item.slug)}">${escapeHtml(item.title)} / ${score(item.rating)}</a></li>`)
    .join("\n          ");
}

function specCells(item) {
  const specs = item.specs || {};
  return [
    ["Length / 时长", specs.length],
    ["CG Files / 图像数", specs.cg],
    ["H-Scenes / 场景数", specs.scenes],
    ["Tags / 标签", (item.tags || []).join(" / ")],
    ["有无动态", specs.animated],
    ["有无配音 / 语音", specs.voiced],
    ["有无回想", specs.gallery]
  ]
    .filter(([, value]) => value)
    .map(
      ([label, value]) => `
        <div class="spec-cell">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
        </div>`
    )
    .join("");
}

function scoreRows(item) {
  return (item.scores || [])
    .map((row) => {
      const width = Math.max(0, Math.min(100, Number(row.value || 0) * 10));
      return `
        <div class="score-row">
          <span>${escapeHtml(row.label)}</span>
          <div class="score-bar"><i style="width:${width}%"></i></div>
          <b>${score(row.value)}</b>
        </div>`;
    })
    .join("");
}

function polarPoint(cx, cy, radius, index, total) {
  const angle = -90 + (360 / total) * index;
  const radians = (angle * Math.PI) / 180;
  return {
    x: cx + Math.cos(radians) * radius,
    y: cy + Math.sin(radians) * radius
  };
}

function pointString(point) {
  return `${point.x.toFixed(2)},${point.y.toFixed(2)}`;
}

function renderRadarSvg(item) {
  const rows = item.scores || [];
  if (!rows.length) return "";
  const cx = 120;
  const cy = 120;
  const maxRadius = 86;
  const total = rows.length;
  const rings = [2, 4, 6, 8, 10]
    .map((value) => {
      const radius = (value / 10) * maxRadius;
      const points = rows.map((_, index) => pointString(polarPoint(cx, cy, radius, index, total))).join(" ");
      return `<polygon class="radar-ring" points="${points}"></polygon>`;
    })
    .join("");
  const axes = rows
    .map((_, index) => {
      const end = polarPoint(cx, cy, maxRadius, index, total);
      return `<line class="radar-axis" x1="${cx}" y1="${cy}" x2="${end.x.toFixed(2)}" y2="${end.y.toFixed(2)}"></line>`;
    })
    .join("");
  const polygon = rows
    .map((row, index) => {
      const radius = (Math.max(0, Math.min(10, Number(row.value || 0))) / 10) * maxRadius;
      return pointString(polarPoint(cx, cy, radius, index, total));
    })
    .join(" ");
  const labels = rows
    .map((row, index) => {
      const labelPoint = polarPoint(cx, cy, maxRadius + 23, index, total);
      return `<text x="${labelPoint.x.toFixed(2)}" y="${labelPoint.y.toFixed(2)}" text-anchor="middle" dominant-baseline="middle">${escapeHtml(row.label)}</text>`;
    })
    .join("");
  return `<svg class="radar-svg" viewBox="0 0 240 240" role="img" aria-label="维度雷达图">${rings}${axes}<polygon class="radar-fill" points="${polygon}"></polygon><polygon class="radar-stroke" points="${polygon}"></polygon>${labels}</svg>`;
}

function renderRadarPanel(item) {
  const rows = item.scores || [];
  if (!rows.length) return "";
  return `
      <section class="radar-panel">
        <div class="radar-head">
          <h2>维度评分 / RADAR ANALYSIS</h2>
          <b>${escapeHtml(item.radarTotal || score(item.rating))} / 10</b>
        </div>
        <div class="radar-grid">
          <div class="radar-visual">${renderRadarSvg(item)}</div>
          <div class="radar-notes">
            ${rows
              .map(
                (row) => `
            <article class="radar-note">
              <div>
                <h3>${escapeHtml(row.label)}</h3>
                <p>${escapeHtml(row.note || "")}</p>
              </div>
              <span class="radar-pill">${score(row.value)}</span>
            </article>`
              )
              .join("")}
          </div>
        </div>
      </section>`;
}

function directoryCards(rows, type, depth) {
  return (rows || [])
    .map((person) => {
      const portrait = person.portrait
        ? image(person.portrait, person.name, depth)
        : `<span class="directory-placeholder">No Image</span>`;
      return `
        <article class="directory-card ${type === "heroine" ? "is-heroine" : "is-antagonist"}">
          <figure>${portrait}</figure>
          <h4>${escapeHtml(person.name || "未命名")}</h4>
          ${person.role ? `<strong>${escapeHtml(person.role)}</strong>` : ""}
          <p>${escapeHtml(person.comment || "暂无人物短评。")}</p>
        </article>`;
    })
    .join("");
}

function renderDirectory(item, depth = "../../") {
  const directories = item.directories || {};
  const heroines = directories.heroines || [];
  const antagonists = directories.antagonists || [];
  if (!heroines.length && !antagonists.length) return "";
  return `
      <section class="directory-wrap">
        ${
          heroines.length
            ? `<div class="directory-section is-heroine">
          <div class="directory-heading"><span>HEROINES DIRECTORY / 女主一览</span></div>
          <div class="directory-grid">${directoryCards(heroines, "heroine", depth)}</div>
        </div>`
            : ""
        }
        ${
          antagonists.length
            ? `<div class="directory-section is-antagonist">
          <div class="directory-heading"><span>TARGETS & ANTAGONISTS / 间男一览</span></div>
          <div class="directory-grid">${directoryCards(antagonists, "antagonist", depth)}</div>
        </div>`
            : ""
        }
      </section>`;
}

function sideList(title, rows) {
  return `
      <section class="side-list">
        <h3>${escapeHtml(title)}</h3>
        <ul>${rows.map((row) => `<li>${escapeHtml(row)}</li>`).join("")}</ul>
      </section>`;
}

function articleMarkup(item, depth = "../../") {
  const articleImage = item.displayCover || item.cover;
  return `
      <article class="article-sheet">
        <header class="article-head">
          <div>
            <span class="eyebrow">${escapeHtml(item.verdict)} / ${escapeHtml(item.studio)}</span>
            <h1>${escapeHtml(item.title)}<br />${escapeHtml(item.titleCn)}</h1>
          </div>
          <div class="article-score">
            <div><span>Final Score</span><strong>${score(item.rating)}</strong></div>
          </div>
        </header>
        <section class="article-hero">
          <figure>${image(articleImage, item.title, depth, { loading: "eager", fetchpriority: "high" })}</figure>
          <div class="article-specs">${specCells(item)}</div>
        </section>
        ${renderDirectory(item, depth)}
        ${renderRadarPanel(item)}
        <section class="article-body">
          <div class="article-copy">
            <blockquote>${escapeHtml(item.pullquote)}</blockquote>
            ${item.body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
          </div>
          <aside class="article-side">
            <div class="button-row">
              <a class="rf-button primary" href="${depth}#reviews">回到目录</a>
            </div>
            <div class="chip-row">${item.tags.map((tag) => `<span class="chip red">${escapeHtml(tag)}</span>`).join("")}</div>
            ${sideList("亮点", item.pros)}
            ${sideList("问题", item.cons)}
          </aside>
        </section>
      </article>`;
}

function jsonLd(item) {
  return JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "Review",
      headline: `${item.title} / ${item.titleCn}`,
      description: item.summary,
      author: { "@type": "Person", name: data.site.editor },
      datePublished: item.releaseDate,
      image: absolute(item.displayCover || item.cover),
      itemReviewed: {
        "@type": "CreativeWork",
        name: item.title
      },
      reviewRating: {
        "@type": "Rating",
        ratingValue: String(item.rating),
        bestRating: "10",
        worstRating: "0"
      },
      reviewBody: [item.pullquote, ...(item.body || [])].join("\n\n")
    },
    null,
    2
  ).replace(/</g, "\\u003c");
}

function renderReviewPage(item) {
  const title = `${item.title} - NTRGAME REVIEW`;
  const description = item.summary;
  const canonical = `${siteUrl}/reviews/${encodeURIComponent(item.slug)}/`;
  const imageUrl = absolute(item.displayCover || item.cover);
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeAttr(description)}" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeAttr(title)}" />
    <meta property="og:description" content="${escapeAttr(description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="color-scheme" content="light" />
    <link rel="icon" href="../../assets/images/site/masthead.svg" type="image/svg+xml" />
    <link rel="preload" as="image" href="${asset(item.displayCover || item.cover, "../../")}" fetchpriority="high" />
    <link rel="stylesheet" href="../../styles/main.css" />
    <script type="application/ld+json">${jsonLd(item)}</script>
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="../../#top" aria-label="ReviewFork home">
        <img src="../../assets/images/site/masthead.svg" alt="" class="brand-mark" />
        <span>
          <strong>${escapeHtml(data.site.brand)}</strong>
          <small>${escapeHtml(data.site.subtitle)}</small>
        </span>
      </a>
      <nav class="top-nav" aria-label="主导航">
        <a href="../../#reviews">测评</a>
        <a href="../../#watchlist">前瞻</a>
        <a href="../../#annual-tier">年度排名</a>
        <a href="../../#community">调研</a>
      </nav>
    </header>
    <main class="review-page">
      <a class="page-back" href="../../#reviews">← Back to reviews</a>
      ${articleMarkup(item, "../../")}
    </main>
    <footer class="site-footer">
      <span>${escapeHtml(data.site.footer)}</span>
      <span>Static review page generated from data/site-data.js.</span>
    </footer>
  </body>
</html>
`;
}

function replaceMarked(html, marker, content) {
  const start = `<!-- static:${marker}:start -->`;
  const end = `<!-- static:${marker}:end -->`;
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}`);
  if (!pattern.test(html)) {
    throw new Error(`Missing static marker: ${marker}`);
  }
  return html.replace(pattern, `${start}\n${content}\n        ${end}`);
}

function updateIndex() {
  let html = read("index.html");
  html = html.replace(/<span id="issue-label">.*?<\/span>/, `<span id="issue-label">${escapeHtml(data.site.issue)} / ${escapeHtml(data.site.volume)}</span>`);
  html = html.replace(/<span id="footer-brand">.*?<\/span>/, `<span id="footer-brand">${escapeHtml(data.site.footer)}</span>`);
  html = html.replace(/<strong id="brand-name">.*?<\/strong>/, `<strong id="brand-name">${escapeHtml(data.site.brand)}</strong>`);
  html = html.replace(/<small id="brand-subtitle">.*?<\/small>/, `<small id="brand-subtitle">${escapeHtml(data.site.subtitle)}</small>`);
  html = html.replace(/<span>Reviews<\/span>\s*<h2>Latest Criticism<\/h2>/, `<span>${escapeHtml(sectionText("reviews", "kicker", "Reviews"))}</span>\n          <h2>${escapeHtml(sectionText("reviews", "title", "Latest Criticism"))}</h2>`);
  html = html.replace(/<span>Watchlist<\/span>\s*<h2>New Release Radar<\/h2>/, `<span>${escapeHtml(sectionText("watchlist", "kicker", "Watchlist"))}</span>\n            <h2>${escapeHtml(sectionText("watchlist", "title", "New Release Radar"))}</h2>`);
  html = html.replace(/<span>Rankings<\/span>\s*<h2>Editor's Board<\/h2>/, `<span>${escapeHtml(sectionText("rankings", "kicker", "Rankings"))}</span>\n            <h2>${escapeHtml(sectionText("rankings", "title", "Editor's Board"))}</h2>`);
  html = html.replace(/<span>Community<\/span>\s*<h2>Likes & Polls<\/h2>/, `<span>${escapeHtml(sectionText("community", "kicker", "Community"))}</span>\n            <h2>${escapeHtml(sectionText("community", "title", "Likes & Polls"))}</h2>`);
  html = replaceMarked(html, "hero", renderHero());
  html = replaceMarked(html, "tags", renderTags());
  html = replaceMarked(html, "reviews", renderReviews());
  html = replaceMarked(html, "watchlist", renderWatchlist());
  html = replaceMarked(html, "rankings", renderRankings());
  html = replaceMarked(html, "polls", renderPolls());
  html = replaceMarked(html, "noscript", renderNoscriptLinks());
  write("index.html", html);
}

function buildReviewPages() {
  data.reviews.forEach((item) => {
    write(path.join("reviews", item.slug, "index.html"), renderReviewPage(item));
  });
}

function buildSitemap() {
  const urls = [`${siteUrl}/`, ...data.reviews.map((item) => `${siteUrl}/reviews/${encodeURIComponent(item.slug)}/`)];
  const body = urls
    .map(
      (url) => `
  <url>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
  </url>`
    )
    .join("");
  write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}\n</urlset>\n`);
  write("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`);
}

updateIndex();
buildReviewPages();
buildSitemap();

console.log(`Generated ${data.reviews.length} review pages, sitemap.xml, robots.txt, and static index content.`);
