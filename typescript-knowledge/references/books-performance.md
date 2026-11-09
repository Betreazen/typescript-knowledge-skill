# Книги и материалы о производительности

Раздел каталога источников. Индекс, короткий список и маршрут чтения — [books.md](books.md).

## Производительность

Здесь классика стареет быстрее всего. High Performance JavaScript (2010) и Web Performance in Action (2016) пора заменить на web.dev и Web Performance Engineering in the Age of AI (2026). Про движок лучше всего статьи разработчиков V8. Про скорость самого компилятора TS главные источники: официальная вики и серия Марвина Хагемайстера. Для кода на TS важен не сам TS, а поведение движка: типы стираются, поэтому оптимизировать надо формы объектов и аллокации, а скорость `tsc` это отдельная задача про сложность типов. Методы измерения: [performance.md](performance.md) и [benchmarking.md](benchmarking.md).

### Книги

| Книга | Автор, издатель, год | Уровень | Статус |
|---|---|---|---|
| [Web Performance Engineering in the Age of AI](https://www.oreilly.com/library/view/web-performance-engineering/9798341660182/) | Addy Osmani, O'Reilly, февраль 2026 | средний, продвинутый | Актуально. Самая новая книга, описание только по каталогу |
| [Fast by Default](https://www.manning.com/books/fast-by-default) | Den Odell, Manning, MEAP с февраля 2026, 8 из 20 глав | средний, продвинутый | Актуально, но не закончена. Печать оценочно весной 2027 |
| [High Performance Browser Networking](https://hpbn.co/) | Ilya Grigorik, O'Reilly, 2013, бесплатно онлайн | средний | Актуально для основ сети (главы 1-4, 10, 13, 14-18). HTTP заканчивается на HTTP/2, про HTTP/3 и QUIC ничего нет; дополнять [Web Almanac 2025](https://almanac.httparchive.org/en/2025/) |
| [Image Optimization](https://www.smashingmagazine.com/printed-books/image-optimization/) | Addy Osmani, Smashing, апрель 2021, 528 с. | средний | Актуально для основ, форматы сверять с web.dev |
| [Web Performance in Action](https://www.manning.com/books/web-performance-in-action) | Jeremy L. Wagner, Manning, 2016, 376 с. | средний | `[устарело]`, замена: [Learn Performance](https://web.dev/learn/performance) и книга Османи 2026 |
| [High Performance JavaScript](https://www.oreilly.com/library/view/high-performance-javascript/9781449382308/index.html) | Nicholas C. Zakas, Yahoo Press / O'Reilly, март 2010, 229 с. | средний | `[устарело]`, замена: статьи V8 ниже и Learn Performance |

### Веб-производительность онлайн

| Источник | Автор | Уровень | Зачем |
|---|---|---|---|
| [Learn Performance](https://web.dev/learn/performance) и [раздел Web performance](https://web.dev/performance) | web.dev, Google | начальный, средний | Основной курс |
| [Web Vitals](https://web.dev/articles/vitals) и [INP](https://web.dev/articles/inp) | web.dev | средний | Метрики |
| [Web performance](https://developer.mozilla.org/en-US/docs/Web/Performance) | MDN | начальный, средний | Справочник |
| [Analyze runtime performance](https://developer.chrome.com/docs/devtools/performance) | Chrome DevTools | средний | Практика профилирования |
| [CSS Wizardry](https://csswizardry.com/) и [блог DebugBear](https://www.debugbear.com/blog) | Harry Roberts; DebugBear | средний, продвинутый | Практические разборы |
| [Web Performance Calendar](https://calendar.perfplanet.com/) | сообщество, последний выпуск 2025 | продвинутый | Ежегодный сборник |

### Движки и быстрый код

| Источник | Автор | Уровень | Зачем |
|---|---|---|---|
| [JavaScript engine fundamentals: Shapes and Inline Caches](https://mathiasbynens.be/notes/shapes-ics) | Mathias Bynens, Benedikt Meurer | средний, продвинутый | Главная статья о стоимости форм объектов |
| [V8 blog](https://v8.dev/blog), [Hidden Classes](https://v8.dev/docs/hidden-classes), [Elements kinds](https://v8.dev/blog/elements-kinds) | команда V8 | продвинутый | Устройство объектов и массивов |
| [What's up with monomorphism?](https://mrale.ph/blog/2015-01-11-whats-up-with-monomorphism.html) (2015) и [Maybe you don't need Rust and WASM to speed up your JS](https://mrale.ph/blog/2018-02-03-maybe-you-dont-need-rust-to-speed-up-your-js.html) (2018) | автор блога mrale.ph | продвинутый | Актуально для метода, детали оптимизаторов сверять с V8 |
| [Is WebAssembly magic performance pixie dust?](https://surma.dev/things/js-to-asc/) | Surma | продвинутый | Когда WASM помогает |
| [Optimizing Javascript for fun and for profit](https://romgrk.com/posts/optimizing-javascript) | romgrk | средний, продвинутый | Цифры проверять своими бенчмарками |
| [Read the Tea Leaves](https://nolanlawson.com/) | Nolan Lawson | средний | Блог о производительности и браузерах |

### Экосистема и скорость компилятора TS

После TS 7 узкое место чаще смещается с `tsc` на линтеры и инструменты, которые ещё зависят от API 6.0. Это вывод из отсутствия API в 7.0, замеров по таким инструментам нет.

| Источник | Автор | Уровень | Зачем |
|---|---|---|---|
| [Speeding up the JavaScript ecosystem](https://marvinh.dev/blog/speeding-up-javascript-ecosystem/) | Marvin Hagemeister, 13 частей с ноября 2022, последняя 17 мая 2026 | средний, продвинутый | Особенно часть 2 (module resolution), [часть 7](https://marvinh.dev/blog/speeding-up-javascript-ecosystem-part-7/) (barrel-файлы), [часть 10](https://marvinh.dev/blog/speeding-up-javascript-ecosystem-part-10/) (Isolated Declarations), [часть 13](https://marvinh.dev/blog/speeding-up-javascript-ecosystem-part-13/) (oxlint и oxfmt) |
| [e18e](https://e18e.dev/) | инициатива по производительности экосистемы | средний | Актуально |
| [Performance](https://github.com/microsoft/TypeScript/wiki/Performance), [Performance Tracing](https://github.com/microsoft/TypeScript/wiki/Performance-Tracing), [typescript-analyze-trace](https://github.com/microsoft/typescript-analyze-trace) | вики TypeScript | средний, продвинутый | Написаны в расчёте на tsc до 7.0, `--generateTrace` проверять на вашей версии |
| [A 10x Faster TypeScript](https://devblogs.microsoft.com/typescript/typescript-native-port/) ([видео](https://www.youtube.com/watch?v=pNlq-EVld70)) | Anders Hejlsberg, март 2025 | средний | История и архитектура порта |
| [Why Go?](https://github.com/microsoft/typescript-go/discussions/411) | обсуждение в репозитории порта | средний | Почему выбран Go |
| [TypeScript's Migration to Modules](https://devblogs.microsoft.com/typescript/typescripts-migration-to-modules/) | команда TS | продвинутый | Разбор большой миграции |

Не вошло: JavaScript Performance Tuning (Amara Hawthorn, 2025) — только карточка без отзывов, признаки низкого качества ([Goodreads](https://www.goodreads.com/book/show/235628310-javascript-performance-tuning)). Книга «Performant Web» не найдена. Свежей книги именно о производительности JS-движков нет, знания о них рассеяны по статьям.
