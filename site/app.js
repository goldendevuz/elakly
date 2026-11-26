const text = {
  uz: { line: "Lentada faqat siz tanlagani.", lead: "Elakly — Instagram uchun kontent filtri. Reklama, tavsiyalar va sizga keraksiz postlar yo'ldan chetga chiqadi.", try: "Sinab ko'ring", soon: "Chrome kengaytmasi tayyorlanmoqda. Android va Windows keyingi bosqichda.", demoTitle: "Qoidani siz qo'yasiz", demoText: "Bu namunaviy lenta. Tugmalarni bosing va natijani ko'ring.", ads: "Reklamani yashirish", suggested: "Tavsiyalarni yashirish", reels: "Reels'ni yashirish", likes: "Eng kam like", hidden: "ta post yashirildi", why: { ad: "reklama", suggested: "tavsiya", type: "Reels", likes: "like kam" }, kinds: ["Do'stingizning safar suratlari", "Reklama posti", "Tavsiya etilgan video", "Qisqa Reels", "Oshxona retsepti", "Kam like olgan post"], rulesTitle: "Nimalarni filtrlaydi", f1: "Shovqin", f1t: "Reklama, tavsiya va homiylik postlari.", f2: "Sifat", f2t: "Like, ko'rishlar soni va video davomiyligi bo'yicha chegara.", f3: "Qora ro'yxat", f3t: "Akkauntlar, so'zlar, heshteglar va alohida postlar.", f4: "Turi", f4t: "Reels, video, rasm yoki karuselni yashirish.", privacyTitle: "Ochiq gap", privacy: "Kengaytma sozlamalaringizni faqat brauzeringizda saqlaydi, parolingizni so'ramaydi va ma'lumotingizni hech qayerga yubormaydi.", limits: "Instagram sahifasi o'zgarsa, ayrim filtrlar yangilanguncha ishlamay qolishi mumkin. Instagram qoidalari bunday vositalarni cheklashi mumkin.", legal: "Instagram yoki Meta bilan bog'liq emas." },
  ru: { line: "В ленте только то, что выбрали вы.", lead: "Elakly — фильтр контента для Instagram. Реклама, рекомендации и ненужные вам посты уходят с дороги.", try: "Попробовать", soon: "Расширение для Chrome в разработке. Android и Windows — на следующем этапе.", demoTitle: "Правила задаёте вы", demoText: "Это пример ленты. Переключайте и смотрите на результат.", ads: "Скрывать рекламу", suggested: "Скрывать рекомендации", reels: "Скрывать Reels", likes: "Минимум лайков", hidden: "постов скрыто", why: { ad: "реклама", suggested: "рекомендация", type: "Reels", likes: "мало лайков" }, kinds: ["Фото из поездки друга", "Рекламный пост", "Рекомендованное видео", "Короткий Reels", "Кулинарный рецепт", "Пост с малым числом лайков"], rulesTitle: "Что фильтруется", f1: "Шум", f1t: "Реклама, рекомендации и партнёрские посты.", f2: "Качество", f2t: "Пороги по лайкам, просмотрам и длине видео.", f3: "Чёрный список", f3t: "Аккаунты, слова, хештеги и отдельные посты.", f4: "Тип", f4t: "Скрытие Reels, видео, фото или каруселей.", privacyTitle: "Честно", privacy: "Расширение хранит настройки только в вашем браузере, не спрашивает пароль и никуда не отправляет ваши данные.", limits: "Если страница Instagram изменится, часть фильтров может не работать до обновления. Правила Instagram могут ограничивать такие инструменты.", legal: "Не связано с Instagram или Meta." },
  en: { line: "Your feed, only what you choose.", lead: "Elakly is a content filter for Instagram. Ads, suggestions and posts you do not need step out of the way.", try: "Try it", soon: "The Chrome extension is in development. Android and Windows come next.", demoTitle: "You set the rules", demoText: "This is a sample feed. Flip the switches and watch.", ads: "Hide ads", suggested: "Hide suggestions", reels: "Hide Reels", likes: "Minimum likes", hidden: "posts hidden", why: { ad: "ad", suggested: "suggested", type: "Reels", likes: "few likes" }, kinds: ["A friend's travel photos", "A sponsored post", "A suggested video", "A short Reel", "A kitchen recipe", "A post with few likes"], rulesTitle: "What it filters", f1: "Noise", f1t: "Ads, suggested and paid partnership posts.", f2: "Quality", f2t: "Limits on likes, views and video length.", f3: "Block list", f3t: "Accounts, words, hashtags and single posts.", f4: "Type", f4t: "Hide Reels, videos, photos or carousels.", privacyTitle: "Plainly", privacy: "The extension keeps your settings in your browser only, never asks for your password and sends your data nowhere.", limits: "If Instagram changes its page, some filters may stop working until updated. Instagram's terms may restrict tools like this.", legal: "Not affiliated with Instagram or Meta." },
};
const posts = [
  { likes: 2400, type: "carousel" }, { likes: 5200, ad: true }, { likes: 4100, suggested: true, type: "video" },
  { likes: 3100, type: "reel" }, { likes: 1300, type: "photo" }, { likes: 40, type: "photo" },
];
const { defaults, reason } = globalThis.ElaklyFilter;
const form = document.getElementById("rules");
const feed = document.getElementById("feed");
// A shared link (?lang=ru) wins, then the visitor's earlier choice, then the browser.
let lang = new URLSearchParams(location.search).get("lang");
try { lang = lang || localStorage.getItem("lang"); } catch {}
if (!text[lang]) lang = defaults.lang;
posts.forEach(() => feed.insertAdjacentHTML("beforeend", "<li><i></i><div><strong></strong><small></small></div></li>"));

function filter() {
  const s = { ...defaults, hideAds: form.hideAds.checked, hideSuggested: form.hideSuggested.checked, hideReels: form.hideReels.checked, minLikes: Number(form.minLikes.value) };
  const t = text[lang];
  let hidden = 0;
  posts.forEach((p, i) => {
    const why = reason(p, s);
    const li = feed.children[i];
    li.classList.toggle("out", Boolean(why));
    li.querySelector("strong").textContent = t.kinds[i];
    li.querySelector("small").textContent = why ? t.why[why.id] : `♡ ${p.likes}`;
    if (why) hidden++;
  });
  document.getElementById("count").textContent = hidden;
  document.getElementById("likes").textContent = s.minLikes;
}
function render() {
  document.documentElement.lang = lang;
  document.querySelector('meta[name="description"]').content = text[lang].lead;
  for (const el of document.querySelectorAll("[data-t]")) el.textContent = text[lang][el.dataset.t];
  for (const el of document.querySelectorAll("[data-lang]")) el.setAttribute("aria-pressed", String(el.dataset.lang === lang));
  filter();
}
document.querySelector(".langs").addEventListener("click", (e) => {
  if (!e.target.dataset.lang) return;
  lang = e.target.dataset.lang;
  try { localStorage.setItem("lang", lang); } catch {}
  render();
});
form.addEventListener("input", filter);
render();
