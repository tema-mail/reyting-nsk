// Тексты карточки компании, собранные из данных среза (не из рейтинга – тексты карточки и рейтинга не повторяются).
// Только факты из json: ничего не дописываем от себя. Карточка №1 – дословно из teksty-nsk.md (раздел 4), с поправкой «почему место».
import { COMPANIES, type Company } from './niche';
import { VESA } from './formula.mjs';
import { int, rate, dec, date, plural } from './fmt';

const W = VESA['dostavka-tsvetov'];
const ACC: Record<string, string> = {
  rating: 'среднюю оценку на двух картах',
  reviews: 'число отзывов',
  fresh: 'свежесть отзывов',
  open: 'открытость (цены, сайт, часы, подтверждённая карточка)',
};
const NAMES: Record<string, string> = {
  rating: 'средняя оценка на двух картах',
  reviews: 'число отзывов',
  fresh: 'свежесть отзывов',
  open: 'открытость (цены, сайт, часы, подтверждённая карточка)',
};

/** Вклад каждого показателя в балл: [ключ, название, вес×10, вклад×10]. */
export function breakdown(c: Company) {
  return (['rating', 'reviews', 'fresh', 'open'] as const).map((k) => ({
    key: k,
    name: NAMES[k],
    max: 10 * (W as any)[k],
    got: 10 * c.calc.parts[k],
  }));
}

function missingOpen(c: Company) {
  const r = c.raw;
  const m: string[] = [];
  if (!r.цены_на_сайте) m.push('цен на сайте не нашли');
  if (!r.сайт_работает) m.push('сайт не открывается');
  if (!r.часы) m.push('часы не указаны');
  if (!r['яндекс'].владелец_подтвердил) m.push('карточку на Яндексе владелец не подтвердил');
  else if (!r.официальный_статус) m.push('подтверждённая владельцем карточка даёт половину доли статуса');
  return m;
}

/** «Почему такое место» – из вкладов формулы. */
export function whyPlace(c: Company): string {
  const b = breakdown(c);
  const best = [...b].sort((a, z) => z.got / z.max - a.got / a.max)[0];
  const worst = [...b].sort((a, z) => z.max - z.got - (a.max - a.got))[0];
  const y = c.raw['яндекс'];
  const lead = COMPANIES.reduce((m, x) => (x.calc.reviews > m.calc.reviews ? x : m), COMPANIES[0]);
  const detail: Record<string, string> = {
    rating: `средняя оценка двух карт ${dec(c.calc.rating, 2)}, самая высокая в нише – 5,00`,
    reviews: `${int(c.calc.reviews)} ${plural(c.calc.reviews, ['отзыв', 'отзыва', 'отзывов'])} на двух картах против ${int(lead.calc.reviews)} у ${lead.name}`,
    fresh: `последний отзыв на Яндексе – ${date(y.последний_отзыв)}, за год – ${y.отзывов_за_12_мес_из_загруженных} среди загруженных`,
    open: missingOpen(c).join('; '),
  };
  const lossTxt = dec(worst.max - worst.got, 1);
  return `Сильнее всего балл держит ${best.name}: ${dec(best.got, 1)} из ${dec(best.max, 1)}. Больше всего служба недобирает за ${ACC[worst.key]} – ${lossTxt} балла: ${detail[worst.key]}.`;
}

export function strengths(c: Company): string[] {
  const r = c.raw, y = r['яндекс'], g = r['2гис'];
  const s: string[] = [];
  if (y.рейтинг >= 4.95 && g.рейтинг >= 4.95) s.push(`${rate(Math.min(y.рейтинг, g.рейтинг))} на обеих картах.`);
  const byRev = [...COMPANIES].sort((a, z) => z.calc.reviews - a.calc.reviews);
  const rank = byRev.indexOf(c) + 1;
  if (rank <= 3) s.push(`${int(c.calc.reviews)} ${plural(c.calc.reviews, ['отзыв', 'отзыва', 'отзывов'])} на двух картах – ${rank}-е место в нише по числу отзывов.`);
  if (c.hours24) s.push(r.адреса.length > 1 ? `Круглосуточно работает один из магазинов: ${r.часы}.` : 'Работает круглосуточно.');
  if (c.calc.daysSince <= 14) s.push(`Свежие отзывы: последний на Яндексе – ${date(y.последний_отзыв)}.`);
  if (r.цены_на_сайте && r.цены_от.length) s.push(`Цены на сайте: ${r.цены_от.join('; ')}.`);
  if (y.хорошее_место_2026) s.push('Отметка Яндекса «Хорошее место 2026».');
  if (y.владелец_подтвердил) s.push('Карточку на Яндексе подтвердил владелец.');
  if (r.адреса.length > 1) s.push(`${r.адреса.length} магазина: ${r.адреса.join('; ')}.`);
  return s;
}

export function attention(c: Company): string[] {
  const r = c.raw, y = r['яндекс'];
  const a: string[] = [];
  if (!r.сайт_работает) a.push(`Сайт из карточки не работает: ${r.цены_примечание}.`);
  else if (!r.цены_на_сайте) a.push(`Цен на сайте в срезе не нашли: ${r.цены_примечание}. Спросите цену при заказе.`);
  if (!y.владелец_подтвердил) a.push('Карточку на Яндексе владелец не подтвердил.');
  if (c.calc.daysSince > 60) a.push(`Последний отзыв на Яндексе – ${date(y.последний_отзыв)}, больше двух месяцев до среза.`);
  const n = y.отзывов_за_12_мес_из_загруженных;
  if (n < 12) a.push(`За год на Яндексе – ${n} ${plural(n, ['отзыв', 'отзыва', 'отзывов'])} среди загруженных.`);
  if (/сопоставлен/.test(r.цены_примечание || '')) a.push('Карточку 2ГИС мы сопоставили по названию, адрес в 2ГИС не подтверждён.');
  if (!c.hours24) {
    const m = r.часы.match(/(\d\d:\d\d)$/);
    if (m) a.push(`Ночью не работает: закрывается в ${m[1]}.`);
  }
  return a;
}

/** Часы для разметки – только простое «ежедневно ЧЧ:ММ–ЧЧ:ММ» или «круглосуточно» у одного магазина. */
export function openingHours(c: Company) {
  const h = c.raw.часы;
  if (c.raw.адреса.length > 1) return undefined;
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  if (h === 'круглосуточно') return [{ '@type': 'OpeningHoursSpecification', dayOfWeek: days, opens: '00:00', closes: '23:59' }];
  const m = h.match(/^ежедневно (\d\d:\d\d)–(\d\d:\d\d)$/);
  return m ? [{ '@type': 'OpeningHoursSpecification', dayOfWeek: days, opens: m[1], closes: m[2] }] : undefined;
}

/** 3 похожие компании: ближайшие по месту в той же нише. */
export function similar(c: Company): Company[] {
  return COMPANIES.filter((x) => x !== c).sort((a, z) => Math.abs(a.place - c.place) - Math.abs(z.place - c.place) || a.place - z.place).slice(0, 3);
}
