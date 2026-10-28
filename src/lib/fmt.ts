// Форматирование чисел и дат по-русски: запятая в дробях, неразрывный пробел в тысячах.
const NB = ' ';
export const int = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, NB);
export const dec = (n: number, d = 1) => n.toFixed(d).replace('.', ',');
/** Оценка карты: 5,0 / 4,94 – как в источнике (два знака, если они есть). */
export const rate = (n: number) => (Math.round(n * 10) === n * 10 ? dec(n, 1) : dec(n, 2));
export const date = (iso: string) => iso.split('-').reverse().join('.');
/** Склонение: plural(3, ['отзыв','отзыва','отзывов']) */
export function plural(n: number, f: [string, string, string]) {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return f[2];
  if (b > 1 && b < 5) return f[1];
  if (b === 1) return f[0];
  return f[2];
}
