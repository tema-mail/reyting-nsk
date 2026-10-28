// Все рейтинги сайта: новые ниши (Яндекс Карты, формула formula-ya.mjs) + доставка цветов (свои данные Я+2ГИС, niche.ts).
// Один источник для страниц рейтингов, хабов, карточек, главной, карты сайта и sitemap.
import { CATS, NISHI } from './nishi.mjs';
import { computeYa, norm } from './formula-ya.mjs';
import { rayon } from './rayon.mjs';
import type { NicheText } from '../data/teksty/types';
import { COMPANIES as TSVETY, NICHE as TSVETY_NICHE } from './niche';

const RAW = import.meta.glob('../data/nsk/*.json', { eager: true, import: 'default' }) as Record<string, any>;
const TXT = import.meta.glob('../data/teksty/*.ts', { eager: true }) as Record<string, { TEKSTY?: NicheText[] }>;
const TEXTS = new Map<string, NicheText>();
for (const m of Object.values(TXT)) for (const t of m.TEKSTY || []) TEXTS.set(t.key, t);

export interface Point {
  id: string; name: string; adr: string; coord: [number, number]; rayon: string; card: string;
  phones: string[]; sites: string[]; hours: string; h24: boolean; rubrics: string[];
  rating: number; ratings: number; reviews: number; last: string | null; n12: number; owner: boolean; good: boolean;
}
export interface Row {
  place: number; name: string; ball: number; ballExact: number; calc: any;
  rating: number; ratings: number; reviews: number; last: string | null; n12: number;
  site: boolean; hours: boolean; owner: boolean; good: boolean; h24: boolean;
  points: Point[]; rayony: string[]; siteUrl: string; phone: string;
  niche: Niche; slug?: string; // slug карточки (есть у компаний с карточкой)
}
export interface Niche {
  key: string; slug: string; name: string; path: string; cat: { slug: string; name: string };
  text: NicheText; rule: { why: string }; srezIso: string; found: number; rows: Row[]; top: Row[]; rest: Row[]; dropped: { name: string; why: string }[];
}
export interface Company { slug: string; name: string; rows: Row[]; points: Point[]; main: Row }

const toPoint = (p: any): Point => ({
  id: String(p.id), name: p.название.trim(), adr: String(p.адрес).replace(/,\s*Новосибирск$/, ''), coord: p.координаты, rayon: rayon(p.координаты),
  card: p.карточка, phones: p.телефоны || [], sites: p.сайты || [], hours: p.круглосуточно ? 'круглосуточно' : p.часы || '', h24: !!p.круглосуточно,
  rubrics: p.рубрики || [], rating: p.рейтинг, ratings: p.оценок, reviews: p.отзывов, last: p.последний_отзыв || null,
  n12: p.отзывов_за_12_мес_из_загруженных || 0, owner: !!p.владелец_подтвердил, good: !!p.хорошее_место,
});

const ALL: Niche[] = [];
const FAILED: { key: string; name: string; count: number }[] = [];
for (const [key, cfg] of Object.entries(NISHI) as [string, any][]) {
  const raw = RAW[`../data/nsk/${key.replace('/', '__')}.json`];
  if (!raw) throw new Error(`Нет данных ниши ${key} в src/data/nsk/`);
  const text = TEXTS.get(key);
  if (!text) throw new Error(`Нет текстов ниши ${key} в src/data/teksty/`);
  const [catSlug, slug] = key.split('/');
  const cat = CATS.find((c) => c.slug === catSlug)!;
  const res = computeYa(raw, cfg.rule, raw['дата_съёма']);
  if (!res.published) { FAILED.push({ key, name: cfg.name, count: res.rows.length }); continue; }
  const n = { key, slug, name: cfg.name, path: `/${key}/`, cat: { slug: cat.slug, name: cat.name }, text, rule: cfg.rule, srezIso: raw['дата_съёма'], found: raw.компании.length, dropped: res.dropped } as Niche;
  n.rows = res.rows.map((r: any) => {
    const points = r.points.map(toPoint).sort((a: Point, b: Point) => b.reviews - a.reviews);
    const main = points[0];
    return {
      place: r.place, name: r.name, ball: r.calc.ballRound, ballExact: r.calc.ball, calc: r.calc,
      rating: r.rating, ratings: r.ratings, reviews: r.reviews, last: r.last, n12: r.n12,
      site: r.site, hours: r.hours, owner: r.owner, good: r.good, h24: r.h24,
      points, rayony: [...new Set(points.map((p: Point) => p.rayon))] as string[],
      siteUrl: points.find((p: Point) => p.sites.length)?.sites[0] || '', phone: points.find((p: Point) => p.phones.length)?.phones[0] || '',
      niche: n,
    } as Row;
  });
  n.top = n.rows.slice(0, 10);
  n.rest = n.rows.slice(10);
  ALL.push(n);
}
export const NICHES = ALL;
export const NOT_PUBLISHED = FAILED;

// Карточки: компания = строки рейтингов, у которых общий id точки на Яндекс Картах (кафе+караоке, стоматология+имплантация).
// Карточка есть у компании, которая хоть в одном рейтинге в топ-10.
const translit = (s: string) => norm(s).replace(/[а-я]/g, (ch) => ({ а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' } as any)[ch] ?? '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const groups: Row[][] = [];
const byId = new Map<string, Row[]>();
for (const n of ALL) for (const r of n.rows) {
  const hit = new Set<Row[]>();
  for (const p of r.points) { const g = byId.get(p.id); if (g) hit.add(g); }
  let g: Row[];
  if (!hit.size) { g = []; groups.push(g); } else {
    const [first, ...others] = [...hit];
    g = first;
    for (const o of others) { g.push(...o); groups.splice(groups.indexOf(o), 1); }
  }
  g.push(r);
  for (const x of g) for (const p of x.points) byId.set(p.id, g);
}
const used = new Set(TSVETY.map((c) => c.slug).concat(['index']));
export const CARDS: Company[] = [];
for (const g of groups) {
  if (!g.some((r) => r.place <= 10)) continue;
  const main = [...g].sort((a, b) => a.place - b.place || b.reviews - a.reviews)[0];
  let slug = translit(main.name) || 'kompaniya';
  if (used.has(slug)) slug = `${slug}-${main.niche.slug}`;
  for (let i = 2; used.has(slug); i++) slug = `${translit(main.name)}-${main.niche.slug}-${i}`;
  used.add(slug);
  const pts = new Map<string, Point>();
  for (const r of g) for (const p of r.points) pts.set(p.id, p);
  const rows = [...g].sort((a, b) => a.place - b.place);
  for (const r of rows) r.slug = slug;
  CARDS.push({ slug, name: main.name, rows, points: [...pts.values()].sort((a, b) => b.reviews - a.reviews), main });
}
export const cardBySlug = (s: string) => CARDS.find((c) => c.slug === s);

/** Сводка по рейтингу для главной, хабов, меню: и новые ниши, и цветы. */
export interface Summary { key: string; cat: string; catName: string; name: string; path: string; short: string; first: string; firstBall: number; firstSlug?: string; count: number; srez: string }
const tsvety: Summary = {
  key: 'prazdniki/dostavka-tsvetov', cat: 'prazdniki', catName: 'Праздники', name: TSVETY_NICHE.name, path: TSVETY_NICHE.path,
  short: 'Службы доставки букетов: оценки и отзывы на Яндекс Картах и в 2ГИС, свежесть отзывов, цены и часы на сайте.',
  first: TSVETY[0].name, firstBall: TSVETY[0].ball, firstSlug: TSVETY[0].slug, count: TSVETY.length, srez: TSVETY_NICHE.srezIso,
};
export const SUMMARIES: Summary[] = [
  ...ALL.map((n) => ({ key: n.key, cat: n.cat.slug, catName: n.cat.name, name: n.name, path: n.path, short: n.text.short, first: n.rows[0].name, firstBall: n.rows[0].ball, firstSlug: n.rows[0].slug, count: n.rows.length, srez: n.srezIso })),
  tsvety,
];
/** Опубликованные категории (порядок CATS) с их рейтингами. */
export const CATEGORIES = CATS.map((c) => ({ ...c, niches: SUMMARIES.filter((s) => s.cat === c.slug) })).filter((c) => c.niches.length > 0);
/** Хаб индексируется только с двух опубликованных ниш. */
export const hubIndexable = (slug: string) => (CATEGORIES.find((c) => c.slug === slug)?.niches.length || 0) >= 2;
export const nicheByKey = (key: string) => ALL.find((n) => n.key === key);
