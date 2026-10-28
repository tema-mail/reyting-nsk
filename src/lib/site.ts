// Общие настройки сайта 2. Название рабочее – ждёт решения владельца (docs/resheniya.md).
export const SITE_NAME = 'Новосибирск в баллах';
export const SITE_NAME_NOTE = 'рабочее название, ждёт владельца';
/** Дата среза данных (видимая и в dateModified). Меняется только после нового съёма. */
export const SREZ = '25.10.2026';
export const SREZ_ISO = '2026-10-25';
/** Дата первой публикации страниц (datePublished). */
export const PUBLISHED_ISO = '2026-10-28';
/** Приёмник заявок не выбран: пусто – формы пишут «Тестовая версия». */
export const FORM_ENDPOINT = (import.meta.env.PUBLIC_FORM_ENDPOINT || '').trim();
export const NOINDEX_ALL = import.meta.env.PUBLIC_NOINDEX === '1';

/** Опубликованные категории и ниши. Нишу без данных сюда не добавлять – страницы и пункта меню нет. */
export const CATEGORIES = [
  {
    slug: 'prazdniki',
    name: 'Праздники',
    niches: [{ slug: 'dostavka-tsvetov', name: 'Доставка цветов', path: '/prazdniki/dostavka-tsvetov/' }],
  },
];
/** Хаб индексируется только с двух опубликованных ниш (карта сайта). */
export const hubIndexable = (slug: string) => (CATEGORIES.find((c) => c.slug === slug)?.niches.length || 0) >= 2;
