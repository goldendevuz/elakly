import { useState } from "react";
import type { text, Lang } from "./text";

const posts: ElaklyPost[] = [
  { likes: 2400, type: "carousel" },
  { likes: 5200, ad: true },
  { likes: 4100, suggested: true, type: "video" },
  { likes: 3100, type: "reel" },
  { likes: 1300, type: "photo" },
  { likes: 40, type: "photo" },
];

export function Demo({ t }: { t: (typeof text)[Lang] }) {
  const [rules, setRules] = useState({ hideAds: true, hideSuggested: true, hideReels: false, minLikes: 0 });
  const settings = { ...ElaklyFilter.defaults, ...rules };
  const results = posts.map((p) => ElaklyFilter.reason(p, settings));
  const switches = [
    ["hideAds", t.ads],
    ["hideSuggested", t.suggested],
    ["hideReels", t.reels],
  ] as const;

  return (
    <section id="demo">
      <h2>{t.demoTitle}</h2>
      <p>{t.demoText}</p>
      <div className="demo">
        <form onSubmit={(e) => e.preventDefault()}>
          {switches.map(([key, label]) => (
            <label key={key}>
              <span>{label}</span>
              <input type="checkbox" name={key} checked={rules[key]} onChange={(e) => setRules({ ...rules, [key]: e.target.checked })} />
            </label>
          ))}
          <label className="range">
            <span>
              {t.likes}: <output>{rules.minLikes}</output>
            </span>
            <input type="range" name="minLikes" min={0} max={5000} step={100} value={rules.minLikes} onChange={(e) => setRules({ ...rules, minLikes: Number(e.target.value) })} />
          </label>
          <p aria-live="polite">
            <b id="count">{results.filter(Boolean).length}</b> {t.hidden}
          </p>
        </form>
        <ol id="feed">
          {posts.map((p, i) => {
            const why = results[i];
            return (
              <li key={i} className={why ? "out" : ""}>
                <i />
                <div>
                  <strong>{t.kinds[i]}</strong>
                  <small>{why ? (t.why as Record<string, string>)[why.id] : `♡ ${p.likes}`}</small>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
