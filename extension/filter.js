// Decides whether a post is hidden. Unknown facts never hide a post.
(function (root) {
  const defaults = {
    enabled: true,
    lang: pickLang(root.navigator?.languages),
    hideAds: true,
    hideSuggested: true,
    hidePaid: false,
    silent: true,
    hidePeople: true,
    tellInstagram: false,
    followingOnly: false,
    hideReels: false,
    hidePhotos: false,
    hideVideos: false,
    hideCarousels: false,
    dailyMinutes: 0,
    minLikes: 0,
    minViews: 0,
    minSeconds: 0,
    maxSeconds: 0,
    blockedUsers: [],
    blockedWords: [],
    topics: [],
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
  const reportable = ["ad", "suggested", "paid", "word", "topic", "user", "manual"];

  // Ready word lists. Matching is by words and their endings, so keep each one unambiguous.
  const topics = {
    crypto: ["kripto", "bitcoin", "bitkoin", "ethereum", "kriptovalyut", "airdrop", "binance", "treyding", "treyder", "trading", "trader", "forex", "крипт", "биткоин", "трейдинг", "трейдер", "форекс"],
    betting: ["kazino", "casino", "bukmeker", "1xbet", "mostbet", "melbet", "betting", "stavka qil", "aviator o'yin", "казино", "букмекер", "ставки на спорт"],
    money: ["pul ishla", "oson pul", "passiv daromad", "millioner", "milliarder", "boy bo'l", "boyib ket", "daromad top", "make money", "passive income", "millionaire", "заработ", "пассивный доход", "миллионер", "разбогат"],
    politics: ["siyosat", "siyosiy", "saylov", "prezident", "deputat", "politics", "election", "president", "политик", "выборы", "президент", "депутат"],
    showbiz: ["shou-biznes", "shoubiznes", "showbiz", "celebrity", "gossip", "mish-mish", "шоу-бизнес", "шоубиз", "знаменитост", "сплетн"],
    sport: ["futbol", "football", "chempionlar ligasi", "champions league", "premier league", "la liga", "transfer yangilik", "футбол", "лига чемпионов", "трансфер"],
    marketing: ["marketing", "marketolog", "smm", "targetolog", "targeting", "copywrit", "kopirayt", "lidgen", "brending", "branding", "sotuv voronkasi", "маркетинг", "маркетолог", "смм", "таргет", "копирайт", "лидоген", "брендинг", "воронк"],
  };

  const topicNames = {
    uz: {"marketing": "Marketing", "crypto": "Kripto va treyding", "betting": "Qimor va stavkalar", "money": "Oson pul va boylik", "politics": "Siyosat", "showbiz": "Shou-biznes", "sport": "Futbol"},
    ru: {"marketing": "Маркетинг", "crypto": "Крипта и трейдинг", "betting": "Казино и ставки", "money": "Лёгкие деньги", "politics": "Политика", "showbiz": "Шоу-бизнес", "sport": "Футбол"},
    en: {"marketing": "Marketing", "crypto": "Crypto and trading", "betting": "Betting and casino", "money": "Easy money", "politics": "Politics", "showbiz": "Celebrities", "sport": "Football"},
  };

  // Returns the reason a post is hidden, or null.
  function reason(post, s) {
    if (!s.enabled) return null;
    if (post.code && s.hiddenPosts.includes(post.code)) return { id: "manual" };
    // Another tool removed the picture or video; the likes and caption left behind would only tempt.
    if (post.leftover) return { id: "leftover" };
    if (s.hideAds && post.ad) return { id: "ad" };
    if (s.hideSuggested && post.suggested) return { id: "suggested" };
    if (s.hidePaid && post.paid) return { id: "paid" };
    const user = post.user && post.user.toLowerCase();
    if (user && s.blockedUsers.some((u) => u.trim().replace(/^@/, "").toLowerCase() === user))
      return { id: "user", detail: "@" + user };
    if (s.followingOnly && post.following === false) return { id: "notFollowing" };
    const word = post.caption && s.blockedWords.find((w) => matchWord(post.caption, w));
    if (word) return { id: "word", detail: word.trim() };
    const topic = post.caption && (s.topics || []).find((name) => topics[name]?.some((w) => matchWord(post.caption, w)));
    if (topic) return { id: "topic", detail: (topicNames[s.lang] || topicNames.en)[topic] };
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

  const EXTRA = 5 * 60; // the one extension allowed per day
  // The local calendar day: the limit resets at the viewer's own midnight.
  const dayKey = (d) => [d.getFullYear(), d.getMonth() + 1, d.getDate()].map((n) => String(n).padStart(2, "0")).join("-");
  const today = (usage, now) => (usage && usage.day === dayKey(now) ? usage : { day: dayKey(now), seconds: 0, extended: false });
  function limitState(usage, s, now) {
    const u = today(usage, now);
    const allowed = s.dailyMinutes * 60 + (u.extended ? EXTRA : 0);
    return { used: u.seconds, left: Math.max(0, allowed - u.seconds), reached: s.dailyMinutes > 0 && u.seconds >= allowed, canExtend: !u.extended };
  }

  root.ElaklyFilter = { defaults, presets, pickLang, matchWord, reason, reportable, today, limitState, topics, topicNames };
})(globalThis);
