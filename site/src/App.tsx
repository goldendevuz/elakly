import { useEffect, useState } from "react";
import { Demo } from "./Demo";
import { text, type Lang } from "./text";

const REPO = "https://github.com/goldendevuz/elakly";
const LANGS = Object.keys(text) as Lang[];
const isLang = (v: string | null): v is Lang => LANGS.includes(v as Lang);

// A shared link (?lang=ru) wins, then the visitor's earlier choice, then the browser.
function firstLang(): Lang {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem("lang");
  } catch {
    // Storage may be blocked; the browser's language is enough.
  }
  const asked = new URLSearchParams(location.search).get("lang");
  return [asked, saved, ElaklyFilter.defaults.lang].find(isLang) ?? "en";
}

export function App() {
  const [lang, setLang] = useState<Lang>(firstLang);
  const t = text[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.querySelector('meta[name="description"]')?.setAttribute("content", t.lead);
  }, [lang, t]);

  const choose = (next: Lang) => {
    setLang(next);
    try {
      localStorage.setItem("lang", next);
    } catch {
      // Not remembered, still applied.
    }
  };

  const features = [
    [t.f1, t.f1t],
    [t.f2, t.f2t],
    [t.f3, t.f3t],
    [t.f4, t.f4t],
    [t.f5, t.f5t],
  ];

  return (
    <>
      <header>
        <a className="logo" href="/">
          <img src="/mark.svg" alt="" />
          Elakly
        </a>
        <div className="langs">
          {LANGS.map((code) => (
            <button key={code} type="button" aria-pressed={code === lang} onClick={() => choose(code)}>
              {code.toUpperCase()}
            </button>
          ))}
        </div>
      </header>
      <main>
        <section className="hero">
          <div>
            <h1>{t.line}</h1>
            <p className="lead">{t.lead}</p>
            <div className="actions">
              <a className="primary" href={REPO}>{t.get}</a>
              <a className="primary secondary" href="#demo">{t.try}</a>
            </div>
            <p className="soon">{t.soon}</p>
          </div>
          <div className="orbit" aria-hidden="true">
            <i /><i /><i /><b />
          </div>
        </section>
        <Demo t={t} />
        <section>
          <h2>{t.rulesTitle}</h2>
          <ul className="grid">
            {features.map(([title, body]) => (
              <li key={title}>
                <h3>{title}</h3>
                <p>{body}</p>
              </li>
            ))}
          </ul>
        </section>
        <section className="honest">
          <h2>{t.privacyTitle}</h2>
          <p>{t.privacy}</p>
          <p>{t.limits}</p>
        </section>
      </main>
      <footer>
        <span>© 2026 Elakly · <a href={REPO}>GitHub</a> · GPL-3.0</span>
        <span>{t.legal}</span>
      </footer>
    </>
  );
}
