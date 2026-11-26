import test from "node:test";
import assert from "node:assert/strict";
import "../extension/filter.js";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import "../extension/media.js";

const { defaults, matchWord, reason } = globalThis.HypeGramFilter;
const { collect } = globalThis.HypeGramMedia;
const s = (patch) => ({ ...defaults, ...patch });
const why = (post, patch) => reason(post, s(patch))?.id ?? null;

test("unknown facts never hide a post", () => {
  assert.equal(why({ code: "abcde" }, { minLikes: 100, minViews: 100, minSeconds: 10, followingOnly: true, hideReels: true }), null);
});

test("thresholds", () => {
  assert.equal(why({ likes: 99 }, { minLikes: 100 }), "likes");
  assert.equal(why({ likes: 100 }, { minLikes: 100 }), null);
  assert.equal(why({ views: 5 }, { minViews: 10 }), "views");
  assert.equal(why({ duration: 5.2 }, { minSeconds: 10 }), "duration");
  assert.equal(why({ duration: 61 }, { maxSeconds: 60 }), "duration");
});

test("switching off shows everything", () => {
  assert.equal(why({ ad: true }, { enabled: false }), null);
});

test("accounts, types, ads", () => {
  assert.equal(why({ user: "spam.page" }, { blockedUsers: ["@Spam.Page"] }), "user");
  assert.equal(why({ type: "reel" }, { hideReels: true }), "type");
  assert.equal(why({ ad: true }), "ad");
  assert.equal(why({ following: false }, { followingOnly: true }), "notFollowing");
});

test("words: Uzbek apostrophes, endings, whole hashtags, Cyrillic", () => {
  assert.ok(matchWord("Yangi oʻyinlar chiqdi", "o'yin"));
  assert.ok(!matchWord("to'yingan", "o'yin"));
  assert.ok(matchWord("bugun #fun!", "#fun"));
  assert.ok(!matchWord("#funny", "#fun"));
  assert.ok(matchWord("Это РЕКЛАМА", "реклама"));
  assert.ok(!matchWord("anything", "  "));
});

test("reads posts and ads from nested page data", () => {
  const found = collect({ data: { edges: [
    { node: { media: { code: "AAAAA1", media_type: 2, product_type: "clips", like_count: 3, play_count: 50, video_duration: 12.5, caption: { text: "hi" }, user: { username: "Bob", friendship_status: { following: false } } } } },
    { node: { ad: { ad_id: "9", items: [{ code: "BBBBB2", media_type: 1, like_count: 7 }] } } },
    { node: { media: { code: "CCCCC3", media_type: 8, like_count: 3, like_and_view_counts_disabled: true } } },
    { node: { error: { code: "not a post" } } },
  ] } });
  const by = Object.fromEntries(found.map((m) => [m.code, m]));
  assert.equal(found.length, 3);
  assert.deepEqual(by.AAAAA1, { code: "AAAAA1", user: "bob", following: false, type: "reel", likes: 3, views: 50, duration: 12.5, caption: "hi" });
  assert.equal(by.BBBBB2.ad, true);
  assert.equal(by.CCCCC3.likes, undefined);
});

test("switching presets leaves nothing behind", () => {
  const { presets } = globalThis.HypeGramFilter;
  const after = { ...defaults, ...presets.quality, ...presets.focus };
  assert.equal(after.minLikes, 0);
  assert.equal(after.hidePaid, false);
  assert.equal(after.followingOnly, true);
});

test("language follows the browser", () => {
  const { pickLang } = globalThis.HypeGramFilter;
  assert.equal(pickLang(["uz-Latn-UZ", "ru"]), "uz");
  assert.equal(pickLang(["de-DE", "ru-RU"]), "ru");
  assert.equal(pickLang(["fr"]), "en");
  assert.equal(pickLang(undefined), "en");
});

test("loads in a browser, where the language list exists", () => {
  const page = { navigator: { languages: ["ru-RU"] } };
  vm.runInNewContext(readFileSync(new URL("../extension/filter.js", import.meta.url), "utf8"), page);
  assert.equal(page.HypeGramFilter.defaults.lang, "ru");
});
