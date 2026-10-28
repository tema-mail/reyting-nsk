// Общие настройки сайта 2. Название рабочее – ждёт решения владельца (~/Sites/reytingi/docs/sayty/resheniya-nsk.md (закрытый репо)).
export const SITE_NAME = 'Новосибирск в баллах';
export const SITE_NAME_NOTE = 'рабочее название, ждёт владельца';
/** Дата среза данных (видимая и в dateModified). Меняется только после нового съёма. */
export const SREZ = '25.10.2026';
export const SREZ_ISO = '2026-10-25';
/** Срез новых ниш (Яндекс Карты, 28.10.2026). SREZ выше – срез доставки цветов. */
export const SREZ_NEW = '28.10.2026';
export const SREZ_NEW_ISO = '2026-10-28';
/** Дата первой публикации страниц (datePublished). */
export const PUBLISHED_ISO = '2026-10-28';
/** Приёмник заявок не выбран: пусто – формы пишут «Тестовая версия». */
export const FORM_ENDPOINT = (import.meta.env.PUBLIC_FORM_ENDPOINT || '').trim();
export const NOINDEX_ALL = import.meta.env.PUBLIC_NOINDEX === '1';

// Категории и ниши – src/lib/reytingi.ts (CATEGORIES, hubIndexable): они собираются из данных.
