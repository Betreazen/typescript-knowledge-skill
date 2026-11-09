# Производительность TypeScript и JavaScript в движках и браузерах

Справочник по ускорению исполняемого кода на TypeScript и JavaScript в движках V8, JavaScriptCore и SpiderMonkey и в браузерах: сайты с контентом, веб-приложения, игры и визуализации, инструменты и библиотеки. Главная точка входа на этапе «поиск решений в базе знаний»: по симптому из профиля или ревью таблица `Симптом → техника → источник` ведёт к приёму, ожидаемому выигрышу, случаям, когда приём не поможет, и источнику. Остальные разделы объясняют механизм и ловушки. Состояние на ноябрь 2026. Методика замеров (прогрев, повторные прогоны, статистика, профилировщики) описана в [benchmarking.md](benchmarking.md) и здесь не повторяется; скорость проверки типов и сборки — в [toolchain.md](toolchain.md) и [types-patterns.md](types-patterns.md); порядок работы в цикле оптимизации — в [pipeline.md](pipeline.md). Специфика сервера на Node (флаги V8, `--trace-gc`, HTTP, потоки) — в skill node-knowledge, файл `references/performance.md`.

Метки: `[устарело]` указывает замену; `[не проверено]` означает, что утверждение держится на одном вторичном источнике или на странице, которую не удалось прочитать целиком. «Нет числа» значит, что источник говорит качественно. Числа привязаны к версии и году измерения и показывают порядок величины.

- [Симптом → техника → источник](#симптом--техника--источник)
- [Движки JS](#движки-js)
- [Что стоит слой TypeScript](#что-стоит-слой-typescript)
- [Данные и алгоритмы](#данные-и-алгоритмы)
- [Память и GC](#память-и-gc)
- [Воркеры и Wasm](#воркеры-и-wasm)
- [Браузер и Core Web Vitals](#браузер-и-core-web-vitals)
- [Доставка JavaScript](#доставка-javascript)
- [Мифы об оптимизации](#мифы-об-оптимизации)
- [Спорные места и пробелы](#спорные-места-и-пробелы)

---

## Симптом → техника → источник

Вывод: сначала профиль, потом правка.
Самый надёжный выигрыш дают смена асимптотики, уменьшение числа аллокаций и уменьшение объёма JS; микроправки (кэш длины, `for...of` против индекса, порядок полей без полиморфного места вызова) в большинстве случаев лежат в пределах шума.
Ниже таблица для быстрого поиска; подробности, версии и ловушки — в разделе из последней колонки.

| Симптом | Техника | Ожидаемый выигрыш и доказательство | Когда не поможет | Источник | Раздел |
|---|---|---|---|---|---|
| Горячая функция получает объекты с разным порядком полей | Инициализировать поля в одном месте и одном порядке: `{x,y}` и `{y,x}` имеют разные формы | Нет числа. При совпадении формы чтение идёт по смещению | Холодный код; объекты-словари | [Meurer, Bynens, 2018](https://mathiasbynens.be/notes/shapes-ics) | [Движки](#движки-js) |
| Одно место вызова видит много форм, в профиле generic-операции | Разделить обработчики по типам, специализировать функцию под форму | Клонирование сортировки под компаратор: около 25 % в V8 (4268 → 3177 мс, 2018) | Место вызова уже мономорфно; предел полиморфизма 4 указан для V8 2015 г. | [Egorov, 2018](https://mrale.ph/blog/2018/02/03/maybe-you-dont-need-rust-to-speed-up-your-js.html); [Egorov, 2015](https://mrale.ph/blog/2015/01/11/whats-up-with-monomorphism.html) | [Движки](#движки-js) |
| Объект с частыми добавлениями и `delete` | `Map` для динамических ключей; у записей фиксированной формы не удалять поля | Нет числа. Словарный режим не работает с inline-кэшами | Объект и так служит словарём | [Bruni, 2017](https://v8.dev/blog/fast-properties) | [Движки](#движки-js) |
| Числовой массив медленнее ожидаемого | Плотный массив одного вида: без дыр, без `-0`, `NaN`, `Infinity` в целочисленных; литерал или `push` вместо `new Array(n)` | Нет числа. Переходы видов только к более общему | Короткие массивы, холодный код | [Bynens, 2017](https://v8.dev/blog/elements-kinds) | [Движки](#движки-js) |
| Долгий parse/compile при старте | Explicit Compile Hints: `//# allFunctionsCalledOnLoad` в начале файла, Chrome 136+ | 17 из 20 популярных страниц лучше; в среднем минус 630 мс parse+compile на главном потоке | Только V8; избыточная компиляция тратит время и память | [Hölttä, 2025](https://v8.dev/blog/explicit-compile-hints) | [Движки](#движки-js) |
| Повторные визиты снова компилируют JS | Стабильные URL, детерминированное исполнение, скрипты ≥1 КиБ, не инлайнить | Код-кэш работает без правок кода при повторе в течение 72 часов | Частые деплои, инлайн-скрипты | [Swirski, 2019/2020](https://v8.dev/blog/code-caching-for-devs) | [Доставка](#доставка-javascript) |
| В бандле IIFE от `enum` | `as const` или union; `const enum` только внутри проекта | Около 300 байт на простой enum `[не проверено]` | Нужен обратный поиск по значению | [Handbook: Enums](https://www.typescriptlang.org/docs/handbook/enums.html); [no-const-enums](https://microsoft.github.io/cloudpack/repo-guidance/no-const-enums) | [TS](#что-стоит-слой-typescript) |
| После `isolatedModules` импорт `const enum` падает в рантайме | Не публиковать ambient `const enum`; в библиотеках `preserveConstEnums` | Инлайн внутри проекта безопасен | Транспиляторы по одному файлу не видят, что это const enum | [Handbook: Enums](https://www.typescriptlang.org/docs/handbook/enums.html); [esbuild](https://esbuild.github.io/content-types/) | [TS](#что-стоит-слой-typescript) |
| Поля классов компилируются в `Object.defineProperty` | `target` ES2022+ или явный `useDefineForClassFields` | Нет числа; в V8 до v9.7 инициализация полей была намного медленнее присваивания | Меняется семантика: поле затеняет аксессор базового класса | [useDefineForClassFields](https://www.typescriptlang.org/tsconfig/useDefineForClassFields.html); [Cheung, 2022](https://v8.dev/blog/faster-class-features) | [TS](#что-стоит-слой-typescript) |
| `async` компилируется в стейт-машину | `target` ES2017+ | Нативный `await` занимает один микротакт вместо минимум трёх до V8 v7.2; `Promise.all` до 8× (2018) | Мало `await` в горячем пути | [Armyanova, Meurer, 2018](https://v8.dev/blog/fast-async); [Schulz](https://mariusschulz.com/blog/compiling-async-await-to-es3-es5-in-typescript) | [TS](#что-стоит-слой-typescript) |
| Раздутый бандл от полифилов и транспиляции | Современный синтаксис, сверка browserslist | `[1,2,3].at(-1)`: 31 байт против 11 217 после Babel и 71 зависимости core-js | Сайт уже на современных целях | [Walton, 2024](https://philipwalton.com/articles/the-state-of-es5-on-the-web/) | [TS](#что-стоит-слой-typescript) |
| Импорт только типов тянет модуль | `import type`, не `import { type X }` при `verbatimModuleSyntax` | Зависит от модуля | Побочные эффекты модуля нужны | [verbatimModuleSyntax](https://www.typescriptlang.org/tsconfig/verbatimModuleSyntax.html) | [TS](#что-стоит-слой-typescript) |
| Dev-сервер и тесты медленны из-за графа модулей | Убрать barrel-файлы в каждой папке | Пустой граф: 1000 модулей 0,31 с, 10 000 — 3,12 с, 50 000 — 48,44 с; задачи быстрее на 60–80 % (оценка автора) | Несколько barrel-файлов не мешают; прод-бандл зависит от конфигурации | [Hagemeister, 2023](https://marvinh.dev/blog/speeding-up-javascript-ecosystem-part-7/) | [TS](#что-стоит-слой-typescript) |
| Tree-shaking оставляет целые модули | ESM без конвертации в CommonJS, точный `sideEffects`, `/*#__PURE__*/`, `/*#__NO_SIDE_EFFECTS__*/` | Пример web.dev: `main` 20,8 → 8,46 KiB | Dev-режим; неверный `sideEffects` у зависимости | [webpack](https://webpack.js.org/guides/tree-shaking/); [Wagner](https://web.dev/articles/reduce-javascript-payloads-with-tree-shaking) | [TS](#что-стоит-слой-typescript) |
| В конфигурации `target: es5` или `downlevelIteration` | Поднять `target`; для ES5 внешний инструмент | В TS 7.0 опции не поддерживаются `[устарело]` | Нужен ES5 по требованию платформы: esbuild или SWC | [TS 6.0 notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html); [TS 7.0, 2026](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) | [TS](#что-стоит-слой-typescript) |
| `reduce` со spread аккумулятора | Локальная мутация или `for...of` | Spread медленнее в 20, 40, 80 раз по мере роста входа (Θ(n²)) | Несколько элементов | [Snapp, 2019](https://www.richsnapp.com/article/2019/06-09-reduce-spread-anti-pattern) | [Данные](#данные-и-алгоритмы) |
| Сортировка всего ради топ-N | Куча на k элементов или отсечение по порогу и сортировка только кандидатов | Куча: O(n log k) вместо O(n log n). Отсечение: −11…−29 % `[проверено локально]` | k близко к n, маленькие входы | [Partial sorting](https://en.wikipedia.org/wiki/Partial_sorting); [mnemonist Heap](https://yomguithereal.github.io/mnemonist/heap) | [Сортировка и regex](#регулярные-выражения-и-сортировка) |
| `localeCompare` в компараторе большой сортировки | Один `Intl.Collator` на модуль | Рекомендация MDN. Локально −8,6 %, вердикт `same`; после отсечения +0,6 % `[проверено локально]` | Сравнений строк уже мало | [MDN localeCompare](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare) | [Сортировка и regex](#регулярные-выражения-и-сортировка) |
| Regex с `\p{…}` доминирует в профиле токенизации | Сканер кодовых точек с таблицей классов BMP | −52…−62 % на текстах 0,3–65 КБ `[проверено локально]` | Редкий вызов: цена 64 КиБ памяти и код, требующий фазза на суррогатах | Локальный замер, публикаций не найдено | [Сортировка и regex](#регулярные-выражения-и-сортировка) |
| Поиск в массиве внутри цикла | `Set` или `Map` | Реальный случай не найден; сравнения MeasureThat за `Set` на больших наборах `[не проверено]` | Совсем малые массивы | [romgrk, 2024](https://romgrk.com/posts/optimizing-javascript) | [Данные](#данные-и-алгоритмы) |
| Динамические строковые ключи | `Map` | Вставка около 2× быстрее при <100 000 записей, около 30 % при 5 млн; память на 20–50 % меньше | Малые целые ключи 0–1000: объект быстрее на 65 % | [Zhenghao He, 2022](https://www.zhenghao.io/posts/object-vs-map) | [Данные](#данные-и-алгоритмы) |
| GC и память от миллионов мелких объектов | Записи фиксированного размера в `Int32Array` | Вклад в общее 4× ускорение source-map (V8 4810 → 1143,5 мс) вместе с алгоритмами | Строки, DOM, малые объёмы | [Egorov, 2018](https://mrale.ph/blog/2018/02/03/maybe-you-dont-need-rust-to-speed-up-your-js.html) | [Данные](#данные-и-алгоритмы) |
| `for...of` на больших массивах | Не менять без профиля | После прогрева разницы нет; на коротком прогоне индексный цикл быстрее | SpiderMonkey на baseline медленнее `[не проверено]` | [Suren, 2026](https://waspdev.com/articles/2026-01-01/javascript-for-of-loops-are-actually-fast) `[не проверено]`; [Bugzilla 1829927](https://bugzilla.mozilla.org/show_bug.cgi?id=1829927) | [Данные](#данные-и-алгоритмы) |
| `JSON.stringify` медленный | Условия быстрого пути: без replacer и space, без `toJSON`, без числовых ключей, плоские строки | Более 2× на json-stringify-inspector в V8 13.8 / Chrome 138 | Любое условие нарушено: откат к общему сериализатору | [Thier, 2025](https://v8.dev/blog/json-stringify) | [Данные](#данные-и-алгоритмы) |
| Глубокая копия | `structuredClone` по умолчанию; JSON-обход для мелких простых данных по замеру | Источники расходятся | Классы, функции, DOM: прототип теряется или ошибка | [Surma](https://web.dev/articles/structured-clone) | [Данные](#данные-и-алгоритмы) |
| Память растёт от действия к действию | Прогреть, базовый снимок, повторить действие простое число раз (7), ещё около трёх снимков, сравнить | Метод поиска, числа нет | Автоматизация: `fuite` | [Lawson, 2020](https://nolanlawson.com/2020/02/19/fixing-memory-leaks-in-web-applications/) | [Память](#память-и-gc) |
| Растут узлы DOM | Task Manager, Performance с Memory, фильтр Detached, Retainers | Метод | Task Manager показывает лишь общий рост | [DevTools: memory](https://developer.chrome.com/docs/devtools/memory-problems); [Heap snapshots](https://developer.chrome.com/docs/devtools/memory-problems/heap-snapshots) | [Память](#память-и-gc) |
| Утечки слушателей, таймеров, Observer | Симметричная очистка: `disconnect`, `clearInterval`, снятие обработчиков с `window` | Метод | Состояние в глобальном сторе растёт само | [Lawson, 2020](https://nolanlawson.com/2020/02/19/fixing-memory-leaks-in-web-applications/) | [Память](#память-и-gc) |
| Замыкание удерживает большой объект | Не держать большое значение в области, общей с долгоживущими замыканиями | В примере удерживается 100 МБ `ArrayBuffer` | Исправление движками маловероятно | [Archibald, 2024](https://jakearchibald.com/2024/garbage-collection-and-closures/) | [Память](#память-и-gc) |
| Частые паузы GC | Allocation Timeline и Allocation sampling, затем снизить скорость аллокаций | Метод | GC не виден в профиле | [DevTools: memory](https://developer.chrome.com/docs/devtools/memory-problems) | [Память](#память-и-gc) |
| Обработчик блокирует UI на слабом устройстве | Вынести логику в Worker | PROXX на Nokia 2: зависание до 6,6 с против обработчика 48 мс | Работа не ускоряется | [Surma, 2019](https://surma.dev/things/when-workers/) | [Wasm](#воркеры-и-wasm) |
| Дорогая передача данных между потоками | ≤100 KiB в 100 мс, ≤10 KiB для анимации; дальше патчи, разбиение, transferable | Передача `ArrayBuffer` быстра при любом размере, отправитель теряет доступ | Ручная JSON-обёртка не помогла | [Surma, 2019](https://surma.dev/things/is-postmessage-slow/) | [Wasm](#воркеры-и-wasm) |
| Нужна разделяемая память | COOP `same-origin` + COEP `require-corp` или `credentialless`; проверять `crossOriginIsolated` | Включает SharedArrayBuffer | `Atomics.wait` на главном потоке бросает `TypeError`; нужен `Atomics.waitAsync` | [Kitamura](https://web.dev/articles/coop-coep); [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics/wait) | [Wasm](#воркеры-и-wasm) |
| Хочется Wasm ради числодробилки | Сначала замерить оптимизированный JS | AS -O3 0,9× к TurboFan (blur); пузырёк 0,6×; бинарная куча: C++ 1,0×, Rust 1,2–1,9× | Прогрев: Wasm выигрывает, когда нужна скорость сразу | [Surma, 2021](https://surma.dev/things/js-to-asc/) | [Wasm](#воркеры-и-wasm) |
| Порт JS на Rust ради скорости | Сначала оптимизировать JS и структуры | Типично около 2×, не 10×; один порт дал 5 % за неделю | Большой выигрыш на миллионах мелких структур | [Zaplib](https://zaplib.com/docs/blog_post_mortem.html) | [Wasm](#воркеры-и-wasm) |
| Частые вызовы JS/Wasm и строки | Крупные вызовы с буферами; JS String Builtins | Без glue-кода минус 45 % времени применения DOM-изменений (эксперимент 2020); прямой вызов около 2× `[не проверено]` | Прямого доступа к DOM нет | [Hunt, 2026](https://hacks.mozilla.org/2026/02/making-webassembly-a-first-class-language-on-the-web/); [Component Model](https://bytecodealliance.org/articles/the-road-to-component-model-1-0); [MDN](https://developer.mozilla.org/en-US/docs/WebAssembly/Guides/JavaScript_builtins) | [Wasm](#воркеры-и-wasm) |
| Длинные задачи, плохой INP | `scheduler.yield()` с фолбэком на `setTimeout`; уступать примерно через 50 мс | `yield` ставит продолжение перед другими задачами; `setTimeout` в конец очереди | Safari: поддержки нет (на ноябрь 2026 не перепроверено) | [Wagner, Kenny](https://web.dev/articles/optimize-long-tasks); [Chrome](https://developer.chrome.com/blog/use-scheduler-yield) | [Браузер](#браузер-и-core-web-vitals) |
| Long Tasks не показывает виновный скрипт | LoAF: `blockingDuration`, `scripts` с forced layout (Chrome 123) | Диагностика: записи `scripts` от 5 мс | Firefox и Safari не поддерживают; в Worker и кросс-доменных iframe атрибуция ограничена | [Chrome: LoAF](https://developer.chrome.com/docs/web-platform/long-animation-frames) | [Браузер](#браузер-и-core-web-vitals) |
| Много пересчётов layout в задаче | Сначала все чтения, затем запись | В трассировке layout 28 мс на кадр при бюджете 16 мс | Reflow дёшев, если DOM не менялся | [Wagner, Lewis, Pollard](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing); [Irish](https://gist.github.com/paulirish/5d52fb081b3570c81e3a) | [Браузер](#браузер-и-core-web-vitals) |
| Большая страница долго рендерится | `content-visibility: auto` + `contain-intrinsic-size: auto <размер>` | Рендер примера 232 → 30 мс (7×); Baseline Newly available с 15.09.2025 | Контент на экране | [Kravets, Wagner, Levin, 2020](https://web.dev/articles/content-visibility) | [Браузер](#браузер-и-core-web-vitals) |
| Большой DOM ухудшает INP | Плоская разметка, containment, виртуализация | Lighthouse предупреждает при 800 узлах, избыточным считает 1400 | Виртуализация требует расчёта высот | [Wagner](https://web.dev/articles/dom-size-and-interactivity) | [Браузер](#браузер-и-core-web-vitals) |
| Анимация дёргается | Только `transform` и `opacity`; `will-change` на короткое время | 40 % мобильных страниц содержат некомпозитные анимации | Лишние слои сами создают проблемы | [Basques, Andrew](https://web.dev/articles/animations-guide); [Web Almanac 2025](https://almanac.httparchive.org/en/2025/performance) | [Браузер](#браузер-и-core-web-vitals) |
| LCP-картинка поздно грузится | В HTML, не лениво, `fetchpriority="high"` на одном-двух изображениях | Google Flights: LCP 2,6 → 1,9 с | Уже есть ранний preload; браузер вправе игнорировать подсказку | [Walton, Pollard](https://web.dev/articles/optimize-lcp); [Osmani](https://web.dev/articles/fetch-priority) | [Браузер](#браузер-и-core-web-vitals) |
| Медленные переходы назад и вперёд | bfcache: убрать `unload` (заменить на `pagehide`), `no-store` только для чувствительных страниц | 1 из 10 десктопных и 1 из 5 мобильных навигаций — назад/вперёд | Сторонние `unload`-обработчики блокируют | [Walton, Pollard](https://web.dev/articles/bfcache) | [Браузер](#браузер-и-core-web-vitals) |
| Навигация по предсказуемым следующим страницам | Speculation Rules (`moderate`, `conservative`), prerender одной-двух страниц | LCP «почти ноль» при успехе, без чисел | Запросы со сменой состояния; лимиты Chrome 10 (`immediate`) и 2 (`conservative`) | [Chrome](https://developer.chrome.com/docs/web-platform/implementing-speculation-rules); [Prerender](https://developer.chrome.com/docs/web-platform/prerender-pages) | [Браузер](#браузер-и-core-web-vitals) |
| Шрифты задерживают рендер | Preconnect, `font-display`, subset с `unicode-range`, WOFF2 (около 30 % лучше WOFF) | Preload занимает ресурсы и игнорирует `unicode-range` | Свой хостинг не всегда быстрее | [Hempenius, Pollard](https://web.dev/articles/font-best-practices) | [Браузер](#браузер-и-core-web-vitals) |
| Тяжёлые изображения | `srcset`+`sizes`, AVIF/WebP через `<picture>`, lazy вне экрана | AVIF экономит >50 % к JPEG в отдельных случаях | Lazy на LCP вредит | [web.dev: images](https://web.dev/learn/performance/image-performance) | [Браузер](#браузер-и-core-web-vitals) |
| Нет разумного бюджета JS | 3 с при P75: 0,3 МиБ JS (15 % от бюджета) или 0,62 МиБ (50 %); 5 с: 0,57 / 1,15 МиБ | P75 JS сейчас около 1,3 МиБ, более чем вдвое выше 2015 г. | Бюджет посчитан для двух TLS-соединений | [Russell, 2025](https://infrequently.org/2025/11/performance-inequality-gap-2026/) | [Доставка](#доставка-javascript) |
| Много мелких файлов вместо бандла | Группировать и сжимать вместе | 1 файл против 12: CSS на 1,4× быстрее, 3,3× легче, задержка в 22× меньше (Bootstrap, Brotli, 3G) | Частое обновление одного модуля | [Roberts, 2023](https://csswizardry.com/2023/10/the-three-c-concatenate-compress-cache/) | [Доставка](#доставка-javascript) |
| Динамические ответы долго сжимаются | zstd там, где высокий Brotli не успевает; Brotli заранее для статики | Zstd на CDN вырос с 3 % до 12 % за год | Браузеры шлют zstd только по HTTPS | [Web Almanac 2025: CDN](https://almanac.httparchive.org/en/2025/cdn); [web-features](https://web-platform-dx.github.io/web-features-explorer/features/zstd) | [Доставка](#доставка-javascript) |
| Повторная загрузка новой версии бандла | Compression Dictionary Transport | До 76 % в примере DebugBear; Chrome и Edge 130+ | Нужна поддержка на сервере и предыдущая версия у пользователя | [Chrome](https://developer.chrome.com/blog/shared-dictionary-compression); [DebugBear](https://www.debugbear.com/blog/shared-compression-dictionaries) | [Доставка](#доставка-javascript) |

---

## Движки JS

Вывод: в V8 четыре уровня исполнения (Ignition, Sparkplug, Maglev, TurboFan).
Из кода на них влияют стабильные формы объектов, мономорфные места вызова, плотные массивы одного вида и отсутствие циклов деоптимизации.
Числовых оценок цены полиморфизма на современных версиях почти нет, поэтому правила ниже применяйте только к функциям, которые профилировщик показал горячими.
Meurer советует не думать о деталях спекуляции заранее, а заниматься архитектурой, структурами данных и идиоматичным JS — [Meurer, 2017](https://benediktmeurer.de/2017/12/13/an-introduction-to-speculative-optimization-in-v8/).

### Формы объектов и inline-кэши

Формы называются по-разному (Map в V8, Structure в JSC, Shape в SpiderMonkey), механизм тот же. `{x, y}` и `{y, x}` дают разные формы; при совпадении формы чтение идёт по смещению без поиска свойства — [Meurer, Bynens, 2018](https://mathiasbynens.be/notes/shapes-ics).

- Заводите все поля в одном месте и одном порядке (конструктор, фабрика).
- Место вызова, видящее много форм, становится полиморфным, затем мегаморфным.
  - Лечение: разделить обработчики по типам или специализировать функцию.
- Клонирование сортировки под каждый компаратор дало около 25 % в V8 (4268 → 3177 мс, 2018).
- Предел полиморфизма 4 указан для V8 2015 г. и зависит от версии — [Egorov, 2018](https://mrale.ph/blog/2018/02/03/maybe-you-dont-need-rust-to-speed-up-your-js.html); [Egorov, 2015](https://mrale.ph/blog/2015/01/11/whats-up-with-monomorphism.html).
- Несоответствие числа аргументов компаратора дало 14 % в V8 2018 г. (4774 → 4123 мс) и не дало эффекта в SpiderMonkey; для нынешних V8 не проверялось.
- Объекты с частыми добавлениями и `delete` переходят в словарный режим, несовместимый с inline-кэшами.
  - Для динамических ключей берите `Map`, у записей фиксированной формы не удаляйте поля — [Bruni, 2017](https://v8.dev/blog/fast-properties).
- Поле, начавшее целым и получившее дробные значения, меняет представление и форму.
  - React заполнял время значением `NaN`, чтобы поле сразу было double.
  - Конкретный обрыв закрыт в V8 v7.4 `[устарело: баг v7.4]`, совет про стабильное представление остаётся — [Meurer, Bynens, 2019](https://v8.dev/blog/react-cliff).
- Proxy называют особенно дорогим для V8, числа в источнике скрыты — [romgrk, 2024](https://romgrk.com/posts/optimizing-javascript).

### Массивы

V8 хранит массивы по видам элементов (elements kinds). Переходы идут только в сторону более общего вида, обратно массив не возвращается — [Bynens, 2017](https://v8.dev/blog/elements-kinds).

- Держите массив плотным и одного вида: без дыр, без `-0`, `NaN`, `Infinity` в целочисленных.
- Создавайте литералом или `push`, а не `new Array(n)`.
- В цикле пишите `i < arr.length`, а не читайте за концом с проверкой на `undefined`: это главный совет источника.
- Числа в источнике нет.
  - На странице есть заметка от 2025-02-28 об исключении для `Array.prototype.fill`: перед применением совета проверьте её.
- Для коротких массивов и холодного кода совет не окупается.

### Уровни V8 и последние изменения

- Sparkplug (неоптимизирующий компилятор, Chrome 91): время главного потока на реальных сайтах лучше на 5–15 %, Speedometer на 5–10 % — [Swirski, 2021](https://v8.dev/blog/sparkplug).
- Maglev стоит между Sparkplug и TurboFan, введён в M117 на десктопе — [Verwaest и др., 2023](https://v8.dev/blog/maglev).
- Кратность скорости компиляции Maglev в источниках расходится.
  - Пост про Maglev: около 10× медленнее Sparkplug и 10× быстрее TurboFan.
  - [V8 is Faster and Safer than Ever!, 2023](https://v8.dev/blog/holiday-season-2023): около 20× медленнее Sparkplug и 10–100× быстрее TurboFan, JetStream 2 +8,2 %.
- Turboshaft заменил Sea of Nodes в бэкенде TurboFan и во всём Wasm-конвейере: время компиляции примерно вдвое меньше, кэш-промахов L1 в SoN было в среднем втрое больше — [Mercadier, 2025](https://v8.dev/blog/leaving-the-sea-of-nodes).
- Turbolev (IR Maglev как новый фронтенд, бэкенд Turboshaft) в разработке — [трекер Chromium](https://issues.chromium.org/issues/42204525); [Seokho, 2025](https://blog.seokho.dev/development/2025/07/15/V8-Expanding-To-Turbolev.html) `[не проверено]`.
- `[устарело]` Утверждение Bynens (2018), что у V8 один оптимизирующий уровень.
  - Сейчас связка Maglev и TurboFan.
- Mutable heap numbers: счётчик или seed в переменной скрипта V8 с 2025 г. обновляет на месте (Int32), вручную обходить не нужно.
  - Выигрыш 2,5× на async-fs и около 1,6 % на общий балл JetStream2.
  - Запись значения другого типа ведёт к деоптимизации; старые V8 так не умеют — [Gomes, 2025](https://v8.dev/blog/mutable-heap-number).
- Pointer Compression: куча V8 меньше до 43 %, память renderer на десктопе меньше до 20 %; Smi стали 31-битными, распаковка double-полей отключена — [Sheludko, Aboy Solanes, 2020](https://v8.dev/blog/pointer-compression).

### Деоптимизация и спекуляция

- Обратная связь движется только вперёд по решётке типов, поэтому цикл оптимизации на одном и том же входе исключён.
- В JSC выход стоит около 2,5 мкс из DFG и около 10 мкс из FTL; в DFG спекуляция окупается при вероятности успеха выше 0,9994 — [Pizlo, 2020](https://webkit.org/blog/10308/speculation-in-javascriptcore/).
- Maglev удешевил перекомпиляцию, и редкие деоптимизации стоят меньше, чем во времена Crankshaft.
- Постоянная нестабильность типов в горячем коде остаётся проблемой.
  - Лечение: стабилизировать типы аргументов.

### Explicit Compile Hints

Первая строка файла `//# allFunctionsCalledOnLoad` просит V8 компилировать все функции файла сразу, а не лениво.

- Поддержка: Chrome 136+, только V8.
- Результат на 20 популярных страницах: 17 улучшились, в среднем минус 630 мс parse+compile на главном потоке — [Hölttä, 2025](https://v8.dev/blog/explicit-compile-hints).
- Источник предупреждает, что избыточная компиляция тратит время и память.
  - Не помечайте файлы с редко вызываемыми функциями; помечайте те, где почти всё вызывается при загрузке.
- Эффект проверяйте по времени parse/compile на главном потоке в Performance.

### JavaScriptCore и SpiderMonkey

- JSC: уровни LLInt, Baseline, DFG, FTL.
  - Задержка на байткод 3,97 / 1,71 / 0,349 / 0,225 нс; пороги повышения 500 / 1000 / 100 000 очков (вызов +15, итерация +1) — [Pizlo, 2020](https://webkit.org/blog/10308/speculation-in-javascriptcore/).
- SpiderMonkey: Baseline Interpreter, Baseline JIT, затем Ion с фронтендом Warp, построенным только на данных CacheIR.
  - Warp: загрузка Google Docs быстрее примерно на 20 %, Speedometer на 10–12 %, при регрессиях на Octane и Kraken — [de Mooij, 2020](https://hacks.mozilla.org/2020/11/warp-improved-js-performance-in-firefox-83/).
- WebKit для Speedometer 3: расширение мегаморфных inline-кэшей, редизайн Call IC, GC между обновлениями рендера (+6,5 % на Speedometer 3.0, MacBook Air M2); суммарно около 60 % между Safari 17.0 и 17.4 — [Baradlay и др., 2024](https://webkit.org/blog/15249/).
- `for...of` в SpiderMonkey на коротких прогонах (baseline) был в несколько раз медленнее V8 на TodoMVC (данные 2023 г.) — [Bugzilla 1829927](https://bugzilla.mozilla.org/show_bug.cgi?id=1829927) `[не проверено]`.
- SpiderMonkey в 2026 г. ввёл `--benchmark-mode` и `--strict-benchmark-mode`: неверная конфигурация оболочки обесценивает замеры — [Gaudet, 2026](https://spidermonkey.dev/blog/2026/04/13/benchmark-mode.html).
  - Методика — в [benchmarking.md](benchmarking.md).

### Выводы для практики

- Стабильные формы окупаются во всех трёх движках, но пороги и цена выхода разные: выигрыш на V8 для Safari и Firefox надо перепроверять.
- Код живёт недолго и до верхних уровней почти не доходит, поэтому старт и baseline-производительность важнее пика на бенчмарках.

---

## Что стоит слой TypeScript

Вывод: типы стираются бесплатно, цену дают только конструкции с runtime-эмитом: `enum`, декораторы с метаданными, хелперы даунлевела.
После TS 6.0 и 7.0 проблема ES5-даунлевела ушла из `tsc`, а практическими рычагами стали современный `target`, `import type`, отказ от массовых barrel-файлов и точный `sideEffects`.
Скорость проверки типов (отдельная тема) разобрана в [toolchain.md](toolchain.md) и [types-patterns.md](types-patterns.md).

### Ловушка `import { type X }` при `verbatimModuleSyntax`

При `verbatimModuleSyntax` инлайновый модификатор `type` стирает только имя, но не сам оператор импорта:

```ts
import { type User } from "./user";   // эмитится: import {} from "./user";  — модуль загрузится
import type { User } from "./user";   // стирается целиком, ребра в графе модулей нет
```

Первая форма сохраняет побочные эффекты и ребро в графе модулей: модуль загрузится и выполнится, даже если из него нужны только типы.
Это влияет на старт, на dev-сервер и на то, что бандлер может счесть модуль используемым — [verbatimModuleSyntax, TSConfig](https://www.typescriptlang.org/tsconfig/verbatimModuleSyntax.html).
Совет: для импортов только типов используйте `import type { X } from "x"`, а `import { type X }` оставляйте там, где рядом есть значения из того же модуля.
Если побочные эффекты модуля нужны, пишите явный `import "x"`.
Выигрыш зависит от веса модуля.
Про декораторы: `experimentalDecorators` с `emitDecoratorMetadata` выводит метаданные в рантайм,; стандартные декораторы эту опцию не поддерживают — [typescript-eslint](https://typescript-eslint.io/blog/changes-to-consistent-type-imports-with-decorators); [experimentalDecorators, TSConfig](https://www.typescriptlang.org/tsconfig/experimentalDecorators.html).

### Изменения TS 6.0 и 7.0

- TS 6.0: `target` по умолчанию плавающий, сейчас es2025; `module` по умолчанию esnext; `target: es5` и `--downlevelIteration` объявлены устаревшими, минимум ES2015 — [TypeScript 6.0 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html).
- TS 7.0 (8 июля 2026 г., нативный компилятор на Go): `target: es5` и `downlevelIteration` больше не поддерживаются; код, чисто компилирующийся в 6.0, «должен компилироваться идентично»; сборка быстрее в 7,7–11,9× при 4 чекерах (vscode: 125,7 → 10,6 с) — [Announcing TypeScript 7.0, Microsoft, 2026](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/).
  - Это время сборки; скорость выполнения кода не меняется.
- `[устарело]` Советы про стоимость `downlevelIteration` и ES5-генераторов в `tsc`.
  - Замена: современный `target`; если ES5 всё же нужен, понижение делает внешний инструмент (esbuild, SWC) — [TS 6.0 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html).

### Цена конструкций

- `enum` эмитит IIFE, числовой ещё и обратное отображение; около 300 байт на простой enum `[не проверено]`, надёжного замера нет.
- Замена: `as const` или union; `const enum` только внутри проекта.
  - Неиспользуемые ключи `as const` минификатор обычно тоже не удаляет — [Handbook: Enums](https://www.typescriptlang.org/docs/handbook/enums.html); [no-const-enums](https://microsoft.github.io/cloudpack/repo-guidance/no-const-enums).
- Ambient `const enum` при `isolatedModules`: транспилятор по одному файлу не знает, что импорт — const enum, и код падает в рантайме.
- Не публикуйте такие enum; в библиотеках используйте `preserveConstEnums` и снятие `const` в `.d.ts` — [esbuild](https://esbuild.github.io/content-types/).
- Хелперы `__awaiter`, `__spreadArray` дублируются по модулям и растут с числом модулей: `importHelpers` и `tslib`, либо современный `target` — [importHelpers](https://www.typescriptlang.org/tsconfig/importHelpers.html).
- Поля классов при низком `target` компилируются в `Object.defineProperty`: поднимите `target` до ES2022+ или задайте `useDefineForClassFields`.
- Семантика при этом меняется: поле затеняет аксессор базового класса, объявление без инициализатора пишет `undefined`; защита — `declare` — [useDefineForClassFields](https://www.typescriptlang.org/tsconfig/useDefineForClassFields.html).
- `async`/`await` при `target` ниже ES2017 становится стейт-машиной — [Schulz](https://mariusschulz.com/blog/compiling-async-await-to-es3-es5-in-typescript).
- Async-генераторы при понижении раздуваются на 650 % (V8, 2017); нужен ES2018+ — [Meurer, 2017](https://github.com/bmeurer/benediktmeurer.de/blob/master/src/posts/2017-02-17-high-performance-es2015-and-beyond.md).

Детали по поводу `useDefineForClassFields`: в V8 инициализация полей была «намного медленнее присваивания» до v9.7, потом исправлена. Нативный `await` занимает один микротакт вместо минимум трёх до V8 v7.2, `Promise.all` в параллельном бенчмарке быстрее до 8× (2018); оптимизация `await` опирается на нативные промисы, поэтому понижение до генераторов её теряет.

### Размер бандла: полифилы и транспиляция

Современный синтаксис нужно отдавать там, где браузерные цели позволяют.
Показательный пример раздувания: `[1,2,3].at(-1)` занимает 31 байт, а после Babel с 71 зависимостью core-js — 11 217 байт.
Пример показывает раздувание, а не замер сайта — [Walton, 2024](https://philipwalton.com/articles/the-state-of-es5-on-the-web/).
Для библиотек разумно поднимать `target` как можно выше и оставлять понижение приложению: повторная транспиляция дублирует работу.

### Barrel-файлы и tree-shaking

- Barrel-файлы в каждой папке тормозят dev-сервер и тесты: загрузка пустого графа — 1000 модулей 0,31 с, 10 000 модулей 3,12 с, 50 000 модулей 48,44 с; автор оценивает ускорение задач на 60–80 % после отказа — [Hagemeister, 2023](https://marvinh.dev/blog/speeding-up-javascript-ecosystem-part-7/).
  - Несколько barrel-файлов не мешают.
  - Выигрыш в основном dev/test; прод-бандл при корректном шейкинге зависит от конфигурации.
  - Сравнение 14,5 с против 2,8 с при прямых импортах, где `sideEffects` улучшает шейкинг, но не ускоряет обход графа — [kanary159357](https://kanary159357.github.io/blog/barrel_file) `[не проверено]`.
- Tree-shaking: ESM без конвертации в CommonJS, точный `sideEffects` в `package.json`, `/*#__PURE__*/` на вызовах, `/*#__NO_SIDE_EFFECTS__*/` на функциях (webpack 5.107+, через границы модулей 5.108+).
  - Пример web.dev: `main` 20,8 → 8,46 KiB.
  - Не помогает в dev-режиме, при неверном `sideEffects` у зависимости, для HOC и геттеров, которые Terser не считает чистыми — [webpack](https://webpack.js.org/guides/tree-shaking/); [Wagner](https://web.dev/articles/reduce-javascript-payloads-with-tree-shaking).

---

## Данные и алгоритмы

Вывод: самый надёжный выигрыш дают смена асимптотики и уменьшение числа аллокаций; микросравнения вроде `for...of` против индексного цикла дают малый, зависящий от прогрева эффект.
Плоские `TypedArray` выигрывают там, где снижают давление на GC, но SoA сам по себе в JS ускорения не гарантирует.
Порядок проверки для кода с большими объёмами записей: убрать лишнюю работу, затем лишние аллокации (плоские буферы) и только потом думать о мономорфности.

### Дополнения к таблице

- `reduce` со spread: `for...of` примерно 1,33× к `reduce` с мутацией; на нескольких элементах разницы нет — [Snapp, 2019](https://www.richsnapp.com/article/2019/06-09-reduce-spread-anti-pattern).
- `Set` вместо `includes`: реального случая не найдено, точка перехода не измерена, на очень маленьких массивах `includes` может быть быстрее `[не проверено]` — [romgrk, 2024](https://romgrk.com/posts/optimizing-javascript).
- `Map` вместо объекта: на малых целых ключах 0–1000 объект быстрее на вставке на 65 %; автор просит осторожности, метод только `for...in` — [Zhenghao He, 2022](https://www.zhenghao.io/posts/object-vs-map).
- SoA: на простом тесте все варианты показали 384–452 оп/с, разброс между прогонами сравним с разницей — [joakin](https://github.com/joakin/js-data-oriented-benchmark).
- `for...of`: Chrome 143 после разогрева даёт равенство, `forEach` медленнее всех при больших N; на коротком прогоне и 500 000 элементов индексный цикл быстрее — [Suren, 2026](https://waspdev.com/articles/2026-01-01/javascript-for-of-loops-are-actually-fast) `[не проверено]`; [Bugzilla 1829927](https://bugzilla.mozilla.org/show_bug.cgi?id=1829927).
- Сортировка: сравнение обычно на порядок дороже доступа к памяти, поэтому сокращайте число сравнений — [Zünd, 2018](https://v8.dev/blog/array-sort).
- Подстроки: держат родительскую строку целиком; пример в 2 МБ (10 → 8 МБ) и ещё 1 МБ после однобайтного вида — [iliazeus, 2023](https://iliazeus.lol/articles/js-string-optimizations-en/).
- Regex: первое выполнение в интерпретаторе, повторное компилируется, длинные строки сразу запускают компиляцию; код меньше на 4–7 % — [Thier, Peško, 2019](https://v8.dev/blog/regexp-tier-up).
- Большой литерал как строка в `JSON.parse` для ≥10 кБ: около 1,7× в V8 (2019), источник просит мерить — [Osmani, Bynens, 2019](https://v8.dev/blog/cost-of-javascript-2019).

### Быстрый путь JSON.stringify

V8 13.8 / Chrome 138 ускорил `JSON.stringify` более чем вдвое на json-stringify-inspector — [Thier, 2025](https://v8.dev/blog/json-stringify). Быстрый путь включается, если выполняются условия (по посту V8; список может быть неполным):

- нет replacer и нет аргумента `space`;
- нет метода `toJSON` у сериализуемых объектов;
- нет числовых ключей (индексных свойств) у объектов;
- строки уже плоские, а не ConsString (то есть не получены длинной цепочкой конкатенаций, которую движок ещё не сплющил).

Если любое условие нарушено, движок откатывается к общему сериализатору.
Следствие: один `toJSON` на прототипе возвращает весь вызов на медленный путь, а простая структура выходных данных сама по себе становится оптимизацией.
Полный список условий в статье может быть шире: перед тем как строить архитектуру вокруг быстрого пути, сверьтесь с постом и замерьте на целевой версии V8 (до 13.8 выигрыша нет).
Выбор между `JSON.stringify` и обходом на сервере см. в node-knowledge.

### Глубокая копия

`structuredClone` — выбор по умолчанию.
Surma пишет, что JSON быстрее только на очень маленьких объектах, а на больших structured clone значительно быстрее, но опирается на сравнение 2018 г. — [web.dev](https://web.dev/articles/structured-clone).
Свежие пользовательские замеры показывают обратное на простых массивах: примерно 3,7× в пользу JSON — [MeasureThat](https://measurethat.net/Benchmarks/Show/34593/1/jsonstringify-jsonparse-vs-structuredclone-on-arrays) `[не проверено]`.
Вывод зависит от данных и движка; решайте по замеру.
Для классов, функций и DOM прототип теряется или выбрасывается ошибка.

### Регулярные выражения и сортировка

Экспоненциальные регулярные выражения: линейный (не backtracking) движок V8 доступен только за экспериментальным флагом и не применим на сайте, ограничения паттернов строгие — [Bidlingmaier, 2021](https://v8.dev/blog/non-backtracking-regexp). Защита на уровне кода: не принимать произвольные паттерны, ограничивать длину входа.

Замеры ниже `[проверено локально]`: подсчёт слов на текстах 0,3, 13 и 65 КБ с распределением Ципфа, Node 24.22, V8 13.6, 5+5 прогонов в порядке ABBA. Это ориентир, а не общий закон.

- **Топ-N без полной сортировки.** Куча на k элементов обходит вход за один проход и работает за O(n log k) — [Partial sorting](https://en.wikipedia.org/wiki/Partial_sorting). Готовые `Heap.nsmallest` и `Heap.nlargest` есть в [mnemonist](https://yomguithereal.github.io/mnemonist/heap). Если ключ сортировки дискретный, как частота слова, проще найти порог (n-е наибольшее значение), отфильтровать записи и отсортировать только кандидатов: это дало −11…−29 %. Фильтр сохраняет исходный порядок, поэтому результат совпадает с полной стабильной сортировкой.
- **`localeCompare` и `Intl.Collator`.** Для сортировки больших массивов MDN советует создать один `Intl.Collator` и использовать его `compare` — [MDN localeCompare](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare). На словаре из 3 000 слов замена дала −8,6 % при вердикте `same`, а после отсечения кандидатов +0,6 %: сравнений почти не осталось. Сначала уменьшайте число сравнений. Без явной локали порядок зависит от машины, поэтому, если порядок входит в контракт, задавайте её: `new Intl.Collator('en')`.
- **Сканер вместо regex с `\p{…}`.** Глобальный `match` с Unicode-свойствами занял 74 % собственного времени токенизации. Цикл по кодовым точкам с таблицей классов BMP (`Uint8Array` на 64 КиБ, класс вычисляется regex не больше одного раза на символ) дал −52…−62 %. Цена: постоянные 64 КиБ и около 30 строк кода, которые нужно проверять фаззом на суррогатных парах. Опубликованных сравнений не найдено.

---

## Память и GC

Вывод: цена scavenger пропорциональна числу выживших объектов, поэтому короткоживущие аллокации дёшевы, а утечки определяются удерживающими ссылками.
Рабочий цикл: Task Manager, затем запись Performance с памятью, затем сравнение снимков кучи при известном числе повторов сценария.
Исправлять утечку нужно удалением удерживающей ссылки, а не `WeakRef`.

### Как работает GC в V8

Молодое поколение разделено на nursery и промежуточное; объект попадает в старшее после двух сборок.
Копирование тратится только на выживших, большинство объектов умирает молодыми, write barrier отслеживает ссылки old→new.
Idle-time GC снизил кучу Gmail в простое на 45 % — [Marshall, 2019](https://v8.dev/blog/trash-talk).
В WebKit GC между обновлениями рендера дал +6,5 % на Speedometer 3.0 — [WebKit, 2024](https://webkit.org/blog/15249/).

### Поиск утечек

1. Откройте Task Manager браузера для общей картины: он показывает рост, но не причину — [Fix memory problems](https://developer.chrome.com/docs/devtools/memory-problems).
2. Запишите Performance с Memory и посмотрите на узлы DOM и слушатели.
3. Сделайте снимки кучи: прогрейте сценарий, снимите базовый снимок, повторите действие простое число раз (7), снимите ещё около трёх снимков, сравните и отсортируйте по числу объектов. Метод — [Lawson, 2020](https://nolanlawson.com/2020/02/19/fixing-memory-leaks-in-web-applications/); автоматизация — `fuite` (в той же статье). Отсоединённые узлы: фильтр Detached в снимке и просмотр Retainers — [Heap snapshots](https://developer.chrome.com/docs/devtools/memory-problems/heap-snapshots).
4. Частые паузы GC: Allocation Timeline и Allocation sampling, чтобы найти источник, затем снизить скорость аллокаций. Если GC не виден в профиле, это не ваша проблема.

### Типичные источники утечек

- Слушатели, таймеры, Observer: симметричная очистка (`disconnect`, `clearInterval`, снятие обработчиков с `window`) — [Lawson, 2020](https://nolanlawson.com/2020/02/19/fixing-memory-leaks-in-web-applications/).
- Замыкание удерживает большой объект (в примере 100 МБ `ArrayBuffer`).
  - Касается Chromium, Firefox и WebKit; исправление движками маловероятно — [Archibald, 2024](https://jakearchibald.com/2024/garbage-collection-and-closures/).
  - Делите скоуп там, где снимок показывает удержание через контекст.
- Бесконечная прокрутка: виртуализация списка, число узлов зависит от размера окна; переменная высота требует расчёта — [Miller, Djirdeh](https://web.dev/articles/virtualize-long-lists-react-window).

### Данные о памяти в поле

`performance.measureUserAgentSpecificMemory` с интервалами по Пуассону, в среднем 5 минут. Только Chromium 89+, нужна кросс-доменная изоляция, результаты нельзя сравнивать между браузерами — [web.dev](https://web.dev/articles/monitor-total-page-memory-usage).

### WeakRef

Движок может намеренно держать значения дольше, чем ожидает код: `deref` может никогда не вернуть `undefined`, момент сборки не гарантирован, поэтому MDN советует избегать `WeakRef` — [WeakRef, MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakRef).
`WeakRef` и `FinalizationRegistry` подходят для кэшей и подчистки ресурсов сверх основной логики.
Серверные задачи (`--trace-gc`, лимиты кучи) — в node-knowledge.

### Пулы объектов

Пул нужен только при подтверждённых профилем паузах GC в цикле кадра.
Решающие признаки: аллокации на горячем кадре в Allocation sampling и паузы GC в записи Performance, а не сама по себе высокая частота создания объектов.
Для сущностей в играх и визуализации пул оправдан; пример — [A-Frame pool](https://aframe.io/docs/1.7.0/components/pool.html).
Контролируемого замера пула против обычной аллокации на современном V8 не найдено.

---

## Воркеры и Wasm

Вывод: Workers дают отзывчивость, а не пропускную способность: работа занимает столько же времени, она лишь не блокирует интерфейс.
Wasm чаще выигрывает на прогреве и предсказуемости, чем на пике против TurboFan; частые вызовы через границу JS/Wasm и передача строк съедают выигрыш.
Реалистичная прибавка от порта JS в Rust или C++ около 2×, не 10×.

### Workers

- Worker оправдан, когда обработчик блокирует UI: PROXX на Nokia 2 зависал до 6,6 с против обработчика 48 мс.
  - Быстрее посчитать он не поможет — [Surma, 2019](https://surma.dev/things/when-workers/).
- Цена передачи: ≤100 KiB укладывается в 100 мс, ≤10 KiB безопасно для анимации.
- Дальше нужны патчи, разбиение, transferable или бинарный формат.
  - Передача `ArrayBuffer` быстра при любом размере, но отправитель теряет доступ — [Surma, 2019](https://surma.dev/things/is-postmessage-slow/).
- Comlink (около 1,1 кБ) даёт эргономику, не скорость: каждый вызов асинхронен, прокси нужно освобождать — [Comlink](https://github.com/GoogleChromeLabs/comlink).
- SharedArrayBuffer требует изоляции: COOP `same-origin` и COEP `require-corp` или `credentialless`, проверка `crossOriginIsolated`.
- `Atomics.wait` на главном потоке бросает `TypeError`, нужен `Atomics.waitAsync`; `credentialless` на момент статьи был только в Chromium — [Kitamura](https://web.dev/articles/coop-coep); [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics/wait).
  - SAB берите при частом обмене большими данными; для редких передач хватает transferable.
- `OffscreenCanvas` в Worker (`transferControlToOffscreen`): Chrome 69, Firefox 105, Safari 16.4; доступ к DOM ограничен — [Dresser](https://web.dev/articles/offscreen-canvas).

### Wasm: реалистичные приросты

| Задача | Результат относительно JS | Источник |
|---|---|---|
| Blur, AssemblyScript -O3 | 0,9× к JS на TurboFan (то есть не быстрее) | [Surma, 2021](https://surma.dev/things/js-to-asc/) |
| Пузырьковая сортировка, AS | 0,6× | [Surma, 2021](https://surma.dev/things/js-to-asc/) |
| Бинарная куча | C++ 1,0×, Rust 1,2–1,9× к JS | [Surma, 2021](https://surma.dev/things/js-to-asc/) |
| Наивный AS | 2,9–4,2× медленнее JS | [Surma, 2021](https://surma.dev/things/js-to-asc/) |
| Порт JS на Rust | Типично около 2×, не 10×; один порт дал 5 % за неделю; большой выигрыш на миллионах мелких структур | [Zaplib post-mortem](https://zaplib.com/docs/blog_post_mortem.html) |
| source-map: JS после правок алгоритма | Отставание от Rust/Wasm лишь 15 % в SpiderMonkey, вровень в V8 | [Egorov, 2018](https://mrale.ph/blog/2018/02/03/maybe-you-dont-need-rust-to-speed-up-your-js.html) |
| WasmGC (Dart, Kotlin, Java) на V8 M137+ | 1,59× на микробенчмарках Dart, 1–8 % на крупных приложениях | [Lehmann, Liedtke, 2025](https://v8.dev/blog/wasm-speculative-optimizations) |

Прогрев: Liftoff быстрее Ignition и Sparkplug, поэтому Wasm выигрывает, когда скорость нужна сразу, а не на пике против TurboFan — [Surma, 2021](https://surma.dev/things/js-to-asc/).
AssemblyScript: `Array.push` с перевыделением на каждом шаге дал замедление в 80× (исправлено в ASC 0.18.31); рекомендуются `unchecked()`, `StaticArray`, `-O3`.
Данные 2021 г.; автор просит не обобщать.
Актуальных замеров AssemblyScript 2025–2026 гг. нет.

Граница JS/Wasm: частые мелкие вызовы и передача строк съедают выигрыш, поэтому делайте крупные вызовы с буферами и используйте JS String Builtins.
Удаление glue-кода дало минус 45 % времени применения DOM-изменений (Dodrio/TodoMVC, эксперимент 2020), прямой вызов близок к 2× (эксперимент) `[не проверено]`.
Прямого доступа к DOM из Wasm в браузерах пока нет — [Hunt, 2026](https://hacks.mozilla.org/2026/02/making-webassembly-a-first-class-language-on-the-web/); [Component Model 1.0](https://bytecodealliance.org/articles/the-road-to-component-model-1-0); [JS builtins, MDN](https://developer.mozilla.org/en-US/docs/WebAssembly/Guides/JavaScript_builtins).

Куда стоит переносить в Wasm: код с большими числовыми буферами и редкими крупными вызовами (кодеки, физика, обработка изображений, парсеры).
DOM-тяжёлый код выигрыша не даст.
Порядок: сначала оптимизировать JS и структуры данных (см.
[Данные и алгоритмы](#данные-и-алгоритмы)), замерить, и только потом портировать.
Нативные расширения на Node — в node-knowledge.

`[устарело]` asm.js: SpiderMonkey опубликовал в мае 2026 г. пост о прекращении поддержки; прочитан только заголовок и анонс, замена — WebAssembly — [Saying goodbye to asm.js, 2026](https://spidermonkey.dev/blog/2026/05/20/saying-goodbye-to-asmjs.html) `[не проверено]`.

### WebGPU compute

Для массивных вычислений над числами: умножение матриц выгоднее на GPU при размере больше 256×256.
Чтение результата асинхронное, через `mapAsync`; его цена в источнике не измерена.
Малые размеры не окупаются — [Beaufort](https://developer.chrome.com/docs/capabilities/web-apis/gpu-compute).

---

## Браузер и Core Web Vitals

Вывод: пороги Core Web Vitals не менялись (LCP ≤ 2,5 с, INP ≤ 200 мс, CLS ≤ 0,1 на 75-м перцентиле), а LCP и INP измеримы во всех основных движках с декабря 2025 г.
Главные рычаги: разбивка длинных задач через `scheduler.yield`, ранняя доступность LCP-ресурса и отсутствие принудительных layout.
Вёрстка и компонентные приёмы — в [frontend.md](frontend.md).

### Метрики и пороги

| Метрика | Хорошо | Плохо | Источник |
|---|---|---|---|
| LCP | ≤ 2,5 с | — | [Web Vitals, web.dev](https://web.dev/articles/vitals) |
| INP | ≤ 200 мс | > 500 мс | [Web Vitals](https://web.dev/articles/vitals); [Optimize INP](https://web.dev/articles/optimize-inp) |
| CLS | ≤ 0,1 | — | [Web Vitals](https://web.dev/articles/vitals) |

Значения берутся на 75-м перцентиле, отдельно для мобильных и десктопа; страница обновлена в 2024 г.
Утверждение о смене методики INP в 2026 г. есть только на одном сайте — [webvitals.tools](https://webvitals.tools/blog/google-core-web-vitals-update-2026/) `[не проверено]`.
`[устарело]` FID заменён на INP.

Поддержка в браузерах:

- LCP и INP стали Baseline Newly available в декабре 2025 г. с Safari 26.2 — [Andrew, 2025](https://web.dev/blog/web-platform-12-2025).
- В реализации INP у Safari есть ошибки, завышающие значения — [RUMvision](https://www.rumvision.com/blog/safari-catching-up-inp-and-lcp-support-in-the-same-beta-release/) `[не проверено]`.
  - `interactionId` в Firefox появился в 144 — [RUMvision](https://www.rumvision.com/blog/firefox-ships-inp-support/) `[не проверено]`.
  - В отчётах разделяйте Chrome и остальные браузеры: значения INP между движками сопоставимы не полностью.
- Soft Navigations включены по умолчанию с Chrome 151; в CrUX метрики экспериментальные, перевод в стабильные запланирован на май 2027 г. — [Chrome, обновлено сентябрь 2026](https://developer.chrome.com/docs/web-platform/soft-navigations).
- Состояние веба: страницы с хорошими CWV — 56 % десктоп, 48 % мобильные; INP хорош у 97 % десктоп и 77 % мобильных; медиана TBT на мобильных 1916 мс, рост на 58 % (лабораторные данные) — [Web Almanac 2025: Performance, 2026](https://almanac.httparchive.org/en/2025/performance).

### Длинные задачи и INP

Разбивайте работу и уступайте через `scheduler.yield()` с фолбэком на `setTimeout`; уступать стоит спустя примерно 50 мс работы.
`yield` ставит продолжение перед другими задачами, `setTimeout` идёт в конец очереди и после пяти вложенных вызовов получает минимум 5 мс.
Разбиение на функции внутри одного вызова ничего не даёт — [Wagner, Kenny](https://web.dev/articles/optimize-long-tasks); [Use scheduler.yield()](https://developer.chrome.com/blog/use-scheduler-yield).

```ts
const yieldToMain = (): Promise<void> =>
  "scheduler" in globalThis && "yield" in (globalThis as any).scheduler
    ? (globalThis as any).scheduler.yield()
    : new Promise((resolve) => setTimeout(resolve, 0));
```

Это безопасно внедрять уже сейчас: при отсутствии API страница всё равно уступает поток. Поддержка в Safari: источник говорит, что её нет; на ноябрь 2026 проверено только через страницу web.dev с динамическим виджетом поддержки и вторичный источник.

`[устарело]` `isInputPending`: может ошибочно возвращать `false`, статус Discouraged, только Chromium 87+. Замена: `scheduler.yield` или `postTask` — [web-features](https://web-platform-dx.github.io/web-features-explorer/features/is-input-pending); [Optimize long tasks](https://web.dev/articles/optimize-long-tasks).

Диагностика: LoAF (Chrome 123) показывает `blockingDuration` и `scripts` со временем forced layout и атрибуцией от 5 мс. Firefox и Safari на момент статьи не поддерживают; в Worker и кросс-доменных iframe атрибуция ограничена — [Chrome: LoAF](https://developer.chrome.com/docs/web-platform/long-animation-frames).

### Layout и DOM

- Принудительные layout: сначала все чтения, затем запись.
  - Список вызовов, форсирующих layout, у Paul Irish обновлялся в 2020 г., сверяйте с DevTools — [Irish](https://gist.github.com/paulirish/5d52fb081b3570c81e3a); [Wagner, Lewis, Pollard](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing).
- `content-visibility: auto` требует резерва размера через `contain-intrinsic-size` — [Kravets, Wagner, Levin, 2020](https://web.dev/articles/content-visibility).
- Большой DOM: Lighthouse предупреждает при 800 узлах, избыточным считает 1400 — [Wagner](https://web.dev/articles/dom-size-and-interactivity).
- Анимации: слои сами могут создавать проблемы — [Basques, Andrew](https://web.dev/articles/animations-guide); [Web Almanac 2025](https://almanac.httparchive.org/en/2025/performance).
- Селекторы CSS: мерить через SelectorStats, современные селекторы не отвергать заранее, Shadow DOM помогает — [Lawson, 2023](https://nolanlawson.com/2023/01/17/my-talk-on-css-runtime-performance/).

### LCP: картинка и загрузка

- Ориентировочные доли LCP: TTFB около 40 %, задержка загрузки меньше 10 %, загрузка около 40 %, рендер меньше 10 % — [Walton, Pollard](https://web.dev/articles/optimize-lcp); [Osmani и др.](https://web.dev/articles/fetch-priority).
- Lazy loading LCP-картинки: у таких страниц 75-й перцентиль LCP 3546 мс против 2922 мс (корреляция); в A/B-тесте на WordPress отключение улучшило LCP архивных страниц на 13–18 %.
- 16–17 % страниц всё ещё лениво грузят LCP-изображение — [Arntz, Viscomi, 2021](https://web.dev/articles/lcp-lazy-loading).
  - Самая дешёвая правка по охвату: снять `loading="lazy"` и задать `fetchpriority`.
- Шрифты и картинки: советы в таблице выше; [Hempenius, Pollard](https://web.dev/articles/font-best-practices), [web.dev: images](https://web.dev/learn/performance/image-performance).

### Навигация и кэш

- bfcache: 1 из 10 десктопных и 1 из 5 мобильных навигаций — назад/вперёд; 23 % сайтов используют `no-store` — [Walton, Pollard](https://web.dev/articles/bfcache); [Web Almanac 2025](https://almanac.httparchive.org/en/2025/performance).
- Speculation Rules: лимиты Chrome 10 (`immediate`) и 2 (`conservative`), отключено при Save-Data и энергосбережении; не для запросов со сменой состояния — [Chrome](https://developer.chrome.com/docs/web-platform/implementing-speculation-rules); [Prerender](https://developer.chrome.com/docs/web-platform/prerender-pages).
- Service Worker замедляет навигацию: Static Routing API (Chrome 123) направляет маршрут без запуска SW; чисел нет — [Andrew](https://developer.chrome.com/blog/service-worker-static-routing).
- Кэш: хэшированные имена, `max-age=31536000, immutable`, `no-cache` для HTML — [Roberts, 2019/2025](https://csswizardry.com/2019/03/cache-control-for-civilians/).
- HTTP/3: умеренные улучшения для большинства, заметные для худших 1–10 % пользователей; экономия около одного RTT к TLS 1.3 — [Marx, 2021](https://www.smashingmagazine.com/2021/08/http3-performance-improvements-part2/).
  - На CDN HTTP/3 используют 29 % HTML-запросов мобильных страниц, на origin 0 % — [Web Almanac 2025: CDN, 2026](https://almanac.httparchive.org/en/2025/cdn).

---

## Доставка JavaScript

Вывод: самая дешёвая оптимизация доставки — меньше JS.
P75 на мобильных около 1,3 МиБ при бюджете Рассела для 3 секунд 0,3–0,62 МиБ.
Бандлирование остаётся полезным и под HTTP/2 (замер на CSS; для JS логика та же, отдельного замера нет), общий CDN-кэш между сайтами не работает, Brotli для статики и zstd для динамики дополняют друг друга.

### Бюджет

Бюджет при P75: 3 с — 0,3 МиБ JS (15 % бюджета) или 0,62 МиБ JS (50 %); 5 с — 0,57 / 1,15 МиБ.
Опорные устройства Galaxy A24, канал 9 Мбит и 100 мс.
P75 JS сейчас около 1,3 МиБ, более чем вдвое выше 2015 г.
Бюджет считается для двух TLS-соединений, сжатие в источнике не уточнено — [Russell, 2025](https://infrequently.org/2025/11/performance-inequality-gap-2026/).
Медианный вес JS 646 КБ на мобильных и 708 КБ на десктопе; значения общего веса страницы в источниках различаются — [Web Almanac 2025: Page Weight, 2026](https://almanac.httparchive.org/en/2025/page-weight).

### Бандлы и дробление

- Расчёт Roberts (1 файл против 12) дан в таблице; при большом бандле остаётся вопрос кэша, если обновляется один модуль — [Roberts, 2023](https://csswizardry.com/2023/10/the-three-c-concatenate-compress-cache/).
- Рекомендация разбивать бандлы больше 50–100 кБ из статьи 2019 г. с замером Roberts расходится — [Osmani, Bynens, 2019](https://v8.dev/blog/cost-of-javascript-2019).
  - Компромисс: делить по маршрутам и крупным функциям, не на сотни файлов.
- ESM прямо с CDN без сборки подходит прототипам и малым приложениям.
  - Общий кэш между сайтами не работает из-за партиционирования (Chrome 86+) — [Kitamura](https://developer.chrome.com/blog/http-cache-partitioning).
  - Структура приложения — в [architecture.md](architecture.md).

### Код-кэш V8

Стабильные URL, детерминированное исполнение, скрипты ≥1 КиБ, не инлайнить.
Код-кэш включается при повторных визитах в течение 72 часов и не требует правок кода; любой новый деплой обнуляет его.
Хуже всего частые деплои, инлайновые скрипты и недетерминированные ветки — [Swirski, 2019/2020](https://v8.dev/blog/code-caching-for-devs); [Osmani, Bynens, 2019](https://v8.dev/blog/cost-of-javascript-2019).
Сочетание с [Explicit Compile Hints](#explicit-compile-hints): хинт помогает на первом визите, кэш — на повторных.

### Сторонние скрипты и гидратация

- Цена фреймворка: учитывайте CPU-скрипты на мобильных, а не только вес.
  - Медиана 2020 г.: React 9287 мс, Angular 4118 мс, Vue 4100 мс CPU против 2372 мс на всех сайтах.
  - Данные 2020 г. без контроля причин, актуальные версии не отражены — [Kadlec, 2020](https://timkadlec.com/remembers/2020-04-21-the-cost-of-javascript-frameworks/).

### Сжатие

- zstd для динамических ответов, где высокий Brotli не успевает; Brotli заранее для статики.
  - На CDN zstd вырос с 3 % до 12 % за год, Brotli 46 %, gzip 42 %.
  - Браузеры шлют zstd только по HTTPS — [Web Almanac 2025: CDN](https://almanac.httparchive.org/en/2025/cdn); [web-features](https://web-platform-dx.github.io/web-features-explorer/features/zstd).
- Поддержка zstd: Chrome 123, Firefox 126; Safari 26 или 26.3 в зависимости от источника — [web-features](https://web-platform-dx.github.io/web-features-explorer/features/zstd); [youngju.dev, 2026](https://www.youngju.dev/blog/2026-07-17-content-encoding-zstd-dictionary-transport) `[не проверено]`.
- Compression Dictionary Transport: сжатие против предыдущей версии бандла, до 76 % в примере DebugBear; поддержка Chrome и Edge 130+, данные о Firefox и Safari неоднозначны `[не проверено]`.
  - Нужна поддержка сервера и предыдущая версия у пользователя.
  - Экономия в поиске Google: средний результат 43 % от исходного размера HTML — из вторичного пересказа `[не проверено]` — [Chrome](https://developer.chrome.com/blog/shared-dictionary-compression); [Search dictionaries](https://developer.chrome.com/blog/search-compression-dictionaries); [DebugBear](https://www.debugbear.com/blog/shared-compression-dictionaries); [MDN](https://developer.mozilla.org/docs/Web/HTTP/Guides/Compression_dictionary_transport).

---

## Мифы об оптимизации

Вывод: большая часть «оптимизаций» эпохи Crankshaft утратила смысл, а у пулов объектов и кэширования длины массива нет современных контролируемых подтверждений. Проверяйте каждое правило измерением на целевом движке (методика — [benchmarking.md](benchmarking.md)); микробенчмарки сами вводят в заблуждение.

| Утверждение | Вердикт | Доказательства | Что делать вместо |
|---|---|---|---|
| `try/catch` убивает оптимизацию | `[устарело]` | Ограничение относилось к Crankshaft; TurboFan оптимизирует — [V8, 2017](https://v8.dev/blog/launching-ignition-and-turbofan) | Использовать `try/catch` где нужен |
| «Optimization killers» | `[устарело]` | Страница помечена: «All this is wrong in TurboFan (Node 8+)» — [Bluebird wiki, 2018](https://github.com/petkaantonov/bluebird/wiki/Optimization-killers) | Профилирование |
| Кэшировать `length` в `for` | Значимого подтверждения нет | В замере 2026 г. вариант с кэшем лишь немного лучше — [Suren, 2026](https://waspdev.com/articles/2026-01-01/javascript-for-of-loops-are-actually-fast) `[не проверено]`; старый материал про мобильные браузеры без хойстинга — [eternalcoding](https://www.eternalcoding.com/javascript-shoud-i-have-to-cache-my-arrays-length) `[устарело]` | Писать как удобно, менять по профилю |
| Пулы объектов нужны везде | Преувеличено | Цена scavenger зависит от выживших, короткоживущие объекты дёшевы — [Marshall, 2019](https://v8.dev/blog/trash-talk) | Пул при подтверждённых паузах GC в цикле кадра; для сущностей в играх и визуализации оправдан — [A-Frame pool](https://aframe.io/docs/1.7.0/components/pool.html) |
| Wasm всегда быстрее JS | Неверно | [Surma, 2021](https://surma.dev/things/js-to-asc/); [Zaplib](https://zaplib.com/docs/blog_post_mortem.html); [Egorov, 2018](https://mrale.ph/blog/2018/02/03/maybe-you-dont-need-rust-to-speed-up-your-js.html) | Сначала профилировать и оптимизировать JS |
| Worker ускоряет работу | Неверно | Работа занимает столько же времени, главный поток свободен — [Surma, 2019](https://surma.dev/things/when-workers/) | Worker ради отзывчивости |
| HTTP/2 отменил бандлинг | Неверно | 1 файл быстрее и легче 12 (замер на CSS Bootstrap) — [Roberts, 2023](https://csswizardry.com/2023/10/the-three-c-concatenate-compress-cache/) | Разумное число чанков |
| Популярная библиотека с CDN уже в кэше пользователя | `[устарело]` с Chrome 86 | Кэш партиционирован по сайту, промахи +3,6 % — [Kitamura](https://developer.chrome.com/blog/http-cache-partitioning) | Сравнить self-hosting и CDN замером |
| Лениво грузить всё | Вредно для LCP | [Arntz, Viscomi, 2021](https://web.dev/articles/lcp-lazy-loading) | Lazy только вне начального экрана |
| HTTP/3 сразу ускоряет всех | Преувеличено | Эффект в основном у хвоста медленных сетей — [Marx, 2021](https://www.smashingmagazine.com/2021/08/http3-performance-improvements-part2/) | Включить, но не ждать роста у всех |
| `WeakRef` чинит утечки | Неверно | Нет гарантий момента сборки — [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakRef) | Убрать удерживающую ссылку |
| Победа на бенчмарке равна реальной пользе | Сомнительно | Баг в Box2DWeb давал +15 % на Octane без пользы в реальности — [Retiring Octane, 2017](https://v8.dev/blog/retiring-octane); неверная конфигурация оболочки обесценивает замеры — [Gaudet, 2026](https://spidermonkey.dev/blog/2026/04/13/benchmark-mode.html) | Тесты на реальных данных и нескольких движках |
| CSS-селекторы — главный тормоз | Без контекста неверно | Рекомендация — мерить через SelectorStats — [Lawson, 2023](https://nolanlawson.com/2023/01/17/my-talk-on-css-runtime-performance/) | Искать дорогие места в DevTools |

---

## Спорные места и пробелы

- Индекс v8.dev заканчивается постом от 4 августа 2025 г.; постов V8 за 2026 г. не найдено. Статус Turbolev по умолчанию и результаты JetStream 3 первичным источником не подтверждены; включён ли Maglev по умолчанию на Android, неизвестно.
- Измеренной разницы между мономорфным, полиморфным и мегаморфным доступом для современных V8 нет, только качественные описания.
- Контролируемых замеров цены декораторов (размер и время) нет; единственная цифра (сокращение кода на 42 %) без методики и не приводится.
  - Данных о tree-shaking TS `namespace` нет.
  - Поведение бандлеров на `import * as` в 2026 г. не проверено: пример web.dev опирается на webpack 2018 г.
  - Кросс-файловый инлайнинг enum в esbuild и swc не описан.
- Достоверного сравнения `+=` и `Array.join` на современных V8 нет; точки перехода `includes` → `Set` без надёжного измерения нет; замеров Iterator helpers и генераторов на современных движках нет; контролируемого сравнения объектов и typed arrays между движками нет.
- Количественной оценки современных пауз Scavenger в браузерах нет; новые возможности панели Memory в 2026 г. не подтверждены (страница снимков упоминает лишь эксперименты Chrome 123).
- Нет надёжной текущей цифры стоимости вызова JS↔Wasm; нет актуальных замеров AssemblyScript 2025–2026; нет сравнения wasm-bindgen и Component Model для прямого DOM-доступа.
- Interop 2026: официального списка требований по метрикам не найдено. Поддержка `scheduler.yield` в Safari на ноябрь 2026 не подтверждена надёжно. Список вызовов, форсирующих layout, мог устареть.
- Нет свежих контролируемых данных об ESM-бандлах на CDN (esm.sh и аналоги) против сборки; нет строгого сравнения Brotli и zstd по скорости сервера на типичных JS-ассетах.
