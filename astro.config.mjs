import { defineConfig } from 'astro/config';

// Адрес для canonical и sitemap. Боевой домен не выбран (ждёт владельца) – на показе GitHub Pages, адрес задаёт workflow.
const SITE = process.env.PUBLIC_SITE_URL || 'https://tema-mail.github.io/reyting-nsk';
// Подпапка для GitHub Pages (/reyting-nsk), на своём домене – пусто.
const BASE = process.env.PUBLIC_BASE || '/';

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'ignore',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  devToolbar: { enabled: false },
});
