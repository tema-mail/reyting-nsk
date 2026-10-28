import type { APIRoute } from 'astro';
import { abs } from '../lib/url';
import { COMPANIES, NICHE } from '../lib/niche';
import { CATEGORIES, hubIndexable, NICHES, CARDS } from '../lib/reytingi';
import { SREZ_ISO, SREZ_NEW_ISO } from '../lib/site';

// Только индексируемые адреса; lastmod = дата среза (не дата сборки).
export const GET: APIRoute = ({ site }) => {
  const urls: [string, string][] = [
    ['/', SREZ_NEW_ISO],
    ...CATEGORIES.filter((c) => hubIndexable(c.slug)).map((c) => [`/${c.slug}/`, SREZ_NEW_ISO] as [string, string]),
    [NICHE.path, SREZ_ISO],
    ...NICHES.map((n) => [n.path, n.srezIso] as [string, string]),
    ...COMPANIES.map((c) => [`/kompanii/${c.slug}/`, SREZ_ISO] as [string, string]),
    ...CARDS.filter((c) => c.index).map((c) => [`/kompanii/${c.slug}/`, c.main.niche.srezIso] as [string, string]),
    ...['/metodika/', '/o-proekte/', '/dobavit-kompaniyu/', '/politika-konfidentsialnosti/', '/soglasie-na-obrabotku-dannykh/'].map((p) => [p, SREZ_NEW_ISO] as [string, string]),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map(([p, d]) => `  <url><loc>${abs(p, site)}</loc><lastmod>${d}</lastmod></url>`)
    .join('\n')}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
