// Ниша «Доставка цветов»: сырые данные съёма → баллы формулы → всё, что нужно страницам. Один источник для текста и разметки.
import raw from '../data/dostavka-tsvetov.json';
import { computeNiche, losses } from './formula.mjs';
import { SLUZHBY } from '../data/sluzhby';

export const NICHE = {
  slug: 'dostavka-tsvetov',
  name: 'Доставка цветов',
  category: { slug: 'prazdniki', name: 'Праздники' },
  path: '/prazdniki/dostavka-tsvetov/',
  srezIso: raw['дата_съёма'] as string,
};

export type Raw = (typeof raw)['компании'][number];
export interface Company {
  raw: Raw;
  name: string;
  slug: string;
  place: number;
  ball: number;
  ballExact: number;
  calc: any;
  losses: Record<string, number>;
  text: (typeof SLUZHBY)[string];
  phones: string[];
  site: string;
  siteHost: string;
  yaLinks: string[];
  gisLinks: string[];
  hours24: boolean;
}

const computed = computeNiche(raw['компании'], NICHE.srezIso, NICHE.slug);

export const COMPANIES: Company[] = computed.map(({ c, calc }: any) => {
  const text = SLUZHBY[c.название];
  if (!text) throw new Error(`Нет текста и slug для «${c.название}» в src/data/sluzhby.ts`);
  return {
    raw: c,
    name: c.название,
    slug: text.slug,
    place: calc.place,
    ball: calc.ballRound,
    ballExact: calc.ball,
    calc,
    losses: losses(calc, NICHE.slug),
    text,
    phones: String(c.телефон).split(';').map((s: string) => s.trim()).filter(Boolean),
    site: c.сайт,
    siteHost: String(c.сайт).replace(/^https?:\/\//, '').replace(/\/$/, ''),
    yaLinks: c['яндекс'].карточки,
    gisLinks: c['2гис'].карточки,
    hours24: /круглосуточно/.test(c.часы),
  };
});

export const bySlug = (slug: string) => COMPANIES.find((x) => x.slug === slug);
export const byName = (name: string) => COMPANIES.find((x) => x.name === name)!;
export const TOTAL_REVIEWS = COMPANIES.reduce((s, x) => s + x.calc.reviews, 0);
export const TOTAL_SHOPS = COMPANIES.reduce((s, x) => s + x.raw.адреса.length, 0);
/** Номер для tel: из «+7 (995) 271-40-40» или «8 (800) …» */
export const tel = (p: string) => 'tel:' + p.replace(/[^\d+]/g, '').replace(/^8(?=\d{10}$)/, '+7');
