# Новосибирск в баллах (рабочее название)

Сайт 2 из проекта рейтингов: рейтинг компаний Новосибирска по открытым цифрам Яндекс Карт и 2ГИС.
Первая ниша – доставка цветов (12 служб, срез 25.10.2026).

- Тестовый показ: https://tema-mail.github.io/reyting-nsk/ (весь сайт noindex + robots Disallow)
- Стек: Astro 7, статическая сборка, без островов (формы – обычный скрипт).
- Карта сайта, тексты, SEO-задание: `~/Sites/reytingi/docs` (karta-nsk.md, teksty-nsk.md, zadanie-shablony.md).
- Решения и открытые вопросы: `docs/resheniya.md`.

## Как устроено
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
