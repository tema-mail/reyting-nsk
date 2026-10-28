import type { APIRoute } from 'astro';
import { abs } from '../lib/url';

// Тестовый показ (PUBLIC_NOINDEX=1) закрыт целиком. В бою – открыто, служебное закрыто noindex на страницах.
// Одна группа *: отдельная группа Yandex отменила бы для Яндекса правила из * (Clean-param тоже здесь).
export const GET: APIRoute = ({ site }) => {
  const closed = import.meta.env.PUBLIC_NOINDEX === '1';
  const body = closed
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\nDisallow: /spasibo/\nClean-param: rayon&sort\n\nSitemap: ${abs('/sitemap.xml', site)}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
