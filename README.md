# HypeGram

Content filters for Instagram. A closed, proprietary product.

| Folder | What |
|---|---|
| `extension/` | Chrome extension (Manifest V3, no dependencies) |
| `site/` | Home page (static) |
| `brand/` | Mark and brand rules |

```bash
node --test test/*.test.mjs
scripts/dev.sh <folder>      # copy to a folder loaded unpacked in Chrome; it reloads itself
scripts/package.sh           # dist/: extension zip and the site
```

Languages: Uzbek, Russian, English (browser language, otherwise English).

© 2026 HypeGram. All rights reserved. Third-party: Instrument Serif (SIL OFL 1.1, `extension/fonts/LICENSE.txt`).
Not affiliated with or endorsed by Instagram or Meta.
