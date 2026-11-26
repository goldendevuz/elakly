// Reads post facts out of the data Instagram's own page already loads.
(function (root) {
  const num = (v) => (typeof v === "number" && v >= 0 ? v : undefined);

  function readMedia(o) {
    const code = o.code || o.shortcode;
    const user = o.user || o.owner;
    if (typeof code !== "string" || !/^[\w-]{5,}$/.test(code)) return null;
    if (!("media_type" in o || "like_count" in o || "product_type" in o || "__typename" in o && user)) return null;
    const m = { code };
    if (user && typeof user.username === "string") m.user = user.username.toLowerCase();
    const following = user && user.friendship_status && user.friendship_status.following;
    if (typeof following === "boolean") m.following = following;
    if (o.product_type === "clips") m.type = "reel";
    else if (o.media_type === 8) m.type = "carousel";
    else if (o.media_type === 2) m.type = "video";
    else if (o.media_type === 1) m.type = "photo";
    // Hidden like counts come with a placeholder number, so leave them unknown.
    if (!o.like_and_view_counts_disabled) m.likes = num(o.like_count);
    m.views = num(o.play_count) ?? num(o.ig_play_count) ?? num(o.view_count);
    m.duration = num(o.video_duration);
    if (o.caption && typeof o.caption.text === "string") m.caption = o.caption.text;
    if (o.is_paid_partnership === true) m.paid = true;
    if (o.ad_id || o.is_ad === true) m.ad = true;
    for (const k of Object.keys(m)) if (m[k] === undefined) delete m[k];
    return m;
  }

  function collect(data) {
    const out = [];
    const stack = [{ v: data, ad: false }];
    let steps = 0;
    while (stack.length && steps++ < 200000) {
      const { v, ad } = stack.pop();
      if (!v || typeof v !== "object") continue;
      // An object wrapped in an "ad" key is a sponsored post.
      const isAd = ad || (!Array.isArray(v) && Boolean(v.ad_id));
      if (!Array.isArray(v)) {
        const m = readMedia(v);
        if (m) {
          if (isAd) m.ad = true;
          out.push(m);
        }
      }
      for (const k in v) {
        const child = v[k];
        if (child && typeof child === "object") stack.push({ v: child, ad: isAd || k === "ad" });
      }
    }
    return out;
  }

  root.ElaklyMedia = { collect };
})(globalThis);
