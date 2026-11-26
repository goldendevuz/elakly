const { defaults, limitState } = globalThis.ElaklyFilter;
const text = {
  uz: { topicsTitle: "Qiziq bo'lmagan mavzular", topicsNote: "So'zlar bo'yicha aniqlanadi: yozuvsiz video o'tib ketishi mumkin.", limitTitle: "Kunlik limit", dailyMinutes: "Kuniga daqiqa", usedToday: "Bugun ishlatildi (daqiqa)", limitNote: "0 — limit yo'q. Xabarlar hisoblanmaydi.", silent: "Izsiz yo'q qilish", tellInstagram: "Instagram'ga «qiziq emas» deyish", tellNote: "Elakly sizning nomingizdan menyudagi tugmani bosadi: soatiga ko'pi bilan 20 marta. Instagram buni cheklashi mumkin.", rules: "qoida ishlayapti", tabClean: "Tozalash", tabLimits: "Chegaralar", tabLists: "Ro'yxatlar", enabled: "Filtrlar yoqilgan", clean: "Tozalash", hideAds: "Reklamani yashirish", hideSuggested: "Tavsiya postlarini yashirish", hidePaid: "Homiylik postlarini yashirish", followingOnly: "Faqat obuna bo'lganlarim", types: "Quyidagilarni yashirish", hideReels: "Reels", hideVideos: "Videolar", hidePhotos: "Rasmlar", hideCarousels: "Karusellar", numbers: "Chegaralar", minLikes: "Eng kam like", minViews: "Eng kam ko'rish", minSeconds: "Video kamida (soniya)", maxSeconds: "Video ko'pi bilan (soniya)", zero: "0 — chegara yo'q.", blockedUsers: "Bloklangan akkauntlar", blockedWords: "Bloklangan so'z va heshteglar", lines: "Har qatorga bittadan.", hiddenPosts: "Qo'lda yashirilgan postlar", restore: "Qaytarish" },
  ru: { topicsTitle: "Неинтересные темы", topicsNote: "Определяется по словам: видео без текста может проскочить.", limitTitle: "Дневной лимит", dailyMinutes: "Минут в день", usedToday: "Сегодня использовано (мин)", limitNote: "0 — без лимита. Сообщения не считаются.", silent: "Убирать без следа", tellInstagram: "Сообщать Instagram «не интересно»", tellNote: "Elakly нажимает пункт меню от вашего имени: не более 20 раз в час. Instagram может это ограничить.", rules: "правил активно", tabClean: "Очистка", tabLimits: "Пороги", tabLists: "Списки", enabled: "Фильтры включены", clean: "Очистка", hideAds: "Скрывать рекламу", hideSuggested: "Скрывать рекомендации", hidePaid: "Скрывать партнёрские посты", followingOnly: "Только подписки", types: "Скрывать", hideReels: "Reels", hideVideos: "Видео", hidePhotos: "Фото", hideCarousels: "Карусели", numbers: "Пороги", minLikes: "Минимум лайков", minViews: "Минимум просмотров", minSeconds: "Видео не короче (сек)", maxSeconds: "Видео не длиннее (сек)", zero: "0 — без ограничения.", blockedUsers: "Заблокированные аккаунты", blockedWords: "Заблокированные слова и хештеги", lines: "По одному в строке.", hiddenPosts: "Скрытые вручную посты", restore: "Вернуть" },
  en: { topicsTitle: "Topics to skip", topicsNote: "Detected by words: a video with no text can slip through.", limitTitle: "Daily limit", dailyMinutes: "Minutes per day", usedToday: "Used today (minutes)", limitNote: "0 means no limit. Messages are not counted.", silent: "Remove without a trace", tellInstagram: "Tell Instagram “not interested”", tellNote: "Elakly presses the menu item on your behalf, at most 20 times an hour. Instagram may restrict this.", rules: "rules active", tabClean: "Clean", tabLimits: "Limits", tabLists: "Lists", enabled: "Filters on", clean: "Clean up", hideAds: "Hide ads", hideSuggested: "Hide suggested posts", hidePaid: "Hide paid partnerships", followingOnly: "Followed accounts only", types: "Hide", hideReels: "Reels", hideVideos: "Videos", hidePhotos: "Photos", hideCarousels: "Carousels", numbers: "Limits", minLikes: "Minimum likes", minViews: "Minimum views", minSeconds: "Video at least (seconds)", maxSeconds: "Video at most (seconds)", zero: "0 means no limit.", blockedUsers: "Blocked accounts", blockedWords: "Blocked words and hashtags", lines: "One per line.", hiddenPosts: "Posts hidden by hand", restore: "Restore" },
};
let settings = { ...defaults };

function render() {
  const t = text[settings.lang] || text.uz;
  document.documentElement.lang = settings.lang;
  document.getElementById("lang").value = settings.lang;
  for (const el of document.querySelectorAll("[data-t]")) el.textContent = t[el.dataset.t];
  for (const el of document.querySelectorAll("[data-key]")) {
    const v = settings[el.dataset.key];
    if (el.type === "checkbox") el.checked = v;
    else if (el !== document.activeElement) el.value = Array.isArray(v) ? v.join("\n") : v || "";
  }
  const active = Object.entries(settings).filter(([k, v]) => k !== "enabled" && k !== "lang" && k !== "preset" && k !== "silent" && k !== "tellInstagram" && k !== "hiddenPosts" && (Array.isArray(v) ? v.length : v)).length;
  document.getElementById("rules").textContent = settings.enabled ? active : 0;
  document.body.classList.toggle("off", !settings.enabled);
  for (const el of document.querySelectorAll("[data-topic]")) el.checked = settings.topics.includes(el.dataset.topic);
  chrome.storage.local.get("usage").then((r) => (document.getElementById("used").textContent = Math.floor(limitState(r.usage, settings, new Date()).used / 60)));
  document.getElementById("hidden-count").textContent = settings.hiddenPosts.length;
}

async function save(patch) {
  // Read first: the page may have hidden a post while this window was open.
  const stored = (await chrome.storage.local.get("settings")).settings;
  settings = { ...defaults, ...stored, ...patch };
  await chrome.storage.local.set({ settings });
  render();
}

document.addEventListener("input", (e) => {
  const el = e.target;
  if (el.id === "lang") return save({ lang: el.value });
  const topic = el.dataset.topic;
  if (topic) return save({ topics: el.checked ? [...new Set([...settings.topics, topic])] : settings.topics.filter((x) => x !== topic) });
  const key = el.dataset.key;
  if (!key) return;
  if (el.type === "checkbox") save({ [key]: el.checked });
  else if (el.type === "number") save({ [key]: Math.max(0, Number(el.value) || 0) });
  else save({ [key]: el.value.split("\n").map((s) => s.trim()).filter(Boolean) });
});
const tabs = [...document.querySelectorAll("[data-tab]")];
function openTab(index) {
  tabs.forEach((tab, i) => tab.setAttribute("aria-selected", String(i === index)));
  document.querySelectorAll(".panel").forEach((panel, i) => (panel.hidden = i !== index));
  document.querySelector("nav").style.setProperty("--at", index);
}
tabs.forEach((tab, i) => tab.addEventListener("click", () => openTab(i)));
openTab(0);
document.getElementById("restore").addEventListener("click", () => save({ hiddenPosts: [] }));
chrome.storage.local.get("settings").then((r) => {
  settings = { ...defaults, ...r.settings };
  render();
});
