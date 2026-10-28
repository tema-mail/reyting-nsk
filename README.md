# Новосибирск в баллах (рабочее название)

Сайт 2 из проекта рейтингов: рейтинг компаний Новосибирска по открытым цифрам Яндекс Карт.
50 рейтингов в 11 категориях: 49 ниш по Яндекс Картам (срез 28.10.2026) и доставка цветов по Яндекс Картам и 2ГИС (12 служб, срез 25.10.2026). Авто на этом сайте нет.

- Тестовый показ: https://tema-mail.github.io/reyting-nsk/ (весь сайт noindex + robots Disallow)
- Стек: Astro 7, статическая сборка, без островов (формы – обычный скрипт).
- Карта сайта, тексты, SEO-задание: `~/Sites/reytingi/docs` (karta-nsk.md, teksty-nsk.md, zadanie-shablony.md).
- Решения и открытые вопросы: `~/Sites/reytingi/docs/sayty/resheniya-nsk.md (закрытый репо)`.

## Как устроено
Новые ниши:
- `src/data/nsk/<категория>__<ниша>.json` – сырой съём Яндекс Карт 28.10.2026 (копия `~/Sites/reytingi/docs/dannye/syroe/nsk`).
- `src/lib/nishi.mjs` – 11 категорий, 49 ниш и правило рубрик каждой ниши; `src/lib/formula-ya.mjs` – отбор, склейка сетей, формула владельца.
- `src/lib/reytingi.ts` – собирает все рейтинги, карточки (компания из нескольких ниш – одна карточка по общему id точки), сводки для главной и хабов.
- `src/data/teksty/<категория>.ts` – тексты ниш (интро, чек-лист, FAQ, H1, title).
- `src/data/rayony.json` + `src/lib/rayon.mjs` – границы 10 районов из OpenStreetMap (Nominatim, 28.10.2026) и точка в полигоне для фильтра.
- Страницы: `src/pages/[cat]/[niche].astro` (рейтинг), `src/pages/[cat]/index.astro` (хаб), `src/components/KartochkaYa.astro` (карточка).
- `scripts/sverka-nsk.mjs` – независимый пересчёт баллов и проверка текстов, вторым шагом в `npm run build`.

Доставка цветов:
- `src/data/dostavka-tsvetov.json` – съём 25.10.2026 как есть.
- `src/lib/formula.mjs` – формула v2, считает баллы при сборке из сырых полей.
- `scripts/sverka.mjs` – сверка баллов с json и текстами; запускается первой в `npm run build`, при расхождении сборка падает.
- `src/data/sluzhby.ts` – редакционные тексты служб и slug карточек.
- `scripts/check-links.mjs` – все внутренние ссылки и якоря в `dist` ведут на существующие страницы.

## Команды
```
export PATH=~/.local/node/bin:$PATH
npm i
npm run dev
PUBLIC_BASE=/reyting-nsk PUBLIC_NOINDEX=1 npm run build && npm run check-links
```

## Переменные
| Переменная | Что |
|---|---|
| `PUBLIC_BASE` | подпапка (`/reyting-nsk` на Pages, пусто на своём домене) |
| `PUBLIC_SITE_URL` | адрес сайта для canonical и sitemap |
| `PUBLIC_NOINDEX` | `1` – весь сайт закрыт от поиска |
| `PUBLIC_FORM_ENDPOINT` | куда POST-ом уходят заявки (JSON); пусто – формы пишут «Тестовая версия» |

Выкладка – `.github/workflows/pages.yml` при пуше в `main`.
