# reyting-nsk – сайт 2 «Новосибирск в баллах» (рабочее название)

Рейтинг компаний Новосибирска по открытым цифрам: Astro (статический), GitHub Pages `tema-mail.github.io/reyting-nsk` (тест, noindex).
Исходники смыслов – `~/Sites/reytingi/docs` (только читать). Решения и открытые вопросы – `~/Sites/reytingi/docs/sayty/resheniya-nsk.md (закрытый репо)` (один источник).

## Правила
- Адреса строго по карте `~/Sites/reytingi/docs/karta/karta-nsk.md`: `/<категория>/<ниша>/`, карточки `/kompanii/<slug>/`, город в адресе не пишем.
- Ниша, где отбор прошли <5 компаний, не публикуется. Список ниш и правила рубрик – `src/lib/nishi.mjs`, тексты – `src/data/teksty/<категория>.ts`.
- Баллы считаются при сборке: цветы – `src/lib/formula.mjs` (Я+2ГИС), остальные – `src/lib/formula-ya.mjs` (только Яндекс Карты). `npm run sverka` (sverka.mjs + sverka-nsk.mjs) роняет сборку при расхождении.
- AggregateRating/Review не размечать. Ссылки на компании – `rel="nofollow noopener"`, без utm.
- Не выдумывать отзывы, цифры, адреса, юр. лицо: пробел – `<Tbc text="…" />` (видимая пометка «подтвердить»).
- Только короткое тире «–», длинное запрещено (и в коммитах).
- Файлы кода ≤800 строк. Ссылок на сайт 1 (reyting-avto) нет.
- Node: `export PATH=~/.local/node/bin:$PATH`. Проверка: `npm run build && npm run check-links`.
