// Decides whether a post is hidden. Unknown facts never hide a post.
(function (root) {
  const defaults = {
    enabled: true,
    lang: pickLang(root.navigator?.languages),
    hideAds: true,
    hideSuggested: true,
    hidePaid: false,
    silent: true,
    tellInstagram: false,
    followingOnly: false,
    hideReels: false,
    hidePhotos: false,
    hideVideos: false,
    hideCarousels: false,
    minLikes: 0,
    minViews: 0,
    minSeconds: 0,
    maxSeconds: 0,
    blockedUsers: [],
    blockedWords: [],
    hiddenPosts: [],
  };

  // Starting points offered on first run. Each sets the same keys, so switching leaves nothing behind.
  const preset = (patch) => ({ enabled: true, hideAds: true, hideSuggested: true, hidePaid: false, followingOnly: false, hideReels: false, minLikes: 0, ...patch });
  const presets = {
    clean: preset({}),
    quality: preset({ hidePaid: true, minLikes: 1000 }),
    focus: preset({ followingOnly: true, hideReels: true }),
  };

  // The first listed browser language we speak; English for everyone else.
  function pickLang(preferred) {
    for (const tag of preferred || []) {
      const base = String(tag).slice(0, 2).toLowerCase();
      if (["uz", "ru", "en"].includes(base)) return base;
    }
    return "en";
  }

  // Uzbek is typed with several apostrophe characters.
  const fold = (s) => s.toLowerCase().replace(/[‘’ʻʼ`´]/g, "'");

  function matchWord(text, word) {
    const w = fold(word.trim());
    if (!w) return false;
    const edge = "[^\\p{L}\\p{N}_]";
    const body = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // "#tag" matches the whole tag; a plain word also matches its endings (o'yin → o'yinlar).
    const tail = w.startsWith("#") ? `(?=${edge}|$)` : "";
    return new RegExp(`(?:^|${edge})${body}${tail}`, "u").test(fold(text));
  }

  // Only unwanted content is reported to Instagram; limits such as likes or length stay local.
  const reportable = ["ad", "suggested", "paid", "word", "user", "manual"];

  // Returns the reason a post is hidden, or null.
  function reason(post, s) {
    if (!s.enabled) return null;
    if (post.code && s.hiddenPosts.includes(post.code)) return { id: "manual" };
    if (s.hideAds && post.ad) return { id: "ad" };
    if (s.hideSuggested && post.suggested) return { id: "suggested" };
    if (s.hidePaid && post.paid) return { id: "paid" };
    const user = post.user && post.user.toLowerCase();
    if (user && s.blockedUsers.some((u) => u.trim().replace(/^@/, "").toLowerCase() === user))
      return { id: "user", detail: "@" + user };
    if (s.followingOnly && post.following === false) return { id: "notFollowing" };
    const word = post.caption && s.blockedWords.find((w) => matchWord(post.caption, w));
    if (word) return { id: "word", detail: word.trim() };
    const typeKey = { reel: "hideReels", photo: "hidePhotos", video: "hideVideos", carousel: "hideCarousels" }[post.type];
    if (typeKey && s[typeKey]) return { id: "type" };
    if (s.minLikes > 0 && post.likes !== undefined && post.likes < s.minLikes) return { id: "likes", detail: String(post.likes) };
    if (s.minViews > 0 && post.views !== undefined && post.views < s.minViews) return { id: "views", detail: String(post.views) };
    if (post.duration !== undefined) {
      const d = Math.round(post.duration);
      if ((s.minSeconds > 0 && d < s.minSeconds) || (s.maxSeconds > 0 && d > s.maxSeconds))
        return { id: "duration", detail: d + "s" };
    }
    return null;
  }

  root.ElaklyFilter = { defaults, presets, pickLang, matchWord, reason, reportable };
})(globalThis);
