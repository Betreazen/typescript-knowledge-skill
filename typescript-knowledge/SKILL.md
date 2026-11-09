---
name: typescript-knowledge
description: Knowledge base and workflow for TypeScript and browser JS in any domain — web apps (React, Vue, Angular, Svelte, Next.js, Nuxt), libraries, monorepos, mobile (React Native, Expo), desktop (Tauri, Electron), browser games, visualization, extensions, edge, AI apps. Use for any TypeScript question, even one that looks quick to answer from memory: writing or reviewing TS; tsc errors, tsconfig, TS 6 vs TS 7; generics, unions, branded types, Zod; slow type-checking, instantiations; choosing tools (Vite, Rolldown, tsdown, ESLint, oxlint, Biome, Vitest, Playwright, pnpm, Turborepo); project structure, barrel files, boundaries; slow pages, LCP, INP, CLS, big bundles, re-renders, frame drops, browser memory leaks; benchmarks and profiling (mitata, Lighthouse, size-limit, hyperfine); TS books. Includes a curated library, toolchain guide and pipeline with benchmarks, review and measured optimization. For Node.js runtime issues (event loop, heap OOM, hangs, streams, HTTP servers) use node-knowledge; TS types stay here.
---

# TypeScript: библиотека знаний и пайплайн

Скилл помогает писать, проверять и ускорять код на TypeScript в любой предметной области. Внутри три вещи:

1. **Библиотека знаний.** Книги, статьи, доклады, документация, кодовые базы и паттерны по категориям. Каждый источник дан со ссылкой и пояснением, зачем его читать.
2. **Тулчейн.** Какие инструменты ставить, какие команды запускать и в каком порядке.
3. **Пайплайн.** Порядок работы: тесты до кода, проверки качества, бенчмарки, ревью, поиск решений в библиотеке и повторный замер.

Состояние знаний — ноябрь 2026: TypeScript 7.0.2 (компилятор на Go, без программного API), 6.0.3 (последний на JavaScript), 7.1 в бете; React 19.3, Vue 3.5, Angular 22, Svelte 5, Vite с Rolldown, Vitest 5. Серверный Node.js (event loop, HTTP-фреймворки, базы данных, streams) разобран в скилле node-knowledge.

## Куда смотреть

| Задача | Файл |
| --- | --- |
| Новая фича, рефакторинг или оптимизация: порядок работы | [references/pipeline.md](references/pipeline.md) |
| Версии, TS 6 и TS 7, `tsconfig`, медленная проверка типов, сборщики, линтеры, мёртвый код, пакетные менеджеры, порядок CI | [references/toolchain.md](references/toolchain.md) |
| Как выразить идею типами, generics, границы типобезопасности, ошибки, валидация, паттерны, стоимость типов, антипаттерны, чеклист ревью | [references/types-patterns.md](references/types-patterns.md) |
| Код или страница медленные: техника по симптому, движки JS, память, воркеры и Wasm, Core Web Vitals, доставка JS, мифы | [references/performance.md](references/performance.md) — начните с таблицы «Симптом → техника → источник» |
| Как мерить: микробенчмарки, Lighthouse, INP, кадры, размер бандла, типы, статистика, профилирование | [references/benchmarking.md](references/benchmarking.md) |
| Vitest, Playwright, MSW, fast-check, Stryker, тесты типов, покрытие | [references/testing.md](references/testing.md) |
| Структура проекта, границы модулей, barrel-файлы, монорепозитории, типы между слоями, DI, библиотеки, эталонные репозитории | [references/architecture.md](references/architecture.md) |
| React, Vue, Angular, Svelte, Solid и другие: типизация и скорость, метафреймворки, состояние, формы, стили | [references/frontend.md](references/frontend.md) |
| Мобильные, десктоп, браузерные игры, визуализация, расширения, edge, AI, инструменты, embedded, Wasm | [references/domains.md](references/domains.md) |
| Что почитать, блоги, доклады, курсы, русскоязычные ресурсы, маршрут по уровням | [references/books.md](references/books.md) — индекс, короткий список и маршрут. Темы лежат в отдельных файлах `books-*.md`: читайте только нужный по вопросу |

Справочники большие, поэтому не читайте файл целиком. Найдите раздел через Grep по заголовкам (`^## `) или по ключевому слову, затем прочитайте только его через Read с `offset` и `limit`.

Скрипты:

- [scripts/bench_template.mts](scripts/bench_template.mts) — шаблон бенчмарка на mitata с явным прогревом JIT. Нужен на этапе 6.
- [scripts/bench_template_nodeps.mts](scripts/bench_template_nodeps.mts) — запасной шаблон без зависимостей, если mitata поставить нельзя. Вывод читает `bench_compare.mjs`.
- [scripts/bench_compare.mjs](scripts/bench_compare.mjs) — сравнение прогонов «до» и «после» (mitata, Vitest 5, hyperfine, Lighthouse, size-limit, tachometer, общий JSON) с учётом шума; возвращает код 1 при регрессии. Нужен на этапах 7 и 11.
- [scripts/tsc_diag.mjs](scripts/tsc_diag.mjs) — переводит `tsc --extendedDiagnostics` в JSON для сравнения счётчиков типов.

## Как работать

**Для задачи больше одной функции** идите по [пайплайну](references/pipeline.md):

1. Опрос.
2. План и спецификация с горячими путями и бюджетами.
3. Подзадачи.
4. Тесты до кода.
5. Изоляция в worktree.
6. Бенчмарки.
7. Базовый замер и профиль.
8. Ревью.
9. Поиск решений в библиотеке.
10. Оптимизация.
11. Повторный замер.

Для мелкой правки хватает короткого режима из того же файла: тест, код, проверки, ревью.

**Перед тем как объявить работу готовой**, прогоните минимальные проверки и покажите их вывод:

```bash
npm ci
npx tsc -v                     # ожидаемая версия: alias на TS 6 подменяет bin/tsc
npx prettier --check .         # или форматтер, принятый в проекте
npx oxlint                     # или npx eslint --max-warnings=0 .
npx tsc --noEmit               # бандлер типы не проверяет
npx vitest run --typecheck     # или раннер, принятый в проекте
npm run build
```

Если проект на pnpm, Bun или Yarn, выполните те же шаги их командами. Для фреймворков добавьте `vue-tsc --noEmit`, `svelte-check` или `ng build`. Для публикуемого пакета добавьте `publint` и `attw --pack`. Если инструмент не установлен, скажите об этом и предложите команду установки из [toolchain.md](references/toolchain.md), а не пропускайте шаг молча.

**При оптимизации:**

- Сначала замер, потом правка. Без базовой линии нельзя сказать, что код стал быстрее.
- Определите оси, которые важны проекту: функции, загрузка страницы, отзывчивость, кадры, размер бандла, проверка типов, сборка. Правка не должна ухудшать другие оси.
- Прогревайте JIT явно и снимайте по 5 прогонов «до» и «после» в отдельных процессах, чередуя порядок (ABBA).
- Перед замерами проверьте стенд A/A-прогоном: порог приёмки должен быть не ниже удвоенного шума.
- Записывайте версии Node, браузера и TypeScript. Счётчики типов TS 6 и TS 7 несравнимы.
- Ищите технику по симптому в [performance.md](references/performance.md) и указывайте источник рядом с правкой.
- Принимайте правку, только если бенчмарк показал значимый выигрыш, а тесты остались зелёными.

**При ревью** используйте чеклисты:

- [types-patterns.md](references/types-patterns.md) — для типов и любого кода;
- [testing.md](references/testing.md) — для тестов;
- [frontend.md](references/frontend.md) — для UI;
- [architecture.md](references/architecture.md) — для структуры проекта и границ модулей.

## Правила использования библиотеки

- **Ссылайтесь на источник.** Рекомендуя паттерн или оптимизацию, давайте ссылку из справочника. Тогда пользователь может проверить совет, а решение не выглядит выдуманным.
- **Учитывайте пометки.** `[устарело]` значит, что у материала есть замена, и она указана рядом. `[не проверено]` значит, что утверждение взято из одного вторичного источника; его стоит перепроверить, прежде чем строить на нём решение. `[проверено локально]` значит, что результат получен запуском на одной машине: это рабочий ориентир, а не общий закон.
- **Проверяйте версии.** Версии указаны на ноябрь 2026, и TypeScript 7.x быстро меняется: 7.1 должен вернуть программный API. Перед важными решениями сверяйтесь с `npm view <пакет>`, release notes и changelog.
- **Уточняйте цели.** Прежде чем советовать новые возможности, узнайте версию TypeScript, целевые браузеры и рантаймы.
- **Говорите о пробелах прямо.** Если в библиотеке нет ответа, так и скажите, а затем ищите в официальной документации. Про незнакомую библиотеку или API сначала сделайте Grep по `references/` и сообщите результат, например: «в библиотеке скилла этого нет». Не выдавайте догадку за материал библиотеки.
- **Следуйте соглашениям проекта.** Если в проекте уже приняты стиль, менеджер пакетов, фреймворк, библиотеки или архитектура, советы библиотеки применяются в их рамках, а не поверх.
