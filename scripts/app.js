(function () {
  const data = window.REVIEWFORK_DATA;
  const state = {
    query: "",
    tag: "All",
    cloudMode: "local",
    firebase: null,
    userId: null,
    animation: {
      hoverBound: false,
      introPlayed: false,
      scrollTriggers: []
    },
    likes: loadLocal("reviewfork.likes", {}),
    liked: loadLocal("reviewfork.liked", {}),
    polls: loadLocal("reviewfork.polls", {}),
    votes: loadLocal("reviewfork.votes", {}),
    busyLikes: new Set(),
    busyPolls: new Set()
  };

  const $ = (selector) => document.querySelector(selector);

  function siteConfig() {
    return data.site || {};
  }

  function animationConfig() {
    return {
      enabled: true,
      intensity: 1,
      intro: "editorial-rise",
      scrollReveal: true,
      hover: true,
      respectReducedMotion: true,
      ...(siteConfig().animation || {})
    };
  }

  function hasGsap() {
    return typeof window.gsap === "object";
  }

  function animationsEnabled() {
    const config = animationConfig();
    if (!config.enabled || !hasGsap()) return false;
    if (config.respectReducedMotion && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return false;
    }
    return Number(config.intensity || 0) > 0;
  }

  function loadLocal(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || "null") || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function saveLocal(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function safeCss(value) {
    if (window.CSS && typeof window.CSS.escape === "function") return window.CSS.escape(value);
    return String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }

  function score(value) {
    return Number(value || 0).toFixed(1);
  }

  function getFeatured() {
    return data.reviews.find((item) => item.slug === data.featuredSlug) || data.reviews[0];
  }

  function image(src, alt) {
    return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" />`;
  }

  function applySiteCustomization() {
    const site = siteConfig();
    const root = document.documentElement;
    const theme = site.theme || {};
    const themeMap = {
      red: "--rf-red",
      black: "--rf-black",
      paper: "--rf-paper",
      white: "--rf-white",
      muted: "--rf-muted",
      line: "--rf-line"
    };

    Object.entries(themeMap).forEach(([key, variable]) => {
      if (theme[key]) root.style.setProperty(variable, theme[key]);
    });

    const brandName = $("#brand-name");
    const brandSubtitle = $("#brand-subtitle");
    if (brandName) brandName.textContent = site.brand || "ReviewFork";
    if (brandSubtitle) brandSubtitle.textContent = site.subtitle || "NTRGAME Editorial Archive";

    const nav = $("#top-nav");
    if (nav && Array.isArray(site.navigation)) {
      nav.innerHTML = site.navigation
        .map((item) => `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`)
        .join("");
    }

    document.querySelectorAll("[data-section]").forEach((section) => {
      const config = site.sections?.[section.dataset.section];
      section.classList.toggle("section-disabled", config?.enabled === false);
    });

    const reviewGrid = $("#review-grid");
    if (reviewGrid) {
      reviewGrid.classList.toggle("section-disabled", site.sections?.reviews?.enabled === false);
    }
  }

  function sectionText(id, key, fallback) {
    return siteConfig().sections?.[id]?.[key] || fallback;
  }

  function updateStaticSectionHeadings() {
    const sections = [
      ["reviews", "Reviews", "Latest Criticism"],
      ["watchlist", "Watchlist", "New Release Radar"],
      ["rankings", "Rankings", "Editor's Board"],
      ["community", "Community", "Likes & Polls"]
    ];

    sections.forEach(([id, kicker, title]) => {
      const section = document.getElementById(id);
      const label = section?.querySelector(".section-rule span");
      const heading = section?.querySelector(".section-rule h2");
      if (label) label.textContent = sectionText(id, "kicker", kicker);
      if (heading) heading.textContent = sectionText(id, "title", title);
    });
  }

  function likeCount(slug) {
    return Math.max(0, Number(state.likes[slug] || 0));
  }

  function isLiked(slug) {
    return Boolean(state.liked[slug]);
  }

  function likeButton(slug, label = "Like") {
    const liked = isLiked(slug);
    const count = likeCount(slug);
    return `
      <button
        class="like-button${liked ? " is-liked" : ""}"
        data-like="${escapeHtml(slug)}"
        data-like-label="${escapeHtml(label)}"
        aria-pressed="${liked ? "true" : "false"}"
        ${state.busyLikes.has(slug) ? "disabled" : ""}
      >
        <span>${liked ? "Liked" : label}</span>
        <b data-like-count="${escapeHtml(slug)}">${count}</b>
      </button>
    `;
  }

  function renderHero() {
    const item = getFeatured();
    const hero = siteConfig().hero || {};
    const heroImage = item.displayCover || item.cover;
    const titleBefore = hero.titleBefore || "NTRGAME";
    const titleHighlight = hero.titleHighlight || "Review";
    const titleAfter = hero.titleAfter || "Archive";
    const lede = hero.useFeaturedPullquote === false && hero.lede ? hero.lede : item.pullquote;
    $("#issue-label").textContent = `${data.site.issue} / ${data.site.volume}`;
    $("#footer-brand").textContent = data.site.footer;

    $("#hero").innerHTML = `
      <div class="hero-copy">
        <div>
          <span class="eyebrow">${escapeHtml(hero.eyebrow || "Featured Review")} / ${escapeHtml(item.verdict)}</span>
          <h1 class="hero-title">
            <span class="word">${escapeHtml(titleBefore)}</span>
            <em class="word">${escapeHtml(titleHighlight)}</em>
            <span class="word">${escapeHtml(titleAfter)}</span>
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
          ${image(heroImage, item.title)}
          <div class="score-badge"><div><small>Rating</small><strong>${score(item.rating)}</strong></div></div>
        </div>
        <div class="hero-panel-body">
          <div class="review-card-kicker">
            <span>${escapeHtml(item.type)}</span>
            <span>${escapeHtml(item.releaseDate)}</span>
          </div>
          <h2>${escapeHtml(item.title)}<br />${escapeHtml(item.titleCn)}</h2>
          <p>${escapeHtml(item.summary)}</p>
          <div class="button-row">
              <button class="rf-button primary" data-open="${escapeHtml(item.slug)}">${escapeHtml(hero.primaryAction || "打开测评")}</button>
            ${likeButton(item.slug)}
            <a class="rf-button" href="#reviews">${escapeHtml(hero.secondaryAction || "Browse Archive")}</a>
          </div>
        </div>
      </article>
    `;
  }

  function allTags() {
    const set = new Set(["All"]);
    data.reviews.forEach((review) => review.tags.forEach((tag) => set.add(tag)));
    return Array.from(set);
  }

  function renderTagFilter() {
    $("#tag-filter").innerHTML = allTags()
      .map((tag) => {
        const active = tag === state.tag ? " is-active" : "";
        return `<button class="tag-button${active}" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`;
      })
      .join("");
  }

  function matchesReview(review) {
    const haystack = [
      review.title,
      review.titleCn,
      review.studio,
      review.type,
      review.summary,
      review.tags.join(" ")
    ]
      .join(" ")
      .toLowerCase();
    const queryMatch = !state.query || haystack.includes(state.query.toLowerCase());
    const tagMatch = state.tag === "All" || review.tags.includes(state.tag);
    return queryMatch && tagMatch;
  }

  function renderReviews() {
    const reviews = data.reviews.filter(matchesReview);
    $("#review-grid").innerHTML = reviews.length
      ? reviews
          .map(
            (item) => `
        <article class="review-card">
          <div class="review-card-image">
            ${image(item.cover, item.title)}
            <div class="card-score">${score(item.rating)}</div>
          </div>
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
              <button class="rf-button primary" data-open="${escapeHtml(item.slug)}">打开测评</button>
              ${likeButton(item.slug)}
            </div>
          </div>
        </article>
      `
          )
          .join("")
      : `<div class="empty-state">没有匹配的测评，换个关键词试试。</div>`;
    animateDynamicContent("#review-grid .review-card");
  }

  function renderWatchlist() {
    $("#watchlist-list").innerHTML = data.watchlist
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
            </div>
          `
            )
            .join("")}
        </div>
      </article>
    `
      )
      .join("");
  }

  function renderRankings() {
    $("#ranking-grid").innerHTML = data.rankings
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
            </li>
          `
            )
            .join("")}
        </ol>
      </article>
    `
      )
      .join("");
  }

  function pollCounts(pollId) {
    return state.polls[pollId] || {};
  }

  function pollTotal(pollId) {
    return Object.values(pollCounts(pollId)).reduce((sum, value) => sum + Math.max(0, Number(value || 0)), 0);
  }

  function renderPolls() {
    const polls = data.polls || [];
    $("#poll-grid").innerHTML = polls
      .map((poll) => {
        const counts = pollCounts(poll.id);
        const total = pollTotal(poll.id);
        const selected = state.votes[poll.id];
        return `
          <article class="poll-card">
            <div>
              <span class="eyebrow">Reader Poll</span>
              <h3>${escapeHtml(poll.title)}</h3>
            </div>
            <p>${escapeHtml(poll.note)}</p>
            <div class="poll-options">
              ${poll.options
                .map((option) => {
                  const count = Math.max(0, Number(counts[option.id] || 0));
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  const active = selected === option.id ? " is-selected" : "";
                  const busy = state.busyPolls.has(poll.id) ? "disabled" : "";
                  return `
                    <button
                      class="poll-option${active}"
                      data-poll="${escapeHtml(poll.id)}"
                      data-option="${escapeHtml(option.id)}"
                      style="--poll-width:${pct}%"
                      ${busy}
                    >
                      <strong>${escapeHtml(option.label)}</strong>
                      <span>${pct}% / ${count}</span>
                    </button>
                  `;
                })
                .join("")}
            </div>
            <div class="poll-total">${total} votes ${selected ? "/ voted" : ""}</div>
          </article>
        `;
      })
      .join("");
    animateDynamicContent("#poll-grid .poll-card");
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
      ["有无回想", specs.gallery],
      ["资料状态", item.sourceStatus || "站内记录"]
    ]
      .map(
        ([label, value]) => `
      <div class="spec-cell">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value || "-")}</strong>
      </div>
    `
      )
      .join("");
  }

  function scoreRows(item) {
    return item.scores
      .map((row) => {
        const width = Math.max(0, Math.min(10, Number(row.value || 0))) * 10;
        return `
          <div class="score-row">
            <span>${escapeHtml(row.label)}</span>
            <div class="score-bar"><i style="width:${width}%"></i></div>
            <b>${score(row.value)}</b>
          </div>
        `;
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
        return `
          <text
            x="${labelPoint.x.toFixed(2)}"
            y="${labelPoint.y.toFixed(2)}"
            text-anchor="middle"
            dominant-baseline="middle"
          >${escapeHtml(row.label)}</text>
        `;
      })
      .join("");

    return `
      <svg class="radar-svg" viewBox="0 0 240 240" role="img" aria-label="维度雷达图">
        ${rings}
        ${axes}
        <polygon class="radar-fill" points="${polygon}"></polygon>
        <polygon class="radar-stroke" points="${polygon}"></polygon>
        ${labels}
      </svg>
    `;
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
              </article>
            `
              )
              .join("")}
          </div>
        </div>
      </section>
    `;
  }

  function directoryCards(rows, type) {
    return (rows || [])
      .map((person) => {
        const portrait = person.portrait
          ? image(person.portrait, person.name)
          : `<span class="directory-placeholder">No Image</span>`;
        return `
          <article class="directory-card ${type === "heroine" ? "is-heroine" : "is-antagonist"}">
            <figure>${portrait}</figure>
            <h4>${escapeHtml(person.name || "未命名")}</h4>
            ${person.role ? `<strong>${escapeHtml(person.role)}</strong>` : ""}
            <p>${escapeHtml(person.comment || "暂无人物短评。")}</p>
          </article>
        `;
      })
      .join("");
  }

  function renderDirectory(item) {
    const directories = item.directories || {};
    const heroines = directories.heroines || [];
    const antagonists = directories.antagonists || [];
    if (!heroines.length && !antagonists.length) return "";

    return `
      <section class="directory-wrap">
        ${heroines.length ? `
          <div class="directory-section is-heroine">
            <div class="directory-heading"><span>HEROINES DIRECTORY / 女主一览</span></div>
            <div class="directory-grid">${directoryCards(heroines, "heroine")}</div>
          </div>
        ` : ""}
        ${antagonists.length ? `
          <div class="directory-section is-antagonist">
            <div class="directory-heading"><span>TARGETS & ANTAGONISTS / 间男一览</span></div>
            <div class="directory-grid">${directoryCards(antagonists, "antagonist")}</div>
          </div>
        ` : ""}
      </section>
    `;
  }

  function sideList(title, rows) {
    return `
      <section class="side-list">
        <h3>${escapeHtml(title)}</h3>
        <ul>${rows.map((row) => `<li>${escapeHtml(row)}</li>`).join("")}</ul>
      </section>
    `;
  }

  function openArticle(slug) {
    const item = data.reviews.find((review) => review.slug === slug);
    if (!item) return;
    const articleImage = item.displayCover || item.cover;

    $("#article-sheet").innerHTML = `
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
        <figure>${image(articleImage, item.title)}</figure>
        <div class="article-specs">${specCells(item)}</div>
      </section>
      ${renderDirectory(item)}
      ${renderRadarPanel(item)}
      <section class="article-body">
        <div class="article-copy">
          <blockquote>${escapeHtml(item.pullquote)}</blockquote>
          ${item.body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
        </div>
        <aside class="article-side">
          <div class="button-row">
            ${likeButton(item.slug, "点赞测评")}
            ${item.poster ? `<a class="rf-button" href="${escapeHtml(item.poster)}" target="_blank" rel="noopener">原始排版图</a>` : ""}
          </div>
          <div class="chip-row">${item.tags.map((tag) => `<span class="chip red">${escapeHtml(tag)}</span>`).join("")}</div>
          ${sideList("亮点", item.pros)}
          ${sideList("问题", item.cons)}
        </aside>
      </section>
    `;

    const dialog = $("#article-dialog");
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "open");
    }
    animateArticleOpen();
    history.replaceState(null, "", `#review/${slug}`);
  }

  function closeArticle(skipAnimation = false) {
    const dialog = $("#article-dialog");
    if (!skipAnimation && dialog.open) {
      animateArticleClose(() => closeArticle(true));
      return;
    }
    if (dialog.open && typeof dialog.close === "function") dialog.close();
    dialog.removeAttribute("open");
    $("#article-sheet").removeAttribute("style");
    if (location.hash.startsWith("#review/")) {
      history.replaceState(null, "", location.pathname + location.search);
    }
  }

  function refreshLikeDom(slug) {
    document.querySelectorAll(`[data-like="${safeCss(slug)}"]`).forEach((button) => {
      const liked = isLiked(slug);
      button.classList.toggle("is-liked", liked);
      button.setAttribute("aria-pressed", liked ? "true" : "false");
      button.disabled = state.busyLikes.has(slug);
      const label = button.querySelector("span");
      if (label) label.textContent = liked ? "Liked" : button.dataset.likeLabel || "Like";
    });

    document.querySelectorAll(`[data-like-count="${safeCss(slug)}"]`).forEach((node) => {
      node.textContent = String(likeCount(slug));
    });
  }

  function refreshInteractions() {
    data.reviews.forEach((review) => refreshLikeDom(review.slug));
    renderPolls();
  }

  async function toggleLike(slug) {
    if (state.busyLikes.has(slug)) return;
    state.busyLikes.add(slug);
    refreshLikeDom(slug);

    try {
      if (state.cloudMode === "cloud") {
        await toggleCloudLike(slug);
      } else {
        const nextLiked = !isLiked(slug);
        state.liked[slug] = nextLiked;
        state.likes[slug] = Math.max(0, likeCount(slug) + (nextLiked ? 1 : -1));
        saveLocal("reviewfork.liked", state.liked);
        saveLocal("reviewfork.likes", state.likes);
      }
    } catch (error) {
      console.error("Like failed", error);
      updateCloudStatus("互动数据：云端写入失败，已保留页面。请检查 Firebase 配置和规则。");
    } finally {
      state.busyLikes.delete(slug);
      refreshLikeDom(slug);
    }
  }

  async function votePoll(pollId, optionId) {
    if (state.busyPolls.has(pollId)) return;
    if (state.votes[pollId] === optionId) return;
    state.busyPolls.add(pollId);
    renderPolls();

    try {
      if (state.cloudMode === "cloud") {
        await voteCloudPoll(pollId, optionId);
      } else {
        const previous = state.votes[pollId];
        const counts = { ...(state.polls[pollId] || {}) };
        if (previous) counts[previous] = Math.max(0, Number(counts[previous] || 0) - 1);
        counts[optionId] = Number(counts[optionId] || 0) + 1;
        state.polls[pollId] = counts;
        state.votes[pollId] = optionId;
        saveLocal("reviewfork.polls", state.polls);
        saveLocal("reviewfork.votes", state.votes);
      }
    } catch (error) {
      console.error("Poll failed", error);
      updateCloudStatus("互动数据：投票写入失败。请检查 Firebase 配置和规则。");
    } finally {
      state.busyPolls.delete(pollId);
      renderPolls();
    }
  }

  async function toggleCloudLike(slug) {
    const { db, uid, fs } = state.firebase;
    const counterRef = fs.doc(db, "reviewforkCounters", `likes_${slug}`);
    const userRef = fs.doc(db, "reviewforkUsers", uid, "likes", slug);

    await fs.runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (userSnap.exists()) {
        transaction.delete(userRef);
        transaction.set(
          counterRef,
          { count: fs.increment(-1), updatedAt: fs.serverTimestamp() },
          { merge: true }
        );
      } else {
        transaction.set(userRef, { liked: true, updatedAt: fs.serverTimestamp() });
        transaction.set(
          counterRef,
          { count: fs.increment(1), updatedAt: fs.serverTimestamp() },
          { merge: true }
        );
      }
    });
  }

  async function voteCloudPoll(pollId, optionId) {
    const { db, uid, fs } = state.firebase;
    const counterRef = fs.doc(db, "reviewforkCounters", `poll_${pollId}`);
    const voteRef = fs.doc(db, "reviewforkUsers", uid, "polls", pollId);

    await fs.runTransaction(db, async (transaction) => {
      const voteSnap = await transaction.get(voteRef);
      const previous = voteSnap.exists() ? voteSnap.data().optionId : null;
      if (previous === optionId) return;

      const optionUpdates = { [optionId]: fs.increment(1) };
      if (previous) optionUpdates[previous] = fs.increment(-1);

      transaction.set(voteRef, { optionId, updatedAt: fs.serverTimestamp() });
      transaction.set(
        counterRef,
        { options: optionUpdates, updatedAt: fs.serverTimestamp() },
        { merge: true }
      );
    });
  }

  function updateCloudStatus(message) {
    const status = $("#cloud-status");
    if (status) status.textContent = message;
  }

  async function initCloudSync() {
    const config = window.REVIEWFORK_FIREBASE_CONFIG;
    if (!config) {
      updateCloudStatus("互动数据：本地预览模式。配置 Firebase 后，访客会看到同一份点赞和投票结果。");
      return;
    }

    try {
      updateCloudStatus("互动数据：正在连接 Firebase...");
      const [appModule, authModule, fsModule] = await Promise.all([
        import("https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js"),
        import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js")
      ]);

      const app = appModule.initializeApp(config);
      const auth = authModule.getAuth(app);
      const credentials = await authModule.signInAnonymously(auth);
      const db = fsModule.getFirestore(app);

      state.cloudMode = "cloud";
      state.userId = credentials.user.uid;
      state.firebase = {
        db,
        uid: credentials.user.uid,
        fs: fsModule
      };

      updateCloudStatus("互动数据：Firebase 已连接。点赞和投票会同步给所有访客。");
      subscribeCloudData();
    } catch (error) {
      console.error("Firebase init failed", error);
      state.cloudMode = "local";
      updateCloudStatus("互动数据：Firebase 连接失败，当前使用本地预览模式。");
    }
  }

  function subscribeCloudData() {
    const { db, uid, fs } = state.firebase;

    data.reviews.forEach((review) => {
      fs.onSnapshot(fs.doc(db, "reviewforkCounters", `likes_${review.slug}`), (snapshot) => {
        state.likes[review.slug] = snapshot.exists() ? Number(snapshot.data().count || 0) : 0;
        refreshLikeDom(review.slug);
      });

      fs.onSnapshot(fs.doc(db, "reviewforkUsers", uid, "likes", review.slug), (snapshot) => {
        state.liked[review.slug] = snapshot.exists();
        refreshLikeDom(review.slug);
      });
    });

    (data.polls || []).forEach((poll) => {
      fs.onSnapshot(fs.doc(db, "reviewforkCounters", `poll_${poll.id}`), (snapshot) => {
        state.polls[poll.id] = snapshot.exists() ? snapshot.data().options || {} : {};
        renderPolls();
      });

      fs.onSnapshot(fs.doc(db, "reviewforkUsers", uid, "polls", poll.id), (snapshot) => {
        if (snapshot.exists()) state.votes[poll.id] = snapshot.data().optionId;
        else delete state.votes[poll.id];
        renderPolls();
      });
    });
  }

  function initGsapAnimations() {
    if (!hasGsap()) return;

    document.body.classList.add("gsap-ready");
    const gsap = window.gsap;
    if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

    const config = animationConfig();
    gsap.defaults({
      duration: 0.42 * Number(config.intensity || 1),
      ease: "power3.out"
    });

    if (!animationsEnabled()) return;

    bindGsapHover();
    runPageIntro();
    setupScrollAnimations();
    window.addEventListener("load", () => window.ScrollTrigger?.refresh());
  }

  function runPageIntro() {
    if (!animationsEnabled() || state.animation.introPlayed) return;
    state.animation.introPlayed = true;

    const gsap = window.gsap;
    const intensity = Number(animationConfig().intensity || 1);
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    gsap.set([".site-header", ".issue-strip", ".hero-copy", ".hero-panel"], { autoAlpha: 1 });
    tl.from(".site-header", { y: -18, autoAlpha: 0, duration: 0.42 * intensity })
      .from(".issue-strip span", { y: 12, autoAlpha: 0, stagger: 0.05, duration: 0.32 * intensity }, "-=0.18")
      .from(".hero-title .word", {
        yPercent: 40,
        autoAlpha: 0,
        rotation: -1.5,
        stagger: 0.08,
        duration: 0.72 * intensity
      }, "-=0.06")
      .from(".hero-lede", { x: -24, autoAlpha: 0, duration: 0.52 * intensity }, "-=0.42")
      .from(".hero-meta span", { y: 18, autoAlpha: 0, stagger: 0.045, duration: 0.42 * intensity }, "-=0.25")
      .from(".hero-panel", { y: 36, autoAlpha: 0, scale: 0.985, duration: 0.64 * intensity }, "-=0.58")
      .from(".score-badge", { scale: 0.72, rotation: -9, autoAlpha: 0, duration: 0.48 * intensity, ease: "back.out(1.8)" }, "-=0.32");
  }

  function killScrollAnimations() {
    state.animation.scrollTriggers.forEach((trigger) => trigger.kill());
    state.animation.scrollTriggers = [];
  }

  function setupScrollAnimations() {
    if (!animationsEnabled() || !window.ScrollTrigger || !animationConfig().scrollReveal) return;
    killScrollAnimations();

    const gsap = window.gsap;
    const targets = gsap.utils.toArray(".review-card, .watch-month, .ranking-list, .poll-card, .note-block");
    gsap.set(targets, { autoAlpha: 0, y: 34, scale: 0.985 });
    const triggers = window.ScrollTrigger.batch(targets, {
      start: "top 88%",
      once: true,
      onEnter: (batch) => {
        gsap.to(batch, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          stagger: 0.06,
          duration: 0.52 * Number(animationConfig().intensity || 1),
          clearProps: "visibility"
        });
      }
    });
    state.animation.scrollTriggers = Array.isArray(triggers) ? triggers : [];
  }

  function animateDynamicContent(selector) {
    if (!animationsEnabled()) return;
    const gsap = window.gsap;
    const targets = gsap.utils.toArray(selector);
    if (!targets.length) return;

    gsap.fromTo(
      targets,
      { autoAlpha: 0, y: 18, scale: 0.992 },
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        stagger: 0.04,
        duration: 0.34 * Number(animationConfig().intensity || 1),
        overwrite: true,
        clearProps: "visibility"
      }
    );
    requestAnimationFrame(() => window.ScrollTrigger?.refresh());
  }

  function bindGsapHover() {
    if (state.animation.hoverBound || !animationsEnabled() || !animationConfig().hover) return;
    state.animation.hoverBound = true;

    const hoverSelector = [
      ".review-card",
      ".watch-item",
      ".ranking-list",
      ".poll-option",
      ".rf-button",
      ".like-button",
      ".tag-button",
      ".reference-links a",
      ".dialog-close"
    ].join(",");

    document.addEventListener("pointerover", (event) => {
      const target = event.target.closest(hoverSelector);
      if (!target || target.disabled || target.contains(event.relatedTarget)) return;
      animateHover(target, true);
    });

    document.addEventListener("pointerout", (event) => {
      const target = event.target.closest(hoverSelector);
      if (!target || target.disabled || target.contains(event.relatedTarget)) return;
      animateHover(target, false);
    });
  }

  function animateHover(target, entering) {
    if (!animationsEnabled()) return;
    const gsap = window.gsap;
    const isLarge = target.matches(".review-card, .watch-item, .ranking-list, .poll-option");

    if (entering) {
      gsap.to(target, {
        y: isLarge ? -4 : -2,
        scale: isLarge ? 1.01 : 1.025,
        duration: 0.2,
        overwrite: "auto"
      });
    } else {
      gsap.to(target, {
        y: 0,
        scale: 1,
        duration: 0.22,
        overwrite: "auto",
        clearProps: "transform"
      });
    }
  }

  function pulseElement(target) {
    if (!target || !animationsEnabled()) return;
    window.gsap.fromTo(
      target,
      { scale: 0.94 },
      { scale: 1, duration: 0.32, ease: "back.out(2.2)", clearProps: "transform" }
    );
  }

  function animatePollChoice(target) {
    if (!target || !animationsEnabled()) return;
    window.gsap.fromTo(
      target,
      { x: -5 },
      { x: 0, duration: 0.28, ease: "elastic.out(1, 0.55)", clearProps: "transform" }
    );
  }

  function animateArticleOpen() {
    if (!animationsEnabled()) return;
    const gsap = window.gsap;
    const sheet = $("#article-sheet");
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(sheet, { autoAlpha: 0, y: 30, scale: 0.985 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.34 })
      .from("#article-sheet > *", { y: 24, autoAlpha: 0, stagger: 0.05, duration: 0.38 }, "-=0.18")
      .fromTo(".score-bar i", { scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, duration: 0.58, stagger: 0.04 }, "-=0.2");
  }

  function animateArticleClose(callback) {
    if (!animationsEnabled()) {
      callback();
      return;
    }
    window.gsap.to("#article-sheet", {
      autoAlpha: 0,
      y: 16,
      scale: 0.99,
      duration: 0.18,
      ease: "power2.in",
      onComplete: callback
    });
  }

  function bindEvents() {
    document.addEventListener("click", (event) => {
      const like = event.target.closest("[data-like]");
      if (like) {
        pulseElement(like);
        toggleLike(like.dataset.like);
        return;
      }

      const poll = event.target.closest("[data-poll][data-option]");
      if (poll) {
        animatePollChoice(poll);
        votePoll(poll.dataset.poll, poll.dataset.option);
        return;
      }

      const openButton = event.target.closest("[data-open]");
      if (openButton) openArticle(openButton.dataset.open);

      const tagButton = event.target.closest("[data-tag]");
      if (tagButton) {
        state.tag = tagButton.dataset.tag;
        renderTagFilter();
        renderReviews();
      }
    });

    $("#search-input").addEventListener("input", (event) => {
      state.query = event.target.value.trim();
      renderReviews();
    });

    $("#dialog-close").addEventListener("click", closeArticle);
    $("#article-dialog").addEventListener("click", (event) => {
      if (event.target.id === "article-dialog") closeArticle();
    });
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeArticle();
    });
  }

  function openHashArticle() {
    if (!location.hash.startsWith("#review/")) return;
    openArticle(decodeURIComponent(location.hash.replace("#review/", "")));
  }

  function boot() {
    applySiteCustomization();
    updateStaticSectionHeadings();
    renderHero();
    renderTagFilter();
    renderReviews();
    renderWatchlist();
    renderRankings();
    renderPolls();
    bindEvents();
    initGsapAnimations();
    openHashArticle();
    initCloudSync();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
