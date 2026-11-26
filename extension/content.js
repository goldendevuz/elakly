// Applies the filters to what Instagram draws.
(function () {
  const { defaults, reason, reportable } = globalThis.ElaklyFilter;
  const media = new Map();
  const shown = new Set(); // posts the viewer chose to open anyway
  const counted = new Set();
  const LIMIT = 15; // after this many hidden posts in a row, keep their height so Instagram stops loading more
  const SKIP_LIMIT = 10;
  let settings = { ...defaults };
  let skipped = 0;
  let lastPath = "";

  const text = {
    uz: { hidden: "Yashirildi", show: "Ko'rsatish", hide: "Bu postni yashirish", ad: "reklama", suggested: "tavsiya", paid: "homiylik", user: "bloklangan akkaunt", notFollowing: "obuna emassiz", word: "bloklangan so'z", type: "post turi", likes: "like kam", views: "ko'rish kam", duration: "davomiyligi", manual: "o'zingiz yashirgansiz", count: "yashirildi" },
    ru: { hidden: "Скрыто", show: "Показать", hide: "Скрыть этот пост", ad: "реклама", suggested: "рекомендация", paid: "партнёрство", user: "аккаунт заблокирован", notFollowing: "вы не подписаны", word: "слово в чёрном списке", type: "тип поста", likes: "мало лайков", views: "мало просмотров", duration: "длительность", manual: "скрыто вами", count: "скрыто" },
    en: { hidden: "Hidden", show: "Show", hide: "Hide this post", ad: "ad", suggested: "suggested", paid: "paid partnership", user: "blocked account", notFollowing: "not followed", word: "blocked word", type: "post type", likes: "few likes", views: "few views", duration: "length", manual: "hidden by you", count: "hidden" },
  };
  const t = () => text[settings.lang] || text.uz;

  const codeOf = (href) => (href || "").match(/\/(?:p|reels?)\/([\w-]{5,})/)?.[1];

  // Labels Instagram prints above a post. Only the header is searched, not the caption.
  const AD = /^(sponsored|ad|реклама|reklama|homiylik asosida)$/i;
  const SUGGESTED = /^(suggested for you|suggested|рекомендации для вас|рекомендуем вам|siz uchun tavsiya etilgan|tavsiya etiladi)$/i;

  function readArticle(el) {
    const link = el.querySelector('a[href*="/p/"], a[href*="/reel/"]');
    const code = codeOf(link?.getAttribute("href"));
    const post = { code, ...media.get(code) };
    const spans = [...el.querySelectorAll("span, div, a")].filter((x) => !x.childElementCount && !x.closest(".hg-note")).slice(0, 60);
    for (const s of spans) {
      const label = s.textContent.trim();
      if (AD.test(label)) post.ad = true;
      if (SUGGESTED.test(label)) post.suggested = true;
    }
    if (!post.user) {
      const a = [...el.querySelectorAll('a[href^="/"]')].find((x) => /^\/[\w.]+\/$/.test(x.getAttribute("href")));
      if (a) post.user = a.getAttribute("href").slice(1, -1).toLowerCase();
    }
    return post;
  }

  const label = (why) => t()[why.id] + (why.detail ? ` (${why.detail})` : "");

  function count(key) {
    counted.add(key);
    let badge = document.getElementById("hg-badge");
    if (!badge) {
      badge = document.createElement("div");
      badge.id = "hg-badge";
      document.body.append(badge);
    }
    badge.textContent = `Elakly · ${counted.size} ${t().count}`;
  }

  function button(cls, title, onClick) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = cls;
    b.textContent = title;
    b.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    });
    return b;
  }

  function clear(el) {
    el.classList.remove("hg-collapsed", "hg-veiled", "hg-gone");
    el.querySelector(":scope > .hg-note")?.remove();
    delete el.dataset.hgWhy;
  }

  function feed() {
    let run = 0;
    for (const el of document.querySelectorAll("article")) {
      const post = readArticle(el);
      const key = post.code || post.user || (post.ad || post.suggested ? "post:" + (el.textContent.replace(/\s+/g, " ").trim().slice(0, 80) || "ad") : null);
      const why = key && !shown.has(key) ? reason(post, settings) : null;
      if (!why) {
        run = 0;
        if (el.dataset.hgWhy) clear(el);
        waiting.delete(el);
        const mine = el.querySelector(":scope > .hg-hide");
        if (settings.enabled && post.code && !mine) {
          el.classList.add("hg-post");
          el.append(button("hg-hide", "✕", () => hidePost(el.dataset.hgCode)));
          el.lastChild.title = t().hide;
        } else if (!settings.enabled) mine?.remove();
        if (post.code) el.dataset.hgCode = post.code;
        continue;
      }
      run++;
      const mode = run > LIMIT ? "hg-veiled" : settings.silent ? "hg-gone" : "hg-collapsed";
      if (settings.tellInstagram && reportable.includes(why.id)) report(el, key);
      const sig = `${key}|${mode}|${label(why)}|${settings.lang}`;
      // Instagram reuses elements, so the note is rebuilt when the post inside changes.
      if (el.dataset.hgWhy === sig && el.querySelector(":scope > .hg-note")) continue;
      clear(el);
      el.querySelector(":scope > .hg-hide")?.remove();
      el.dataset.hgWhy = sig;
      el.classList.add(mode);
      const note = document.createElement("div");
      note.className = "hg-note";
      const span = document.createElement("span");
      span.textContent = `${t().hidden}: ${label(why)}`;
      note.append(span, button("hg-show", t().show, () => { shown.add(key); schedule(); }));
      el.append(note);
      for (const v of el.querySelectorAll("video")) v.pause();
      count(key);
    }
  }

  // "Not interested": the only action Elakly ever takes on the account, and only if the viewer turned it on.
  // It is deliberately slow and capped, so it does not look or behave like a bot flood.
  const NOT_INTERESTED = /^(not interested|не интересует|не интересно|qiziq emas|qiziqtirmaydi|meni qiziqtirmaydi)$/i;
  const MORE = 'svg[aria-label="More options"], svg[aria-label="Ещё"], svg[aria-label="Другие параметры"], svg[aria-label="Boshqa parametrlar"], svg[aria-label="Boshqa variantlar"]';
  const GAP = 8000;
  const PER_HOUR = 20;
  const waiting = new Map();
  const reported = new Set();
  let sentAt = [];
  let acting = false;

  function report(el, key) {
    if (!reported.has(key)) waiting.set(el, key);
  }

  const pause = (ms) => new Promise((r) => setTimeout(r, ms));
  const escape = () => document.activeElement?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", keyCode: 27, bubbles: true }));

  async function sendOne() {
    const now = Date.now();
    sentAt = sentAt.filter((t) => now - t < 3600000);
    if (acting || !settings.enabled || !settings.tellInstagram || document.hidden) return;
    if (sentAt.length >= PER_HOUR || (sentAt.length && now - sentAt.at(-1) < GAP)) return;
    // Never interfere with a window the viewer has open.
    if (document.querySelector('[role="dialog"]')) return;
    const next = [...waiting].find(([el]) => el.isConnected && el.dataset.hgWhy);
    if (!next) return;
    const [el, key] = next;
    waiting.delete(el);
    reported.add(key);
    const more = el.querySelector(MORE)?.closest('button, [role="button"]');
    if (!more) return;
    acting = true;
    sentAt.push(now);
    document.documentElement.classList.add("hg-acting");
    try {
      more.click();
      let item;
      for (let i = 0; i < 20 && !item; i++) {
        await pause(150);
        item = [...document.querySelectorAll('[role="dialog"] *, [role="menu"] *')].find((x) => !x.childElementCount && NOT_INTERESTED.test(x.textContent.trim()));
      }
      if (item) {
        (item.closest('button, [role="button"], [role="menuitem"]') || item).click();
        count(key);
        await pause(900);
      }
      // Close the menu, or any follow-up question Instagram asks.
      for (let i = 0; i < 2 && document.querySelector('[role="dialog"], [role="menu"]'); i++) {
        const close = document.querySelector('[role="dialog"] svg[aria-label="Close"], [role="dialog"] svg[aria-label="Закрыть"], [role="dialog"] svg[aria-label="Yopish"]')?.closest('button, [role="button"]');
        if (close) close.click();
        else escape();
        await pause(300);
      }
    } finally {
      document.documentElement.classList.remove("hg-acting");
      acting = false;
    }
  }
  setInterval(sendOne, 1000);

  // Explore, profile and search grids.
  function grid() {
    for (const a of document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]')) {
      if (a.closest("article") && a.closest("article").querySelector("header")) continue;
      if (!a.querySelector("img, video, [style*='background-image']")) continue;
      const code = codeOf(a.getAttribute("href"));
      const why = code ? reason({ code, ...media.get(code) }, settings) : null;
      a.classList.toggle("hg-tile", Boolean(why));
      if (why) {
        a.dataset.hgLabel = label(why);
        count(code);
      }
    }
  }

  // The full-screen Reels viewer: move past a filtered reel.
  function reels() {
    const code = location.pathname.match(/^\/reels\/([\w-]{5,})/)?.[1];
    if (!code || location.pathname === lastPath || !media.has(code)) return;
    lastPath = location.pathname;
    if (shown.has(code) || !reason({ code, ...media.get(code) }, settings)) {
      skipped = 0;
      return;
    }
    count(code);
    if (skipped++ >= SKIP_LIMIT) return; // do not race through Instagram's feed
    setTimeout(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", code: "ArrowDown", keyCode: 40, bubbles: true }));
      const video = [...document.querySelectorAll("video")].find((v) => {
        const r = v.getBoundingClientRect();
        return r.top < innerHeight / 2 && r.bottom > innerHeight / 2;
      });
      let box = video?.parentElement;
      while (box && box.scrollHeight <= box.clientHeight + 10) box = box.parentElement;
      box?.scrollBy({ top: box.clientHeight, behavior: "smooth" });
    }, 600);
  }

  let pending = 0;
  function schedule() {
    if (pending || !document.body) return;
    pending = setTimeout(() => {
      pending = 0;
      feed();
      grid();
      reels();
      if (!settings.enabled) document.getElementById("hg-badge")?.remove();
    }, 120);
  }

  function hidePost(code) {
    if (!code) return;
    shown.delete(code);
    settings.hiddenPosts = [...new Set([...settings.hiddenPosts, code])].slice(-2000);
    chrome.storage.local.set({ settings });
    schedule();
  }

  window.addEventListener("message", (e) => {
    if (e.source !== window || e.data?.source !== "elakly" || !Array.isArray(e.data.media)) return;
    for (const m of e.data.media) media.set(m.code, m);
    lastPath = "";
    schedule();
  });
  window.postMessage({ source: "elakly-ready" }, location.origin);

  chrome.storage.local.get("settings").then((r) => {
    settings = { ...defaults, ...r.settings };
    schedule();
  });
  chrome.storage.onChanged.addListener((changes) => {
    if (!changes.settings) return;
    settings = { ...defaults, ...changes.settings.newValue };
    shown.clear();
    counted.clear();
    document.getElementById("hg-badge")?.remove();
    skipped = 0;
    lastPath = "";
    schedule();
  });

  new MutationObserver((list) => {
    if (list.some((m) => !m.target.closest?.("#hg-badge, .hg-note"))) schedule();
  }).observe(document.documentElement, { childList: true, subtree: true });

  // Development builds: ask the background to look for a newer build on disk.
  const ping = setInterval(() => {
    try {
      chrome.runtime.sendMessage({ type: "check-build" }).catch(() => {});
    } catch {
      clearInterval(ping);
    }
  }, 3000);
})();
