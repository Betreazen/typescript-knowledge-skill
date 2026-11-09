# TypeScript с UI-фреймворками

Справочник по TypeScript во фронтенд-фреймворках: React, Next.js, React Router, TanStack Start, Astro, Qwik, Vue и Nuxt, Angular, Svelte и SvelteKit, SolidJS, Lit, Preact, а также библиотеки состояния, формы, таблицы и стили. Для каждого фреймворка даны текущая версия, идиоматичная типизация, таблица «симптом → техника → источник» и инструменты измерения. Состояние знаний на ноябрь 2026. Версии сняты командой `npm view` 8 ноября 2026; цифры вендоров помечены. Пометки: `[устарело]` — рядом названа замена; `[не проверено]` — утверждение держится на одном вторичном источнике. Общую браузерную технику (INP, LCP, виртуализация, разделение кода) см. в [performance.md](performance.md), методику замеров — в [benchmarking.md](benchmarking.md), настройку компилятора и tsconfig — в [toolchain.md](toolchain.md), типовые приёмы — в [types-patterns.md](types-patterns.md), тесты компонентов — в [testing.md](testing.md).

- [Версии на ноябрь 2026](#версии-на-ноябрь-2026)
- [Совместимость с TypeScript 7](#совместимость-с-typescript-7)
- [Сравнение по замерам](#сравнение-по-замерам)
- [React](#react)
- [Метафреймворки](#метафреймворки)
- [Vue и Nuxt](#vue-и-nuxt)
- [Angular](#angular)
- [Svelte и SvelteKit](#svelte-и-sveltekit)
- [SolidJS, Lit и Preact](#solidjs-lit-и-preact)
- [Состояние и серверные данные](#состояние-и-серверные-данные)
- [Формы и таблицы](#формы-и-таблицы)
- [Стилизация](#стилизация)
- [Антипаттерны UI](#антипаттерны-ui)
- [Чеклист ревью UI-кода](#чеклист-ревью-ui-кода)
- [Спорные места и пробелы](#спорные-места-и-пробелы)

---

## Версии на ноябрь 2026

За 2026 год почти весь стек перешёл на новые мажоры: React Router 8, Astro 7, Angular 22, SvelteKit 3, Preact 11, Jotai 3, Pinia 4, TanStack Table 9, TypeScript 7. Vue 3.6 (Vapor), Solid 2 и Qwik 2 остаются в стадии RC. Для проектов с шаблонами TypeScript 7 пока не везде применим, см. следующий раздел.

Все строки таблицы получены командами `npm view <pkg> version` и `time[<version>]` 2026-11-08.

| Пакет | Версия | Дата публикации | Примечание |
|---|---|---|---|
| react / react-dom | 19.3.1 | 2026-10-14 | |
| babel-plugin-react-compiler | 1.0.0 | 2025-10-07 | `latest` не менялся больше года |
| eslint-plugin-react-hooks | 7.1.1 | 2026-04-17 | |
| next | 16.4.5 | 2026-11-03 | |
| react-router | 8.5.1 | 2026-10-27 | |
| @remix-run/react | 2.17.5 | 2026-06-01 | `[устарело]`, линия v2; замена — React Router 8 |
| @tanstack/react-start | 1.169.5 | 2026-11-08 | |
| astro | 7.4.7 | 2026-11-05 | |
| @builder.io/qwik | 1.20.3 | 2026-10-25 | стабильная линия |
| @qwik.dev/core | 2.0.0-rc.4 | 2026-10-25 | RC |
| vue | 3.5.45 | 2026-11-05 | тег `rc`: 3.6.0-rc.14 |
| pinia | 4.1.0 | 2026-10-14 | |
| nuxt | 4.6.4 | 2026-11-02 | |
| vue-tsc | 3.3.14 | 2026-10-29 | |
| @angular/core | 22.2.5 | 2026-11-06 | |
| svelte | 5.57.3 | 2026-10-26 | |
| @sveltejs/kit | 3.1.1 | 2026-10-29 | |
| svelte-check | 4.7.8 | 2026-11-01 | |
| solid-js | 1.9.18 | 2026-10-29 | тег `next`: 2.0.0-rc.21 |
| lit | 3.3.3 | 2026-05-14 | |
| preact | 11.2.0 | 2026-11-06 | |
| @preact/signals | 2.11.4 | 2026-10-27 | |
| @tanstack/react-query | 5.107.1 | 2026-11-06 | |
| swr | 2.5.1 | 2026-08-12 | |
| zustand | 5.1.0 | 2026-11-06 | |
| jotai | 3.0.1 | 2026-09-29 | |
| @reduxjs/toolkit | 2.14.0 | 2026-11-03 | |
| react-redux | 9.3.1 | 2026-10-27 | |
| mobx | 7.1.5 | 2026-11-06 | |
| xstate | 5.33.4 | 2026-11-07 | |
| valtio | 2.3.2 | 2026-05-01 | |
| nanostores | 1.5.5 | 2026-10-06 | |
| react-hook-form | 7.91.0 | 2026-10-23 | |
| @tanstack/react-form | 1.33.5 | 2026-08-11 | |
| @tanstack/react-table | 9.3.1 | 2026-10-12 | |
| @tanstack/react-virtual | 3.14.26 | 2026-11-03 | |
| tailwindcss | 4.3.5 | 2026-11-06 | |
| @vanilla-extract/css | 1.21.3 | 2026-10-08 | |
| @pandacss/dev | 2.5.0 | 2026-11-02 | |
| @stylexjs/stylex | 0.19.1 | 2026-09-15 | |
| styled-components | 6.6.0 | 2026-10-12 | |
| @emotion/react | 11.14.0 | 2024-12-09 | релизов почти два года нет |
| typescript | 7.0.2 | 2026-07-08 | тег `beta`: 7.1.0-beta |
| @welldone-software/why-did-you-render | 10.0.1 | 2025-01-20 | |

Даты релизов из первичных источников:

| Событие | Дата | Источник |
|---|---|---|
| React 19.3: стабильные View Transitions и Fragment Refs, `browser()`, Trusted Types | 9 сентября 2026 | [React 19.3](https://react.dev/blog/2026/09/09/react-19-3) |
| Next.js 16.4: Cache Components включены по умолчанию в `create-next-app`, станут умолчанием в Next.js 17 | 6 октября 2026 | [Next.js 16.4](https://nextjs.org/blog/next-16-4.md) |
| React Router 8.0: только ESM, Node 22.22+, React 19.2.7+, Vite 7+ | 17 июня 2026 | [React Router v8](https://remix.run/blog/react-router-v8) |
| TanStack Start 1.0 объявлен стабильным | 13 октября 2026 | [TanStack Start 1.0](https://tanstack.com/blog/tanstack-start-1-0) |
| Astro 7.0 (во вторичных источниках встречается 7 июля, официальный блог указывает июнь) | 22 июня 2026 | [Astro 7](https://astro.build/blog/astro-7/) |
| Angular 22 (статья Telerik датирована 5 июня; точная дата 22.0 не подтверждена) | начало июня 2026 | [Angular 22 evolution](https://www.telerik.com/blogs/angular-22-evolution-modern-angular) |
| SvelteKit 3.0 | 1 октября 2026 | [SvelteKit 3 is here](https://svelte.dev/blog/sveltekit-3-is-here) |
| Solid 2.0 Beta, стадия Alpha пропущена | 15 мая 2026 | [SolidJS 2.0 async (InfoQ)](https://www.infoq.com/news/2026/05/solidjs-2-async/); первичный текст — [v2.0.0 Beta](https://github.com/solidjs/solid/releases/tag/v2.0.0-beta.0) |

Рекомендация «всегда брать latest» неприменима к компилятору React: команда React советует фиксировать точную версию, а тег `latest` не обновлялся с октября 2025.

---

## Совместимость с TypeScript 7

Для проектов с шаблонами (Angular, Vue, Svelte, Astro, MDX) безопасная конфигурация на ноябрь 2026: TS 6.x для редактора и шаблонных чекеров, TS 7 как быстрый CLI для `.ts`-файлов там, где инструмент это допускает. Смешанный режим поддерживает официальный пакет `@typescript/typescript6`. У TS 7.0 нет программного API, и именно это блокирует шаблонные чекеры.

| Инструмент | Статус с TS 7 | Источник |
|---|---|---|
| TypeScript 7.0 | Нет программного API; инструменты Vue, MDX, Astro, Svelte «скорее всего пока не смогут» использовать TS 7, проверка шаблонов Angular тоже. Для редактора предлагается TS 6.0, для CLI — `tsc` из TS 7; `@typescript/typescript6` даёт `tsc6` и API 6.0; новый API ожидается в 7.1 | [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) |
| Angular 22.0 | Peer-диапазон TypeScript `>=6.0.0 <6.1.0`, то есть TS 7 по версии не проходит | [Angular version compatibility](https://angular.dev/reference/versions) |
| Компилятор Angular под tsgo | Прототип | [Angular roadmap](https://angular.dev/roadmap) |
| vue-tsc | Поддержка TS 7 с 3.3.8 (22 июля); в 3.3.14 исправлена совместимость с TS 7.1 | [vuejs/language-tools releases](https://github.com/vuejs/language-tools/releases) |
| Next.js | По умолчанию проверяет типы локальным `tsc`, поэтому TS 7 работает при `next build`; JS API включается через `experimental.useTypeScriptCli: false` | [Next.js TypeScript](https://nextjs.org/docs/app/api-reference/config/typescript) |
| SvelteKit 3 | Минимум Node 22.17, TypeScript 6, Svelte 5.56.4, Vite 8 | [Migrating to SvelteKit 3](https://next.svelte.dev/docs/kit/migrating-to-sveltekit-3/llms.txt) |

Причина блокировки у Angular и ESLint — отсутствие Programmatic Compiler API в 7.0. Прогноз о бэкпорте поддержки в Angular 22.2/22.3 является предположением автора статьи `[не проверено]` — [Why Angular, Vue and ESLint can't upgrade](https://dev.to/the-modern-web/why-angular-vue-and-eslint-cant-upgrade-to-typescript-70-yet-and-why-ts-71-changes-441g).

---

## Сравнение по замерам

Лабораторный и полевой рейтинги отвечают на разные вопросы и расходятся. По операциям с DOM лидируют Vue Vapor, Solid и Svelte. В полевых Core Web Vitals лидирует Astro, ниже идут Preact и Svelte, а React, Vue и Angular оказываются ниже среднего по вебу. Ни один из наборов не доказывает причинность, поэтому выбор фреймворка по этим таблицам нельзя считать обоснованным без замера на своём приложении. Общие правила интерпретации замеров — в [benchmarking.md](benchmarking.md).

### js-framework-benchmark, прогон Chrome 156

Релиз `chrome156` опубликован 25 октября 2026 — [Release chrome156](https://github.com/krausest/js-framework-benchmark/releases/tag/chrome156). Сырые данные — [results.ts](https://raw.githubusercontent.com/krausest/js-framework-benchmark/master/webdriver-ts-results/src/results.ts), веса — [Common.ts](https://raw.githubusercontent.com/krausest/js-framework-benchmark/master/webdriver-ts-results/src/Common.ts). Официальная страница результатов — [current.html](https://krausest.github.io/js-framework-benchmark/current.html).

Оговорка. Числа ниже получены пересчётом из сырых результатов, а не скопированы с сайта, поэтому возможны небольшие расхождения с официальной страницей. Метод: средние значения `total`, отношение к лучшему результату среди 207 реализаций, для CPU взвешенное геометрическое среднее с весами из `Common.ts`, для памяти и столбца «размер и старт» невзвешенное (несжатый размер, сжатый размер, first paint). Меньше значит лучше. Версии в таблице отстают от текущих (solid 1.9.3, svelte 5.42.1, react 19.0–19.2), поэтому результаты React 19.3 и Svelte 5.57 неизвестны.

| Реализация | CPU | Память | Размер и старт |
|---|---|---|---|
| vanillajs-lite | 1,02 | 1,04 | 1,39 |
| vue-vapor 3.6.0-rc.5 | 1,12 | 1,64 | 8,75 |
| inferno 10.0.0 | 1,12 | 1,33 | 5,07 |
| solid 1.9.3 | 1,14 | 1,29 | 2,74 |
| solid-next 2.0.0-rc.18 | 1,14 | 1,64 | 8,92 |
| svelte 5.42.1 | 1,19 | 1,49 | 5,01 |
| lit 3.2.0 | 1,29 | 1,46 | 4,01 |
| vue 3.5.39 | 1,29 | 1,93 | 10,22 |
| preact-classes 11.0.0 | 1,31 | 1,47 | 3,55 |
| preact-signals 11.0.0 + 2.3.1 | 1,39 | 3,76 | 4,46 |
| vue-pinia 3.5.39 + 3.0.4 | 1,43 | 2,15 | 10,80 |
| react-hooks 19.2.0 | 1,56 | 2,64 | 25,51 |
| astro-react 6.3.3 + 19.2.6 | 1,58 | 2,73 | 16,15 |
| angular control flow, без зон, 22.2.2 | 1,59 | 2,30 | 15,53 |
| angular control flow, с зонами, 22.2.2 | 1,60 | 3,07 | 19,97 |
| react-compiler-hooks 19.0.0 | 1,60 | 2,65 | 24,78 |
| angular signals, без зон, 22.2.2 | 1,61 | 2,32 | 15,27 |
| preact-hooks 11.0.0 | 1,62 | 1,44 | 3,33 |
| react-zustand 19.0.0 + 5.0.2 | 1,67 | 2,96 | 24,78 |
| react-mobX 19.0.0 + 6.13.5 | 1,70 | 3,43 | 32,12 |
| react-redux-hooks 19.0.0 + 9.2.0 | 1,72 | 2,98 | 25,01 |
| react-redux 19.0.0 + 9.2.0 | 2,04 | 3,53 | 26,19 |
| qwik 1.20.2 | 3,38 | 4,70 | 12,47 |

Ограничения самого бенчмарка (README): продолжительность включает рендер; с Chrome 118 итог считается как взвешенное геометрическое среднее; с прогона Chrome 156 допускаются только keyed-реализации; `vanillajs` является базовой линией, а не образцом; ручные манипуляции DOM и подобные приёмы получают пометки; снимок current может быть хуже по качеству — [js-framework-benchmark](https://github.com/krausest/js-framework-benchmark). Бенчмарк тестирует одну таблицу и не покрывает SSR, гидратацию, маршрутизацию и реальные деревья компонентов.

Что из таблицы следует:

| Наблюдение | Числа | Оговорка |
|---|---|---|
| Vapor даёт самый заметный выигрыш внутри одного фреймворка | CPU 1,29 → 1,12, память 1,93 → 1,64 | Версия 3.6.0-rc.5, не стабильная |
| Заявление Vue о сравнимости Vapor с Solid и Svelte 5 пересчёт подтверждает | 1,12 против 1,14 и 1,19 | Заявление — [Vue core CHANGELOG (minor)](https://raw.githubusercontent.com/vuejs/core/minor/CHANGELOG.md) |
| Отказ от зон в Angular экономит память и размер, скорость почти не меняется | CPU 1,59 и 1,60; память 2,30 против 3,07; размер 15,53 против 19,97 | Версия 22.2.2 |
| Компилятор React не даёт выигрыша на этом бенчмарке | `react-hooks` 1,56, `react-compiler-hooks` 1,60 | В бенчмарке нет лишних рендеров; версии React разные (19.2.0 и 19.0.0), сравнение не чистое |
| Сигналы в Preact экономят рендеры, но заметно увеличивают память | preact-signals 3,76 против preact-hooks 1,44 | Память по этому бенчмарку |

Реализация `astro-v6.3.3` с результатом 1,06 в таблицу не включена: она, вероятно, почти не использует рантайм фреймворка и несопоставима с остальными. Исходник не проверялся.

### HTTP Archive Technology Report (CrUX), сентябрь 2026

Только корреляция. Сама страница отчёта подчёркивает, что корреляция не означает причинности и это не рейтинг фреймворков — [Technology Report](https://httparchive.org/reports/techreport/landing). Данные на уровне origin; технологии определяются на главной и одной внутренней странице. Данные получены запросами к публичному API `https://cdn.httparchive.org/v1/cwv?technology=<имя>&geo=ALL&rank=ALL&start=2026-07-01`, мобильные origin.

| Технология | Origin (n) | Good CWV | LCP | INP | CLS | Good CWV desktop |
|---|---|---|---|---|---|---|
| Все сайты | 8 569 446 | 52,8% | 65,6% | 79,4% | 83,4% | 60,8% |
| Astro | 47 277 | 71,1% | 81,1% | 85,0% | 93,6% | 84,6% |
| Qwik | 1 378 | 62,1% | 86,7% | 72,6% | 85,6% | 92,5% |
| Preact | 380 079 | 55,6% | 70,3% | 81,6% | 82,0% | 60,8% |
| Svelte | 92 950 | 53,6% | 71,4% | 75,3% | 81,9% | 65,7% |
| SvelteKit | 10 065 | 48,3% | 65,0% | 73,4% | 79,3% | 63,1% |
| lit-html | 465 237 | 47,9% | 61,4% | 81,3% | 76,5% | 53,1% |
| React | 1 283 019 | 43,9% | 57,9% | 69,5% | 76,6% | 54,7% |
| Next.js App Router | 271 367 | 38,9% | 54,3% | 60,9% | 78,0% | 61,4% |
| Vue.js | 609 131 | 36,2% | 54,6% | 62,0% | 64,3% | 50,9% |
| Next.js | 395 345 | 35,7% | 53,5% | 59,7% | 73,5% | 56,9% |
| Nuxt.js | 93 276 | 28,8% | 47,2% | 64,1% | 60,0% | 42,2% |
| React Router | 198 071 | 24,3% | 37,7% | 53,3% | 63,7% | 39,2% |
| TanStack Start | 16 650 | 19,3% | 26,3% | 51,4% | 83,7% | 39,2% |
| Angular | 116 296 | 16,5% | 33,0% | 54,6% | 45,3% | 27,2% |
| SolidJS (n мал) | 91 | 79,1% | 90,1% | 84,1% | 92,4% | 80,3% |

Как читать:
- Показатели Lit определяются по `lit-html` и `lit-element`, поэтому в выборку, вероятно, попадают сайты со встроенными виджетами сторонних поставщиков.
- Строки Qwik (n = 1 378) и SolidJS (n = 91) слишком малы для выводов.
- Низкий процент у Angular не стоит приписывать самому фреймворку: популяция включает большой пласт корпоративных и старых приложений.
- Preact в бенчмарке намного меньше React по столбцу размера (3,33 и 25,51), а в CrUX у него выше доля хорошего LCP (70,3% и 57,9%). Связь правдоподобна, причинность из этих данных не выводится.
- Контролируемого исследования, отделяющего эффект фреймворка от состава сайтов, нет.

### Другие полевые данные

| Источник | Что в нём | Оговорка |
|---|---|---|
| Web Almanac 2025, Performance | Good CWV 48% mobile и 56% desktop; INP 77% и 97%; медиана TBT на mobile 1916 мс (+58% к 1209 мс), desktop 92 мс; рост TBT при улучшении INP глава называет противоречием — [Performance 2025](https://almanac.httparchive.org/en/2025/performance) | Фреймворки в главе не названы |
| State of Web Vitals (телефоны, 219 633 сайта) | Доля хорошего LCP: React 84,1%, Svelte 84,0%, Next.js 83,3%, Vue 75,6%, Nuxt 69,7%, Angular 65,0%; Astro в таблице нет — [Frameworks performance](https://www.corewebvitals.io/state-of-cwv/explorer/technologies/frameworks) | Выборка на 69,5% из jQuery; чтение INP и CLS было интерпретацией искажённого текста страницы `[не проверено]`; INP для React (92%) расходится с HTTP Archive (69,5%), расхождение не объяснено |

Цифры «провала CWV» по фреймворкам из [Why 90% of Web Apps Fail Core Web Vitals](https://www.markaicode.com/core-web-vitals-fixes-2025/) использовать нельзя: методика не указана, и они не сходятся с полевыми данными.

---

## React

Компилятор React 1.x снимает большую часть ручной мемоизации внутри компонента, но не отменяет измерений: он не делит результат между компонентами, пропускает библиотеки с внутренней мутабельностью и не лечит нестабильные пропы из внешнего кода. Рабочий набор измерений теперь Performance Tracks плюс Profiler. why-did-you-render с компилятором несовместим. Текущая версия React 19.3.1 (2026-10-14), компилятор 1.0.0.

### React Compiler 1.x: что делает и чего не делает

| Факт | Источник |
|---|---|
| Компилятор 1.0 вышел 7 октября 2025, реализован как Babel-плагин; умеет условную мемоизацию после раннего `return`, чего вручную не сделать; optional chain и индексы массивов добавлены как зависимости | [React Compiler v1.0](https://react.dev/blog/2025/10/07/react-compiler-1) |
| Измерения Meta Quest Store (данные вендора): начальные загрузки и переходы быстрее до 12%, отдельные взаимодействия более чем в 2,5 раза, память нейтрально | там же |
| Поддерживает React 17+; для версий ниже 19 нужны `target` и `react-compiler-runtime` | там же |
| Мемоизируются: повторные рендеры дочерних компонентов (через переиспользование JSX), вычисления внутри компонента или хука, inline-функции в JSX | [Introduction to React Compiler](https://react.dev/learn/react-compiler/introduction) |
| Не мемоизируются: обычные функции вне компонентов и хуков | там же |
| Результат не делится между компонентами или хуками: дорогая функция, вызванная в N местах, выполнится N раз | там же |
| `eslint-plugin-react-compiler` `[устарело]`, замена — `eslint-plugin-react-hooks@latest`, пресеты `recommended` и `recommended-latest` | [React Compiler v1.0](https://react.dev/blog/2025/10/07/react-compiler-1) |
| Пресет `recommended` содержит 17 правил, среди них `incompatible-library`, `preserve-manual-memoization`, `purity`, `refs`, `set-state-in-effect`, `set-state-in-render`, `static-components`, `unsupported-syntax`; на неподдерживаемом паттерне компилятор пропускает только этот компонент | [eslint-plugin-react-hooks](https://react.dev/reference/eslint-plugin-react-hooks) |
| Библиотекам рекомендуется публиковать уже скомпилированный код; тесты прогонять и на скомпилированной, и на исходной версии | [Compiling Libraries](https://react.dev/reference/react-compiler/compiling-libraries) |
| Обновление компилятора может изменить момент срабатывания `useEffect`; без хорошего покрытия тестами команда советует фиксировать точную версию | [React Compiler v1.0](https://react.dev/blog/2025/10/07/react-compiler-1) |

Пределы компилятора, о которых надо помнить при ревью:

1. Нет общего кэша между компонентами. Тяжёлое вычисление, которое нужно в нескольких местах, поднимайте в общего родителя или в хук с единственным вызовом.
2. Библиотеки с внутренней мутабельностью компилятор пропускает. Это `watch` из React Hook Form и `useReactTable`; MobX `observer` линтер пока не определяет, нужен `"use no memo"` — [incompatible-library](https://react.dev/reference/eslint-plugin-react-hooks/lints/incompatible-library).
3. Нестабильные объектные пропы из внешнего кода остаются. В реальном приложении на 15 тыс. строк из 9 случаев лишних рендеров компилятор исправил 2 полностью, 5 частично, 2 не исправил; начальная загрузка не изменилась; TBT упал с 280 мс до нуля на одной странице и с 130 до 90 мс на другой. Замер сделан на бете 2024 года, для 1.0 его нужно повторить — [How React Compiler Performs on Real Code](https://www.developerway.com/posts/how-react-compiler-performs-on-real-code); публикация в календаре — [Web Performance Calendar](https://calendar.perfplanet.com/2024/how-does-the-react-compiler-perform-on-real-code/).
4. Независимого бенчмарка компилятора 1.0 на большом приложении с повторяемой методикой нет. Цифры Meta принадлежат вендору, замеры Нади Макаревич относятся к бете.

### Когда ручные memo и useMemo ещё нужны

| Случай | Что делать | Источник |
|---|---|---|
| Стабильная ссылка как зависимость эффекта | `useMemo` как официальный escape hatch | [Introduction to React Compiler](https://react.dev/learn/react-compiler/introduction) |
| `useDeferredValue` | Работает только при `memo` на медленном дочернем компоненте; страница не уточняет поведение при компиляторе | [useDeferredValue](https://react.dev/reference/react/useDeferredValue) |
| Существующая мемоизация в кодовой базе | Не убирать без тестов: удаление меняет вывод компилятора | [Introduction to React Compiler](https://react.dev/learn/react-compiler/introduction) |

Порядок действий при лишних рендерах с компилятором: сначала линтер и `incompatible-library`, затем Performance Tracks в dev для изменённых пропсов, и только потом ручной `memo`.

### Actions, use, Server Components

| Тема | Факт | Источник |
|---|---|---|
| `useActionState` | `useActionState(reducerAction, initialState, permalink?)` возвращает `[state, dispatchAction, isPending]`; вызовы встают в очередь; `isPending` обновляется только внутри Transition; известные ошибки возвращайте как состояние, потому что выброс отменяет очередь | [useActionState](https://react.dev/reference/react/useActionState) |
| `use(promise)` | Можно вызывать условно; в клиентских компонентах промис обязан быть закэширован; оборачивать в `try/catch` нельзя | [use](https://react.dev/reference/react/use) |
| Граница `'use client'` | Сериализуемы примитивы, `Map`, `Set`, `Date`, TypedArray, простые объекты, Server Functions, JSX и промисы; классы и обычные функции нет | [use client](https://react.dev/reference/rsc/use-client) |
| Server Functions | Считать публичными эндпоинтами: контроль доступа и валидация внутри функции | [React Server Components in React Router](https://reactrouter.com/how-to/react-server-components) |
| Безопасность RSC | В декабре 2025 раскрыта критическая уязвимость и позже ещё две | [Critical Security Vulnerability in RSC](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components); [DoS and Source Code Exposure in RSC](https://react.dev/blog/2025/12/11/denial-of-service-and-source-code-exposure-in-react-server-components) |

### Идиоматичная типизация

| Что | Правило | Источник |
|---|---|---|
| `ref` | Обычный проп функционального компонента; `forwardRef` в новом коде React 19 не нужен | [useRef](https://react.dev/reference/react/useRef) |
| Типы React 19 | `useRef()` требует аргумент; ref-колбэк не может неявно возвращать значение; `MutableRefObject` `[устарело]`, замена — единый `RefObject<T>`; пропсы `ReactElement` по умолчанию `unknown`; глобальный `JSX` `[устарело]`, замена — `React.JSX` через `declare module`; `useReducer` не принимает полный тип редьюсера; кодмод `types-react-codemod preset-19` | [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide) |
| Основы | Дискриминируемое объединение для состояния (`useState<RequestState>` с полем `status`); `createContext<T \| null>(null)` плюс хук с проверкой; `React.ChangeEvent<HTMLInputElement>`; `ReactNode` против `ReactElement`; `React.CSSProperties` | [Using TypeScript](https://react.dev/learn/typescript) |
| Расширенные паттерны | `ComponentPropsWithoutRef`, generic-компоненты, дискриминируемые пропсы, полиморфные компоненты | [React TypeScript Cheatsheet: Patterns by usecase](https://react-typescript-cheatsheet.netlify.app/docs/advanced/patterns_by_usecase/) |
| Generic-компонент поверх типизированного маршрута | `function Card<T extends string>({ href }: { href: Route<T> \| URL })` | [Next.js TypeScript](https://nextjs.org/docs/app/api-reference/config/typescript) |

Generic-компонент объявляется обычной функцией с параметром типа и не требует специальных API.

### Симптом → техника → источник

| Симптом | Техника | Источник |
|---|---|---|
| Ввод в поле перерисовывает тяжёлое соседнее дерево | Опустить состояние вниз или передать поддерево как `children` | [Before You memo()](https://overreacted.io/before-you-memo/) |
| Рендер родителя пересчитывает всё поддерево | Понимать рекурсивный рендер; `memo` сразу под провайдером | [A (Mostly) Complete Guide to React Rendering Behavior](https://blog.isquaredsoftware.com/2020/05/blogged-answers-a-mostly-complete-guide-to-react-rendering-behavior/) |
| Подписчики контекста обновляются лишний раз | Разделить данные и API на разные провайдеры | [React re-renders guide](https://www.developerway.com/posts/react-re-renders-guide) |
| Эффект срабатывает повторно с новым объектом | `useMemo` как escape hatch | [Introduction to React Compiler](https://react.dev/learn/react-compiler/introduction) |
| Длинный список, а компилятор ломает виртуализатор | `directDomUpdates: true` или `"use no memo"` | [TanStack Virtual #743](https://github.com/TanStack/virtual/issues/743) |
| Ввод тормозит из-за медленного списка | `useDeferredValue` с `memo` на списке | [useDeferredValue](https://react.dev/reference/react/useDeferredValue) |
| Переключение вкладок блокирует интерфейс | `useTransition`; для контролируемого инпута не подходит | [useTransition](https://react.dev/reference/react/useTransition) |
| Скрытая вкладка теряет состояние | `<Activity mode="hidden">`: эффекты снимаются, состояние и DOM сохраняются, рендер идёт с низким приоритетом | [Activity](https://react.dev/reference/react/Activity) |
| Fallback Suspense мигает при каждом рендере | Кэшировать промис для `use` | [use](https://react.dev/reference/react/use) |
| Очередь Actions копится | `useOptimistic`; для параллельной работы `useState` и `useTransition` | [useActionState](https://react.dev/reference/react/useActionState) |

Изменения 19.3, важные для производительности: Transition рендерятся независимо (#37290), обновления от resize батчатся до следующего кадра, исправлено зависание `useDeferredValue` — [React 19.3](https://react.dev/blog/2026/09/09/react-19-3). Страница `useTransition` по-прежнему утверждает, что несколько Transition батчатся вместе — [useTransition](https://react.dev/reference/react/useTransition). Документы расходятся: опирайтесь на changelog и проверяйте на своей версии.

### Инструменты измерения

| Инструмент | Что важно | Источник |
|---|---|---|
| Performance Tracks | Дорожка Scheduler с приоритетами Blocking, Transition, Suspense и Idle; дорожка Components с флеймграфом; пометка cascading updates; в dev-сборке показаны изменённые пропсы. В продакшене отключены; для прод-подобного замера нужен псевдоним `react-dom/client` → `react-dom/profiling` | [React Performance Tracks](https://react.dev/reference/dev-tools/react-performance-tracks) |
| why-did-you-render `[устарело]` в проектах с компилятором | README: библиотека не тестировалась с компилятором, автор считает её полностью несовместимой. Замена — Performance Tracks и Profiler с записью причин рендера. Без компилятора работает с React 19 | [why-did-you-render](https://github.com/welldone-software/why-did-you-render) |
| Profiler | Миллисекундам в dev-режиме верить нельзя; измерять на продакшен-сборке и слабом железе | [Why React Re-Renders](https://www.joshwcomeau.com/react/why-react-re-renders/) |

---

## Метафреймворки

В Next.js кэширование стало явным и компонентным; главная ловушка сместилась с неявных кэшей на границы `Suspense` и область хранения кэша. По полевым данным наименьшую цену гидратации платит Astro; цифры Next.js и React Router заметно ниже среднего по вебу, но это корреляция (см. [Сравнение по замерам](#сравнение-по-замерам)). Версии: Next.js 16.4.5, React Router 8.5.1, TanStack Start 1.169.5, Astro 7.4.7, Qwik 1.20.3 (стабильный) и 2.0.0-rc.4.

### Next.js 16.x

| Тема | Факт | Источник |
|---|---|---|
| Типизированные маршруты | `typedRoutes: true`, `Route`, глобальные помощники `PageProps`, `LayoutProps`, `RouteContext`, генерация через `next typegen` | [Next.js TypeScript](https://nextjs.org/docs/app/api-reference/config/typescript) |
| `'use cache'` | Работает на уровне данных и UI; аргументы и захваченные значения входят в ключ; без `cacheLife` применяется профиль по умолчанию, команда рекомендует указывать его явно | [Caching](https://nextjs.org/docs/app/getting-started/caching) |
| Старая модель кэширования `[устарело]` | Замена — Cache Components; опции `cacheComponents` и `partialPrefetching` исчезнут в следующем мажоре | там же |
| `ensureStatic`, `navigation()`, `prefetch()` | `ensureStatic` запрещает случайный динамический контент на этапе сборки; `navigation()` и `prefetch()` исключают части из предзагрузки | [Next.js 16.4](https://nextjs.org/blog/next-16-4.md) |
| Turbopack (данные вендора) | Память dev-сервера с 21,5 ГБ до 2 ГБ на vercel.com после вытеснения кэша; холодная и кэшированная сборка 21 с и 9,2 с на nextjs.org; в CI выигрыш есть только при восстановлении `.next/cache` | [Turbopack in Next.js 16.3](https://nextjs.org/blog/next-16-3-turbopack.md) |
| 16.4 | Дисковый кэш меньше на 20–25%, короче имена классов CSS Modules, единый общий runtime | [Next.js 16.4](https://nextjs.org/blog/next-16-4.md) |

Чтобы получить выгоду Cache Components, `await` нужно опускать как можно глубже, поэтому на ревью окупается проверка `await params` в layout.

Симптом → техника → источник (Next.js):

| Симптом | Техника | Источник |
|---|---|---|
| Ошибка blocking-route, чтение без границы | Обернуть в `<Suspense>` или добавить `use cache` | [Caching](https://nextjs.org/docs/app/getting-started/caching) |
| Layout с `await params` выпадает из статической оболочки | Передать промис ниже и дождаться внутри `Suspense` | там же |
| `cookies()` нужен в кэшируемой функции | Вынести значение и передать аргументом либо `use cache: private` | там же |
| Кэш «не работает» на serverless | Память экземпляра эфемерна; `use cache: remote` окупается только при высоком hit rate | там же |
| Рост счёта из-за `<Link prefetch>` | Предзагрузка на ссылку стоит вызова сервера; использовать `navigation()` | там же |
| `lazy()` не уменьшил бандл | Другой модуль импортирует компонент статически; смотреть `next analyze` | [Ship less JavaScript](https://nextjs.org/blog/ship-less-javascript-with-ai.md) |
| Большой initial JS | Анализатор со снапшотами и путём критического рендера; у Vercel снято почти 2 МБ сжатого JS (данные вендора) | там же |

### React Router 8 и Remix

| Тема | Факт | Источник |
|---|---|---|
| Типы | Генерируются для каждого маршрута в `.react-router/types`, импорт из `./+types/<route>`; `Route.LoaderArgs`, `Route.ComponentProps`; `react-router typegen --watch` | [Type Safety](https://reactrouter.com/explanation/type-safety) |
| Версия 8 | Middleware и Split Route Modules включены по умолчанию; RSC остаётся нестабильным | [React Router v8](https://remix.run/blog/react-router-v8) |
| RSC | Экспериментальны, API помечены `unstable_`, возможны ломающие изменения в минорных и патч-версиях | [React Server Components in React Router](https://reactrouter.com/how-to/react-server-components) |
| Remix 2 | `@remix-run/react` 2.17.5 `[устарело]`, замена — React Router 8; Remix 3 всё ещё pre-release | [Remix Newsletter #45](https://remix.run/newsletter/45) |

### TanStack Start и Router

| Тема | Факт | Источник |
|---|---|---|
| Статус | Пост про RC от сентября 2025 `[устарело]`, замена — пост о стабильной 1.0 | [Announcing TanStack Start v1](https://tanstack.com/blog/announcing-tanstack-start-v1) |
| Заявления вендора | Примерно 5,5-кратное увеличение пропускной способности SSR в собственном бенчмарке; RSC поддерживаются, но с tanstack.com их убрали из-за сложности отслеживания того, что уходит на клиент | [TanStack Start 1.0](https://tanstack.com/blog/tanstack-start-1-0) |
| Типы | `ValidateLinkOptions`, `ValidateNavigateOptions`, `ValidateRedirectOptions`; для производительности TS указывать `TRouter` в публичных сигнатурах | [Type Utilities](https://tanstack.com/router/latest/docs/framework/react/guide/type-utilities) |

Независимого сравнения TanStack Start, Next.js и React Router с одинаковой методикой нет. Цифры 5,5x и 9,9x из вторичных блогов отброшены: методика не указана. В CrUX у TanStack Start Good CWV 19,3% при 16 650 origin (корреляция).

### Astro

| Тема | Факт | Источник |
|---|---|---|
| Astro 7 | Компилятор переписан на Rust; сборки быстрее на 15–61% в собственных бенчмарках, astro.build с 62,7 с до 24,2 с; кэширование маршрутов стабильно; разметка больше не исправляется автоматически | [Astro 7](https://astro.build/blog/astro-7/) |
| Острова | Компоненты по умолчанию рендерятся в HTML без JS; `client:load`, `client:idle`, `client:visible`; `server:defer` для серверных островов; острова гидрируются изолированно | [Islands architecture](https://docs.astro.build/en/concepts/islands/) |
| Типы | Интерфейс `Props`, `HTMLAttributes<"a">`, `ComponentProps<typeof X>`, `Polymorphic`; dev-сервер типы не проверяет, нужен `astro check` | [TypeScript in Astro](https://docs.astro.build/en/guides/typescript/) |

Для контентных сайтов Astro подтверждается и полевыми данными (71,1% Good CWV), и архитектурой. Острова на React дают цифры рендера как у React (`astro-react` 1,58). Изменения server islands в Astro 7 в официальном посте не описаны.

### Qwik

| Тема | Факт | Источник |
|---|---|---|
| Возобновляемость | Гидратация обязана восстановить слушатели, дерево компонентов и состояние; Qwik сериализует их в HTML. Цена: не сериализуются экземпляры классов и потоки, код пишется с оглядкой на сериализацию | [Resumable vs. Hydration](https://qwik.dev/docs/concepts/resumable/) |
| Qwik 2 RC | Вышел 1 октября 2026. Заявлено более чем двукратное ускорение реактивности относительно v1; результаты предварительные, в официальный набор Chrome 156 реализации Qwik v2 не входят | [Qwik 2.0 RC](https://next.qwik.dev/blog/qwik-2-rc/) |

### Стоимость гидратации в целом

Главный минус регидратации: сильное ухудшение TBT и INP даже при хорошем FCP, «one app for the price of two». Смягчают это инкрементальной, прогрессивной или частичной гидратацией — [Rendering on the Web (Addy Osmani, Jason Miller, обновлено 5 января 2026)](https://web.dev/articles/rendering-on-the-web). Общую технику разделения кода и загрузки — в [performance.md](performance.md).

Инструменты измерения метафреймворков: `next analyze`, `next typegen`, Performance Tracks; `react-router typegen`; `astro check`.

---

## Vue и Nuxt

Стабильная линия Vue 3.5.45; Vapor доступен только в 3.6 RC (rc.14) как опциональный режим и в независимом бенчмарке уже на уровне Solid (CPU 1,12). Главные рычаги в продакшене прежние: стабильность пропсов, `shallowRef`, виртуализация. Nuxt 4.6.4, Pinia 4.1.0, vue-tsc 3.3.14.

### Vapor и реактивность в 3.6

| Факт | Источник |
|---|---|
| Vapor в 3.6 RC объявлен завершённым по функциям и полностью опционален; рекомендован для частичного применения и небольших новых приложений | [Vue core CHANGELOG (minor)](https://raw.githubusercontent.com/vuejs/core/minor/CHANGELOG.md) |
| Не поддерживаются: Options API, `globalProperties`, `v-memo`, события `@vue:xxx`; `getCurrentInstance()` возвращает `null`; в rc.2 делегирование событий стало опциональным через `.delegate` | там же |
| Для смешения с VDOM нужен `vaporInteropPlugin`, но он тянет VDOM-рантайм | там же |
| В ядре 3.6 реактивность перестроена на базе alien-signals; числа в заметках к релизу не приведены | там же |
| Цифра Эвана Ю «100 000 компонентов примерно за 100 мс» (условия не указаны, превью марта 2025) `[устарело]`, замена — результаты бенчмарка из раздела [Сравнение по замерам](#сравнение-по-замерам) | [Evan You: preview of Vue 3.6 Vapor Mode](https://vueschool.io/articles/news/vn-talk-evan-you-preview-of-vue-3-6-vapor-mode/) |

Перед внедрением Vapor стоит обновиться на 3.6 и измерить выигрыш только от alien-signals: он даётся без смены API. `v-memo` на Vapor не переносится, поэтому коду с ним при миграции страницы нужен пересмотр. Официальных чисел по памяти alien-signals нет: значение −14% встретилось только в пересказе без источника, цифры 33 КБ и 21 КБ для Vapor-бандла не подтверждены.

### Идиоматичная типизация

| Что | Правило | Источник |
|---|---|---|
| Пропсы и события | `defineProps<Props>()`, деструктуризация с умолчаниями или `withDefaults`; `defineEmits` с именованными кортежами | [TypeScript with Composition API](https://vuejs.org/guide/typescript/composition-api) |
| Реактивность | Не использовать generic-аргумент `reactive()` | там же |
| Ссылки и инъекции | `useTemplateRef`; `ComponentExposed` для generic-компонентов; `InjectionKey<T>` | там же |
| События DOM | `event: Event` с приведением `target` | там же |
| Nuxt | Проверка типов отключена в dev и build; запуск `npx nuxt typecheck` или `typescript.typeCheck: true`; контексты разделены на `.nuxt/tsconfig.app/node/server/shared.json` | [Nuxt TypeScript](https://nuxt.com/docs/4.x/guide/concepts/typescript) |

### Симптом → техника → источник

| Симптом | Техника | Источник |
|---|---|---|
| Изменение одного значения обновляет все элементы списка | Стабилизировать пропсы, вычислять в родителе | [Performance](https://vuejs.org/guide/best-practices/performance) |
| Статический блок перерисовывается | `v-once` | там же |
| Большой `v-for` (от 1000 элементов) диффится зря | `v-memo` на том же элементе, что и `v-for`, только для микрооптимизаций | [v-memo](https://vuejs.org/api/built-in-directives) |
| Вычисляемый объект будит эффекты | Вернуть `oldValue`, если значение не изменилось (3.4+) | [Performance](https://vuejs.org/guide/best-practices/performance) |
| Глубокая реактивность на больших данных | `shallowRef`, заменять корневое значение | там же |
| Конфликт с внешним стором, Immer, XState | Держать в `shallowRef` | [Reactivity in Depth](https://vuejs.org/guide/extras/reactivity-in-depth) |
| Тысячи экземпляров компонентов | Убрать обёртки, виртуализировать список | [Performance](https://vuejs.org/guide/best-practices/performance) |
| Деструктуризация потеряла реактивность | Читать через прокси или ref | [Reactivity in Depth](https://vuejs.org/guide/extras/reactivity-in-depth) |
| Плагины Nuxt блокируют гидратацию | Заменить на composables | [Nuxt Performance](https://nuxt.com/docs/4.x/guide/best-practices/performance) |
| Предзагрузка лишних чанков | `prefetchOn` для `<NuxtLink>`, хук `build:manifest` | там же |
| Поздняя интерактивность тяжёлого блока | `hydrate-on-visible` на Lazy-компоненте (3.16+) | там же |

### Pinia и Nuxt

| Факт | Источник |
|---|---|
| Pinia 4 содержит только технически ломающие изменения: только ESM и обязательная установка `@vue/devtools-api` | [Pinia 4.0.0 release notes](https://newreleases.io/project/npm/pinia/release/4.0.0) |
| Setup-store: возвращаемые свойства классифицируются как state, action и getter; несериализуемое не возвращать; `skipHydrate()` для состояния, которое нельзя восстанавливать с сервера | [Pinia: Dealing with composables](https://pinia.vuejs.org/cookbook/composables.html) |
| Nuxt 3 `[устарело]` с 31 июля 2026, замена — Nuxt 4 | [Nuxt 3 hits End Of Life](https://certificates.dev/blog/nuxt-3-hits-end-of-life) |

### Инструменты измерения

| Инструмент | Источник |
|---|---|
| `app.config.performance` и профайлер Vue DevTools | [Performance](https://vuejs.org/guide/best-practices/performance) |
| `onRenderTracked`, `onRenderTriggered`, `onTrack`, `onTrigger` (только dev) | [Reactivity in Depth](https://vuejs.org/guide/extras/reactivity-in-depth) |
| Nuxt DevTools Timeline и `nuxi analyze` | [Nuxt Performance](https://nuxt.com/docs/4.x/guide/best-practices/performance) |

---

## Angular

Начиная с v21 приложения по умолчанию работают без zone.js, с v22 стратегией по умолчанию стал OnPush. По бенчмарку отказ от зон почти не меняет скорость операций, но заметно уменьшает память и размер (Chrome 156: CPU 1,59 и 1,60, память 2,30 против 3,07, размер 15,53 против 19,97). Поддержка TS 7 в компиляторе Angular на стадии прототипа, peer-диапазон Angular 22.0 `>=6.0.0 <6.1.0` (см. [Совместимость с TypeScript 7](#совместимость-с-typescript-7)). Версия @angular/core 22.2.5.

### Статус

| Факт | Источник |
|---|---|
| Zoneless стал стабильным в 20.2, Signal Forms завершены, совместимый с tsgo компилятор прототипируется | [Angular roadmap](https://angular.dev/roadmap) |
| Angular 21+ работает без зон по умолчанию; zone.js `[устарело]`, замена — уведомления через сигналы, `markForCheck`, `AsyncPipe`, слушатели шаблона. Хуки `NgZone.onStable` и подобные больше не срабатывают; реактивные формы сами обнаружение изменений не планируют; для SSR нужен `PendingTasks`; утверждения о лучших CWV не подкреплены числами | [Zoneless](https://angular.dev/guide/zoneless) |
| OnPush — стратегия по умолчанию с v22; проверка выполняется при новых входах (сравнение `Object.is`) или событии в поддереве; мутация объекта с той же ссылкой проверку не запускает | [Skipping component subtrees](https://angular.dev/best-practices/skipping-subtrees) |

Цель миграции на zoneless: память и размер, а не скорость рендера.

### Идиоматичная типизация

| Что | Правило | Источник |
|---|---|---|
| `input` | `input(0)` выводит `InputSignal<number>`; `input.required<T>()` без `undefined` и с ошибкой сборки при отсутствии; `transform` определяет типы для шаблона; `model()` для двусторонней привязки; `@Input` поддерживается, но для нового кода рекомендуется `input` | [Accepting data with input properties](https://angular.dev/guide/components/inputs) |
| `computed` | Ленив и мемоизирован, зависимости динамические; равенство `Object.is`, настраивается через `equal`; чтения после `await` не отслеживаются; эффекты нужны редко | [Signals](https://angular.dev/guide/signals) |
| `resource` | `params`, `loader` с `abortSignal`; `hasValue()` как guard типа, `value()` бросает при ошибке; статусы `idle`, `loading`, `reloading`, `resolved`, `local`, `error`; `resourceFromSnapshots` экспериментален | [Async reactivity with resources](https://angular.dev/guide/signals/resource) |

### Симптом → техника → источник

| Симптом | Техника | Источник |
|---|---|---|
| Дерево проверяется чаще нужного | OnPush и сигналы, смотреть в Profiler серые компоненты | [Angular DevTools Profiler](https://angular.dev/tools/devtools/profiler) |
| Мутация объекта не отражается на экране | Новая ссылка или `markForCheck()` | [Skipping component subtrees](https://angular.dev/best-practices/skipping-subtrees) |
| Обновление формы не перерисовывает | Связать с `markForCheck()` или сигналами | [Zoneless](https://angular.dev/guide/zoneless) |
| Тест ждёт стабильности | `await fixture.whenStable()` | там же |
| `ExpressionChangedAfterItHasBeenChecked` при отказе от зон | Искать отсутствующее уведомление об изменении | там же |
| Большой initial bundle | `@defer` с `on idle`, `viewport`, `prefetch on idle` | [Deferred loading](https://angular.dev/guide/templates/defer) |
| Рост CLS после `@defer` | Не откладывать контент первого экрана | там же |
| Отложенный компонент всё равно в бандле | Убрать ссылку вне блока и импорт через barrel; зависимость должна быть standalone | там же |
| Каскад запросов вложенных `@defer` | Разные триггеры | там же |
| HMR грузит все defer-чанки | Проверять с `--no-hmr` | там же |

### Инструменты измерения

| Инструмент | Что важно | Источник |
|---|---|---|
| Angular DevTools Profiler | Столбцы циклов обнаружения изменений, флеймграф, оценка кадровой частоты, экспорт в JSON | [Profiler](https://angular.dev/tools/devtools/profiler) |
| Трек Angular в Chrome DevTools | `ng.enableProfiling()` или `enableProfiling()` до bootstrap; синий цвет — TS, фиолетовый — шаблоны, зелёный — точки входа; только dev-режим | [Profiling with Chrome DevTools](https://angular.dev/best-practices/profiling-with-chrome-devtools) |

---

## Svelte и SvelteKit

Runes делают реактивность явной и пообъектной; главная цена, глубокие прокси `$state`, снимается через `$state.raw`. Remote functions и асинхронный Svelte остаются экспериментальными даже после выхода SvelteKit 3. Версии: svelte 5.57.3, @sveltejs/kit 3.1.1, svelte-check 4.7.8.

### Статус и миграция

| Факт | Источник |
|---|---|
| `$:` и `export let` из Svelte 4 `[устарело]`, замена — runes `$state`, `$derived`, `$effect`, `$props`; в Svelte 4 изменение одного свойства инвалидировало весь объект | [Svelte 5 is alive](https://svelte.dev/blog/svelte-5-is-alive); мотивация — [Introducing runes](https://svelte.dev/blog/runes) |
| `sv check` оборачивает svelte-check, проверяет весь проект целиком, поддерживает машинный вывод и `--fail-on-warnings`; проверить только изменённые файлы нельзя | [sv check](https://svelte.dev/docs/cli/sv-check) |
| Remote functions не готовы, это главный приоритет; нужен экспериментальный Async Svelte | [SvelteKit 3 is here](https://svelte.dev/blog/sveltekit-3-is-here) |
| Релиза Svelte 6 в npm не было на июль 2026 `[не проверено]` | [SvelteKit 3.0 pre-release: what breaks](https://www.youngju.dev/blog/2026-07-17-sveltekit-3-pre-release-what-breaks.en); на странице блога анонса нет — [Svelte Blog](https://svelte.dev/blog) |

### Идиоматичная типизация

| Что | Правило | Источник |
|---|---|---|
| Пропсы | `let {...}: Props = $props()` | [TypeScript](https://svelte.dev/docs/svelte/typescript) |
| Generic-компонент | Атрибут `generics="Item extends { text: string }"` | там же |
| Типы DOM-атрибутов, сниппеты, компоненты | `HTMLButtonAttributes` из `svelte/elements`; `Snippet<[string]>`; `Component<P>`, `ComponentProps<typeof X>` | там же |
| tsconfig | `verbatimModuleSyntax` и `isolatedModules` | там же |

### Симптом → техника → источник

| Симптом | Техника | Источник |
|---|---|---|
| Большой массив дорого проксировать | `$state.raw`, заменять целиком | [$state](https://svelte.dev/docs/svelte/$state) |
| Деструктуризация потеряла связь | Передавать геттер или обернуть в объект/класс | там же |
| Экспорт переназначаемого `$state` не работает | Экспортировать объект или функции чтения/записи | там же |
| Библиотека не принимает прокси | `$state.snapshot` | там же |
| Интерфейс ждёт `await` | `$state.eager`, но редко | там же |
| Лишние обновления зависимых | Вернуть ту же ссылку: при идентичности обновления пропускаются; `$derived` пересчитывается при чтении | [$derived](https://svelte.dev/docs/svelte/$derived) |
| Непонятно, что вызвало повтор | `$inspect.trace()` первой строкой функции (5.14+) | [$inspect](https://svelte.dev/docs/svelte/$inspect) |
| Шрифт грузится поздно | Хук `handle` с фильтром `preload` | [Performance](https://svelte.dev/docs/kit/performance) |
| Каскад запросов | Серверный `load`, join на стороне БД, не использовать SPA-режим | там же |
| Медленные второстепенные данные | Возвращать промис из `load` для стриминга | там же |
| Замеры расходятся с продакшеном | Мерить в preview после сборки | там же |

`$state.raw` играет ту же роль, что `shallowRef` у Vue: большие заменяемые коллекции не нужно делать глубоко реактивными.

### Инструменты измерения

`$inspect` (в продакшене no-op) — [$inspect](https://svelte.dev/docs/svelte/$inspect); `rollup-plugin-visualizer`, Lighthouse, Server-Timing и OpenTelemetry — [Performance](https://svelte.dev/docs/kit/performance). Отдельного профайлера рендера для Svelte 5 с задокументированной поддержкой нет. Количественной оценки накладных расходов прокси `$state` в документации нет; косвенно бенчмарк показывает Svelte 5.42.1 на уровне CPU 1,19.

---

## SolidJS, Lit и Preact

Solid 2 на ноябрь в RC (2.0.0-rc.21) и меняет базовые примитивы, поэтому стабильная линия 1.9.18. Lit уже обновляет только изменившиеся привязки, и сигналы дают ему мало. Preact 11.2.0 текущий; сигналы экономят рендеры, но в бенчмарке заметно увеличивают память (3,76 против 1,44).

### Solid

| Тема | Факт | Источник |
|---|---|---|
| Статус | `next` указывает на 2.0.0-rc.21, `latest` — 1.9.18 (npm view, 2026-11-08); сроки стабильного релиза не называются | [SolidJS 2.0 async (InfoQ)](https://www.infoq.com/news/2026/05/solidjs-2-async/) |
| Новое в 2.0 | Вычисления могут возвращать промисы; `<Loading>` и `isPending()`; `action()` с `createOptimistic`; обновления батчатся микрозадачей, чтение отражает запись только после flush | [v2.0.0 Beta](https://github.com/solidjs/solid/releases/tag/v2.0.0-beta.0) |
| Удалено в 2.0 | `Index` и `onMount` `[устарело]`, замены — `<For keyed={false}>` и `onSettled`; директивы `use:` заменены фабриками `ref`; dev-хуки для devtools ещё недоступны | там же |
| Типы | `Component<P>`, `ParentComponent`, `VoidComponent`, `FlowComponent`; generic-компонент объявляется функцией с явным параметром; `Accessor<T>`, `Setter<T>`; `JSX.EventHandler<T, E>`; вызов аксессора нельзя сузить как переменную, поэтому нужен `?.`, колбэк `Show` или memo | [TypeScript](https://docs.solidjs.com/configuration/typescript) |
| Пропсы | Деструктуризация пропсов ломает реактивность; `mergeProps` и `splitProps` её сохраняют | [Props](https://docs.solidjs.com/concepts/components/props) |
| Модель | Обновляется только затронутый атрибут; подписка синхронна, чтение в `setTimeout` не отслеживается; ранний возврат в memo лишает его других зависимостей | [Fine-grained reactivity](https://docs.solidjs.com/advanced-concepts/fine-grained-reactivity) |

Переносить Solid 1 на 2 до стабильного релиза разумно только экспериментально: API эффектов, списков и директив меняется. Статья Райана Карниато об итогах 2.0 за 2026 год не найдена.

### Lit и Web Components

| Тема | Факт | Источник |
|---|---|---|
| Декораторы | Для продакшена рекомендованы experimental decorators с `useDefineForClassFields: false`; стандартные декораторы требуют `accessor` (TS 4.9+) и дают заметно больший вывод | [Decorators](https://lit.dev/docs/components/decorators/) |
| Поля класса | Поля скрывают сгенерированные аксессоры; решения: `useDefineForClassFields: false`, `declare` или `accessor`; мутация массива требует `requestUpdate()` или новой ссылки | [Reactive properties](https://lit.dev/docs/components/properties/) |
| Типизация тегов | `HTMLElementTagNameMap` и публикация `.d.ts` | [Defining components](https://lit.dev/docs/components/defining/) |
| Рендер | Обновляются только изменившиеся части; несколько изменений свойств дают одно обновление | [Rendering](https://lit.dev/docs/components/rendering/) |
| Списки | `map` по умолчанию; `repeat` с ключом, когда обновление узлов дороже перемещения или DOM хранит собственное состояние | [Lists](https://lit.dev/docs/templates/lists/) |
| Сигналы | `@lit-labs/signals` экспериментален; `watch()` обычно не даёт значимого ускорения; сигнального `repeat()` нет, поэтому изменения массива вызывают полный рендер | [Signals](https://lit.dev/docs/data/signals/) |

Lit не нуждается в сигналах ради скорости: их смысл в разделяемом состоянии между компонентами. Специализированного профайлера для Lit нет, остаются стандартные Chrome DevTools.

### Preact

| Тема | Факт | Источник |
|---|---|---|
| Статус 11.x | Документация помечает её как текущую; `Object.is` для зависимостей хуков; Hydration 2.0; `ref` передаётся как проп; только ESM (`.mjs`); TS 5.1+; очистка `useEffect` после отрисовки | [Preact 11 Upgrade Guide](https://preactjs.com/guide/v11/upgrade-guide/) |
| Устаревшее мнение | Статья января 2026 о том, что 11 не готов к продакшену, `[устарело]`, замена — руководство выше | [What's new in Preact 2026](https://blog.openreplay.com/whats-new-preact-2026/) |
| Типы | `jsxImportSource: "preact"`, `ComponentChildren`, `TargetedMouseEvent<HTMLButtonElement>`, алиасы `preact/compat` | [Preact TypeScript](https://preactjs.com/guide/v11/typescript) |
| Сигналы | Сигнал в JSX `{count}` обновляет текстовый узел без рендера компонента; `.value` подписывает компонент; `computed` ленив; `batch` объединяет записи. Страница относится к документации v10 | [Signals](https://preactjs.com/guide/v10/signals/) |

### Симптом → техника → источник

| Фреймворк | Симптом | Техника | Источник |
|---|---|---|---|
| Solid | Проп перестал обновляться | Читать `props.x` или `splitProps` | [Props](https://docs.solidjs.com/concepts/components/props) |
| Solid | Тип не сужается после проверки | Колбэк-форма `Show` или memo | [TypeScript](https://docs.solidjs.com/configuration/typescript) |
| Lit | Свойство класса не реактивно | `accessor`, `declare` или настройка tsconfig | [Reactive properties](https://lit.dev/docs/components/properties/) |

---

## Состояние и серверные данные

Выбор библиотеки определяется моделью подписки: селекторы (Redux, Zustand, Jotai на атомах), отслеживание чтений (Valtio, MobX, TanStack Query) или автомат (XState). Селектор, создающий новую ссылку, общая причина лишних рендеров почти во всех этих библиотеках. Для Vue состояние см. Pinia в разделе [Vue и Nuxt](#vue-и-nuxt), для Angular сигналы и `resource` в разделе [Angular](#angular).

| Библиотека | Типизация | Производительность | Источник |
|---|---|---|---|
| TanStack Query 5 | Вывод из `queryFn` с явным типом; `queryOptions`, `mutationOptions`; `Register` для `defaultError`; `skipToken`; TS 5.7+ | см. следующую строку | [TypeScript](https://tanstack.com/query/latest/docs/framework/react/typescript) |
| TanStack Query | Сужение по `isSuccess` | Structural sharing только для JSON-данных; `select` повторяется при новой функции; object rest отключает отслеживание | [Render Optimizations](https://tanstack.com/query/latest/docs/framework/react/guides/render-optimizations) |
| SWR 2 | | Дедупликация, глубокое сравнение; сбор зависимостей, по данным Vercel примерно на 60% меньше рендеров | [Performance](https://swr.vercel.app/docs/advanced/performance) |
| Zustand 5 | Каррированный `create<T>()(...)` из-за microsoft/TypeScript#10571; `devtools` снаружи; слайсы через `StateCreator` | Селектор с новой ссылкой даёт бесконечный цикл, лечится `useShallow` | [Advanced TypeScript](https://zustand.docs.pmnd.rs/learn/guides/advanced-typescript); [Migrating to v5](https://zustand.docs.pmnd.rs/reference/migrations/migrating-to-v5) |
| Jotai 3 | Старые версии TS не поддерживаются | Только ESM; `atomFamily`, `loadable` `[устарело]`, замены — `jotai-family`, `jotai-eager` | [Jotai 3 released](https://www.infoq.com/news/2026/09/jotai-3-released/) |
| Redux Toolkit 2 | `RootState` и `AppDispatch` из стора; `useSelector.withTypes<RootState>()`; `PayloadAction<T>` | | [Usage with TypeScript](https://redux.js.org/usage/usage-with-typescript) |
| Reselect 5 | `createSelector.withTypes<RootState>()` | `weakMapMemoize` по умолчанию; `lruMemoize` размера 1 в Reselect 4 `[устарело]`; проверки в dev | [Deriving Data with Selectors](https://redux.js.org/usage/deriving-data-selectors) |
| MobX 7 | | Много мелких компонентов, разыменовывать поздно, функции как пропсы; `observer` требует `"use no memo"` при компиляторе | [Optimizing React](https://mobx.js.org/react-optimizations.html); [incompatible-library](https://react.dev/reference/eslint-plugin-react-hooks/lints/incompatible-library) |
| XState 5 | `setup({ types })`, `assertEvent`, TS 5.0+; typegen `[устарело]`, замена — `setup()` | Страница производительность не обсуждает | [TypeScript](https://stately.ai/docs/typescript) |
| Valtio 2 | | `useSnapshot` отслеживает чтения; читать из снимка, писать в прокси; замена дочернего прокси рвёт подписку | [useSnapshot](https://valtio.dev/docs/api/basic/useSnapshot) |
| nanostores 1 | `atom<T>()`, `StoreValue<typeof $s>` | 351–844 байта; ленивый монтаж с задержкой 1 с; адаптеры для React, Vue, Svelte, Solid, Lit, Angular | [nanostores](https://github.com/nanostores/nanostores) |

Дополнительно:
- `useShallow` стабилизирует ссылку, поверхностное сравнение на один уровень — [useShallow](https://zustand.docs.pmnd.rs/reference/hooks/use-shallow). Поведение v4 доступно через `createWithEqualityFn` — [Zustand v5.0.0](https://github.com/pmndrs/zustand/releases/tag/v5.0.0).
- Серия Доминика Дорфмайстера по TanStack Query: [Practical React Query](https://tkdodo.eu/blog/practical-react-query), [Type-safe React Query](https://tkdodo.eu/blog/type-safe-react-query), [React Query Render Optimizations](https://tkdodo.eu/blog/react-query-render-optimizations).
- Цена менеджера состояния на React в js-framework-benchmark: hooks 1,56, zustand 1,67, mobX 1,70, redux-hooks 1,72, redux с `connect` 2,04 (см. [Сравнение по замерам](#сравнение-по-замерам)).

Общая рекомендация для всех селекторных библиотек: возвращать примитивы или стабильные ссылки, а производные массивы мемоизировать вне компонента.

---

## Формы и таблицы

React Hook Form остаётся самым экономным по рендерам вариантом, но `watch` и `getValues` конфликтуют с компилятором. TanStack Form строит типы из значений по умолчанию и требует явных селекторов. Таблицы и виртуализаторы на React Compiler требуют проверки после каждого обновления: это самая частая зона несовместимости. Версии: react-hook-form 7.91.0, @tanstack/react-form 1.33.5, @tanstack/react-table 9.3.1, @tanstack/react-virtual 3.14.26.

| Тема | Факт | Источник |
|---|---|---|
| React Hook Form, типы | `Control`, `FieldPath`, `FieldPathByValue`, `Resolver`, `SubmitHandler`, `UseControllerProps`; TS 4.1+, тестируется на 6.x; есть руководство по миграции на v8 (бета) | [React Hook Form TypeScript](https://react-hook-form.com/ts) |
| React Hook Form, рендеры | Неконтролируемые инпуты; `watch` рендерит весь компонент с `useForm`, `useWatch` только вызывающий, `subscribe` и `getValues` ничего; при компиляторе `watch` и `getValues` могут вернуть устаревшее значение | [React Hook Form FAQs](https://react-hook-form.com/faqs) |
| TanStack Form, типы | Типы выводятся из `defaultValues`, generic на вызове не нужен | [Philosophy](https://tanstack.com/form/latest/docs/philosophy) |
| TanStack Form, рендеры | Обязателен селектор в `useSelector(form.store, …)` и `form.Subscribe`, иначе лишние рендеры; Standard Schema (Zod 3.24+, Valibot 1.0+, ArkType 2.1.20+, Yup 1.7+) | [Basic Concepts](https://tanstack.com/form/latest/docs/framework/react/guides/basic-concepts) |
| TanStack Table | `useReactTable` входит в список несовместимых с компилятором; `useMemo` на экземпляре таблицы и производных не применять | [incompatible-library](https://react.dev/reference/eslint-plugin-react-hooks/lints/incompatible-library) |
| TanStack Virtual и компилятор | `useVirtualizer` конфликтовал с компилятором: `getVirtualItems()` кэшировался; закрыто опцией `directDomUpdates: true`, один пользователь в июле 2026 сообщил, что исправление ему не помогло | [TanStack Virtual #743](https://github.com/TanStack/virtual/issues/743) |

Симптом → техника → источник:

| Симптом | Техника | Источник |
|---|---|---|
| Ввод перерисовывает всю форму | Заменить `watch` на `useWatch` | [React Hook Form FAQs](https://react-hook-form.com/faqs) |
| Значение формы устарело в компилируемом компоненте | `useWatch`, для побочных эффектов `subscribe` | там же |
| Кнопка формы TanStack обновляется при каждом вводе | `form.Subscribe` с узким селектором | [Basic Concepts](https://tanstack.com/form/latest/docs/framework/react/guides/basic-concepts) |
| Таблица перестаёт обновляться при компиляторе | Не мемоизировать экземпляр; при необходимости `"use no memo"` | [incompatible-library](https://react.dev/reference/eslint-plugin-react-hooks/lints/incompatible-library) |

---

## Стилизация

Вставка CSS во время рендера остаётся дорогой, и направление отрасли — статическое извлечение. Замеры старые, поэтому новые решения стоит оценивать на своём приложении. Рейтинга CSS Modules, Tailwind, StyleX, Panda и vanilla-extract на одном приложении в 2025–2026 годах нет.

| Тема | Факт | Источник |
|---|---|---|
| Рантайм-генерация | Генерация стилей во время рендера вынуждает пересчитывать правила для всех узлов на каждом кадре; долгосрочная рекомендация — статическое извлечение и инлайн для динамических значений | [Library Upgrade Guide: style tags](https://github.com/reactwg/react-18/discussions/110) |
| Замер Spot | Emotion 54,3 мс против Sass Modules 27,7 мс (20 элементов, 10 рендеров, DevTools Profiler, M1 Max); итог относится к сериализации внутри рендера. Замер 2022 года, версии устарели `[устарело]`, свежего аналога нет | [Why We're Breaking Up with CSS-in-JS](https://dev.to/srmagura/why-were-breaking-up-wiht-css-in-js-4g9b) |
| Tailwind 4.0 (22 января 2025) | Полная сборка 378 → 100 мс, инкрементальная с новым CSS 44 → 5 мс, без нового CSS 35 мс → 192 мкс; движок Lightning CSS. Числа относятся к 4.0, а не к текущей 4.3.5 | [Tailwind CSS v4.0](https://tailwindcss.com/blog/tailwindcss-v4) |
| vanilla-extract | Компилирует TypeScript в статический CSS, контракты токенов типизированы | [vanilla-extract](https://vanilla-extract.style/) |
| Panda | Полностью без рантайма только с source-трансформами; значения должны быть видны в исходнике; на сервере `css()` работает и без трансформа | [Why Panda](https://panda-css.com/docs/overview/why-panda) |
| StyleX | Атомарный CSS, статический файл при сборке; размер CSS «выходит на плато» (чисел нет) | [StyleX: Learn](https://stylexjs.com/docs/learn/) |
| styled-components 6 | Заявляет поддержку серверных компонентов; проект поддерживается в основном одним человеком | [styled-components](https://github.com/styled-components/styled-components) |
| CSS Modules в Next.js 16.4 | Turbopack укорачивает классы в продакшене | [Next.js 16.4](https://nextjs.org/blog/next-16-4.md) |

`@emotion/react` без релизов с декабря 2024 (11.14.0): повод не начинать на нём новые проекты, хотя формального объявления о прекращении поддержки не найдено.

| Симптом | Техника | Источник |
|---|---|---|
| Рендер списка замедлен стилями | Вынести сериализацию из рендера или перейти на статический CSS | [Why We're Breaking Up with CSS-in-JS](https://dev.to/srmagura/why-were-breaking-up-wiht-css-in-js-4g9b) |
| Стили не извлекаются в Panda | Убрать значения, известные только в рантайме | [Why Panda](https://panda-css.com/docs/overview/why-panda) |
| Нужна типизация токенов без рантайма | vanilla-extract или Panda | [vanilla-extract](https://vanilla-extract.style/) |

---

## Антипаттерны UI

Большинство проблем решается не типами, а отказом от лишнего состояния и эффектов; типы лишь делают такие ошибки заметнее. Часть паттернов теперь ловит линтер. Правило «дискриминируемое объединение вместо набора булевых флагов» переносится на все фреймворки: Vue `defineProps` и Svelte `$props` принимают те же типы TS.

| Фреймворк | Антипаттерн | Замена | Источник |
|---|---|---|---|
| React | Производное состояние в эффекте | Вычислять при рендере | [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect) |
| React | Сброс состояния в эффекте | `key` на компоненте | там же |
| React | Цепочки эффектов | Считать всё в обработчике события | там же |
| React | `onChange` родителя из эффекта | Вызывать в том же обработчике | там же |
| React | Загрузка в эффекте без очистки | Флаг `ignore` или данные через фреймворк | там же |
| React | `setState` синхронно в эффекте | Правило `set-state-in-effect` | [eslint-plugin-react-hooks](https://react.dev/reference/eslint-plugin-react-hooks) |
| React | Prop-drilling сразу лечат контекстом | Сначала пропсы, затем извлечение компонентов и `children` | [Passing Data Deeply with Context](https://react.dev/learn/passing-data-deeply-with-context) |
| React | `key={index}` при изменяемом списке | Стабильный идентификатор из данных | [Rendering Lists](https://react.dev/learn/rendering-lists) |
| React | `key={Math.random()}` | Никогда: каждый рендер пересоздаёт DOM и теряет ввод | там же |
| Vue | Неявный `any` у события | `event: Event` и приведение `target` | [TypeScript with Composition API](https://vuejs.org/guide/typescript/composition-api) |
| Solid | Перепутанные `target` и `currentTarget` | `JSX.EventHandler<T, E>`: типизирован только `currentTarget` | [TypeScript](https://docs.solidjs.com/configuration/typescript) |
| Angular | Мутация объекта при OnPush | Новая ссылка | [Skipping component subtrees](https://angular.dev/best-practices/skipping-subtrees) |
| Lit | Мутация массива | Новая ссылка или `requestUpdate()` | [Reactive properties](https://lit.dev/docs/components/properties/) |

---

## Чеклист ревью UI-кода

Пункты собраны из разделов выше; раздел с источником указан в скобках.

Общее:
- Версии зафиксированы: компилятор React точной версией, TypeScript 6.x или 7 согласован с шаблонным чекером ([Совместимость с TypeScript 7](#совместимость-с-typescript-7)).
- Утверждение об ускорении подкреплено замером на продакшен-сборке, а не ссылкой на бенчмарк или CrUX ([Сравнение по замерам](#сравнение-по-замерам)).
- Состояние запроса описано дискриминируемым объединением, события типизированы ([Антипаттерны UI](#антипаттерны-ui)).

React и метафреймворки:
- `eslint-plugin-react-hooks` включён с пресетом `recommended`; предупреждения `incompatible-library` и `preserve-manual-memoization` разобраны ([React](#react)).
- Нет `useEffect` для производного состояния, сброса состояния и цепочек обновлений; нет `key={index}` на изменяемых списках и `key={Math.random()}`.
- Для `watch`, `useReactTable`, MobX `observer` оставлены `useWatch` или `"use no memo"`; новый код без `forwardRef`, `MutableRefObject`, глобального `JSX`.
- Server Functions проверяют доступ и валидируют вход внутри себя; `await params` в layout не ломает статическую оболочку, у `'use cache'` явный `cacheLife` ([Метафреймворки](#метафреймворки)).
- Типы маршрутов генерируются и проверяются в CI: `next typegen`, `react-router typegen`, `astro check`.

Остальные фреймворки:
- Vue: большие данные в `shallowRef`; `v-memo` не в коде, который переводят на Vapor; `nuxt typecheck` запускается явно ([Vue и Nuxt](#vue-и-nuxt)).
- Angular: нет зависимости от zone.js, мутации заменены новыми ссылками, новый код на `input()` и `model()`, первый экран не под `@defer` ([Angular](#angular)).
- Svelte: большие массивы в `$state.raw`, в библиотеки уходит `$state.snapshot`, `sv check` в CI ([Svelte и SvelteKit](#svelte-и-sveltekit)).
- Solid: пропсы не деструктурируются; Lit: `useDefineForClassFields: false` или `accessor`; Solid 2 в продакшен не берётся до стабильного релиза ([SolidJS, Lit и Preact](#solidjs-lit-и-preact)).

Состояние, формы, стили:
- Селекторы Zustand, Redux, TanStack Query возвращают примитивы или стабильные ссылки ([Состояние и серверные данные](#состояние-и-серверные-данные)).
- Динамические стили не сериализуются в рендере; `@emotion/react` не берётся в новые проекты ([Стилизация](#стилизация)).

---

## Спорные места и пробелы

| Вопрос | Что известно | Что неизвестно |
|---|---|---|
| Компилятор React 1.0 на большом приложении | Цифры Meta (данные вендора); замеры Нади Макаревич на бете 2024 | Независимого бенчмарка 1.0 с повторяемой методикой нет |
| Компилятор и дочерние `memo` | Документация React: дочерний рендер пропускается через переиспользование JSX | Один блог утверждает обратное, запуски и сборка не описаны `[не проверено]` |
| Батчинг Transition в React 19.3 | Changelog: Transition рендерятся независимо | Страница `useTransition` утверждает, что несколько Transition батчатся вместе |
| Тип `ref`-пропа | `ref` стал обычным пропом | Страница `@types/react` о `Ref<T>` не найдена, первичным источником тип не подтверждён |
| TS 7 и Angular 22.1/22.2 | Angular 22.0: `>=6.0.0 <6.1.0` | Поведение 22.1 и 22.2 относительно TS 6.1 и TS 7 не подтверждено; прогноз о бэкпорте `[не проверено]` |
| TS 7 в Svelte и Astro | SvelteKit 3 требует TypeScript 6 | Заявлений о поддержке TS 7 на страницах документации нет |
| Qwik 2 | RC; таблица авторов предварительная | Результатов Qwik v2 в официальном наборе Chrome 156 нет; цифры шаблона 59 → 9 КБ `[не проверено]` |
| Vapor | CPU в бенчмарке 1,12; полностью опционален | Память alien-signals (−14% встретилось только в пересказе) и размер Vapor-бандла не подтверждены |
| Nuxt 5, страница `typedPages` | Nuxt 5 привязан к Nitro v3 | Дата выхода неизвестна; `typedPages` не проверена |
| Angular 22.0 | Вышел в начале июня 2026 | Точная дата из первичного источника не подтверждена (blog.angular.dev отдал 403) |
| Накладные расходы прокси `$state` | Метод снятия: `$state.raw`; Svelte 5.42.1 в бенчмарке 1,19 | Количественной оценки в документации нет; профайлера рендера Svelte 5 с задокументированной поддержкой не найдено |
| TanStack Table v9 | Версия 9.3.1 опубликована | Изменения типов и снятие несовместимости с компилятором не подтверждены (страницы вернули 404) |
| TanStack Query v6 | v5 остаётся основной линией | Роадмапа нет; ветка `v6/store-experiments` и `@tanstack/solid-query@6.0.0-beta.5` на зеркалах `[не проверено]` |
| Стили и сравнение метафреймворков | Данные Spot 2022, Tailwind 4.0, заявления вендоров | Сопоставимых замеров стилей и независимого сравнения TanStack Start, Next.js, React Router нет |
| Solid 2, Astro 7, Preact 11 | Solid RC.21; Astro 7 server islands есть | Сроки стабильного Solid 2, изменения server islands, руководство по сигналам Preact 11 не проверены |
| js-framework-benchmark и CrUX | Лабораторные и полевые данные расходятся | Версии в бенчмарке отстают; CrUX даёт популяции сайтов, эффект фреймворка не отделён; INP React 92% (State of Web Vitals) против 69,5% (HTTP Archive) не объяснён |
