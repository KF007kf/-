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
    busyPolls: new Set(),
    tierBoards: loadLocal("reviewfork.tierBoards", null),
    tierActiveYear: loadLocal("reviewfork.tierActiveYear", data.annualTier?.activeYear || "2026"),
    tierDragId: null,
    tierEditItemId: null
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

  function cloneData(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function uid(prefix = "id") {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
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
      ["reviews", "reviews", "Reviews", "Latest Criticism"],
      ["watchlist", "watchlist", "Watchlist", "New Release Radar"],
      ["annual-tier", "annualTier", "Annual Tier List", "年度牛油排名"],
      ["rankings", "rankings", "Rankings", "Editor's Board"],
      ["community", "community", "Community", "Likes & Polls"]
    ];

    sections.forEach(([id, configId, kicker, title]) => {
      const section = document.getElementById(id);
      const label = section?.querySelector(".section-rule span");
      const heading = section?.querySelector(".section-rule h2");
      if (label) label.textContent = sectionText(configId, "kicker", kicker);
      if (heading) heading.textContent = sectionText(configId, "title", title);
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
    const heroScoreBadge = item.coverHasScore
      ? ""
      : `<div class="score-badge"><div><small>Rating</small><strong>${score(item.rating)}</strong></div></div>`;
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

  function defaultTierRows() {
    return cloneData(data.annualTier?.defaultTiers || [
      { id: "s", label: "S / 年度级", color: "#ff3530" },
      { id: "a", label: "A / 强推荐", color: "#111111" },
      { id: "b", label: "B / 可玩", color: "#6f6f6f" },
      { id: "c", label: "C / 观望", color: "#b9b2a8" },
      { id: "d", label: "D / 慎入", color: "#ded9cf" }
    ]).map((tier) => ({ ...tier, itemIds: tier.itemIds || [] }));
  }

  function seedTierBoards() {
    const boards = cloneData(data.annualTier?.boards || []);
    return boards.length ? boards : [createTierBoard(data.annualTier?.activeYear || "2026")];
  }

  function createTierBoard(year) {
    return {
      year: String(year || new Date().getFullYear()),
      title: `${year || new Date().getFullYear()} 年度牛油排名`,
      subtitle: "新建榜单。上传封面图，把条目拖进分层里，排完记得保存。",
      savedAt: "",
      tiers: defaultTierRows(),
      poolItemIds: [],
      items: []
    };
  }

  function normalizeTierBoard(board) {
    board.year = String(board.year || new Date().getFullYear());
    board.title = board.title || `${board.year} 年度牛油排名`;
    board.subtitle = board.subtitle || "";
    board.tiers = Array.isArray(board.tiers) && board.tiers.length ? board.tiers : defaultTierRows();
    board.tiers = board.tiers.map((tier, index) => ({
      id: tier.id || uid("tier"),
      label: tier.label || `Tier ${index + 1}`,
      color: tier.color || "#111111",
      itemIds: Array.isArray(tier.itemIds) ? tier.itemIds : []
    }));
    board.poolItemIds = Array.isArray(board.poolItemIds) ? board.poolItemIds : [];
    board.items = Array.isArray(board.items) ? board.items : [];

    const itemIds = new Set(board.items.map((item) => item.id));
    board.tiers.forEach((tier) => {
      tier.itemIds = tier.itemIds.filter((id, index, list) => itemIds.has(id) && list.indexOf(id) === index);
    });
    board.poolItemIds = board.poolItemIds.filter((id, index, list) => itemIds.has(id) && list.indexOf(id) === index);

    const placed = new Set([...board.poolItemIds, ...board.tiers.flatMap((tier) => tier.itemIds)]);
    board.items.forEach((item) => {
      if (!placed.has(item.id)) board.poolItemIds.push(item.id);
    });
    return board;
  }

  function initTierState() {
    if (!Array.isArray(state.tierBoards) || !state.tierBoards.length) {
      state.tierBoards = seedTierBoards();
    }
    state.tierBoards = state.tierBoards.map(normalizeTierBoard);
    if (!state.tierBoards.some((board) => board.year === state.tierActiveYear)) {
      state.tierActiveYear = state.tierBoards[0]?.year || data.annualTier?.activeYear || "2026";
    }
  }

  function currentTierBoard() {
    initTierState();
    return state.tierBoards.find((board) => board.year === state.tierActiveYear) || state.tierBoards[0];
  }

  function tierItemMap(board) {
    return new Map((board.items || []).map((item) => [item.id, item]));
  }

  function tierGroup(board, tierId) {
    if (tierId === "pool") return board.poolItemIds;
    return board.tiers.find((tier) => tier.id === tierId)?.itemIds || board.poolItemIds;
  }

  function saveTierState(showStatus = true) {
    const board = currentTierBoard();
    if (board) board.savedAt = new Date().toISOString();
    try {
      saveLocal("reviewfork.tierBoards", state.tierBoards);
      saveLocal("reviewfork.tierActiveYear", state.tierActiveYear);
      if (showStatus) updateTierStatus("已保存到本机浏览器。要长期备份可以导出 JSON。", "ok");
    } catch (error) {
      console.error("Tier save failed", error);
      updateTierStatus("保存失败：浏览器空间可能满了。请先导出 JSON 备份。", "bad");
    }
  }

  function updateTierStatus(message, tone = "idle") {
    const status = $("#tier-status");
    if (!status) return;
    status.textContent = message;
    status.dataset.tone = tone;
    if (animationsEnabled()) {
      window.gsap.fromTo(status, { y: -4, autoAlpha: 0.6 }, { y: 0, autoAlpha: 1, duration: 0.24, overwrite: true });
    }
  }

  function formatSavedAt(value) {
    if (!value) return "尚未手动保存";
    try {
      return new Date(value).toLocaleString("zh-CN", { hour12: false });
    } catch (error) {
      return value;
    }
  }

  function tierCover(item) {
    if (item.cover) return image(item.cover, item.title || "tier item");
    return `<span class="tier-card-placeholder">UPLOAD<br />IMAGE</span>`;
  }

  function renderTierCard(item) {
    return `
      <article class="tier-card" draggable="true" data-tier-item="${escapeHtml(item.id)}">
        <figure>${tierCover(item)}</figure>
        <div class="tier-card-copy">
          <strong>${escapeHtml(item.title || "未命名作品")}</strong>
          <span>${escapeHtml(item.studio || "未知社团")}</span>
        </div>
        <b>${escapeHtml(item.score || "-")}</b>
        <button class="tier-card-edit" type="button" data-tier-edit="${escapeHtml(item.id)}" title="编辑条目">编辑</button>
      </article>
    `;
  }

  function renderTierRows(board) {
    const items = tierItemMap(board);
    const rows = board.tiers
      .map((tier) => {
        const cards = tier.itemIds.map((id) => items.get(id)).filter(Boolean).map(renderTierCard).join("");
        return `
          <section class="tier-row" data-tier-drop="${escapeHtml(tier.id)}" style="--tier-color:${escapeHtml(tier.color)}">
            <div class="tier-label">
              <input class="tier-label-input" value="${escapeHtml(tier.label)}" data-tier-label="${escapeHtml(tier.id)}" aria-label="分层名称" />
              <input class="tier-color-input" type="color" value="${escapeHtml(tier.color)}" data-tier-color="${escapeHtml(tier.id)}" aria-label="分层颜色" />
              <button class="tier-row-remove" type="button" data-tier-remove="${escapeHtml(tier.id)}" title="删除分层">×</button>
            </div>
            <div class="tier-dropzone" data-tier-drop="${escapeHtml(tier.id)}">
              ${cards || `<span class="tier-empty">拖到这里</span>`}
            </div>
          </section>
        `;
      })
      .join("");
    const poolCards = board.poolItemIds.map((id) => items.get(id)).filter(Boolean).map(renderTierCard).join("");

    return `
      <div class="tier-board" data-tier-board="${escapeHtml(board.year)}">
        ${rows}
        <section class="tier-pool" data-tier-drop="pool">
          <div>
            <span>IMAGE POOL / 未上榜素材池</span>
            <p>上传的新图会先到这里，再拖到上面的分层。</p>
          </div>
          <div class="tier-pool-grid" data-tier-drop="pool">
            ${poolCards || `<span class="tier-empty">这里暂时没有待排条目</span>`}
          </div>
        </section>
      </div>
    `;
  }

  function renderAnnualTier() {
    const root = $("#tier-app");
    if (!root) return;
    initTierState();
    const board = currentTierBoard();
    const years = state.tierBoards.map((item) => item.year);

    root.innerHTML = `
      <div class="tier-toolbar">
        <div class="tier-year-tabs" aria-label="年度排名年份">
          ${years
            .map(
              (year) => `
            <button class="tier-year-tab${year === board.year ? " is-active" : ""}" type="button" data-tier-year="${escapeHtml(year)}">${escapeHtml(year)}</button>
          `
            )
            .join("")}
        </div>
        <div class="tier-actions">
          <button class="rf-button primary" type="button" data-tier-upload-trigger>上传图片</button>
          <button class="rf-button" type="button" data-tier-add-item>新增空条目</button>
          <button class="rf-button" type="button" data-tier-add-row>新增分层</button>
          <button class="rf-button" type="button" data-tier-new-year>新建年份</button>
          <button class="rf-button primary" type="button" data-tier-save>保存</button>
          <button class="rf-button" type="button" data-tier-export>导出 JSON</button>
          <button class="rf-button" type="button" data-tier-import-trigger>导入 JSON</button>
          <input id="tier-upload-input" type="file" accept="image/*" multiple hidden />
          <input id="tier-import-input" type="file" accept="application/json,.json" hidden />
        </div>
      </div>

      <div class="tier-meta-editor">
        <label>
          <span>YEAR / 年份</span>
          <input value="${escapeHtml(board.year)}" data-tier-board-field="year" />
        </label>
        <label>
          <span>TITLE / 榜单标题</span>
          <input value="${escapeHtml(board.title)}" data-tier-board-field="title" />
        </label>
        <label class="wide">
          <span>NOTE / 榜单说明</span>
          <input value="${escapeHtml(board.subtitle)}" data-tier-board-field="subtitle" />
        </label>
      </div>

      <div class="tier-status-line">
        <span id="tier-status" data-tone="idle">当前榜单：${escapeHtml(board.title)} / ${escapeHtml(formatSavedAt(board.savedAt))}</span>
        <span>拖拽排序 / 本地保存 / JSON 备份</span>
      </div>

      ${renderTierRows(board)}
    `;
    animateDynamicContent("#tier-app .tier-row, #tier-app .tier-pool, #tier-app .tier-card");
  }

  function moveTierItem(itemId, destinationId, beforeItemId = null) {
    const board = currentTierBoard();
    const groups = [board.poolItemIds, ...board.tiers.map((tier) => tier.itemIds)];
    groups.forEach((group) => {
      const index = group.indexOf(itemId);
      if (index >= 0) group.splice(index, 1);
    });

    const destination = tierGroup(board, destinationId);
    if (beforeItemId && beforeItemId !== itemId) {
      const beforeIndex = destination.indexOf(beforeItemId);
      if (beforeIndex >= 0) destination.splice(beforeIndex, 0, itemId);
      else destination.push(itemId);
    } else {
      destination.push(itemId);
    }
    saveTierState(false);
    renderAnnualTier();
    updateTierStatus("排序已更新并自动保存。", "ok");
  }

  function addTierYear(year) {
    const cleanYear = String(year || "").trim();
    if (!cleanYear) return;
    const existing = state.tierBoards.find((board) => board.year === cleanYear);
    if (existing) {
      state.tierActiveYear = cleanYear;
      saveTierState(false);
      renderAnnualTier();
      updateTierStatus(`已切换到 ${cleanYear}。`, "ok");
      return;
    }
    state.tierBoards.push(createTierBoard(cleanYear));
    state.tierActiveYear = cleanYear;
    saveTierState(false);
    renderAnnualTier();
    updateTierStatus(`已新建 ${cleanYear} 年度榜单。`, "ok");
  }

  function addTierRow() {
    const board = currentTierBoard();
    board.tiers.push({ id: uid("tier"), label: "NEW / 新分层", color: "#111111", itemIds: [] });
    saveTierState(false);
    renderAnnualTier();
    updateTierStatus("已新增分层。", "ok");
  }

  function addTierItem(seed = {}) {
    const board = currentTierBoard();
    const item = {
      id: seed.id || uid("item"),
      title: seed.title || "未命名作品",
      studio: seed.studio || "未知社团",
      score: seed.score || "-",
      cover: seed.cover || "",
      note: seed.note || ""
    };
    board.items.push(item);
    board.poolItemIds.push(item.id);
    saveTierState(false);
    renderAnnualTier();
    openTierItemEditor(item.id);
  }

  function removeTierRow(tierId) {
    const board = currentTierBoard();
    if (board.tiers.length <= 1) {
      updateTierStatus("至少保留一个分层。", "bad");
      return;
    }
    const tier = board.tiers.find((row) => row.id === tierId);
    if (!tier) return;
    board.poolItemIds.push(...tier.itemIds);
    board.tiers = board.tiers.filter((row) => row.id !== tierId);
    saveTierState(false);
    renderAnnualTier();
    updateTierStatus("分层已删除，里面的条目回到素材池。", "ok");
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function compressImageFile(file) {
    const dataUrl = await readFileAsDataUrl(file);
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const maxSide = 680;
        const ratio = Math.min(1, maxSide / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * ratio));
        const height = Math.max(1, Math.round(img.height * ratio));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  async function uploadTierImages(files) {
    const board = currentTierBoard();
    const imageFiles = Array.from(files || []).filter((file) => file.type.startsWith("image/"));
    if (!imageFiles.length) return;
    updateTierStatus("正在压缩并加入图片……", "idle");
    for (const file of imageFiles) {
      const cover = await compressImageFile(file);
      const name = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || "未命名作品";
      const id = uid("item");
      board.items.push({ id, title: name, studio: "待补社团", score: "-", cover, note: "" });
      board.poolItemIds.push(id);
    }
    saveTierState(false);
    renderAnnualTier();
    updateTierStatus(`已加入 ${imageFiles.length} 张图片。`, "ok");
  }

  function exportTierBoard() {
    const board = currentTierBoard();
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      board
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ntrgame-tier-${board.year}.json`;
    link.click();
    URL.revokeObjectURL(url);
    updateTierStatus("已导出 JSON 备份。", "ok");
  }

  async function importTierBoard(file) {
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      const incomingBoards = Array.isArray(payload.boards)
        ? payload.boards
        : [payload.board || payload].filter(Boolean);
      incomingBoards.map(normalizeTierBoard).forEach((incoming) => {
        const index = state.tierBoards.findIndex((board) => board.year === incoming.year);
        if (index >= 0) state.tierBoards[index] = incoming;
        else state.tierBoards.push(incoming);
        state.tierActiveYear = incoming.year;
      });
      saveTierState(false);
      renderAnnualTier();
      updateTierStatus("JSON 已导入。", "ok");
    } catch (error) {
      console.error("Tier import failed", error);
      updateTierStatus("导入失败：JSON 格式不对。", "bad");
    }
  }

  function findTierItem(itemId) {
    const board = currentTierBoard();
    return board.items.find((item) => item.id === itemId);
  }

  function openTierItemEditor(itemId) {
    const item = findTierItem(itemId);
    if (!item) return;
    state.tierEditItemId = itemId;
    $("#tier-edit-sheet").innerHTML = `
      <header class="tier-edit-head">
        <span class="eyebrow">TIER ITEM / 条目编辑</span>
        <h2>${escapeHtml(item.title || "未命名作品")}</h2>
      </header>
      <div class="tier-edit-grid">
        <figure class="tier-edit-preview">${tierCover(item)}</figure>
        <div class="tier-edit-fields">
          <label><span>标题</span><input id="tier-edit-title" value="${escapeHtml(item.title || "")}" /></label>
          <label><span>社团</span><input id="tier-edit-studio" value="${escapeHtml(item.studio || "")}" /></label>
          <label><span>分数/等级</span><input id="tier-edit-score" value="${escapeHtml(item.score || "")}" /></label>
          <label><span>备注</span><textarea id="tier-edit-note">${escapeHtml(item.note || "")}</textarea></label>
          <label><span>替换图片</span><input id="tier-edit-cover" type="file" accept="image/*" /></label>
        </div>
      </div>
      <div class="button-row">
        <button class="rf-button primary" type="button" data-tier-edit-save>保存条目</button>
        <button class="rf-button" type="button" data-tier-edit-remove>删除条目</button>
      </div>
    `;
    const dialog = $("#tier-edit-dialog");
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "open");
    if (animationsEnabled()) {
      window.gsap.fromTo("#tier-edit-sheet > *", { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.05, duration: 0.32 });
    }
  }

  function closeTierItemEditor() {
    const dialog = $("#tier-edit-dialog");
    if (dialog?.open && typeof dialog.close === "function") dialog.close();
    dialog?.removeAttribute("open");
    state.tierEditItemId = null;
  }

  async function saveTierItemEditor() {
    const item = findTierItem(state.tierEditItemId);
    if (!item) return;
    item.title = $("#tier-edit-title")?.value.trim() || "未命名作品";
    item.studio = $("#tier-edit-studio")?.value.trim() || "未知社团";
    item.score = $("#tier-edit-score")?.value.trim() || "-";
    item.note = $("#tier-edit-note")?.value.trim() || "";
    const file = $("#tier-edit-cover")?.files?.[0];
    if (file) item.cover = await compressImageFile(file);
    saveTierState(false);
    closeTierItemEditor();
    renderAnnualTier();
    updateTierStatus("条目已保存。", "ok");
  }

  function removeTierItemEditor() {
    const board = currentTierBoard();
    const itemId = state.tierEditItemId;
    board.items = board.items.filter((item) => item.id !== itemId);
    board.poolItemIds = board.poolItemIds.filter((id) => id !== itemId);
    board.tiers.forEach((tier) => {
      tier.itemIds = tier.itemIds.filter((id) => id !== itemId);
    });
    saveTierState(false);
    closeTierItemEditor();
    renderAnnualTier();
    updateTierStatus("条目已删除。", "ok");
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
    const targets = gsap.utils.toArray(".review-card, .watch-month, .tier-maker, .tier-row, .ranking-list, .poll-card, .note-block");
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
      ".tier-card",
      ".tier-row",
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

      const tierYear = event.target.closest("[data-tier-year]");
      if (tierYear) {
        state.tierActiveYear = tierYear.dataset.tierYear;
        saveTierState(false);
        renderAnnualTier();
        updateTierStatus(`已切换到 ${state.tierActiveYear}。`, "ok");
        return;
      }

      if (event.target.closest("[data-tier-new-year]")) {
        const year = window.prompt("输入要新建的年份，例如 2026、2025、2024");
        addTierYear(year);
        return;
      }

      if (event.target.closest("[data-tier-save]")) {
        saveTierState(true);
        return;
      }

      if (event.target.closest("[data-tier-add-row]")) {
        addTierRow();
        return;
      }

      if (event.target.closest("[data-tier-add-item]")) {
        addTierItem();
        return;
      }

      if (event.target.closest("[data-tier-upload-trigger]")) {
        $("#tier-upload-input")?.click();
        return;
      }

      if (event.target.closest("[data-tier-export]")) {
        exportTierBoard();
        return;
      }

      if (event.target.closest("[data-tier-import-trigger]")) {
        $("#tier-import-input")?.click();
        return;
      }

      const tierRemove = event.target.closest("[data-tier-remove]");
      if (tierRemove) {
        removeTierRow(tierRemove.dataset.tierRemove);
        return;
      }

      const tierEdit = event.target.closest("[data-tier-edit]");
      if (tierEdit) {
        openTierItemEditor(tierEdit.dataset.tierEdit);
        return;
      }

      if (event.target.closest("[data-tier-edit-save]")) {
        saveTierItemEditor();
        return;
      }

      if (event.target.closest("[data-tier-edit-remove]")) {
        removeTierItemEditor();
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

    document.addEventListener("change", async (event) => {
      const boardField = event.target.closest("[data-tier-board-field]");
      if (boardField) {
        const board = currentTierBoard();
        const field = boardField.dataset.tierBoardField;
        const value = boardField.value.trim();
        if (field === "year") {
          if (!value) {
            renderAnnualTier();
            updateTierStatus("年份不能为空。", "bad");
            return;
          }
          const duplicate = state.tierBoards.some((item) => item !== board && item.year === value);
          if (duplicate) {
            renderAnnualTier();
            updateTierStatus("这个年份已经存在，不能重复。", "bad");
            return;
          }
          board.year = value;
          state.tierActiveYear = value;
        } else {
          board[field] = value;
        }
        saveTierState(false);
        renderAnnualTier();
        updateTierStatus("榜单信息已保存。", "ok");
        return;
      }

      const tierLabel = event.target.closest("[data-tier-label]");
      if (tierLabel) {
        const tier = currentTierBoard().tiers.find((item) => item.id === tierLabel.dataset.tierLabel);
        if (tier) tier.label = tierLabel.value.trim() || "未命名分层";
        saveTierState(false);
        renderAnnualTier();
        updateTierStatus("分层名称已保存。", "ok");
        return;
      }

      const tierColor = event.target.closest("[data-tier-color]");
      if (tierColor) {
        const tier = currentTierBoard().tiers.find((item) => item.id === tierColor.dataset.tierColor);
        if (tier) tier.color = tierColor.value;
        saveTierState(false);
        renderAnnualTier();
        updateTierStatus("分层颜色已保存。", "ok");
        return;
      }

      if (event.target.id === "tier-upload-input") {
        await uploadTierImages(event.target.files);
        event.target.value = "";
        return;
      }

      if (event.target.id === "tier-import-input") {
        await importTierBoard(event.target.files?.[0]);
        event.target.value = "";
      }
    });

    document.addEventListener("dragstart", (event) => {
      const card = event.target.closest("[data-tier-item]");
      if (!card) return;
      state.tierDragId = card.dataset.tierItem;
      card.classList.add("is-dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", state.tierDragId);
    });

    document.addEventListener("dragend", (event) => {
      event.target.closest("[data-tier-item]")?.classList.remove("is-dragging");
      document.querySelectorAll(".is-tier-over").forEach((node) => node.classList.remove("is-tier-over"));
      state.tierDragId = null;
    });

    document.addEventListener("dragover", (event) => {
      const zone = event.target.closest("[data-tier-drop]");
      if (!zone || !state.tierDragId) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      zone.classList.add("is-tier-over");
    });

    document.addEventListener("dragleave", (event) => {
      const zone = event.target.closest("[data-tier-drop]");
      if (!zone || zone.contains(event.relatedTarget)) return;
      zone.classList.remove("is-tier-over");
    });

    document.addEventListener("drop", (event) => {
      const zone = event.target.closest("[data-tier-drop]");
      if (!zone || !state.tierDragId) return;
      event.preventDefault();
      const targetCard = event.target.closest("[data-tier-item]");
      const beforeItemId = targetCard?.dataset.tierItem;
      moveTierItem(state.tierDragId, zone.dataset.tierDrop, beforeItemId);
    });

    $("#dialog-close").addEventListener("click", closeArticle);
    $("#article-dialog").addEventListener("click", (event) => {
      if (event.target.id === "article-dialog") closeArticle();
    });
    $("#tier-edit-close").addEventListener("click", closeTierItemEditor);
    $("#tier-edit-dialog").addEventListener("click", (event) => {
      if (event.target.id === "tier-edit-dialog") closeTierItemEditor();
    });
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeArticle();
        closeTierItemEditor();
      }
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
    renderAnnualTier();
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
