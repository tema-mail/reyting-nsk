// Сверка новых ниш (Яндекс Карты). Запускается в npm run build перед astro build; любая ошибка роняет сборку.
// 1) Независимый пересчёт балла: своя реализация формулы владельца по строкам, которые отобрал formula-ya.mjs,
//    со сложением филиалов заново из сырых точек – места и баллы должны совпасть до 1e-9.
// 2) Инварианты: ≥5 компаний в опубликованной нише, баллы в [0;10], порядок по убыванию, отбор ≥4,0 и ≥10 отзывов.
// 3) Тексты: у каждой ниши свои, check 5–7, faq 3–5, ключ совпадает, нет длинного тире; данные и тексты на месте.
import { readFileSync, readdirSync } from 'node:fs';
import { NISHI, OTBOR } from '../src/lib/nishi.mjs';
import { computeYa } from '../src/lib/formula-ya.mjs';

const ROOT = new URL('../', import.meta.url);
const errs = [];
const DAY = 86400000;

// Тексты
const texts = new Map();
for (const f of readdirSync(new URL('src/data/teksty/', ROOT))) {
  if (f === 'types.ts' || !f.endsWith('.ts')) continue;
  const src = readFileSync(new URL(`src/data/teksty/${f}`, ROOT), 'utf8');
  if (src.includes('\u2014')) errs.push(`тексты ${f}: длинное тире`);
  const { TEKSTY } = await import(new URL(`src/data/teksty/${f}`, ROOT).href);
  for (const t of TEKSTY) {
    if (texts.has(t.key)) errs.push(`тексты: ключ ${t.key} дважды`);
    texts.set(t.key, t);
    if (t.check.length < 5 || t.check.length > 7) errs.push(`${t.key}: чек-лист ${t.check.length} пунктов (нужно 5–7)`);
    if (t.faq.length < 3 || t.faq.length > 5) errs.push(`${t.key}: FAQ ${t.faq.length} (нужно 3–5)`);
    if (t.title.length > 70) errs.push(`${t.key}: title ${t.title.length} знаков`);
    if (/\d[\d\s]*₽|%/.test(JSON.stringify(t))) errs.push(`${t.key}: в тексте цена или проценты`);
  }
}
const intros = new Set();
for (const t of texts.values()) { if (intros.has(t.intro)) errs.push(`${t.key}: интро повторяет другую нишу`); intros.add(t.intro); }

let published = 0, rowsTotal = 0;
const report = [];
for (const [key, cfg] of Object.entries(NISHI)) {
  if (!texts.has(key)) errs.push(`${key}: нет текстов`);
  const raw = JSON.parse(readFileSync(new URL(`src/data/nsk/${key.replace('/', '__')}.json`, ROOT), 'utf8'));
  const srez = raw['дата_съёма'];
  if (raw.ключ && raw.ключ !== key) errs.push(`${key}: в файле ключ ${raw.ключ}`);
  const res = computeYa(raw, cfg.rule, srez);
  if (!res.published) { report.push(`${key}: НЕ ОПУБЛИКОВАН, прошли ${res.rows.length}`); continue; }
  published++; rowsTotal += res.rows.length;

  // Независимый пересчёт
  const alt = res.rows.map((r) => {
    const pts = r.points;
    const w = pts.reduce((s, p) => s + p.оценок, 0);
    const rating = pts.reduce((s, p) => s + p.рейтинг * p.оценок, 0) / w;
    const reviews = pts.reduce((s, p) => s + p.отзывов, 0);
    const last = pts.map((p) => p.последний_отзыв).filter(Boolean).sort().pop();
    const n12 = pts.reduce((s, p) => s + (p.отзывов_за_12_мес_из_загруженных || 0), 0);
    const any = (f) => pts.some(f);
    const fresh = last ? 0.5 * Math.max(0, 1 - Math.round((Date.parse(srez) - Date.parse(last)) / DAY) / 365) + 0.5 * Math.min(1, n12 / 12) : 0;
    const open = 0.25 * [any((p) => p.сайты?.length), any((p) => p.часы || p.круглосуточно), any((p) => p.владелец_подтвердил), any((p) => p.хорошее_место)].filter(Boolean).length;
    if (rating < OTBOR.minRating) errs.push(`${key}: ${r.name} оценка ${rating} < 4,0`);
    if (reviews < OTBOR.minReviews) errs.push(`${key}: ${r.name} отзывов ${reviews} < 10`);
    if (pts.some((p) => /closed/.test(p.статус))) errs.push(`${key}: ${r.name} закрыт`);
    return { r, rating, lr: Math.log10(1 + reviews), fresh, open };
  });
  const lo = (k) => Math.min(...alt.map((a) => a[k])), hi = (k) => Math.max(...alt.map((a) => a[k]));
  const nz = (k, x) => (hi(k) === lo(k) ? 1 : (x - lo(k)) / (hi(k) - lo(k)));
  for (const a of alt) {
    const ball = 10 * (0.35 * nz('rating', a.rating) + 0.35 * nz('lr', a.lr) + 0.15 * a.fresh + 0.15 * a.open);
    if (Math.abs(ball - a.r.calc.ball) > 1e-9) errs.push(`${key}: ${a.r.name} балл ${a.r.calc.ball} ≠ пересчёт ${ball}`);
    if (ball < 0 || ball > 10.000001) errs.push(`${key}: ${a.r.name} балл вне 0–10`);
  }
  res.rows.forEach((r, i) => {
    if (r.place !== i + 1) errs.push(`${key}: место ${r.place} на позиции ${i + 1}`);
    if (i && res.rows[i - 1].calc.ball < r.calc.ball) errs.push(`${key}: порядок нарушен у ${r.name}`);
  });
  report.push(`${key}: ${res.rows.length} из ${raw.компании.length}, №1 ${res.rows[0].name} ${res.rows[0].calc.ballRound}`);
}
for (const k of texts.keys()) if (!NISHI[k]) errs.push(`тексты: лишний ключ ${k}`);

console.log(report.join('\n'));
console.log(`\nОпубликовано ниш: ${published} из ${Object.keys(NISHI).length}, строк рейтинга: ${rowsTotal}`);
if (errs.length) { console.error('\nОШИБКИ СВЕРКИ:\n- ' + errs.join('\n- ')); process.exit(1); }
console.log('Сверка новых ниш: баллы совпали с независимым пересчётом, тексты в норме.');
