// Цены «от» с сайтов компаний (съём 28.10.2026, reytingi/docs/dannye/ceny). В формулу балла НЕ входят – только показ.
// Услуга – «от N ₽»; товар (изделие) показываем только в нишах товаров (goods в nishi.mjs) с подписью «цена изделия».
const RAW = import.meta.glob('../data/ceny/*.json', { eager: true, import: 'default' }) as Record<string, any>;
const BY_KEY = new Map<string, { srez: string; byId: Map<string, any> }>();
for (const d of Object.values(RAW)) BY_KEY.set(d.ключ, { srez: d['дата_съёма'], byId: new Map(d.компании.map((c: any) => [String(c.id), c])) });

export interface PriceItem { name: string; rub: number; goods: boolean; url: string }
export interface Prices { items: PriceItem[]; min: number; minGoods: boolean; url: string; srez: string }

/** Цены компании в нише: по главной точке, если там пусто – по любому филиалу. */
export function pricesFor(cfg: any, key: string, ids: string[]): Prices | null {
  const src = BY_KEY.get(key);
  if (!src) return null;
  const re = cfg.priceRe ? new RegExp(cfg.priceRe, 'i') : null;
  const ban = cfg.priceBan ? new RegExp(cfg.priceBan, 'i') : null;
  for (const id of ids) {
    const c = src.byId.get(id);
    if (!c || !c.цены?.length) continue;
    const seen = new Set<string>();
    const items: PriceItem[] = c.цены
      .filter((x: any) => typeof x.от_руб === 'number' && x.от_руб > 0 && (x.вид === 'услуга' || (x.вид === 'товар' && cfg.goods)))
      .filter((x: any) => (!re || re.test(x.услуга)) && (!ban || !ban.test(x.услуга)))
      .map((x: any) => ({ name: String(x.услуга).replace(/\s+/g, ' ').trim(), rub: x.от_руб, goods: x.вид === 'товар', url: x.url }))
      .filter((x: PriceItem) => (seen.has(x.name.toLowerCase()) ? false : (seen.add(x.name.toLowerCase()), true)))
      .sort((a: PriceItem, b: PriceItem) => a.rub - b.rub);
    if (!items.length) continue;
    return { items: items.slice(0, 6), min: items[0].rub, minGoods: items[0].goods, url: items[0].url, srez: src.srez };
  }
  return null;
}
export const rub = (n: number) => `${Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ')} ₽`;
