const { defaults, presets } = globalThis.ElaklyFilter;
const text = {
  uz: { line: "Lentada faqat siz tanlagani.", intro: "Elakly Instagram'dagi ortiqcha postlarni sizning qoidalaringiz bo'yicha yashiradi.", pickTitle: "Qanday lenta xohlaysiz?", pickText: "Birini tanlang. Keyin har bir qoidani alohida o'zgartirish mumkin.", clean: "Toza", cleanText: "Reklama va tavsiya postlari yashiriladi.", quality: "Saralangan", qualityText: "Toza rejim, ustiga homiylik postlari va 1000 tadan kam like olganlar.", focus: "Diqqat", focusText: "Faqat obuna bo'lganlaringiz, Reels'siz.", blockTitle: "Nimani ko'rishni istamaysiz?", blockText: "So'z yoki heshteg, har qatorga bittadan. Bo'sh qoldirsa ham bo'ladi.", doneTitle: "Tayyor.", doneText: "Sozlamalar brauzer panelidagi Elakly belgisida. Ochiq turgan Instagram tabini bir marta yangilang.", note: "Elakly sozlamalaringizni faqat shu brauzerda saqlaydi. Instagram yoki Meta bilan bog'liq emas. Instagram qoidalari bunday vositalarni cheklashi mumkin.", open: "Instagram'ni ochish", back: "Orqaga", next: "Davom etish" },
  ru: { line: "В ленте только то, что выбрали вы.", intro: "Elakly скрывает лишние посты в Instagram по вашим правилам.", pickTitle: "Какую ленту вы хотите?", pickText: "Выберите вариант. Потом каждое правило можно изменить отдельно.", clean: "Чистая", cleanText: "Скрыты реклама и рекомендации.", quality: "Отборная", qualityText: "Чистая лента без партнёрских постов и постов меньше 1000 лайков.", focus: "Фокус", focusText: "Только подписки, без Reels.", blockTitle: "Что вы не хотите видеть?", blockText: "Слово или хештег, по одному в строке. Можно оставить пустым.", doneTitle: "Готово.", doneText: "Настройки открываются значком Elakly на панели браузера. Один раз обновите открытую вкладку Instagram.", note: "Elakly хранит настройки только в этом браузере. Не связан с Instagram или Meta. Правила Instagram могут ограничивать такие инструменты.", open: "Открыть Instagram", back: "Назад", next: "Дальше" },
  en: { line: "Your feed, only what you choose.", intro: "Elakly hides the Instagram posts you do not want, by your rules.", pickTitle: "What kind of feed do you want?", pickText: "Pick one. You can change every rule afterwards.", clean: "Clean", cleanText: "Ads and suggested posts are hidden.", quality: "Selected", qualityText: "Clean, and no paid partnerships or posts under 1000 likes.", focus: "Focus", focusText: "Followed accounts only, no Reels.", blockTitle: "What do you not want to see?", blockText: "A word or hashtag, one per line. You can leave it empty.", doneTitle: "Ready.", doneText: "Settings are behind the Elakly icon in the toolbar. Reload an open Instagram tab once.", note: "Elakly keeps your settings in this browser only. It is not affiliated with Instagram or Meta. Instagram's terms may restrict tools like this.", open: "Open Instagram", back: "Back", next: "Continue" },
};
const steps = [...document.querySelectorAll(".step")];
let settings = { ...defaults };
let at = 0;

function render() {
  const t = text[settings.lang] || text.uz;
  document.documentElement.lang = settings.lang;
  for (const el of document.querySelectorAll("[data-t]")) el.textContent = t[el.dataset.t];
  for (const el of document.querySelectorAll("[data-lang]")) el.setAttribute("aria-pressed", String(el.dataset.lang === settings.lang));
  for (const el of document.querySelectorAll("[data-preset]")) el.setAttribute("aria-pressed", String(el.dataset.preset === settings.preset));
  steps.forEach((s, i) => (s.hidden = i !== at));
  document.querySelectorAll(".dots i").forEach((d, i) => d.classList.toggle("on", i <= at));
  document.getElementById("back").style.visibility = at ? "visible" : "hidden";
  document.getElementById("next").hidden = at === steps.length - 1;
}

async function save(patch) {
  const stored = (await chrome.storage.local.get("settings")).settings;
  settings = { ...defaults, ...stored, ...patch };
  await chrome.storage.local.set({ settings });
  render();
}

document.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.lang) save({ lang: b.dataset.lang });
  else if (b.dataset.preset) save({ ...presets[b.dataset.preset], preset: b.dataset.preset });
  else {
    at = Math.min(steps.length - 1, Math.max(0, at + (b.id === "next" ? 1 : -1)));
    render();
  }
});
document.getElementById("words").addEventListener("input", (e) => save({ blockedWords: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) }));
chrome.storage.local.get("settings").then((r) => {
  settings = { ...defaults, ...r.settings };
  document.getElementById("words").value = settings.blockedWords.join("\n");
  render();
});
