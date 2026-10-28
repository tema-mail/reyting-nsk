import type { APIRoute } from 'astro';
import { abs } from '../lib/url';

// Тестовый показ (PUBLIC_NOINDEX=1) закрыт целиком. В бою – открыто, служебное закрыто noindex на страницах.
export const GET: APIRoute = ({ site }) => {
  const closed = import.meta.env.PUBLIC_NOINDEX === '1';
  const body = closed
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\nDisallow: /spasibo/\n\nUser-agent: Yandex\nClean-param: rayon&sort\n\nSitemap: ${abs('/sitemap.xml', site)}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
