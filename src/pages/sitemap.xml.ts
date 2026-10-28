import type { APIRoute } from 'astro';
import { abs } from '../lib/url';
import { COMPANIES, NICHE } from '../lib/niche';
import { SREZ_ISO, CATEGORIES, hubIndexable } from '../lib/site';

// Только индексируемые адреса; lastmod = дата среза (не дата сборки).
export const GET: APIRoute = ({ site }) => {
  const paths = [
    '/',
    ...CATEGORIES.filter((c) => hubIndexable(c.slug)).map((c) => `/${c.slug}/`),
    NICHE.path,
    ...COMPANIES.map((c) => `/kompanii/${c.slug}/`),
    '/metodika/', '/o-proekte/', '/dobavit-kompaniyu/', '/politika-konfidentsialnosti/', '/soglasie-na-obrabotku-dannykh/',
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths
    .map((p) => `  <url><loc>${abs(p, site)}</loc><lastmod>${SREZ_ISO}</lastmod></url>`)
    .join('\n')}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
