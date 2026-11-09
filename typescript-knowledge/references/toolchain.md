# Инструментарий TypeScript: компилятор, tsconfig, сборка, линтеры, CI

Справочник по тому, чем собирают, проверяют и публикуют TypeScript-проекты любого вида: приложения на бандлере, библиотеки, монорепозитории. Внутри: версии компиляторов и инструментов на ноябрь 2026; статус TypeScript 7 (порт на Go без JS API в 7.0, возвращение API в 7.1 beta) и таблица совместимости инструментов с ним; готовые шаблоны tsconfig (приложение на бандлере, библиотека, монорепозиторий); порядок диагностики медленной проверки типов, включая правило `--checkers 1` для сопоставимых счётчиков; бенчмарки на уровне типов; редакторы; бандлеры и транспиляторы с цифрами открытого бенчмарка; линтеры и форматтеры (ESLint + typescript-eslint, Oxlint, Biome, Prettier, Oxfmt); поиск мёртвого кода и проверка зависимостей; пакетные менеджеры и защита от свежих релизов; точный порядок шагов CI и кэш `.tsbuildinfo`. Состояние знаний на 2026-11-08. Часть утверждений проверена локальными запусками (Windows 11, Node 24.17.0, 32 логических ядра, шумная среда, синтетические проекты, TypeScript 7.0.2 и 6.0.3 рядом); такие места помечены «проверено локально», их стоит читать как отношения, а не как абсолютные величины. Метки: `[устарело]` — инструмент или приём заменён, замена названа рядом; `[не проверено]` — утверждение из одного вторичного источника или только из сниппета поиска. Смежные темы: пайплайн разработки и измерений — [pipeline.md](pipeline.md); паттерны типов — [types-patterns.md](types-patterns.md); производительность — [performance.md](performance.md); бенчмарки — [benchmarking.md](benchmarking.md); тесты — [testing.md](testing.md); структура проекта и монорепозитории — [architecture.md](architecture.md); фронтенд — [frontend.md](frontend.md). Серверные темы Node (запуск `.ts` через type stripping, tsx, `@types/node`, график релизов Node) здесь не повторяются: смотрите скилл node-knowledge.

- [Версии на ноябрь 2026](#версии-на-ноябрь-2026)
- [Статус компилятора](#статус-компилятора)
- [Настройка tsconfig](#настройка-tsconfig)
- [Диагностика медленной проверки типов](#диагностика-медленной-проверки-типов)
- [Бенчмарки на уровне типов](#бенчмарки-на-уровне-типов)
- [Производительность редактора](#производительность-редактора)
- [Сборщики и транспиляторы](#сборщики-и-транспиляторы)
- [Линтеры и форматтеры](#линтеры-и-форматтеры)
- [Мёртвый код и зависимости](#мёртвый-код-и-зависимости)
- [Пакетные менеджеры и защита цепочки поставки](#пакетные-менеджеры-и-защита-цепочки-поставки)
- [Порядок проверок в CI](#порядок-проверок-в-ci)
- [Симптом → приём](#симптом--приём)
- [Спорные места и пробелы](#спорные-места-и-пробелы)

## Версии на ноябрь 2026

Вывод: `typescript@latest` в npm — 7.0.2 (компилятор на Go, без JS API); 7.1.0-beta возвращает API, но инструменты на него только переходят. Колонка «дата» ниже — `time.modified` из реестра npm на 2026-11-08, то есть последнее изменение метаданных пакета (любая публикация, включая nightly), а не обязательно дата этой версии. Где известна точная дата релиза, она указана отдельно.

| Пакет | Версия | Дата | Заметка |
|---|---|---|---|
| typescript `latest` | 7.0.2 | релиз 2026-07-08 | `rc` всё ещё указывает на 7.0.1-rc: RC 7.1 на 2026-11-08 нет |
| typescript `beta` / `next` | 7.1.0-beta / 7.1.0-dev.20261108.1 | релиз беты 2026-10-20 | |
| typescript 6.0.3 | 6.0.3 | релиз 2026-04-16 | последняя 6.x |
| @typescript/typescript6 | 6.0.2 | 2026-07-06 | алиас с `tsc6` и API 6.0 |
| @typescript/native-preview | 7.0.0-dev.20260707.2 | 2026-07-07 | `[устарело]` → `typescript@7` / `typescript@next` |
| @typescript/analyze-trace | 0.11.1 | 2026-06-26 | читает трассы 7.0.2 (проверено локально) |
| typeslayer | 0.1.32 | 2026-03-23 | |
| @ark/attest / tstyche / expect-type / tsd | 0.58.0 / 7.2.5 / 1.4.0 / 0.33.0 | 2026-10-22 / 2026-10-11 / 2026-06-25 / 2025-08-05 | |
| typescript-eslint | 8.72.1 | 2026-11-02 | peer `typescript >=4.8.4 <6.1.0` |
| eslint | 10.14.0 | 2026-10-30 | |
| oxlint / oxlint-tsgolint / oxfmt | 1.92.0 / 7.0.2006 / 0.77.0 | 2026-11-06 / 2026-11-05 / 2026-11-06 | oxfmt до 1.0 |
| @biomejs/biome / prettier | 2.6.6 / 3.9.10 | 2026-11-06 / 2026-10-10 | |
| esbuild / @swc/core / oxc-transform | 0.28.2 / 1.16.22 / 0.157.0 | 2026-08-08 / 2026-11-05 / 2026-11-02 | |
| vite / rolldown / rollup | 8.3.6 / 1.3.0 / 4.68.0 | 2026-11-05 / 2026-11-05 / 2026-11-06 | |
| @rspack/core / @rsbuild/core / webpack | 2.3.1 / 2.3.1 / 5.112.2 | 2026-11-03 / 2026-11-03 / 2026-10-23 | |
| next (Turbopack) | 16.4.5 | 2026-11-07 | npm-пакет `turbopack` — заглушка 0.0.1 от 2022 года |
| tsdown / rolldown-plugin-dts / tsup / unbuild | 0.23.7 / 0.30.0 / 9.0.0 / 3.6.1 | 2026-11-06 / 2026-11-06 / 2026-10-14 / 2025-08-15 | |
| knip / dependency-cruiser / madge / skott / ts-prune / depcheck | 6.44.2 / 18.7.2 (`beta` 18.8.0-beta-2) / 8.0.0 / 0.35.12 / 0.10.3 / 1.4.7 | 2026-11-07 / 2026-11-02 / 2024-08-05 / 2026-09-11 / 2022-05-22 / 2025-08-31 | |
| publint / @arethetypeswrong/cli / @microsoft/api-extractor | 0.3.25 / 0.18.5 / 7.60.1 | 2026-10-01 / 2026-07-09 / 2026-10-30 | |
| pnpm / npm / bun / turbo / nx | 12.18.0 / 12.2.2 / 1.4.4 / 2.11.10 / 24.0.5 | 2026-11-06 / 2026-11-04 / 2026-11-08 / 2026-11-06 / 2026-11-06 | |
| @angular/compiler-cli / vue-tsc / svelte-check / @astrojs/check | 22.2.5 / 3.3.14 / 4.7.8 / 0.9.12 | 2026-11-06 / 2026-10-29 / 2026-11-01 / 2026-10-21 | |
| typia / ttsc / ts-morph / ts-patch | 15.3.0 / 0.36.3 / 28.0.0 / 4.0.1 | 2026-11-06 / 2026-11-06 / 2026-04-12 / 2026-05-01 | |
| ts-loader / fork-ts-checker-webpack-plugin / vite-plugin-checker | 9.6.2 / 9.1.0 / 1.0.0 | 2026-10-22 / 2025-04-03 / 2026-11-08 | |
| @tsconfig/strictest / recommended / vite-react / next / node24 / node26 | 2.0.8 / 1.0.13 / 8.1.1 / 2.0.6 / 24.0.5 / 26.0.1 | 2026-09-24 | |

Устаревшее одной строкой:

| Было | Замена |
|---|---|
| `@typescript/native-preview` (`tsgo`) `[устарело]` | `typescript@7` или `typescript@next` |
| tsup `[устарело]` | tsdown |
| ts-prune `[устарело]` | knip |
| depcheck `[устарело]` | knip |
| webpack 5 для новых проектов `[устарело]` | Vite или Rspack |
| `typescript.tsserver.maxTsServerMemory` `[устарело]` | `js/ts.tsserver.maxMemory` |
| Оценка Oxlint «20–40×» `[устарело]` | «10–20×» из README tsgolint |

## Статус компилятора

Вывод: TS 6.0.3 — последний релиз на JavaScript и мост к 7.0; TS 7.0.2 — порт на Go, быстрый, но без программного API. Для большинства проектов работает схема «`tsc` 7 проверяет типы, а инструментам с `import ts from "typescript"` отдаётся API 6.0 под именем `typescript`». После любой установки двух версий проверяйте `npx tsc -v`.

### Что есть в 7.0 и 7.1

- 7.0 ставится как `npm install -D typescript`. Установка рядом: `npm install -D typescript@npm:@typescript/typescript6` даёт только `tsc6`, а `"@typescript/native": "npm:typescript@^7.0.2"` возвращает `tsc` от 7.0 — [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/).
- Скорость по данным Microsoft (`--checkers 4` по умолчанию): vscode 125,7 с → 10,6 с (11,9×), sentry 139,8 → 15,7 (8,9×), bluesky 24,3 → 2,8 (8,7×), playwright 12,8 → 1,47 (8,7×), tldraw 11,2 → 1,46 (7,7×). С `--checkers 8` выигрыш 10,6–16,7×. Память ниже на 6–26 % — [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/).
- Умолчания 6.0+ и удалённые в 7.0 опции: `strict` true, `module` esnext, `types` [], `rootDir` ./; удалены `target: es5`, `baseUrl`, `moduleResolution node/node10/classic`, `module amd/umd/systemjs/none` — [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/). Ошибка для `baseUrl` на 7.0.2: `TS5102: Option 'baseUrl' has been removed` (проверено локально).
- Репозиторий `microsoft/typescript-go` архивирован, только чтение; README называет его staging-репозиторием и отправляет в основной; там же «API: not ready», LSP «in progress» — [microsoft/typescript-go](https://github.com/microsoft/typescript-go).
- 7.1 beta (2026-10-20): точки входа `typescript/sync`, `typescript/async`, `typescript/fs`, `typescript/ast`, `typescript/ast/is`, `typescript/ast/factory`; `Disposable`-объекты; `contentMappers` в tsconfig и флаг `--runExternalCode`; `--target/--lib es2026`; атрибуты импорта в ambient-модулях; `import source` — [Announcing TypeScript 7.1 Beta](https://devblogs.microsoft.com/typescript/announcing-typescript-7-1-beta/).
- Ускорение 7.1 beta над 7.0 (4 чекера, `--noEmit`): bluesky 1,2×, mui-docs 1,9×, sentry 1,3×, t3code-server 1,4×, vscode 1,2×; память ниже на 15,8–49,6 % — [Announcing TypeScript 7.1 Beta](https://devblogs.microsoft.com/typescript/announcing-typescript-7-1-beta/).
- План итерации: RC 2026-11-10, Stable 2026-11-24 (бета планировалась на 2026-10-06, вышла 2026-10-20) — [TypeScript 7.1 Iteration Plan #63703](https://github.com/microsoft/TypeScript/issues/63703). В блоге: RC «in about a month», финал «shortly thereafter» — [Announcing TypeScript 7.1 Beta](https://devblogs.microsoft.com/typescript/announcing-typescript-7-1-beta/). Бета уже отстала от плана на две недели, поэтому обновляться на 7.1 ради API разумно после 2026-11-24 и с запасом: инструменты привязаны к конкретным подпутям.

### Выбор схемы установки

| Условие | Схема |
|---|---|
| Ни один инструмент не делает `import ts from "typescript"` (Oxlint вместо ESLint, Vite или tsdown без плагинов) | Просто `npm i -D typescript@7.0.2` |
| Есть typescript-eslint, ts-morph, vue-tsc, Angular, ts-loader и т. п. | Два компилятора рядом через алиасы; `npx tsc -v` шагом CI |

Схема с двумя компиляторами:

```bash
npm i -D "@typescript/native@npm:typescript@^7.0.2" "typescript@npm:@typescript/typescript6@^6.0.2"
npx tsc -v      # ожидается 7.0.x; если 6.x, смотрите, куда ведёт node_modules/.bin/tsc
npx tsc6 -v     # 6.0.x: API для typescript-eslint, ts-morph и т. п.
```

`npm i --ignore-scripts typescript@7.0.2` работает: нативный бинарник приходит optional-зависимостью, postinstall не нужен (проверено локально). Политика запрета скриптов TS 7 не мешает.

### Ловушка: алиас TS 6 перехватывает `.bin/tsc`

Установка `typescript@7.0.2` и `ts6@npm:typescript@6.0.3` в один `node_modules` дала `.bin/tsc` → 6.0.3. Первый прогон сравнения незаметно шёл на 6.0.3 с обеих сторон (проверено локально, Node 24.17.0, Windows 11). Причина: пакет алиаса (`@typescript/typescript6` зависит от `@typescript/old` = `npm:typescript@^6`) приносит свой бинарник `tsc` и занимает ссылку в `.bin`. Правило: после каждой установки второго компилятора запускайте `npx tsc -v`, держите эту проверку в CI шагом 1 и вызывайте бинарник 7.0 по явному пути, если нужна уверенность.

### Совместимость инструментов с TS 7

Состояние на 2026-11-08.

| Инструмент | Состояние | Что делать |
|---|---|---|
| typescript-eslint 8.72.1 | peer `<6.1.0`; запрос поддержки 7.0.2 закрыт как not planned — [issue #12518](https://github.com/typescript-eslint/typescript-eslint/issues/12518); трекинг — [issue #10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940); открыт PR с `projectService: { EXPERIMENTAL_backend: 'tsgo' }` — [PR #12803](https://github.com/typescript-eslint/typescript-eslint/pull/12803) | Алиас `typescript` → `@typescript/typescript6`. Бэкенд tsgo не брать: в комментарии к PR он не загружается на 7.1.0-beta из-за переезда подпутей и был в 1,2–2,4× медленнее (один пользователь, nightly 2026-10-01); мейнтейнер пишет о «slightly faster than the baseline of TypeScript 6». Источники расходятся |
| ts-morph 28.0.0 | API TS 6; мейнтейнер: «waiting for TypeScript to stabilize» — [ts-morph #1685](https://github.com/dsherret/ts-morph/issues/1685); трекинг открыт — [ts-morph #1621](https://github.com/dsherret/ts-morph/issues/1621). В экспериментальной ветке на TS 7 через RPC было ~199 с против ~158 с на TS 5 | Держать на API 6.0 |
| typia 15.3.0 | Больше не зависит от JS API напрямую: peer `ttsc >=0.36.3`; ttsc peer `typescript >=6.0.0 \|\| >=7.1.0-0`; с ttsc 0.34 работают `--runExternalCode` и content mappers — [typia #2510](https://github.com/samchon/typia/issues/2510), [typia #2513](https://github.com/samchon/typia/issues/2513), [samchon/ttsc](https://github.com/samchon/ttsc) | `ttsc` вместо ts-patch; на 7.0 content mappers недоступны |
| dependency-cruiser 18.7.2 | Поддерживает `typescript >=2 <7`; `18.8.0-beta-1` работает через API 7.1, репортёр подтвердил — [dependency-cruiser #1112](https://github.com/sverweij/dependency-cruiser/issues/1112) | Стабильная: держать API 6.0 или парсер `swc`; для 7.1 взять `beta` |
| Angular 22 | `@angular/compiler-cli` и `@angular/build` peer `>=6.0 <6.1` (npm); запросы закрыты — [angular #69704](https://github.com/angular/angular/issues/69704), [angular #70160](https://github.com/angular/angular/issues/70160) (ответ команды ведёт на #69719); в [angular #69719](https://github.com/angular/angular/issues/69719) команда 2026-09-25 дала ссылку на [блог-пост о компиляторе на TS 7](https://blog.angular.dev/an-update-on-angulars-typescript-7-powered-compiler-9619a35e2b0a) (содержимое прочитать не удалось: страница защиты от ботов) | По анонсу 7.0: `tsc` 7.0 для проверок CLI, 6.0 для редактора — [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) |
| Vue | `vue-tsc` 3.3.14 падает на TS 7 — [language-tools #6121](https://github.com/vuejs/language-tools/discussions/6121). Новый путь — `@vue/content-mapper` 4.0.0-alpha (npm: `latest` alpha.0, `alpha` alpha.3), требует TS 7.1 | TS 6 рядом. В эксперименте `tsc --runExternalCode` 7.1 + mapper дал 14,19 → 3,10 с на 581 `.vue` (Directus), но 445 → 1127 ошибок и регрессии редактора; автор советует только сайд-проекты — [Goodbye vue-tsc](https://alexop.dev/posts/goodbye-vue-tsc-typescript-7-content-mappers/) `[не проверено]` |
| svelte-check 4.7.8 | peer `^5 \|\| ^6`; TS 7 через `--tsgo`/`--tsgo-experimental-api` и установку обеих версий — [README svelte-check 4.7.7](https://unpkg.com/svelte-check@4.7.7/README.md). Открытые ошибки: `--tsgo` выходит с кодом 0 при ошибке разбора компонента — [#3185](https://github.com/sveltejs/language-tools/issues/3185), не сообщает о несуществующем импорте — [#3187](https://github.com/sveltejs/language-tools/issues/3187) | Не делать `--tsgo` гейтом CI; оставить обычный режим на TS 6 |
| @astrojs/check 0.9.12 | зависимость `typescript ^5 \|\| ^6` (npm) | TS 6 |
| ts-loader 9.6.2 | Порт на API 7.1 в черновом [PR #1704](https://github.com/TypeStrong/ts-loader/pull/1704); `transpileOnly`, custom transformers и project references пока не работают (на 2026-07-31) — [Migrating ts-loader to TypeScript 7.1](https://blog.johnnyreilly.com/migrating-ts-loader-to-typescript-7-1-with-ai) | TS 6 рядом или переход на Rspack или Vite |
| Tsserver-плагины, Volar | Vue, MDX, Astro, Svelte и шаблоны Angular в редакторе требуют TS 6.0 — [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) | См. [Производительность редактора](#производительность-редактора) |
| skott 0.35.12 | Парсит `.ts` через typescript-estree; вывод из зависимостей, запуском не проверялся | Считать, что на TS 7 нужен API 6.0 рядом `[не проверено]` |
| fork-ts-checker-webpack-plugin 9.1.0 | Состояние на TS 7 не описано; по природе инструмента ему нужен JS API | Проверять локально до внедрения |

Не требуют JS API проекта:

| Инструмент | Почему |
|---|---|
| knip | Использует oxc-parser и oxc-resolver, не `ts.findReferences` — [Knip FAQ](https://knip.dev/reference/faq) |
| @microsoft/api-extractor | Несёт собственную зависимость `typescript 6.0.3` (npm) |
| tsdown | Принимает `typescript ^5 \|\| ^6 \|\| ^7` (npm) |
| oxlint-tsgolint | Наоборот, требует TS 7.0+ — [Oxlint Type-Aware](https://oxc.rs/docs/guide/usage/linter/type-aware.html) |

### Совместимость и скорость на практике

- Контракт 6.0 → 7.0: код, который чисто компилируется на 6.0 с `stableTypeOrdering` и без `ignoreDeprecations`, должен компилироваться и на 7.0. `ignoreDeprecations: "6.0"` глушит предупреждения только в 6.0; в 7.0 это ошибки.
- Выигрыш 7.0 на типо-тяжёлом коде почти целиком от параллелизма (подробно в разделе про диагностику). В CI с 2–4 ядрами ожидания 8–12× могут не сбыться, измеряйте на своём раннере.
- Неизвестно: даты поддержки API 7.1 в ts-morph, стабильной typescript-eslint и Angular не объявлены; план сопровождения 6.x после 6.0.3 не найден.

## Настройка tsconfig

Вывод: база везде одна: `strict` + `noUncheckedIndexedAccess` + `verbatimModuleSyntax` + `skipLibCheck` + явные `types`, `rootDir`, `target`, `module`. Различаются `module`/`moduleResolution` и пара `isolatedDeclarations`/`composite`. `moduleResolution: bundler` годится только для кода, который реально потребляет бандлер.

### Что известно об опциях

- Приложения под бандлер: `module: esnext`, `moduleResolution: bundler`, `esModuleInterop`, `noEmit` (или `emitDeclarationOnly`), `allowImportingTsExtensions`, `allowArbitraryExtensions`, `verbatimModuleSyntax` (или `isolatedModules`). Не ставить `"type": "module"` и не использовать `.mts` в таких проектах — [Choosing Compiler Options](https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options.html).
- Библиотеки: `module: node18` (шаблон ниже берёт `node20`, та же логика, новее), `target` — минимальный поддерживаемый, строгие настройки, потому что «satisfying those tends to satisfy all others». `moduleResolution: bundler` в библиотеке назван «infectious»: он пропускает `export * from "./utils"`, который падает в Node — [Choosing Compiler Options](https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options.html).
- Vite транспилирует, но не проверяет типы. Нужны `isolatedModules: true`, проверка `tsc --noEmit` рядом со сборкой, `tsc --noEmit --watch` или `vite-plugin-checker` в разработке. `target` из tsconfig Vite игнорирует и берёт `oxc.target` / `build.target` — [Vite Features: TypeScript](https://vite.dev/guide/features.html#typescript).
- esbuild компилирует по файлу и читает из tsconfig только `experimentalDecorators`, `target`, `useDefineForClassFields`, `baseUrl`, `paths`, `jsx*`, `alwaysStrict`, `strict`, `verbatimModuleSyntax`, `importsNotUsedAsValues`, `preserveValueImports`, `extends` — [esbuild: TypeScript](https://esbuild.github.io/content-types/#typescript).
- `@tsconfig/strictest` 2.0.8 задаёт: `strict`, `allowUnusedLabels: false`, `allowUnreachableCode: false`, `exactOptionalPropertyTypes`, `noFallthroughCasesInSwitch`, `noImplicitOverride`, `noImplicitReturns`, `noPropertyAccessFromIndexSignature`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`, `isolatedModules`, `esModuleInterop`, `skipLibCheck` — [unpkg: @tsconfig/strictest](https://unpkg.com/@tsconfig/strictest/tsconfig.json).
- `@tsconfig/vite-react` 8.1.1: `target es2023`, `module esnext`, `moduleResolution bundler`, `allowImportingTsExtensions`, `verbatimModuleSyntax`, `erasableSyntaxOnly`, `moduleDetection force`, `noEmit`, `jsx react-jsx`, `types: ["vite/client"]`, `tsBuildInfoFile: ./node_modules/.tmp/tsconfig.app.tsbuildinfo`; `strict` не задан (полагается на умолчание 6.0+) — [unpkg: @tsconfig/vite-react](https://unpkg.com/@tsconfig/vite-react/tsconfig.json).
- Набор баз: `recommended`, `strictest`, `node-ts`, `node-lts`, `node24`, `node26`, `bun`, `deno`, `next`, `nuxt`, `svelte`, `vite-react`, `remix` и др.; `extends` принимает массив с 5.0 — [tsconfig/bases](https://github.com/tsconfig/bases).
- `isolatedModules` не ускоряет emit сам по себе, а лишь флагует конструкции, требующие межфайловой информации — [TypeScript Performance wiki](https://github.com/microsoft/TypeScript/wiki/Performance). Страницы опций: [isolatedModules](https://www.typescriptlang.org/tsconfig/isolatedModules.html), [verbatimModuleSyntax](https://www.typescriptlang.org/tsconfig/verbatimModuleSyntax.html), [erasableSyntaxOnly](https://www.typescriptlang.org/tsconfig/erasableSyntaxOnly.html), [noUncheckedIndexedAccess](https://www.typescriptlang.org/tsconfig/noUncheckedIndexedAccess.html).
- `isolatedDeclarations` (5.5): «Require sufficient annotation on exports so other tools can trivially generate declaration files» — [tsconfig: isolatedDeclarations](https://www.typescriptlang.org/tsconfig/isolatedDeclarations.html), [TS 5.5 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-5.html).
- `skipLibCheck` ускоряет сборку ценой возможных скрытых конфликтов `.d.ts` — [Performance wiki](https://github.com/microsoft/TypeScript/wiki/Performance), [tsconfig: skipLibCheck](https://www.typescriptlang.org/tsconfig/skipLibCheck.html). Шаблоны Vite ставят `true` — [Vite Features](https://vite.dev/guide/features.html#typescript). TypeSlayer советует не исключать сторонние зависимости из анализа через `skipLibCheck` — [TypeSlayer docs](https://docsearch.algolia.com/mcp/docs/repo/dimitropoulos/typeslayer) `[не проверено]`.
- `erasableSyntaxOnly` разумно включать и на фронтенде: его уже ставит `@tsconfig/vite-react`, и он совпадает с тем, что нужно Oxc без типов и нативному запуску `.ts` в Node.
- `noUnusedLocals` и `noUnusedParameters` из `@tsconfig/strictest` дублируют линтер; при Oxlint или ESLint их лучше отключить.

### Шаблон 1: приложение на бандлере (фронтенд)

Проходит `tsc -p .` с exit 0 на 7.0.2 и 6.0.3 (проверено локально, Node 24.17.0, Windows 11).

```jsonc
{
  "compilerOptions": {
    "target": "es2022",
    "lib": ["es2024", "dom", "dom.iterable"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "preserve",                 // react-jsx для React
    "types": [],                       // добавить "vite/client" и т. п.
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "erasableSyntaxOnly": true,
    "noUncheckedSideEffectImports": true,
    "moduleDetection": "force",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noPropertyAccessFromIndexSignature": true,
    "skipLibCheck": true,
    "incremental": true,
    "tsBuildInfoFile": "node_modules/.cache/tsc/app.tsbuildinfo"
  },
  "include": ["src"]
}
```

Пояснения: `types: []` обязателен как явная запись, потому что с 6.0 умолчание пустое; `tsBuildInfoFile` лежит в `node_modules/.cache/tsc`, откуда его берёт кэш CI (см. [Порядок проверок в CI](#порядок-проверок-в-ci)).

### Шаблон 2: публикуемая библиотека (только ESM)

Конфиг проверен локально: TS 7.0.2 и 6.0.3 собирают его, Node 24.17, Windows 11. В `package.json` библиотеки: `"type": "module"`, `exports` с `types` и `default`, `files: ["dist", "src"]`, `sideEffects: false`.

```jsonc
// package.json: "type": "module",
//   "exports": { ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" }, "./package.json": "./package.json" },
//   "files": ["dist", "src"], "engines": { "node": ">=22.12" }, "sideEffects": false
{
  "compilerOptions": {
    "target": "es2023",                // что запускает самая старая поддерживаемая среда; не завышайте
    "lib": ["es2023"],
    "module": "node20",                // стабильная семантика для потребителей
    "types": [],                       // "node" только если библиотека использует API Node
    "rootDir": "src",
    "outDir": "dist",
    "declaration": true,
    "declarationMap": true,            // "go to definition" попадает в src/ (публикуйте src/)
    "sourceMap": true,
    "isolatedDeclarations": true,      // быстрые .d.ts по файлам (tsdown/oxc)
    "rewriteRelativeImportExtensions": true,
    "erasableSyntaxOnly": true,
    "verbatimModuleSyntax": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "stripInternal": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

Проверка артефакта: publint сообщает «All good!», `attw --pack --profile esm-only` даёт зелёный статус для node16-from-ESM и bundler (проверено локально). Без профиля attw помечает «ESM (dynamic import only)» для CJS-потребителей. Не включайте `exactOptionalPropertyTypes` в библиотеке, не проверив потребителей, у которых он выключен: флаг меняет чтение необязательных свойств в публичных типах.

Серверное приложение на Node, где `.ts` запускает сам Node, а `tsc` только проверяет типы: `module: nodenext`, `types: ["node"]`, `erasableSyntaxOnly` — готовый шаблон смотрите в скилле node-knowledge.

### Шаблон 3: монорепозиторий (корень и пакеты)

Конфиг пакета с project references собирается: `tsc -b --verbose` на двух пакетах, повторный запуск сообщает `is up to date`; флаги `--builders 2 --checkers 2` приняты на 7.0.2 (проверено локально). Корневые файлы ниже составлены из подтверждённых опций, но целиком как корневая связка отдельно не запускались `[не проверено]`.

```jsonc
// tsconfig.base.json в корне: общие строгие опции, без emit-настроек
{
  "compilerOptions": {
    "target": "es2023",
    "module": "node20",
    "types": [],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "erasableSyntaxOnly": true,
    "skipLibCheck": true
  }
}
```

```jsonc
// tsconfig.json в корне: «решение», сам ничего не компилирует
{
  "files": [],
  "references": [{ "path": "packages/core" }, { "path": "packages/app" }]
}
```

```jsonc
// packages/*/tsconfig.json: подтверждено сборкой
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,             // включает incremental и declaration
    "rootDir": "src",
    "outDir": "dist",
    "isolatedDeclarations": true   // чтобы .d.ts строились без вывода типов
  },
  "include": ["src"],
  "references": [{ "path": "../core" }]
}
```

Замечания:

- Turborepo project references не рекомендует («another caching layer»), `tsconfig.json` в корне вызывает у него промахи кэша, а `check-types` строится по `topo`-графу — [Turborepo: TypeScript](https://turborepo.dev/docs/guides/tools/typescript). Nx позиционирует project references и инкрементальные сборки как основную поддержку TS — [Nx: TypeScript](https://nx.dev/docs/technologies/typescript). TS wiki советует разбивать на проекты, когда страдает редактор и трассы показывают масштаб, а не горячие точки: 5–20 проектов, общие зависимости проверяются повторно — [Performance wiki](https://github.com/microsoft/TypeScript/wiki/Performance).
- Практический выбор: при сотнях пакетов и `tsc -b --builders N` выигрывает граф TS; при кэширующем оркестраторе проще отдельный `tsc --noEmit` на пакет. Решайте замером.
- Одна версия компилятора на весь монорепозиторий: каталог версий (см. [Пакетные менеджеры и защита цепочки поставки](#пакетные-менеджеры-и-защита-цепочки-поставки)). Запись `npm:`-алиасов в каталог для схемы с двумя версиями TS не проверялась.

### Неизвестно про tsconfig

- Количественных данных о влиянии отдельных строгих флагов (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) на время проверки нет. Выбирайте их ради пойманных ошибок.
- Не оценено, как `skipLibCheck: false` меняет время на TS 7.

## Диагностика медленной проверки типов

Вывод: порядок такой: `--extendedDiagnostics` → `--listFilesOnly` / `--explainFiles` → `--generateTrace` + `analyze-trace` → `--pprofDir` на TS 7. На 7.0.2 трассы работают, но `--checkers` меняет счётчики типов и инстанцирований, поэтому сравнивать версии и ставить бюджеты нужно только при `--checkers 1`.

### Порядок действий

1. Измерьте общую картину: `--extendedDiagnostics` (файлы, I/O, parse, bind, check, память, инстанцирования).
2. Посмотрите, что вообще попало в программу: `--listFilesOnly`, `--explainFiles`. Лишние `@types` и build-артефакты дешевле всего убрать, поэтому файлы идут раньше типов.
3. Если время уходит в Check, снимайте трассу и ищите дорогие выражения.
4. Только после этого правьте типы (приёмы ниже).

Команды (флаги и назначение — [Performance wiki](https://github.com/microsoft/TypeScript/wiki/Performance), страница правлена 2026-02-20):

```bash
tsc -p . --noEmit --extendedDiagnostics          # файлы, I/O, parse, program, bind, check, память, инстанцирования
tsc -p . --showConfig                            # итоговый конфиг после extends
tsc -p . --listFilesOnly                         # список файлов без проверки (предпочтительнее --listFiles)
tsc -p . --explainFiles > files.txt              # почему файл попал в программу
tsc -p . --traceResolution > resolve.txt         # шаги разрешения импортов
tsc -p . --generateTrace tr --incremental false  # трасса; нужен tsc, не бандлер
npx analyze-trace tr                             # пакет @typescript/analyze-trace
```

Работа с трассой: Chrome `about://tracing`, раскрыть Main; смотреть `checkSourceFile`, `checkExpression`, `checkVariableDeclaration`; метаданные дают `id` типа, его ищем в `types.json`. В режиме `--build` пишутся `trace.N.json`, `legend.json` связывает их с tsconfig. Трассы могут содержать пути и исходный код, не публикуйте их без проверки — [Performance Tracing wiki](https://github.com/microsoft/TypeScript/wiki/Performance-Tracing). Анализатор: [microsoft/typescript-analyze-trace](https://github.com/microsoft/typescript-analyze-trace). Уменьшение трассы: `process-tracing --sample=5 --close trace.1.json trace.1.json.gz` — [Performance Tracing wiki](https://github.com/microsoft/TypeScript/wiki/Performance-Tracing).

### Правило `--checkers 1`

Для бюджетов и A/B-сравнений всегда запускайте `tsc --checkers 1`. На одном чекере счётчики Types и Instantiations у 7.0.2 совпали с 6.0.3 до единицы (266 013 инстанцирований). При 4 и 8 чекерах они выросли на 52 % и 121 %, потому что у каждого чекера своя таблица типов. Трассы с одним чекером читать тоже проще: один `types_0.json`. На 6.0.3 флаг `--checkers` не существует (`TS5025`), поэтому для сравнения версий используйте его только на 7.x.

### Что отличается на TS 7

- `--generateTrace` добавлен в порт на Go в апреле 2026 («Tracing is now wired through core checker, compiler, and tsc paths») — [changelog typescript-go 2026-04-24](https://kt3k.github.io/changelog/microsoft/typescript-go/2026-04-24); до этого в [issue #3054](https://github.com/microsoft/typescript-go/issues/3054) советовали `--pprofDir`. В анонсе 7.0 про трассировку ни слова — [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/).
- На 7.0.2 `--generateTrace` создаёт `legend.json`, `trace.json` и `types_N.json` на каждый чекер (при 4 чекерах `types_0..3.json`). `analyze-trace` 0.11.1 эти трассы читает и показывает hot spots; порог пришлось снизить: `--forceMillis 20 --skipMillis 5` (проверено локально).
- `--pprofDir pp` пишет `*-cpuprofile.pb.gz` и `*-memprofile.pb.gz`. `--generateCpuProfile` на 7.0.2 принимается, но файл не появился (проверено локально); причина неизвестна.
- Среди флагов 7.0.2 и 7.1-beta есть `--checkers`, `--builders`, `--singleThreaded`, `--pprofDir`, `--generateTrace`; на 6.0.3 `--checkers` даёт `TS5025` (проверено локально).

### Как `--checkers` меняет числа

Проверено локально: Node 24.17.0, Windows 11, синтетика из 120 файлов с рекурсивными и mapped-типами (195 файлов с lib), `noEmit`.

| Компилятор | Types | Instantiations | Memory | Check | Total |
|---|---:|---:|---:|---:|---:|
| 6.0.3 | 395 060 | 266 013 | 552 МБ | 1,62 с | 2,02 с |
| 7.0.2, `--checkers 1` | 395 060 | 266 013 | 342 МБ | 1,39 с | 1,45 с |
| 7.0.2, 4 (умолч.) | 539 120 | 404 172 | 452 МБ | 0,50 с | 0,56 с |
| 7.0.2, `--checkers 8` | 731 200 | 588 384 | 574 МБ | 0,36 с | 0,42 с |
| 7.1.0-beta, 4 (умолч.) | 491 305 | 358 119 | 352 МБ | 0,46 с | 0,51 с |

На более простом проекте (600 файлов, 675 с lib) 6.0.3 дал 1,52 с всего и 206 МБ, 7.0.2 — 0,16 с и 104 МБ, то есть около 10× (проверено локально).

Выводы из таблицы:

- На типо-тяжёлом коде при одном чекере 7.0.2 даёт 1,39 с против 1,62 с у 6.0.3. Основной выигрыш 7.0 здесь от параллелизма. В CI с 2–4 ядрами ожидания 8–12× могут не сбыться.
- `--checkers` выше умолчания платит памятью: 452 → 574 МБ в замере. На раннерах с небольшим ОЗУ верхний предел памяти важнее скорости. `--checkers 2` на 2-ядерном раннере разумная отправная точка, но её нужно проверить.
- Реальный проект из отчёта: 6 891 764 инстанцирований и 2,15 ГБ при параллельных чекерах против 2 537 315 и 1,37 ГБ при `--singleThreaded` — [typescript-go #2454](https://github.com/microsoft/typescript-go/issues/2454).
- В CI выигрыш бывает намного меньше обещанного: сообщение о 57 с против 79 с на `ubuntu-latest` (ранний превью, 2025); команда просит repro или pprof — [typescript-go #1507](https://github.com/microsoft/typescript-go/issues/1507).
- Отдельный случай регрессии памяти: перекрёстная дистрибуция в `@types/three` — [typescript-go #4612](https://github.com/microsoft/typescript-go/issues/4612).
- Бывает и обратное: один файл с глубоким рекурсивным типом 7.0.2 проверял около 1,0 с против около 0,6 с у 6.0.3 (проверено локально). Горячие типы ищите через `--generateTrace`.

### Приёмы из Performance wiki

Источник всех пунктов — [Performance wiki](https://github.com/microsoft/TypeScript/wiki/Performance):

| Приём | Зачем |
|---|---|
| `interface X extends A, B` вместо `type X = A & B & {...}` | Конфликты видны, отображение чище, отношения кэшируются. `extends` «slightly faster» — [Total TypeScript: type vs interface](https://www.totaltypescript.com/type-vs-interface-which-should-you-use) |
| Явные аннотации, особенно возвращаемых типов, в медленных местах | Именованные типы дешевле анонимных выведенных |
| Базовые типы вместо больших union | Union «больше примерно дюжины» заметно замедляют |
| Сложные условные типы в именованные alias | Кэшируются |
| Project references только когда страдает редактор и трассы показывают масштаб | 5–20 проектов; общие зависимости проверяются повторно |
| `include`/`exclude` только входные каталоги; `types: []` и перечисление нужных; `incremental`; `skipLibCheck` | Меньше файлов в программе |
| Проверка типов отдельно от emit (fork-ts-checker, `transpileOnly`) | Сборка не ждёт чекер |

Отдельных бенчмарков «interface против intersection» на TS 7 нет.

### Измерение эффекта

- Инстанцирования служат прокси времени проверки: в одном замере 3363 файла, 3 492 575 инстанцирований, Check 4,69 с из 6,91 с; один файл 1590 мс, из них одно сравнение 1185 мс — [Benchmarking TypeScript type-checking (Spiko)](https://tech.spiko.io/posts/benchmarking-typescript-type-checking).
- TypeSlayer: `npx typeslayer` из корня пакета поднимает локальный UI, собирает трассы и CPU-профили, показывает treemap, граф и Perfetto; Linux x64 glibc 2.39+, macOS ARM64, Windows x64 — [dimitropoulos/typeslayer](https://github.com/dimitropoulos/typeslayer). Отдельный пакет `@typeslayer/analyze-trace` — [pkgstats](https://www.pkgstats.com/pkg:@typeslayer/analyze-trace) `[не проверено]`.
- Неизвестно: совместимость TypeSlayer 0.1.32 с трассами TS 7 не подтверждена (FAQ упоминает `tsgo`, текст недоступен).

## Бенчмарки на уровне типов

Вывод: `@ark/attest` — основной инструмент для бюджетов инстанцирований по отдельным типам и работает на TS 7. Для проекта целиком достаточно разбирать строку `Instantiations:` из `--extendedDiagnostics --checkers 1`. Общую методику бенчмарков смотрите в [benchmarking.md](benchmarking.md), тесты типов в [testing.md](testing.md).

| Инструмент | Для чего | Статус на TS 7 |
|---|---|---|
| @ark/attest 0.58.0 | Бюджеты инстанцирований и времени для отдельных выражений | Поддержка TS 7 с 0.57.0; удалено переключение версий TS в процессе; peer `typescript: *`, `tsrs: *` (npm) — [arktype PR #1680](https://github.com/arktypeio/arktype/pull/1680), [arktype PR #1706](https://github.com/arktypeio/arktype/pull/1706) |
| TSTyche 7.2.5 | Тесты типов | Документация: `>=5.4`, «does not yet support TypeScript 7», `latest` откатывается на 6.0 — [TSTyche: TypeScript versions](https://tstyche.org/guides/typescript-versions). Но [issue #443](https://github.com/tstyche/tstyche/issues/443) закрыт 2026-10-11: «Beta release TSTyche 8 with TypeScript 7 support», `tstyche@next`, `tstyche --target next`. Документация отстаёт от беты |
| expect-type 1.4.0 | `expectTypeOf`, основа в Vitest | — [mmkal/expect-type](https://github.com/mmkal/expect-type) |
| vitest `--typecheck` | Запуск `tsc --noEmit` или `vue-tsc --noEmit` | TS 7 на странице не упомянут — [Vitest: Testing Types](https://vitest.dev/guide/testing-types) |

Особенности attest:

- Синтаксис и пороги: `bench("name", () => {...}).mean([2, "ms"]).types([337, "instantiations"])`; запуск `tsx benches.ts`. Baseline-выражение вне bench исключает стоимость первого вызова и не должно совпадать с выражениями в bench (иначе кэш обнуляет счётчик). Порог по умолчанию 20 %, падение только с `--benchErrorOnThresholdExceeded`, процент меняется `--benchPercentThreshold` — [Attest: Benches](https://arktype.io/docs/attest/benches).
- Счётчики детерминированы: «deterministically report the number of type instantiations» — [README @ark/attest 0.58.0](https://cdn.jsdelivr.net/npm/@ark/attest@0.58.0/README.md).
- Практика фиксации чисел в CI: `baselines.json` и скрипт обновления — [supabase/postgrest-js PR #644](https://github.com/supabase/postgrest-js/pull/644/files) (зеркало, `[не проверено]`).

Бюджет на весь проект. Формат строки `Instantiations:` проверен локально, сам скрипт приведён как пример:

```bash
n=$(npx tsc -p . --noEmit --checkers 1 --extendedDiagnostics | awk '/^Instantiations:/{print $2}')
[ "$n" -le "${TYPE_BUDGET:-5000000}" ] || { echo "instantiations $n > budget"; exit 1; }
```

Как выбирать:

- Attest ловит деградацию одного публичного типа, бюджет проекта ловит общий дрейф. Библиотекам с тяжёлыми generics нужен первый, приложениям обычно хватает второго.
- Абсолютный порог задавайте по замеру на конкретном репозитории с запасом 10–20 %, иначе обновление зависимостей будет ронять сборку.
- Неизвестно: есть ли у attest нормализация счётчиков между значениями `--checkers` на TS 7.

## Производительность редактора

Вывод: нативный языковой сервер дал порядковый выигрыш на больших репозиториях, но он всё ещё включается как опция через расширение и не работает с tsserver-плагинами (Vue, Svelte, Astro, MDX, шаблоны Angular).

- Время до первой ошибки на репозитории VS Code: около 17,5 с → менее 1,3 с; LSP, многопоточность. В Visual Studio TS 7 включается автоматически; поддержка VS Code была обещана «in the coming weeks» — [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/).
- Опыт команды VS Code: `tsc --noEmit` 36 с → 5 с; `npm run watch` около 80 с → чуть больше 20 с; загрузка проекта в редакторе около минуты → около 10 с; webpack заменён на esbuild — [Iterating faster with TypeScript 7](https://code.visualstudio.com/blogs/2026/06/26/iterating-faster-with-ts-7).
- Расширение `TypeScriptTeam.native-preview`, включается настройкой `js/ts.experimental.useTsgo` — [Marketplace: TypeScript 7](https://marketplace.visualstudio.com/items?itemName=TypeScriptTeam.native-preview); VS Code 1.118 добавил поддержку беты — [VS Code 1.118](https://code.visualstudio.com/updates/v1_118).
- Настройки в текущем `main` VS Code: `js/ts.experimental.useTsgo`, `js/ts.tsserver.maxMemory` (заменяет `typescript.tsserver.maxTsServerMemory` `[устарело]`), `js/ts.tsserver.watchOptions`, `js/ts.tsserver.heapSnapshot`, `js/ts.tsserver.heapProfile`, `js/ts.tsserver.useSyntaxServer`. Лимит выше 4 ГБ требует `js/ts.tsserver.node.path` — [typescript-language-features/package.json](https://github.com/microsoft/vscode/blob/main/extensions/typescript-language-features/package.json).
- Известная проблема: расширение TS 7 находило только `@typescript/native-preview` и молча использовало встроенный компилятор вместо `typescript@7.x` из проекта — [TypeScript #64565](https://github.com/microsoft/TypeScript/issues/64565). Обход из комментария там же (2026-10-21): `"js/ts.tsdk.path": "node_modules/typescript"` `[не проверено]`.
- При нехватке памяти редактора: `disableReferencedProjectLoad` и `disableSolutionSearching`; подробный лог — `"typescript.tsserver.log": "verbose"` — [Performance wiki](https://github.com/microsoft/TypeScript/wiki/Performance). `disableReferencedProjectLoad` загружает проекты по мере открытия файлов, поэтому Find All References становится неполным — [tsconfig: disableReferencedProjectLoad](https://www.typescriptlang.org/tsconfig/disableReferencedProjectLoad.html).
- WebStorm 2026.2.2: поддержка TS 7 для Angular и React заявлена как стабильная — [WebStorm blog](https://blog.jetbrains.com/webstorm/2026/09/typescript-7-in-webstorm-faster-coding-assistance-for-angular-and-react-no-migration-required/) (страница отдала 403, данные из сниппета поиска, `[не проверено]`).

Порядок действий для большого монорепозитория: сначала нативный LSP (если нет tsserver-плагинов), затем `disableReferencedProjectLoad`, и только потом подъём `js/ts.tsserver.maxMemory`. Проекты на Vue, Svelte, Astro и Angular пока живут в разделённом режиме: быстрый `tsc` 7 в CLI и TS 6 в редакторе. Рассинхрон диагностики между ними считайте нормой.

Неизвестно: стал ли нативный сервер встроенным в VS Code к ноябрю 2026, официальной заметки о релизе не найдено.

## Сборщики и транспиляторы

Вывод: приложения: Vite 8 по умолчанию, Next.js остаётся на Turbopack, Rsbuild или Rspack подходят для миграции с webpack и дают лучший dev-старт на больших графах. Библиотеки: tsdown с `isolatedDeclarations`. Типы всегда проверяет отдельный `tsc`: ни один из этих сборщиков этого не делает. Фронтенд-специфику (фреймворки, бандл-бюджеты) смотрите в [frontend.md](frontend.md).

### Выбор

| Задача | Брать | Команда |
|---|---|---|
| SPA, MPA, SSR-фреймворки | Vite 8 | `npm create vite@latest` · `vite build` · `tsc --noEmit` рядом |
| Next.js | Turbopack (умолчание) | `next build`; проверка типов отдельно |
| Большой проект, переезд с webpack, важен dev-старт | Rsbuild 2 / Rspack 2 | `rsbuild build` |
| webpack 5 | только наследие; `[устарело]` для новых проектов → Vite или Rspack | |
| Простая библиотека без бандлинга | `tsc -p .` | |
| Библиотека с бандлом | tsdown 0.23.7 + `isolatedDeclarations` | `tsdown` |
| Серверный сервис на Node | см. скилл node-knowledge | |

### Открытый бенчмарк бандлеров

Данные от 2026-11-01, коммит `8d085d4d`, GitHub Actions. Бенчмарк поддерживает команда Rstack, железо CI плавает — [rstackjs/build-tools-performance](https://github.com/rstackjs/build-tools-performance). Читать цифры нужно с поправкой на автора, хотя Vite в нём выигрывает prod-сборку, что говорит в пользу добросовестности.

| react-10k (10 000 компонентов), мс | Dev startup | HMR | Prod build |
|---|---:|---:|---:|
| Rspack 2.3.0 | 1278 | 97 | 2915 |
| Rsbuild 2.3.0 | 1256 | 115 | 3507 |
| Vite 8.3.5 | 6826 | 134 | 1840 |
| webpack 5.112.2 | 20 597 | 2293 | 23 310 |

| popular-libs, Prod build | мс |
|---|---:|
| Rolldown 1.2.15 | 790 |
| esbuild 0.28.2 | 957 |
| Vite 8.3.5 | 1186 |
| Rsbuild 2.3.0 | 1320 |
| Rspack 2.3.0 | 1403 |
| webpack 5.112.2 | 5340 |
| Rollup 4.65.1 | 7488 |

Разрыв между Vite 8 и Rspack лежит в разных местах: Vite быстрее в prod-сборке на больших графах (1840 против 2915 мс), Rspack в 5,3× быстрее стартует в dev (1278 против 6826 мс). Выбирайте по тому, что болит.

### Что известно о каждом

- Vite 8 (2026-03-12): Rolldown как единственный бандлер, замена esbuild + Rollup; слой совместимости конвертирует `esbuild`/`rollupOptions`; Linear 46 с → 6 с, Ramp −57 %, Mercedes-Benz.io до −38 %, Beehiiv −64 %; нужен Node 20.19+ или 22.12+ — [Announcing Vite 8](https://vite.dev/blog/announcing-vite8).
- Rolldown 1.0 (2026-05-07): заявлено 10–30× быстрее Rollup и на уровне esbuild; full bundle mode ещё не выпущен, предварительно dev-старт в 3× быстрее — [Announcing Rolldown 1.0](https://voidzero.dev/posts/announcing-rolldown-1-0).
- Rspack 2.0 (2026-04-22): 10k-бенчмарк 3,1 с, с кэшем 1,4 с, HMR 118 мс; чистый ESM; `rslint --type-check` и планы подключить typescript-go к `ts-checker-rspack-plugin` — [Announcing Rspack 2.0](https://rspack.rs/blog/announcing-2-0).
- Turbopack: бандлер по умолчанию в Next.js с 16.0; использует SWC; типы не проверяет («run `tsc --watch` or rely on your IDE»); откат `next build --webpack`; плагины webpack не поддерживает — [Next.js: Turbopack](https://nextjs.org/docs/app/api-reference/turbopack). Независимых цифр по Turbopack с проверяемой методикой нет; обзоры вроде [Vite 8 vs Rspack vs Turbopack](https://tech-insider.org/vite-8-vs-rspack-vs-turbopack-2026/) `[не проверено]` методику не раскрывают, а сводка [Kunal Ganglani](https://www.kunalganglani.com/blog/vite-turbopack-rspack-benchmark) собрана из разных источников и несопоставима.

### Транспиляторы

- Oxc против SWC (собственный бенчмарк Oxc): 3,03–5,71× в зависимости от файла и настроек; `.d.ts` через isolated declarations против tsc 7,99–44,45×; Max RSS на parser.ts 57 МБ против 74 МБ; пакет darwin-arm64 1,95 МБ против 37,5 МБ — [oxc-project/bench-transformer](https://github.com/oxc-project/bench-transformer). Другой бенчмарк Oxc: минимум 2× над SWC, но больше памяти — [bench-javascript-transformer-written-in-rust](https://github.com/oxc-project/bench-javascript-transformer-written-in-rust) `[не проверено]`: источники одного автора расходятся по памяти. Сводка: [Oxc benchmarks](https://oxc.rs/docs/guide/benchmarks.html).
- Кто чем транспилирует: Vite — Oxc ([Vite Features](https://vite.dev/guide/features.html#typescript)); Next — SWC; Rspack — `builtin:swc-loader` ([Announcing Rspack 2.0](https://rspack.rs/blog/announcing-2-0)). Независимых сопоставимых замеров esbuild, SWC и Oxc за 2026 год нет.

### Сборка библиотек и `.d.ts`

- tsup 9.0.0 ещё публикуется, но README: «not actively maintained anymore», совет — tsdown `[устарело]` → tsdown — [egoist/tsup](https://github.com/egoist/tsup), [Migrate from tsup](https://tsdown.dev/guide/migrate-from-tsup). unbuild 3.6.1 без релизов с 2025-08 (npm).
- tsdown использует rolldown-plugin-dts; при `isolatedDeclarations` — oxc-transform, иначе TypeScript; генерация включается по полям `types`/`exports` — [tsdown: dts](https://tsdown.dev/options/dts), [tsdown](https://github.com/rolldown/tsdown).
- `rolldown-plugin-dts` 0.30.0 выбирает генератор: `oxc` при `isolatedDeclarations`, `tsgo` при API 7.1, `tsc` иначе. Бэкенд через CLI на TS 7.0 объявлен deprecated и уйдёт в следующем минорном релизе; `tsrs` «highly experimental» — [sxzz/rolldown-plugin-dts](https://github.com/sxzz/rolldown-plugin-dts).
- `isolatedDeclarations` обосновал [Marvin Hagemeister](https://marvinh.dev/blog/speeding-up-javascript-ecosystem-part-10/): вывод типов — главная цена, без него `.d.ts` сводится к синтаксической операции (качественные оценки, методики нет). Bazel/Aspect: oxc около 5 мс против около 340 мс у tsc — [Aspect: isolated declarations](https://aspect.build/docs/bazel/javascript/isolated-declarations) `[не проверено]`.
- tsdown ещё в 0.x: в библиотеках фиксируйте точную версию.

Неизвестно: независимого воспроизводимого сравнения Turbopack с Vite или Rspack вне Next.js не существует, потому что Turbopack работает только внутри Next.

## Линтеры и форматтеры

Вывод: быстрый вариант 2026 года — Oxlint с `--type-aware` на tsgolint (стабилен с июля 2026, 59 из 61 правила, 12–18×), но он требует TS 7. ESLint + typescript-eslint даёт полный набор правил и плагинов, но держит TS 6 рядом.

### Выбор

| Ситуация | Вариант |
|---|---|
| Новый проект без плагинов ESLint | Oxlint type-aware + oxfmt или Prettier |
| Angular, Vue, Svelte, нестандартные плагины ESLint | ESLint + typescript-eslint на алиасе TS 6 |
| Хочется один инструмент без компилятора TS | Biome 2 (собственный вывод типов, покрытие правил ниже) |

### ESLint и typescript-eslint

- Рекомендуемая конфигурация с `parserOptions.projectService: true`. Типизированный линтинг заставляет TS анализировать весь проект, полные прогоны нужны перед пушем или в CI — [Typed Linting](https://typescript-eslint.io/getting-started/typed-linting/).
- Производительность: время типизированного линта должно быть сравнимо со временем сборки; `TIMING=1` показывает дорогие правила; узкие `include`; без `eslint-plugin-prettier` (файл парсится дважды), `prettier --check` отдельным шагом; не использовать `import/named`, `import/namespace`, `import/default`, `import/no-named-as-default-member`, `import/no-unresolved`; `import/no-cycle` и подобные только в CI; избегать `@stylistic/indent`; `--max-old-space-size` — последнее средство — [Typed Linting Performance](https://typescript-eslint.io/troubleshooting/typed-linting/performance/).
- Наборы правил: `recommended` + `stylistic` без типов; `recommended-type-checked` + `stylistic-type-checked` с типами; `strict-type-checked` только если команда уверенно владеет TS, и он не стабилен по semver — [typescript-eslint Configs](https://typescript-eslint.io/users/configs/).
- ESLint 10 (2026-02-06): eslintrc удалён полностью, `eslint.config.*` ищется от каталога файла (важно для монорепозиториев), минимум Node 20.19 — [ESLint v10.0.0](https://eslint.org/blog/2026/02/eslint-v10.0.0-released/).

### Oxlint и tsgolint

- Oxlint type-aware стабилен (2026-07-22); tsgolint v7 следует за TS 7.0.2 (`v7.0.2000` = патч 0 для 7.0.2); 59 из 61 правила. Бенчмарк на Apple M4 Pro: vscode 83,2 → 6,96 с (12×), typescript 27,2 → 1,94 с (14×), typeorm 13,2 → 0,75 с (18×), vuejs/core 12,3 → 0,95 с (13×) — [Type-Aware Linting Stable](https://oxc.rs/blog/2026-07-22-type-aware-linting-stable). README: «10–20x» — [oxc-project/tsgolint](https://github.com/oxc-project/tsgolint). Более ранние оценки 20–40× `[устарело]`.
- Требования и ограничения: TS 7.0+; флаги `--type-aware`, `--type-check`; `baseUrl` и другие опции, удалённые в 7.0, не поддерживаются; пакеты монорепозитория должны быть собраны (нужны `.d.ts`); возможна высокая память; отладка `--debug timings`, `OXC_LOG=debug` — [Oxlint Type-Aware](https://oxc.rs/docs/guide/usage/linter/type-aware.html). Тип и линт делят одну программу, что избавляет от повторной настройки — [Type-Aware Linting Stable](https://oxc.rs/blog/2026-07-22-type-aware-linting-stable).
- Гипотеза: `oxlint --type-aware --type-check` может заменить отдельный шаг `tsc --noEmit` в CI, но тогда теряется кэш `.tsbuildinfo`. Замена оправдана, только если сумма двух шагов заметно больше единого прогона; это нужно замерить.

### Biome

Biome 2 строит собственный вывод типов без компилятора TS. `noFloatingPromises` ловил около 75 % случаев typescript-eslint на ограниченной выборке (2025-06-17) — [Biome v2](https://biomejs.dev/blog/biome-v2/). Цифра старая, считайте её нижней оценкой, а не текущим покрытием. Сканер проекта opt-in; правила проекта и типов — известная стоимость; `biome lint --profile-type-inference` доступен с 2.6 — [Biome: Investigate slowness](https://biomejs.dev/guides/investigate-slowness/).

### Форматтеры

- Oxfmt — бета с 2026-02-24, более 30× быстрее Prettier и 3× быстрее Biome на первом прогоне без кэша — [Oxfmt Beta](https://oxc.rs/blog/2026-02-24-oxfmt-beta); до 36× и 100 % JS/TS-тестов Prettier — [VoidZero, февраль 2026](https://voidzero.dev/posts/whats-new-feb-2026). Намеренные расхождения с Prettier есть — [Oxfmt docs](https://oxc.rs/docs/guide/usage/formatter).
- Prettier — [prettier.io](https://prettier.io/). Oxfmt в 0.x: в команде на Prettier сначала сравните дифф на всём репозитории, потом меняйте.

### Команды

```bash
# Вариант на Oxlint (TS 7 в проекте)
npm i -D oxlint oxlint-tsgolint oxfmt
npx oxlint --type-aware --type-check
npx oxfmt --check

# Вариант на ESLint (алиас typescript → TS 6)
npx eslint .          # flat config, projectService: true
TIMING=1 npx eslint . # какое правило дорогое
npx prettier --check .
```

Неизвестно: покрытие `noFloatingPromises` в Biome 2.5–2.6; какие именно два правила typescript-eslint не покрыты tsgolint (в README незавершёнными отмечены `naming-convention` и `prefer-destructuring`, `[не проверено]`, блог их не называет).

## Мёртвый код и зависимости

Вывод: Knip закрывает неиспользуемый код и зависимости и работает независимо от версии TS; ts-prune и depcheck не берите. Для архитектурных правил нужен dependency-cruiser, перед публикацией — publint и attw. Структурные принципы слоёв смотрите в [architecture.md](architecture.md).

| Задача | Инструмент | Заметка |
|---|---|---|
| Неиспользуемые файлы, экспорты, зависимости | knip | Использует oxc-parser и oxc-resolver, не `ts.findReferences`; нет peer на typescript (npm) — [Knip FAQ](https://knip.dev/reference/faq). Поддержка content mappers влита — [Knip PR #1978](https://github.com/webpro-nl/knip/pull/1978) |
| Неиспользуемые экспорты | ts-prune `[устарело]` → knip | На npm 0.10.3 от 2022 года. Репозиторий ожил (коммит 2026-09-14 готовит 0.11, README: «has been resurrected»), но релиза 0.11 на 2026-11-08 нет — [nadeesha/ts-prune](https://github.com/nadeesha/ts-prune) |
| Неиспользуемые зависимости | depcheck `[устарело]` → knip | Репозиторий архивирован (`archived: true`, последний push 2025-02-27) — [depcheck/depcheck](https://github.com/depcheck/depcheck) |
| Граф, правила слоёв, циклы | dependency-cruiser | См. таблицу совместимости с TS 7 выше — [sverweij/dependency-cruiser](https://github.com/sverweij/dependency-cruiser) |
| Граф и циклы (альтернативы) | madge, skott | madge 8.0.0 (2024-08) застыл; `detectiveOptions.ts.skipTypeImports`, `tsConfig` для алиасов — [pahen/madge](https://github.com/pahen/madge). skott 0.35.12: граф, циклы, неиспользуемые файлы и зависимости, `.ts` через typescript-estree — [antoine-coulon/skott](https://github.com/antoine-coulon/skott) |
| Линтер `package.json` и `exports` | publint | — [publint.dev](https://publint.dev/) |
| Проверка опубликованных типов | attw | `attw --pack` — [arethetypeswrong](https://arethetypeswrong.github.io/) |
| Свёртка `.d.ts` и отчёт об API | api-extractor | — [API Extractor](https://api-extractor.com/) |

```bash
npx knip --production                       # только продуктовый граф
npx depcruise src --config .dependency-cruiser.js
npx publint && npx attw --pack . --profile esm-only
```

Набор на проект: knip всегда; dependency-cruiser, когда есть правила слоёв; publint + attw для всего публикуемого; api-extractor только при поддерживаемом публичном API. Неизвестно: сравнительных замеров knip, dependency-cruiser и skott на одном репозитории нет.

## Пакетные менеджеры и защита цепочки поставки

Вывод: задержка по возрасту релиза есть у pnpm, npm и Bun (у pnpm включена по умолчанию), каталоги версий есть у pnpm и Bun. Для TS-проектов это даёт одну версию компилятора на монорепозиторий и защиту от свежих релизов инструментов; библиотекам нужны trusted publishing и `isolatedDeclarations` для JSR. Инциденты и аудит подробно разобраны в скилле node-knowledge.

| Менеджер | Что настраивать | Источник |
|---|---|---|
| pnpm | `minimumReleaseAge` по умолчанию 1440 минут (нестрого, с откатом на более раннюю версию); `minimumReleaseAgeStrict` true только при явной настройке; `trustPolicy` выключен по умолчанию, значение `no-downgrade`; `blockExoticSubdeps` true | [pnpm: Dependency resolution](https://pnpm.io/settings/dependency-resolution) |
| pnpm, каталоги | `catalog:` в `pnpm-workspace.yaml`, `catalogMode` (`manual` по умолчанию, `strict`, `prefer`), `catalogPrune` | [pnpm: Catalogs](https://pnpm.io/catalogs) |
| npm | `min-release-age` (дни, по умолчанию `null`), `min-release-age-exclude`, `before`, `allow-git` | [npm config](https://docs.npmjs.com/cli/v11/using-npm/config) |
| Bun | `minimumReleaseAge` в секундах или с единицами, `minimumReleaseAgeExcludes`, `trustedDependencies` (скрипты зависимостей без доверия не выполняются), каталоги в `workspaces` корневого `package.json`, текстовый `bun.lock` | [Bun install](https://bun.sh/docs/pm/cli/install) |

Trusted publishing: npm CLI ≥ 11.5.1, Node ≥ 22.14.0, GitHub Actions, GitLab или CircleCI на облачных раннерах; `id-token: write`; provenance автоматически для публичных пакетов из публичного репозитория (кроме CircleCI) — [Trusted publishers](https://docs.npmjs.com/trusted-publishers), [Provenance](https://docs.npmjs.com/generating-provenance-statements).

JSR: «slow types» — экспорты без явного типа. `isolatedDeclarations` покрывает это правило; без исправления типы потребителей проверяются минимум в 1,5–2× медленнее, `.d.ts` неполные. Проверяет `jsr publish` / `deno publish`, обход `--allow-slow-types` — [JSR: About slow types](https://jsr.io/docs/about-slow-types). Обзор — [JSR docs](https://jsr.io/docs/introduction). Поэтому `isolatedDeclarations` окупается трижды: быстрый `.d.ts`, совместимость с JSR и более быстрая проверка у потребителей.

Один TS на монорепозиторий (пример показывает синтаксис, а не рекомендацию исключать всё):

```yaml
# pnpm-workspace.yaml
catalog:
  typescript: 7.0.2
minimumReleaseAge: 4320
minimumReleaseAgeExclude:
  - "@typescript/*"
```

`minimumReleaseAgeExclude` для `typescript` нужен только тем, кто действительно живёт на `next`; остальным лучше не исключать.

## Порядок проверок в CI

Вывод: дешёвые проверки идут раньше, сборка и упаковка позже. `.tsbuildinfo` безопасно кэшировать: при обычном `--incremental` важно содержимое, а не mtime, но ключ кэша обязан включать версию TS. Если у проекта два компилятора, у каждого свой `tsBuildInfoFile`.

### Команды по порядку

Порядок выведен из источников и локальных тестов; общая схема пайплайна — [pipeline.md](pipeline.md).

| # | Шаг | Команда |
|---|---|---|
| 0 | Установка из lockfile | `pnpm install --frozen-lockfile` / `npm ci` |
| 1 | Контроль компилятора | `npx tsc -v` (ожидаемая версия) |
| 2 | Формат | `oxfmt --check` или `prettier --check .` |
| 3 | Синтаксический линт | `oxlint` |
| 4 | Проверка типов | `tsc -p . --noEmit` с `--incremental` |
| 5 | Типизированный линт | `oxlint --type-aware` или `eslint .` |
| 6 | Тесты и тесты типов | `vitest run --typecheck` |
| 7 | Мёртвый код, архитектура | `knip`, `depcruise` |
| 8 | Сборка | `vite build` / `tsdown` |
| 9 | Проверка артефакта | `publint`, `attw --pack` |
| 10 | E2E | по необходимости |

Почему так: проверка типов в Vite — отдельная команда ([Vite Features](https://vite.dev/guide/features.html#typescript)), `prettier --check` тоже отдельным шагом ([typescript-eslint Performance](https://typescript-eslint.io/troubleshooting/typed-linting/performance/)). Для малых PR самая большая экономия — не запускать незатронутое: оркестратор (`turbo`, `nx affected`) важнее подбора флагов компилятора.

### Кэш `.tsbuildinfo`

Проверено локально (Node 24.17.0, Windows 11, синтетические проекты):

- `tsc --incremental` 7.0.2: полный прогон 817–988 мс, без изменений 256 мс; `touch` всех файлов не инвалидирует кэш (250 мс); изменение одного файла 348 мс. На 6.0.3: 2399 → 611 мс, после `touch` 624 мс.
- `tsc -b` 7.0.2: первичная проверка актуальности идёт по времени («newest input older than output»), но после `touch` без изменения содержимого пересборки не было, только `Updating output timestamps`.
- Разные версии TS не разделяют кэш: 6.0.3 с `.tsbuildinfo` от 7.0.2 сделал полную проверку (2349 мс против 623 мс у повторного), 7.0.2 после 6.0.3 тоже (836 мс). Поэтому версия TS обязана входить в ключ кэша.
- Утверждение, что потеря mtime после `checkout` инвалидирует кэш TS, пришло от одного пользователя из старого обсуждения — [Lightrun: tsbuildinfo](https://lightrun.com/answers/actions-cache-tutorial-monorepo-with-typescript-how-to-benefit-from-tsbuildcache-info) `[не проверено]`; локальный тест его не подтверждает.

Кэш в GitHub Actions. `restore-keys` восстанавливает устаревший кэш по префиксу, при этом `cache-hit` равен `false` — [actions/cache](https://github.com/actions/cache). Хэш lockfile в ключе решает проблему разных версий TS автоматически: версия компилятора меняется только вместе с lockfile. Частичный кэш всё равно полезен, TS сам определит изменившиеся файлы, поэтому держите `restore-keys`.

```yaml
- uses: actions/cache@<pinned-sha>
  with:
    path: node_modules/.cache/tsc
    key: tsc-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml', 'tsconfig*.json') }}-${{ github.sha }}
    restore-keys: |
      tsc-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml', 'tsconfig*.json') }}-
```

Если компиляторов два (TS 7 для CLI и TS 6 для API), задайте каждому свой `tsBuildInfoFile`, иначе они перезаписывают кэш друг друга. Если версия TS не привязана к lockfile (например, ставится отдельным шагом), добавьте в ключ вывод `npx tsc -v`.

### Turborepo

Кэшируется только то, что указано в `outputs`; хэш включает lockfile и файлы пакета; для удалённого кэша `turbo login`, `turbo link`; отладка `--dry`, `--summarize`, `--force` — [Turborepo: Caching](https://turborepo.dev/docs/crafting-your-repository/caching).

```jsonc
// turbo.json
{ "tasks": {
    "topo": { "dependsOn": ["^topo"] },
    "check-types": { "dependsOn": ["topo"], "outputs": ["node_modules/.cache/tsc/**"] }
} }
```

Неизвестно: официального примера кэширования `.tsbuildinfo` в `examples.md` у `actions/cache` нет (поиск по тексту в `main` пуст); подробную страницу Nx о project references получить не удалось (прежний адрес 404, текущая не отдала текст); текущий тег `actions/cache` не проверялся, в шаблоне стоит заполнитель.

## Симптом → приём

| Симптом | Приём | Где |
|---|---|---|
| После установки двух версий TS `tsc -v` показывает 6.x | Алиас занял `.bin/tsc`; вызывайте бинарник 7.0 явно, добавьте `npx tsc -v` шагом CI | [Статус компилятора](#статус-компилятора) |
| `TS5102: Option 'baseUrl' has been removed` | Убрать `baseUrl`, оставить `paths` относительно tsconfig | [Статус компилятора](#статус-компилятора) |
| `TS5025` на `--checkers` | Флаг есть только на 7.x, у 6.0.3 его нет | [Диагностика медленной проверки типов](#диагностика-медленной-проверки-типов) |
| typescript-eslint не работает на TS 7 | Алиас `typescript` → `@typescript/typescript6`, `tsc` 7 отдельно | [Статус компилятора](#статус-компилятора) |
| `vue-tsc`, `svelte-check`, Angular падают на TS 7 | TS 6 рядом; `--tsgo` в svelte-check не делать гейтом CI | [Статус компилятора](#статус-компилятора) |
| `tsc` медленный, неясно где | `--extendedDiagnostics`, затем `--listFilesOnly`, затем `--generateTrace` + `analyze-trace` | [Диагностика медленной проверки типов](#диагностика-медленной-проверки-типов) |
| Счётчики инстанцирований прыгают между запусками | Сравнивать только при `--checkers 1` | [Диагностика медленной проверки типов](#диагностика-медленной-проверки-типов) |
| В CI на 2 ядрах TS 7 быстрее лишь на 10–30 % | Ожидаемо при малом параллелизме; измерить `--checkers 2`, следить за памятью | [Диагностика медленной проверки типов](#диагностика-медленной-проверки-типов) |
| Память `tsc` выросла на TS 7 | Попробовать `--checkers 1` или `--singleThreaded`; проверить случаи вроде `@types/three` | [Диагностика медленной проверки типов](#диагностика-медленной-проверки-типов) |
| Дорогой публичный тип в библиотеке | Бюджет инстанцирований через `@ark/attest` | [Бенчмарки на уровне типов](#бенчмарки-на-уровне-типов) |
| Общий дрейф стоимости типов в приложении | Бюджет `Instantiations:` из `--checkers 1` в CI | [Бенчмарки на уровне типов](#бенчмарки-на-уровне-типов) |
| Редактор съедает память в монорепозитории | Нативный LSP, `disableReferencedProjectLoad`, затем `js/ts.tsserver.maxMemory` | [Производительность редактора](#производительность-редактора) |
| Расширение TS 7 использует не тот компилятор | `"js/ts.tsdk.path": "node_modules/typescript"` `[не проверено]` | [Производительность редактора](#производительность-редактора) |
| Vite не показывает ошибок типов | Vite не проверяет типы; добавить `tsc --noEmit` или `vite-plugin-checker` | [Настройка tsconfig](#настройка-tsconfig) |
| Медленный dev-старт большого графа | Rsbuild/Rspack (1278 мс против 6826 мс у Vite в react-10k) | [Сборщики и транспиляторы](#сборщики-и-транспиляторы) |
| Медленная генерация `.d.ts` у библиотеки | `isolatedDeclarations` + tsdown | [Сборщики и транспиляторы](#сборщики-и-транспиляторы) |
| Типизированный ESLint слишком долго работает | `TIMING=1`, убрать `eslint-plugin-prettier` и тяжёлые `import/*`, сузить `include` | [Линтеры и форматтеры](#линтеры-и-форматтеры) |
| Нужен быстрый типизированный линт | Oxlint `--type-aware` (нужен TS 7) | [Линтеры и форматтеры](#линтеры-и-форматтеры) |
| Неиспользуемые экспорты и зависимости | knip; ts-prune и depcheck не брать | [Мёртвый код и зависимости](#мёртвый-код-и-зависимости) |
| Циклы и нарушения слоёв | dependency-cruiser с правилами | [Мёртвый код и зависимости](#мёртвый-код-и-зависимости) |
| Кэш `.tsbuildinfo` не помогает после обновления TS | Версия TS должна быть в ключе кэша, у каждого компилятора свой файл | [Порядок проверок в CI](#порядок-проверок-в-ci) |
| `jsr publish` ругается на slow types | `isolatedDeclarations` и явные типы экспортов | [Пакетные менеджеры и защита цепочки поставки](#пакетные-менеджеры-и-защита-цепочки-поставки) |

## Спорные места и пробелы

Что неизвестно или расходится по источникам, на 2026-11-08:

| Вопрос | Состояние |
|---|---|
| Даты поддержки API 7.1 в ts-morph, стабильной typescript-eslint, Angular | Не объявлены |
| Сопровождение TS 6.x после 6.0.3 | План не найден; будут ли исправления в 6.0, неясно |
| Блог-пост Angular о компиляторе на TS 7 | Прочитать не удалось (страница защиты от ботов) |
| Бэкенд tsgo в typescript-eslint | Источники расходятся: 1,2–2,4× медленнее по отзыву пользователя и «slightly faster» по словам мейнтейнера |
| Влияние отдельных строгих флагов и `skipLibCheck: false` на время проверки | Измерений нет, особенно на TS 7 |
| Корневая связка монорепозитория (`tsconfig.base.json` + solution-файл) | Составлена из подтверждённых опций, целиком отдельно не запускалась |
| Совместимость TypeSlayer 0.1.32 с трассами TS 7 | Не подтверждена |
| `--generateCpuProfile` на 7.0.2 | Флаг принимается, файл не появляется, причина неизвестна |
| Нормализация счётчиков attest между `--checkers` на TS 7 | Не выяснено |
| Бенчмарки «interface против intersection» на TS 7 | Не найдены |
| Нативный сервер встроен ли в VS Code к ноябрю 2026 | Официальной заметки нет |
| Независимое сравнение esbuild, SWC и Oxc за 2026; Turbopack вне Next.js | Нет сопоставимых замеров |
| Fork-ts-checker-webpack-plugin 9.1.0 на TS 7 | Не описано |
| Покрытие `noFloatingPromises` в Biome 2.5–2.6; два непокрытых правила typescript-eslint в tsgolint | Не найдены |
| Сравнение knip, dependency-cruiser и skott на одном репозитории | Не найдено |
| Официальный пример кэша `.tsbuildinfo` у `actions/cache`; страница Nx о project references; актуальный тег `actions/cache` | Не получены или не проверялись |
| `oxlint --type-aware --type-check` вместо отдельного `tsc --noEmit` | Гипотеза, замеров нет |
| Каталоги pnpm с `npm:`-алиасами для двух версий TS | Не проверялось |
