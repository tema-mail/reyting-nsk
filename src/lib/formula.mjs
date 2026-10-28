// Формула балла v2 (docs/dannye/dostavka-cvetov-itog.json → «формула_v2»). Публичная, одна для всех компаний ниши.
// балл = 10 × (w_r·оценка + w_o·отзывы + w_s·свежесть + w_p·открытость + w_n·признак ниши)
// Чистый JS без зависимостей: импортируют и страницы Astro, и scripts/sverka.mjs.

/** Веса по нишам. Сумма = 1. Признак ниши (profile) для цветов не применяется. */
export const VESA = {
  'dostavka-tsvetov': { rating: 0.35, reviews: 0.35, fresh: 0.15, open: 0.15, profile: 0 },
};

const DAY = 86400000;
const days = (fromIso, toIso) => Math.round((Date.parse(toIso) - Date.parse(fromIso)) / DAY);

/** Средняя оценка двух карт по филиалам: вес Яндекса – число оценок, вес 2ГИС – число отзывов. */
export function kombiRating(c) {
  const ya = c['яндекс']?.['филиалы']?.length ? c['яндекс']['филиалы'].map((f) => [f.r, f.rc]) : [[c['яндекс'].рейтинг, c['яндекс'].оценок]];
  const gi = c['2гис']?.['филиалы']?.length ? c['2гис']['филиалы'].map((f) => [f.r, f.n]) : [[c['2гис'].рейтинг, c['2гис'].отзывов]];
  const all = [...ya, ...gi].filter(([r, n]) => r != null && n);
  const w = all.reduce((s, [, n]) => s + n, 0);
  return w ? all.reduce((s, [r, n]) => s + r * n, 0) / w : 0;
}

/** Отзывы с текстом на Яндексе + отзывы в 2ГИС (сеть – сумма филиалов). */
export const reviewsTotal = (c) => (c['яндекс'].текстовых_отзывов || 0) + (c['2гис'].отзывов || 0);

/** Свежесть: половина – дни с последнего отзыва на Яндексе (365 и больше – 0), половина – отзывов за 12 мес. (12 – максимум). */
export function freshness(c, srezIso) {
  const y = c['яндекс'];
  const d = y.последний_отзыв ? days(y.последний_отзыв, srezIso) : 365;
  return { daysSince: d, value: 0.5 * Math.max(0, 1 - d / 365) + 0.5 * Math.min(1, (y.отзывов_за_12_мес_из_загруженных || 0) / 12) };
}

/** Статус: официальный (дилер, фирменный центр) – 1; только «владелец подтвердил» – 0,5; иначе 0. */
export const statusScore = (c) => (c.официальный_статус ? 1 : c['яндекс'].владелец_подтвердил ? 0.5 : 0);

/** Открытость: четыре равные доли – цены на сайте, сайт работает, часы указаны, статус. */
export const openness = (c) => 0.25 * ((c.цены_на_сайте ? 1 : 0) + (c.сайт_работает ? 1 : 0) + (c.часы ? 1 : 0) + statusScore(c));

const minmax = (xs) => {
  const lo = Math.min(...xs), hi = Math.max(...xs);
  return (x) => (hi === lo ? 1 : (x - lo) / (hi - lo));
};

/**
 * Считает баллы и места ниши. Нормировка min-max внутри ниши: лучший = 1, худший = 0.
 * @returns массив { c, calc } по убыванию балла, calc.place – место.
 */
export function computeNiche(companies, srezIso, nicheSlug) {
  const w = VESA[nicheSlug];
  if (!w) throw new Error(`Нет весов для ниши ${nicheSlug}`);
  const base = companies.map((c) => {
    const rating = kombiRating(c);
    const reviews = reviewsTotal(c);
    const f = freshness(c, srezIso);
    return { c, rating, reviews, logReviews: Math.log10(1 + reviews), daysSince: f.daysSince, fresh: f.value, status: statusScore(c), open: openness(c), profile: c.профиль_ниши || 0 };
  });
  const nr = minmax(base.map((b) => b.rating));
  const nl = minmax(base.map((b) => b.logReviews));
  const out = base.map((b) => {
    const normRating = nr(b.rating);
    const normReviews = nl(b.logReviews);
    const parts = {
      rating: w.rating * normRating,
      reviews: w.reviews * normReviews,
      fresh: w.fresh * b.fresh,
      open: w.open * b.open,
      profile: w.profile * b.profile,
    };
    const ball = 10 * Object.values(parts).reduce((s, x) => s + x, 0);
    return { c: b.c, calc: { ...b, c: undefined, normRating, normReviews, parts, ball, ballRound: Math.round(ball * 10) / 10 } };
  });
  out.sort((a, b) => b.calc.ball - a.calc.ball);
  out.forEach((x, i) => { x.calc.place = i + 1; });
  return out;
}

/** Сколько балла компания недобрала по каждому показателю (вес − вклад), ×10. Для «почему такое место». */
export function losses(calc, nicheSlug) {
  const w = VESA[nicheSlug];
  return {
    rating: 10 * (w.rating - calc.parts.rating),
    reviews: 10 * (w.reviews - calc.parts.reviews),
    fresh: 10 * (w.fresh - calc.parts.fresh),
    open: 10 * (w.open - calc.parts.open),
  };
}
