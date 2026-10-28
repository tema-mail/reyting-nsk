// Проверка внутренних ссылок собранного сайта: каждая href/src из dist ведёт на существующий файл, якорь – на существующий id.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const BASE = (process.env.PUBLIC_BASE || '/reyting-nsk').replace(/\/$/, '');
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const pages = walk(DIST).filter((f) => f.endsWith('.html'));
const ids = new Map();
const idsOf = (file) => {
  if (!ids.has(file)) ids.set(file, new Set([...readFileSync(file, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  return ids.get(file);
};
const resolve = (p) => {
  let rel = p.startsWith(BASE + '/') ? p.slice(BASE.length) : BASE ? null : p;
  if (rel == null) return null;
  rel = decodeURI(rel.split('?')[0]);
  const f = join(DIST, rel);
  if (rel.endsWith('/')) return existsSync(join(f, 'index.html')) ? join(f, 'index.html') : null;
  if (existsSync(f) && statSync(f).isFile()) return f;
  return existsSync(join(f, 'index.html')) ? join(f, 'index.html') : null;
};
let n = 0;
const bad = [];
for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const url = m[1].replace(/&amp;/g, '&');
    if (/^(https?:|tel:|mailto:|data:)/.test(url)) continue;
    n++;
    const [path, hash] = url.split('#');
    const target = path ? resolve(path) : page;
    if (!target) { bad.push(`${page.replace(DIST, '')}: нет ${url}`); continue; }
    if (hash && target.endsWith('.html') && !idsOf(target).has(hash)) bad.push(`${page.replace(DIST, '')}: нет якоря ${url}`);
  }
}
console.log(`Страниц: ${pages.length}, внутренних ссылок: ${n}, битых: ${bad.length}`);
if (bad.length) { console.error(bad.join('\n')); process.exit(1); }
