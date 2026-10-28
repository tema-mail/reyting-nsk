// Фразы рейтинга и карточки, собранные только из данных съёма Яндекс Карт. Ничего от себя.
import type { Niche, Row, Company } from './reytingi';
import { W } from './formula-ya.mjs';
import { int, dec, rate, date, plural } from './fmt';

export const units = (n: Niche, k: number) => `${k} ${plural(k, n.text.unit)}`;
export const otz = (k: number) => `${int(k)} ${plural(k, ['отзыв', 'отзыва', 'отзывов'])}`;
export const r1 = (x: number) => dec(Math.round(x * 100) / 100, 2).replace(/0$/, '').replace(/,$/, '');

/** Часы для таблицы: «круглосуточно», часы главной точки или «у филиалов разные». */
export function hoursCell(r: Row) {
  if (r.points.every((p) => p.h24)) return 'круглосуточно';
  const hs = [...new Set(r.points.map((p) => p.hours).filter(Boolean))];
  if (!hs.length) return 'не указаны';
  if (hs.length > 1) return r.h24 ? 'есть круглосуточный филиал' : 'у филиалов разные';
  return hs[0];
}

export function kratko(n: Niche) {
  const [a, b, c] = n.rows;
  const tail = [b && `${b.name} (${dec(b.ball)})`, c && `${c.name} (${dec(c.ball)})`].filter(Boolean).join(' и ');
  return `№1 – ${a.name}: ${dec(a.ball)} из 10, оценка ${r1(a.rating)} на Яндекс Картах, ${otz(a.reviews)}. Следом – ${tail}. Мы сравнили ${units(n, n.rows.length)} Новосибирска по оценке и числу отзывов на Яндекс Картах, их свежести и открытости карточки; за место никто не платит.`;
}

export interface Nom { t: string; who: string; d: string; slug?: string }
/** Номинации только по данным; компания, у которой нет данных для номинации, не попадает. */
export function nominations(n: Niche): Nom[] {
  const out: Nom[] = [];
  const most = [...n.rows].sort((a, b) => b.reviews - a.reviews)[0];
  out.push({ t: 'Больше всего отзывов', who: most.name, slug: most.slug, d: `${otz(most.reviews)} на Яндекс Картах${most.points.length > 1 ? `, ${most.points.length} ${plural(most.points.length, ['филиал', 'филиала', 'филиалов'])}` : ''}.` });
  const hi = n.rows.filter((r) => r.reviews >= 100).sort((a, b) => b.rating - a.rating || b.reviews - a.reviews)[0];
  if (hi && hi !== most) out.push({ t: 'Высокая оценка при 100+ отзывах', who: hi.name, slug: hi.slug, d: `${r1(hi.rating)} при ${otz(hi.reviews)}.` });
  const fresh = n.rows.filter((r) => r.last).sort((a, b) => (b.last! > a.last! ? 1 : b.last! < a.last! ? -1 : b.n12 - a.n12))[0];
  if (fresh) out.push({ t: 'Самый свежий отзыв', who: fresh.name, slug: fresh.slug, d: `последний отзыв – ${date(fresh.last!)}, за 12 месяцев – ${fresh.n12} среди загруженных.` });
  const h24 = n.rows.filter((r) => r.h24);
  if (h24.length) out.push({ t: 'Круглосуточно', who: h24.slice(0, 3).map((r) => r.name).join(', '), slug: h24.length === 1 ? h24[0].slug : undefined, d: h24.length > 3 ? `и ещё ${h24.length - 3} – по часам на Яндекс Картах.` : 'по часам на Яндекс Картах.' });
  const open = n.rows.filter((r) => r.calc.open === 1);
  if (open.length) out.push({ t: 'Самая полная карточка', who: open.slice(0, 3).map((r) => r.name).join(', '), d: `сайт, часы, подтверждение владельца и «Хорошее место» – все четыре признака${open.length > 3 ? `; всего таких ${open.length}` : ''}.` });
  return out;
}

const NAMES: Record<string, string> = { rating: 'оценка на Яндекс Картах', reviews: 'число отзывов', fresh: 'свежесть отзывов', open: 'открытость карточки' };
export function breakdown(r: Row) {
  return (['rating', 'reviews', 'fresh', 'open'] as const).map((k) => ({ key: k, name: NAMES[k], max: 10 * (W as any)[k], got: 10 * r.calc.parts[k] }));
}
export function missingOpen(r: Row) {
  return [!r.site && 'сайт не указан', !r.hours && 'часы не указаны', !r.owner && 'владелец не подтвердил карточку', !r.good && 'нет отметки «Хорошее место»'].filter(Boolean) as string[];
}
export function whyPlace(r: Row) {
  const b = breakdown(r);
  const best = [...b].sort((x, y) => y.got / y.max - x.got / x.max)[0];
  const worst = [...b].sort((x, y) => y.max - y.got - (x.max - x.got))[0];
  const lead = [...r.niche.rows].sort((a, z) => z.reviews - a.reviews)[0];
  const detail: Record<string, string> = {
    rating: `оценка ${r1(r.rating)}, самая высокая в рейтинге – ${r1(Math.max(...r.niche.rows.map((x) => x.rating)))}`,
    reviews: `${otz(r.reviews)} против ${int(lead.reviews)} у ${lead.name}`,
    fresh: r.last ? `последний отзыв – ${date(r.last)}, за 12 месяцев – ${r.n12} среди загруженных` : 'дат отзывов в срезе нет, свежесть посчитана как ноль',
    open: missingOpen(r).join('; '),
  };
  if (worst.max - worst.got < 0.05) return `Балл почти полный: по всем четырём показателям компания набирает близко к максимуму.`;
  return `Сильнее всего балл держит ${best.name}: ${dec(best.got, 1)} из ${dec(best.max, 1)}. Больше всего компания недобирает за ${worst.name} – ${dec(worst.max - worst.got, 1)} балла: ${detail[worst.key]}.`;
}

export function strengths(c: Company): string[] {
  const r = c.main, s: string[] = [];
  const byRev = [...r.niche.rows].sort((a, z) => z.reviews - a.reviews).indexOf(r) + 1;
  if (r.rating >= 4.9) s.push(`Оценка ${r1(r.rating)} на Яндекс Картах.`);
  if (byRev <= 3) s.push(`${otz(r.reviews)} – ${byRev}-е место в рейтинге «${r.niche.name}» по числу отзывов.`);
  if (r.calc.days != null && r.calc.days <= 14) s.push(`Свежие отзывы: последний – ${date(r.last!)}.`);
  if (r.n12 >= 12) s.push(`За 12 месяцев – ${r.n12} отзывов среди загруженных.`);
  if (r.good) s.push('Отметка Яндекса «Хорошее место».');
  if (r.owner) s.push('Карточку на Яндексе подтвердил владелец.');
  if (r.h24) s.push(r.points.length > 1 ? 'Есть круглосуточный филиал.' : 'Работает круглосуточно.');
  if (c.points.length > 1) s.push(`${c.points.length} ${plural(c.points.length, ['точка', 'точки', 'точек'])} в рейтинге.`);
  return s;
}
export function attention(c: Company): string[] {
  const r = c.main, a: string[] = [];
  if (!r.site) a.push('Сайт в карточке на Яндексе не указан.');
  if (!r.owner) a.push('Карточку на Яндексе владелец не подтвердил.');
  if (r.calc.noDate) a.push('Дат отзывов в срезе нет – свежесть не посчитана.');
  else if (r.calc.days > 60) a.push(`Последний отзыв – ${date(r.last!)}, больше двух месяцев до среза.`);
  if (!r.calc.noDate && r.n12 < 12) a.push(`За 12 месяцев – ${r.n12} ${plural(r.n12, ['отзыв', 'отзыва', 'отзывов'])} среди загруженных.`);
  if (r.rating < 4.5) a.push(`Оценка ${r1(r.rating)} – ниже, чем у большинства в рейтинге.`);
  return a;
}
export const rateRow = (r: Row) => `${r1(r.rating)} · ${otz(r.reviews)}`;
export { rate };
