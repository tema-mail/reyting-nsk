// Сайт может жить в подпапке (GitHub Pages: /reyting-nsk). Все внутренние ссылки – через u().
const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

export function u(path: string): string {
  if (!path || /^(https?:|tel:|mailto:|#|data:)/.test(path)) return path;
  if (BASE && path.startsWith(BASE + '/')) return path;
  return BASE + (path.startsWith('/') ? path : '/' + path);
}

/** Полный адрес страницы для canonical, разметки и sitemap. */
export function abs(path: string, site: URL | undefined): string {
  const s = String(site || '').replace(/\/$/, '');
  const p = u(path);
  const sitePath = new URL(s + '/').pathname.replace(/\/$/, '');
  // site уже содержит подпапку (https://…/reyting-nsk) – не дублируем её
  const rest = sitePath && p.startsWith(sitePath) ? p.slice(sitePath.length) : p;
  return s + rest;
}
