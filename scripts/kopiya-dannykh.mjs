// Копия данных из закрытого репо reytingi (только чтение) в src/data: съём Яндекс Карт и цены с сайтов.
// Волны nsk, nsk2, nsk3 сливаются по ключу ниши: компании объединяются по id точки (поздняя волна побеждает).
// Запуск вручную после нового съёма: node scripts/kopiya-dannykh.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';

const SRC = `${homedir()}/Sites/reytingi/docs/dannye`;
const OUT = new URL('../src/data/', import.meta.url);
const WAVES = ['nsk', 'nsk2', 'nsk3'];

function merge(kind) {
  const acc = new Map();
  for (const w of WAVES) {
    const dir = kind === 'syroe' ? `${SRC}/syroe/${w}` : `${SRC}/ceny/${w}`;
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
      const d = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
      const prev = acc.get(f);
      if (!prev) { acc.set(f, { ...d, волны: [w] }); continue; }
      const byId = new Map(prev.компании.map((c) => [String(c.id), c]));
      for (const c of d.компании) byId.set(String(c.id), { ...(byId.get(String(c.id)) || {}), ...c });
      acc.set(f, {
        ...prev, ...d, волны: [...prev.волны, w],
        найдено_в_яндексе: { ...(prev.найдено_в_яндексе || {}), ...(d.найдено_в_яндексе || {}) },
        компании: [...byId.values()],
      });
    }
  }
  const dir = new URL(kind === 'syroe' ? 'nsk/' : 'ceny/', OUT);
  mkdirSync(dir, { recursive: true });
  for (const [f, d] of acc) writeFileSync(new URL(f, dir), JSON.stringify(d, null, 1));
  console.log(`${kind}: ${acc.size} файлов`);
}
merge('syroe');
merge('ceny');
