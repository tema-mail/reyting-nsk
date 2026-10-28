// JSON-LD: один узел Organization сайта (#org), крошки, без AggregateRating/Review (правила Google: рейтинг редакции по чужим отзывам размечать нельзя).
import { abs } from './url';
import { SITE_NAME } from './site';

export const orgId = (site: URL | undefined) => abs('/', site) + '#org';
export function org(site: URL | undefined) {
  // email и sameAs не выводим: почты и профилей проекта пока нет (подтвердить у владельца)
  return { '@type': 'Organization', '@id': orgId(site), name: SITE_NAME, url: abs('/', site), logo: abs('/favicon.svg', site) };
}
export function crumbs(items: { name: string; path: string }[], site: URL | undefined) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: abs(it.path, site) })),
  };
}
export const graph = (...nodes: object[]) => ({ '@context': 'https://schema.org', '@graph': nodes });
