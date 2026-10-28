// Сверка: баллы, посчитанные модулем формулы из сырых полей, против
// 1) балл_v2 / место_v2 в json съёма и 2) чисел в текстах сайта (reytingi/docs/marketing/teksty-nsk.md, таблица рейтинга).
// Любое расхождение роняет сборку (npm run build вызывает этот скрипт первым).
import { readFileSync } from 'node:fs';
import { computeNiche } from '../src/lib/formula.mjs';

const data = JSON.parse(readFileSync(new URL('../src/data/dostavka-tsvetov.json', import.meta.url), 'utf8'));
const res = computeNiche(data['компании'], data['дата_съёма'], 'dostavka-tsvetov');

// Таблица «Рейтинг доставки цветов в Новосибирске: таблица баллов» из teksty-nsk.md (25.10.2026), дословно.
const TEKSTY = [
  [1, 'Оверсайз Букет', 9.7], [2, 'Русский Букет', 7.4], [3, 'Flowersgift', 7.2], [4, 'La Rose', 7.0],
  [5, 'Art Flower', 6.6], [6, 'Amour', 6.4], [7, 'Ваши Цветы', 6.3], [8, 'Moulen Rose', 5.9],
  [9, 'Сфинкс', 5.7], [10, 'Astraflo', 5.6], [11, 'Elite Rose', 3.5], [12, 'Бизнес Букет', 0.9],
];
// Сводные числа из текстов главной, хаба и рейтинга.
const TEKSTY_SUM = { sluzhb: 12, magazinov: 15, otzyvov: 16919, kruglosutochno: 4, oversayz: 3982, russkiy: 3563 };

const errs = [];
const rows = [];
for (const { c, calc } of res) {
  const t = TEKSTY.find((x) => x[1] === c.название);
  rows.push([calc.place, c.название, calc.ball.toFixed(3), calc.ballRound, c.балл_v2, c.место_v2, t ? t[2] : '–']);
  if (!t) errs.push(`${c.название}: нет в текстах`);
  else {
    if (t[0] !== calc.place) errs.push(`${c.название}: место ${calc.place}, в текстах ${t[0]}`);
    if (t[2] !== calc.ballRound) errs.push(`${c.название}: балл ${calc.ballRound}, в текстах ${t[2]}`);
  }
  if (c.балл_v2 !== calc.ballRound) errs.push(`${c.название}: балл ${calc.ballRound}, в json балл_v2 ${c.балл_v2}`);
  if (c.место_v2 !== calc.place) errs.push(`${c.название}: место ${calc.place}, в json место_v2 ${c.место_v2}`);
  const r = c.расчёт;
  if (Math.abs(r.freshness - calc.fresh) > 0.001) errs.push(`${c.название}: свежесть ${calc.fresh.toFixed(3)} ≠ ${r.freshness}`);
  if (Math.abs(r.transparency - calc.open) > 0.001) errs.push(`${c.название}: открытость ${calc.open} ≠ ${r.transparency}`);
  if (Math.abs(r.rating_combined - calc.rating) > 0.0006) errs.push(`${c.название}: оценка ${calc.rating.toFixed(3)} ≠ ${r.rating_combined}`);
  if (r.reviews_total !== calc.reviews) errs.push(`${c.название}: отзывов ${calc.reviews} ≠ ${r.reviews_total}`);
}
const sum = {
  sluzhb: res.length,
  magazinov: res.reduce((s, x) => s + x.c.адреса.length, 0),
  otzyvov: res.reduce((s, x) => s + x.calc.reviews, 0),
  kruglosutochno: res.filter((x) => /круглосуточно/.test(x.c.часы)).length,
  oversayz: res.find((x) => x.c.название === 'Оверсайз Букет').calc.reviews,
  russkiy: res.find((x) => x.c.название === 'Русский Букет').calc.reviews,
};
for (const k of Object.keys(TEKSTY_SUM)) if (sum[k] !== TEKSTY_SUM[k]) errs.push(`${k}: посчитано ${sum[k]}, в текстах ${TEKSTY_SUM[k]}`);

console.log('Место | Компания | балл точно | балл | json балл_v2 | json место_v2 | тексты');
rows.forEach((r) => console.log(r.join(' | ')));
console.log('Сводка:', JSON.stringify(sum));
if (errs.length) { console.error('\nРАСХОЖДЕНИЯ:\n- ' + errs.join('\n- ')); process.exit(1); }
console.log('\nСверка: 12 из 12 совпадают с json и текстами, сводные числа совпадают.');
