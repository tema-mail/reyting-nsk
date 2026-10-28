// Формула новых ниш (одна для сайтов 1 и 2, задана владельцем 28.10.2026). Источник – только Яндекс Карты.
// балл = 10 × (0,35·норм.оценка + 0,35·норм.log10(1 + отзывы) + 0,15·свежесть + 0,15·открытость)
//   норм. – min-max внутри опубликованного списка ниши (лучший = 1, худший = 0);
//   свежесть = 0,5·max(0; 1 − дней с последнего отзыва/365) + 0,5·min(1; отзывов за 12 мес./12); нет даты – 0 и пометка;
//   открытость = 0,25·сайт + 0,25·часы + 0,25·владелец подтвердил + 0,25·«Хорошее место».
// Отбор: правило рубрик ниши (nishi.mjs), статус не «закрыто», оценка ≥ 4,0, отзывов ≥ 10. Сеть (одно название) = одна строка,
// все показатели – главной точки сети (больше всего оценок), остальные филиалы только перечисляются.
import { OTBOR, ALIASES } from './nishi.mjs';

export const W = { rating: 0.35, reviews: 0.35, fresh: 0.15, open: 0.15 };
export const CENTER = [82.9204, 55.0302]; // площадь Ленина
const DAY = 86400000;

export const norm = (s) => String(s).toLowerCase().replace(/ё/g, 'е').replace(/[«»"'.,!?()&]/g, ' ').replace(/\s+/g, ' ').trim();
export const kmFromCenter = ([lon, lat]) => Math.hypot((lon - CENTER[0]) * 111.32 * Math.cos((lat * Math.PI) / 180), (lat - CENTER[1]) * 110.57);

/** Проходит ли точка (филиал) правило ниши. Возвращает null или причину отсева. */
export function rejectPoint(p, rule) {
  if (/closed/.test(p.статус || '')) return 'закрыто';
  const rub = (p.рубрики || []).map(norm);
  const need = rule.need.map(norm);
  const alt = rule.alsoFirst && rule.alsoFirst.first.map(norm).includes(rub[0]) && rule.alsoFirst.has.map(norm).some((h) => rub.includes(h));
  const ok = alt || (rule.where === 'first' ? need.includes(rub[0]) : rub.some((r) => need.includes(r)));
  if (!ok) return 'рубрика';
  if ((rule.ban || []).map(norm).some((b) => rub.includes(b))) return 'рубрика-исключение';
  if (rule.banName && new RegExp(rule.banName, 'i').test(norm(p.название))) return 'название';
  if (rule.maxKm && kmFromCenter(p.координаты) > rule.maxKm) return 'далеко';
  if (!p.рейтинг) return 'нет оценки';
  return null;
}

/** Главная точка сети: больше всего оценок, при равенстве – больше отзывов, затем меньший id. */
export const mainPoint = (points) => [...points].sort((a, b) => (b.оценок || 0) - (a.оценок || 0) || (b.отзывов || 0) - (a.отзывов || 0) || String(a.id).localeCompare(String(b.id)))[0];

/** Сеть (одинаковое название) = одна строка; баллы – по главной точке (решение владельца 28.10.2026), остальные филиалы – списком. */
export function mergeChain(points) {
  const main = mainPoint(points);
  return {
    name: main.название.trim(),
    main,
    points: [main, ...points.filter((p) => p !== main)],
    rating: main.рейтинг,
    ratings: main.оценок || 0,
    reviews: main.отзывов || 0,
    last: main.последний_отзыв || null,
    n12: main.отзывов_за_12_мес_из_загруженных || 0,
    site: (main.сайты || []).length > 0,
    hours: !!main.часы || !!main.круглосуточно,
    owner: !!main.владелец_подтвердил,
    good: !!main.хорошее_место,
    h24: !!main.круглосуточно,
  };
}

export function freshness(row, srezIso) {
  if (!row.last) return { days: null, value: 0, noDate: true };
  const days = Math.round((Date.parse(srezIso) - Date.parse(row.last)) / DAY);
  return { days, value: 0.5 * Math.max(0, 1 - days / 365) + 0.5 * Math.min(1, row.n12 / 12), noDate: false };
}
export const openness = (r) => 0.25 * ((r.site ? 1 : 0) + (r.hours ? 1 : 0) + (r.owner ? 1 : 0) + (r.good ? 1 : 0));

/**
 * Полный расчёт ниши из сырого файла съёма.
 * @returns { rows: строки по местам с calc, dropped: [{name, why}], published: boolean }
 */
export function computeYa(raw, rule, srezIso) {
  const dropped = [];
  const groups = new Map();
  for (const p of raw.компании) {
    const why = rejectPoint(p, rule);
    if (why) { dropped.push({ name: p.название, adr: p.адрес, why }); continue; }
    const k0 = norm(p.название);
    const k = ALIASES[k0] || k0;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(p);
  }
  const rows = [];
  for (const pts of groups.values()) {
    const r = mergeChain(pts);
    if (r.rating < OTBOR.minRating) { dropped.push({ name: r.name, why: 'оценка ниже 4,0' }); continue; }
    if (r.reviews < OTBOR.minReviews) { dropped.push({ name: r.name, why: 'меньше 10 отзывов' }); continue; }
    rows.push(r);
  }
  if (!rows.length) return { rows, dropped, published: false };
  const logs = rows.map((r) => Math.log10(1 + r.reviews));
  const mm = (xs) => { const lo = Math.min(...xs), hi = Math.max(...xs); return (x) => (hi === lo ? 1 : (x - lo) / (hi - lo)); };
  const nr = mm(rows.map((r) => r.rating));
  const nl = mm(logs);
  for (const r of rows) {
    const f = freshness(r, srezIso);
    const normRating = nr(r.rating);
    const normReviews = nl(Math.log10(1 + r.reviews));
    const open = openness(r);
    const parts = { rating: W.rating * normRating, reviews: W.reviews * normReviews, fresh: W.fresh * f.value, open: W.open * open };
    const ball = 10 * (parts.rating + parts.reviews + parts.fresh + parts.open);
    r.calc = { normRating, normReviews, fresh: f.value, days: f.days, noDate: f.noDate, open, parts, ball, ballRound: Math.round(ball * 10) / 10 };
  }
  rows.sort((a, b) => b.calc.ball - a.calc.ball || b.reviews - a.reviews || a.name.localeCompare(b.name, 'ru'));
  rows.forEach((r, i) => { r.place = i + 1; });
  return { rows, dropped, published: rows.length >= OTBOR.minPublish };
}
