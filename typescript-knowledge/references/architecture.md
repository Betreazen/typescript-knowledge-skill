# Архитектура TypeScript-проектов: от маленького приложения до большого монорепозитория

Как раскладывать TypeScript-код от маленького приложения до монорепозитория: стили и деревья папок, границы модулей и их проверка, barrel-файлы, связывание пакетов и живые типы, TypeScript 7, крупные миграции, типы между клиентом и сервером, DI, состояние и побочные эффекты, библиотеки и SDK, эталонные репозитории, чеклист ревью. Состояние знаний: ноябрь 2026. Версии сняты из реестра npm 8 ноября 2026, деревья репозиториев прочитаны через `gh api` в тот же день. Метки: `[устарело]` с названием замены и `[не проверено]` для утверждений с одним вторичным источником. Числа вендоров помечены как вендорские. Структура Node-сервиса разобрана в skill node-knowledge, `references/architecture.md`. Главный вывод: граница модулей существует, только если её проверяет машина (`exports`, линтер, ratchet в CI), а начинать стоит с фичевой раскладки без лишних слоёв.

Соседние файлы: настройки компилятора и сборка — [toolchain.md](toolchain.md); паттерны типов (branded types, дискриминируемые объединения) — [types-patterns.md](types-patterns.md); скорость `tsserver` и бандлов — [performance.md](performance.md); тесты — [testing.md](testing.md); фронтенд-фреймворки — [frontend.md](frontend.md); игры, мобильные, данные — [domains.md](domains.md); книги — [books.md](books.md).

- [Выбор структуры](#выбор-структуры)
- [Границы модулей](#границы-модулей)
- [Barrel-файлы](#barrel-файлы)
- [Монорепозитории](#монорепозитории)
- [Масштабные миграции](#масштабные-миграции)
- [Типы между слоями](#типы-между-слоями)
- [Внедрение зависимостей](#внедрение-зависимостей)
- [Состояние и побочные эффекты](#состояние-и-побочные-эффекты)
- [Ошибки, конфигурация, флаги и наблюдаемость на границах](#ошибки-конфигурация-флаги-и-наблюдаемость-на-границах)
- [Архитектура библиотек](#архитектура-библиотек)
- [Опыт крупных проектов](#опыт-крупных-проектов)
- [Эталонные кодовые базы](#эталонные-кодовые-базы)
- [Устаревшее и замены](#устаревшее-и-замены)
- [Чеклист ревью архитектуры](#чеклист-ревью-архитектуры)
- [Спорные места и пробелы](#спорные-места-и-пробелы)

## Выбор структуры

Начинайте с фичевой (вертикальной) раскладки с однонаправленными зависимостями. Порты, CQRS, микрофронтенды и полный DDD добавляйте точечно, когда есть конкретная причина: заменяемый адаптер, сложный домен, независимые релизы команд. Минимум, который окупается почти всегда: выделенный домен и соблюдённое правило зависимостей.

### Сравнение стилей

Суть стилей взята из источников. Колонки «Подходит» и «Не подходит» частично сделаны по выводам источников, а не измерены. Измеренных порогов перехода между стилями (число разработчиков, число файлов) не публикует никто.

| Стиль | Суть | Подходит | Не подходит | Источник |
|---|---|---|---|---|
| Colocation, простая раскладка | Код лежит рядом с местом использования | Маленькие приложения, утилиты, игры-прототипы | Много команд без границ | [Colocation — Kent C. Dodds, 2019](https://kentcdodds.com/blog/colocation) |
| Фичи / вертикальные срезы | Код группируется вокруг запроса или фичи | Большинство продуктов, если команда готова рефакторить | Сильное разделяемое ядро домена: появляются расхождения | [Vertical Slice Architecture — Jimmy Bogard, 2018](https://www.jimmybogard.com/vertical-slice-architecture/) |
| Feature-Sliced Design | Слои App, Pages, Widgets, Features, Entities, Shared; слайсы и сегменты | Фронтенд-приложения на вебе, мобильных, десктопе | Библиотеки: методология для приложений | [FSD Overview, v2.1](https://feature-sliced.design/docs/get-started/overview) |
| Слои presentation-domain-data | Разделение по техническим ролям | Небольшие системы или внутри модуля | Верхний уровень большой системы | [PresentationDomainDataLayering — Martin Fowler, 2015](https://martinfowler.com/bliki/PresentationDomainDataLayering.html) |
| Hexagonal (ports and adapters) | Ядро не зависит от устройств и БД, запускается из тестов и скриптов | Несколько реальных адаптеров, долгоживущая логика | CRUD | [Hexagonal Architecture — Alistair Cockburn, 2005](https://alistair.cockburn.us/hexagonal-architecture/) |
| Clean Architecture | Зависимости исходного кода направлены только внутрь | Правило зависимостей окупается почти всегда, полный набор слоёв редко | Малые проекты: время и многословие | [The Clean Architecture — Robert C. Martin, 2012](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html); [Bespoyasov, 2021](https://bespoyasov.me/blog/clean-architecture-on-frontend/) |
| Functional core, imperative shell | Логика чистая, ввод-вывод снаружи | Движки правил, парсеры, симуляции, расчёты, редьюсеры | Логика, которой ввод-вывод нужен посреди решения | [FCIS — Gary Bernhardt](https://www.destroyallsoftware.com/screencasts/catalog/functional-core-imperative-shell); [Dependency rejection — Mark Seemann, 2017](https://blog.ploeh.dk/2017/02/02/dependency-rejection/) |
| Modular monolith | Один деплой, домены с публичным API и своими данными | Средние и большие продукты без потребности в раздельном деплое | Команды, которым нужны независимые релизы | [Deconstructing the Monolith — Kirsten Westeinde, Shopify, 2019](https://shopify.engineering/deconstructing-monolith-designing-software-maximizes-developer-productivity) |
| Micro-frontends | Независимо поставляемые приложения, собранные в целое | Несколько команд с независимым релизным циклом | Одна команда: цена в payload и операциях | [Micro Frontends — Cam Jackson, 2019](https://martinfowler.com/articles/micro-frontends.html) |

Про Bernhardt: прочитана только страница каталога, сами screencast и talk не просмотрены.

### Детали по стилям

Фичи.
- Bulletproof React задаёт поток shared → features → app. Фичи не импортируют друг друга, композиция идёт на уровне app, правило держит `import/no-restricted-paths` с `zones` — [bulletproof-react: project structure](https://raw.githubusercontent.com/alan2207/bulletproof-react/master/docs/project-structure.md).
- Принцип Богарда: «Minimize coupling between slices, and maximize coupling in a slice» — [Bogard, 2018](https://www.jimmybogard.com/vertical-slice-architecture/).

Feature-Sliced Design.
- Модуль импортирует только слои строго ниже, слайсы одного слоя не видят друг друга — [FSD Overview](https://feature-sliced.design/docs/get-started/overview).
- Для реальных взаимных ссылок сущностей есть нотация `@x`: `entities/A/@x/B.ts`, только на слое Entities — [FSD Public API](https://feature-sliced.design/docs/reference/public-api).
- `[устарело]` Слой Processes объявлен deprecated. Замена по спецификации: перенести содержимое в `features` и `app` — [FSD: Layers](https://feature-sliced.design/docs/reference/layers).

Порты и DDD в TS.
- `interface` стирается при компиляции и не может быть токеном DI, поэтому в Nest абстрактный класс служит и контрактом, и токеном — [NestJS custom providers](https://docs.nestjs.com/fundamentals/custom-providers). VS Code заводит идентификатор сервиса по той же причине: типизация структурная — [VS Code: Source Code Organization](https://github.com/microsoft/vscode/wiki/Source-Code-Organization).
- Полный пример DDD + hexagonal + CQRS: `src/modules/<домен>/{commands,queries,domain,database,application}`, `src/libs/`. README предупреждает: «ill-suited to simple CRUD applications» — [Sairyss/domain-driven-hexagon](https://github.com/Sairyss/domain-driven-hexagon).
- «Parse, don't validate»: на границе преобразуйте данные в более точный тип, чтобы компилятор держал гарантию дальше — [Alexis King, 2019](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/).

Граница клиент/сервер.
- `'use client'` и `'use server'` делают сетевой переход синтаксическим и статически анализируемым — [What Does "use client" Do? — Dan Abramov, 2025](https://overreacted.io/what-does-use-client-do/).
- В TanStack Start граница держится суффиксами: `*.functions.ts` (обёртки `createServerFn`), `*.server.ts` (только серверные помощники), `*.ts` (код, безопасный для клиента) — [TanStack Start: Server Functions](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions).

Модульный монолит.
- Fowler советует начинать с монолита и резать, когда границы прояснились — [MonolithFirst, 2015](https://martinfowler.com/bliki/MonolithFirst.html).
- Shopify позже пересмотрел статические границы: нулевое число нарушений не означало изоляцию, пакет без нарушений не загружался. Рекомендация: загружать пакеты изолированно и гонять их тесты в CI, а пакеты определять по функциональной роли — [A Packwerk Retrospective — McGibbon, Salzberg, Shopify, 2024](https://shopify.engineering/a-packwerk-retrospective).

Микрофронтенды.
- Минусы: дублирование зависимостей в payload, расхождение окружений, операционная сложность. Интеграция на этапе сборки отвергается из-за синхронных релизов, runtime через JS назван выбором по умолчанию — [Cam Jackson, 2019](https://martinfowler.com/articles/micro-frontends.html).
- Module Federation 2.0 стабилен (апрель 2026): рантайм отделён от сборщика, `mf-manifest.json`, динамические подсказки типов; скептики называют его «headache» и предпочитают инструменты монорепозитория — [InfoQ, 2026](https://www.infoq.com/news/2026/04/module-federation-2-stable); [Module Federation: guide](https://module-federation.io/guide/start/index.html). single-spa: последний стабильный [6.0.3 от сентября 2024](https://registry.npmjs.org/single-spa), ветка 7 в beta — [single-spa: overview](http://single-spa.js.org/docs/getting-started-overview/).

Критика переусложнения.
- «Duplication is cheaper than the wrong abstraction»; если абстракция неверна, быстрее откатиться — [The Wrong Abstraction — Sandi Metz, 2016](https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction).
- Не делите приложение слишком рано: точки разреза должны проявиться сами, а хорошая точка имеет узкий интерфейс — [The Grug Brained Developer](https://grugbrain.dev/).
- CQRS: «you should be very cautious about using CQRS» — [Martin Fowler, 2011](https://martinfowler.com/bliki/CQRS.html).

### Деревья каталогов

Пороги выбора ниже получены из источников выше как оценка, не как измерение.

Дерево A. Маленькое приложение, CLI, игра-прототип (colocation).

```text
src/
  main.ts             # точка сборки: wiring и запуск
  game-loop.ts        # или app.tsx, cli.ts
  rules/score.ts      # чистая логика
  rules/score.test.ts
  io/save-file.ts     # ввод-вывод
```

Дерево B. Среднее SPA или мобильное приложение (фичи, поток shared → features → app).

```text
src/
  app/                # роутер, провайдеры, композиция фич
  features/
    billing/{api,components,hooks,model,index.ts}
    editor/{...}
  shared/{ui,lib,config}
```

Дерево C. FSD.

```text
src/{app,pages,widgets,features,entities,shared}/
src/entities/user/{ui,model,api,index.ts}
src/entities/user/@x/order.ts   # только для entities/order
```

Дерево D. Hexagonal-модуль внутри сервиса или движка.

```text
src/modules/orders/
  domain/{order.ts,order.test.ts}       # чистые типы и функции
  application/{place-order.ts,ports.ts} # use cases и порты-интерфейсы
  adapters/{http,postgres,stripe}/      # реализации портов
  index.ts                              # публичный API модуля
src/composition-root.ts                 # единственная точка сборки
```

Дерево E. Клиент с разделением по рантайму (модель VS Code): инструменты, десктоп, тяжёлые данные.

```text
src/{base,platform,core,workbench}/
  common/   # только чистый JS, работает везде
  browser/  # DOM
  node/     # Node API
  worker/   # код для Web Worker
```

Дерево F. Игра, симуляция, движок (модель ядро/платформа/сцена, по дереву PlayCanvas).

```text
src/{core,platform,scene,framework}/    # зависимости только влево
src/sim/         # чистое состояние и шаг симуляции: тестируется без рендера
```

Дерево G. Модульный монолит в монорепозитории.

```text
apps/{web,api,worker}/          # тонкие: маршруты и wiring
packages/modules/billing/{frontend,backend,contracts}/
packages/modules/catalog/{frontend,backend,contracts}/
packages/platform/{db,auth,telemetry}/
packages/ui/
```

Дерево H. Большой монорепозиторий (модель Grafana, tldraw, Effect).

```text
apps/*                    # деплоящиеся приложения
packages/core-*           # без зависимостей от фреймворков
packages/<framework>-*    # адаптеры: react-, vue-, solid-
packages/platform/{node,browser,bun}
tooling/{tsconfig,eslint-config}
```

### Как выбирать

- Домен простой и UI главный: дерево B.
- Команд одна-три: B или G.
- Логика важнее UI и живёт дольше фреймворка: D внутри модулей.
- Несколько рантаймов (браузер, Node, worker): E.
- Симуляция или игра: F с чистым `sim/`.
- Вертикальные срезы и hexagonal не конкурируют: срез определяет верхний уровень, порты появляются внутри среза там, где есть второй адаптер.
- Абстрактный порт с одной реализацией обычно лишний. Цю в своём примере прямо применяет Inline Class к интерфейсу с единственной реализацией — [Juntao Qiu, 2023](https://martinfowler.com/articles/modularizing-react-apps.html).

## Границы модулей

Граница существует только если её проверяет машина. Для пакета это `exports`, для папки — линтер или `dependency-cruiser`, для старого кода — ratchet от базового значения. Рабочий минимум: `exports` на каждом внутреннем пакете, запрет чужих внутренних путей линтером, проверка циклов в CI, `verbatimModuleSyntax`.

### `exports` и публичный API

- Grafana задаёт уровни публичности через подпути: `./` для всех, `./unstable` для экспериментов (доступен плагинам), `./internal` только для самого Grafana — [grafana/packages/README.md](https://github.com/grafana/grafana/blob/main/packages/README.md).
- tRPC держит внутренний импорт `unstable-core-do-not-import` как публичный путь и объясняет почему: иначе ошибка «The inferred type ... cannot be named». Это TS-специфика: вывод типов вынуждает экспортировать то, что логически внутреннее — [trpc: unstable-core-do-not-import.ts](https://github.com/trpc/trpc/blob/main/packages/server/src/unstable-core-do-not-import.ts).
- Workspace npm сам по себе не граница: фантомные зависимости ловят pnpm или проверки в CI (локальная проверка описана в skill node-knowledge, `references/architecture.md`).

### Инструменты контроля границ

| Инструмент | Уровень | Как работает | Версия (npm) | Источник |
|---|---|---|---|---|
| `exports` | Пакет | Рантайм и резолвинг | встроено | см. выше |
| project references | TS-проект | Компиляция только по объявленным ссылкам | встроено | [TS Handbook](https://www.typescriptlang.org/docs/handbook/project-references.html) |
| dependency-cruiser | Файлы | Правила `forbidden`, отчёты | [18.7.2](https://registry.npmjs.org/dependency-cruiser) | skill node-knowledge, `references/architecture.md` |
| eslint-plugin-boundaries | Элементы | Элементы и политики allow/disallow, подсветка в IDE | [7.4.2](https://registry.npmjs.org/eslint-plugin-boundaries) | [JS Boundaries](https://www.jsboundaries.dev/) |
| Nx `enforce-module-boundaries` | Проекты по тегам | `depConstraints`; проект без тегов ни от чего не может зависеть | Nx [24.0.5](https://registry.npmjs.org/nx) | [Nx docs](https://nx.dev/docs/features/enforce-module-boundaries) |
| `turbo boundaries` | Пакеты | Импорт вне пакета, необъявленные пакеты, правила тегов транзитивно. Экспериментально | [2.11.10](https://registry.npmjs.org/turbo) | [Turborepo: boundaries](https://turborepo.dev/docs/reference/boundaries) |
| Sheriff | Модули | Инкапсуляция и `depRules`, без зависимостей кроме TS | [0.20.0](https://registry.npmjs.org/@softarc%2Fsheriff-core) | [Sheriff](https://sheriff.softarc.io/docs/introduction) |
| ArchUnitTS | Файлы, в тестах | Архитектурные правила как unit-тесты; пакет `archunit` | [2.5.4](https://registry.npmjs.org/archunit) | [LukasNiessen/ArchUnitTS](https://github.com/LukasNiessen/ArchUnitTS) |
| Steiger | FSD | Линтер структуры FSD | [0.9.0](https://registry.npmjs.org/steiger) | [FSD Public API](https://feature-sliced.design/docs/reference/public-api) |
| `no-restricted-imports`, Biome `noRestrictedImports` | Файлы | Запрещённые шаблоны путей, дёшево | встроено | [Cal.com biome.json](https://github.com/calcom/cal.diy/blob/main/biome.json) |
| Своё правило ESLint | Папки, рантайм | Слои и таргеты | свой код | [vscode/.eslint-plugin-local](https://github.com/microsoft/vscode/tree/main/.eslint-plugin-local) |

- `[устарело]` ts-arch (`tsarch`): [5.4.1 от декабря 2024](https://registry.npmjs.org/tsarch). Замена — ArchUnitTS.
- Осторожно с именами: `arch-unit-ts` — другой, отдельный проект — [arch-unit-ts](https://github.com/arch-unit-ts/arch-unit-ts).
- Для маленького приложения хватает `no-restricted-imports`. dependency-cruiser или boundaries окупаются, когда правил больше двух-трёх и нужна транзитивная логика (вывод из источников, не измерение).
- Статические проверки дают нижнюю границу качества. Опыт Shopify показывает, что нужен дополнительный прогон: сборка или запуск пакета изолированно.

### Ratchet: внедрение в старом коде

Требовать ноль нарушений с первого дня обычно нереально. Рабочий приём: хранить базовое число и падать только при росте.

- n8n не требует нуля: скрипт падает, только если `turbo boundaries` нашёл больше ошибок, чем записано в `.boundaries-baseline.json` (на момент чтения 105). Nightly-задача понижает базу, повышения автоматически нет. Автор скрипта честно отмечает, что счётчик не различает исправленную и новую ошибку при том же числе — [n8n: check-boundaries.mjs](https://github.com/n8n-io/n8n/blob/master/scripts/check-boundaries.mjs).
- Grafana хранит подавления ESLint в корневом `eslint-suppressions.json` и задаёт множество блоков `no-restricted-imports` — [grafana/eslint.config.js](https://github.com/grafana/grafana/blob/main/eslint.config.js).
- Предупреждение Shopify: ноль нарушений статической проверки не доказывает изоляцию. Пакет без нарушений может не загружаться вовсе. Добавьте к линтеру CI-задачу, которая загружает и тестирует каждый пакет отдельно — [Packwerk Retrospective, 2024](https://shopify.engineering/a-packwerk-retrospective).
- Инструмент границ, который нашёл 0 модулей, сломан, а не доволен кодом: проверяйте, что отчёт содержит ожидаемое число файлов.

### Циклические импорты

- Figma при включении strictNullChecks упёрлась в цикл из 500+ файлов, почти половину кодовой базы. Его разбивали как сильно связанную компоненту — [Inside Figma — Rudi Chen, 2020](https://www.figma.com/blog/inside-figma-a-case-study-on-strict-null-checks/).
- Grafana запускает madge со `skipTypeImports: true`: циклы только по типам исключены из проверки — [grafana/.madgerc](https://github.com/grafana/grafana/blob/main/.madgerc). Циклы только по типам безвредны в рантайме, но логически связывают модули; исключение их из проверки разумно для старта.
- `[устарело]` madge: последний релиз [8.0.0 от августа 2024](https://registry.npmjs.org/madge). Замена — правило `no-circular` в dependency-cruiser.
- Подвох TS 7: dependency-cruiser 18.7 объявляет поддержку `typescript <7` — [реестр npm, supportedTranspilers](https://registry.npmjs.org/dependency-cruiser/latest). С одним `typescript@7` он молча обходит 0 модулей (локальная проверка описана в skill node-knowledge). Держите рядом `typescript6` или настройте `parser: swc`.

### Type-only импорты

- `verbatimModuleSyntax`: импорты без `type` остаются, всё с `type` удаляется — [TSConfig](https://www.typescriptlang.org/tsconfig/verbatimModuleSyntax.html).
- `[устарело]` `importsNotUsedAsValues` и `preserveValueImports` → `verbatimModuleSyntax` — [TSConfig: preserveValueImports](https://www.typescriptlang.org/tsconfig/preserveValueImports.html).
- Причины метить импорты как `type`: не запускать побочные эффекты модулей и дать транспайлерам с пофайловой обработкой знать, что удалить. Подвох: `import { type xyz } from 'xyz'` оставляет пустой импорт, ловится правилом `no-import-type-side-effects` — [Josh Goldberg, typescript-eslint, 2023](https://typescript-eslint.io/blog/consistent-type-imports-and-exports-why-and-how).

## Barrel-файлы

Внутри приложения barrel-файл вреден: он раздувает граф модулей, замедляет тесты, TS-сервер и сборку, а приватность не обеспечивает. Barrel уместен как единственная точка входа библиотеки. Для существующих приложений: запретить новые barrel-файлы, убирать старые волнами, автофикс-правилом линтера.

### Цифры

| Источник | Ситуация | Результат |
|---|---|---|
| [Atlassian, Tim Sebastian, 2025](https://www.atlassian.com/blog/atlassian-engineering/faster-builds-when-removing-barrel-files) | Jira frontend, почти 100 000 изменённых файлов, более 1000 разработчиков | TS-подсветка быстрее более чем на 30%; локальные unit-тесты в среднем на 50% быстрее (до 10x); минуты сборки на коммит −75%; unit-тестов на сборку −88% |
| [Marvin Hagemeister, 2023](https://marvinh.dev/blog/speeding-up-javascript-ecosystem-part-7/) | Синтетика: загрузка графа модулей | 500 модулей 0,15 с; 10 000 — 3,12 с; 50 000 — 48,44 с |
| [TkDodo, 2024](https://tkdodo.eu/blog/please-stop-using-barrel-files) | Проект Next.js | 11 тыс. модулей → примерно 3,5 тыс. (−68%) |
| [Vercel, Shu Ding, 2023](https://vercel.com/blog/how-we-optimized-package-imports-in-next-js) | `optimizePackageImports` | `@material-ui/icons` 10,2 с → 2,9 с (11 738 → 632 модуля); `@mui/material` 7,1 с → 2,9 с |

Числа Atlassian получены в одной очень большой кодовой базе и измерены самой компанией. Цифры Hagemeister получены на синтетике, цифры Vercel относятся к конкретной оптимизации Next.js.

### Позиции школ

- Исключение у TkDodo: точка входа библиотеки — единственное место, где barrel осмыслен. Там же: barrel не делает внутренности приватными без правил линтера. `optimizePackageImports` работает только с файлом из чистых реэкспортов — [TkDodo, 2024](https://tkdodo.eu/blog/please-stop-using-barrel-files).
- Turborepo рекомендует `exports` вместо barrel-файлов — [Structuring a repository](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository).
- Cal.com запрещает импорт из `index.ts`: `@calcom/ui/components/button`, а не `@calcom/ui` — [AGENTS.md](https://github.com/calcom/cal.diy/blob/main/AGENTS.md).
- Напряжение между школами: Sheriff определяет модуль через конфиг или barrel `index.ts` — [Sheriff](https://sheriff.softarc.io/docs/introduction). Здесь barrel работает как объявление границы, в отличие от позиции Atlassian. Совместить можно так: barrel как декларация публичного API модуля, но импорт внутри самого модуля идёт по прямым путям, а внешним потребителям barrel виден лишь на границе пакета.
- Сгенерированный код тоже создаёт barrel: в GraphQL Codegen `index.ts` отключается через `skipIndexFile: true` — [client-preset](https://the-guild.dev/graphql/codegen/plugins/presets/preset-client).

## Монорепозитории

По умолчанию: pnpm с каталогами, Turborepo или Nx, `exports` на каждом пакете. Для живых типов лучше всего работает своя condition в `exports` с `customConditions`. Project references оправданы на больших репозиториях и выигрывают память, но требуют синхронизации. TS 7 сильно снижает цену полной проверки и пока оставляет необходимость держать рядом TS 6 для инструментов.

### Workspaces и каталоги

- Версии (npm, 8 ноября 2026): [typescript](https://registry.npmjs.org/typescript) 7.0.2 (2026-07-08, тег beta/next 7.1.0-beta), [@typescript/typescript6](https://registry.npmjs.org/@typescript%2Ftypescript6) 6.0.2, [pnpm](https://registry.npmjs.org/pnpm) 12.18.0, [bun](https://registry.npmjs.org/bun) 1.4.4, [turbo](https://registry.npmjs.org/turbo) 2.11.10, [nx](https://registry.npmjs.org/nx) 24.0.5, [@moonrepo/cli](https://registry.npmjs.org/@moonrepo%2Fcli) 2.6.5, [@microsoft/rush](https://registry.npmjs.org/@microsoft%2Frush) 5.182.1, [@changesets/cli](https://registry.npmjs.org/@changesets%2Fcli) 3.0.3.
- pnpm catalogs: `catalog:` и `catalog:<name>` в `pnpm-workspace.yaml`. Именованные каталоги помогают мигрировать зависимость по одному пакету. `catalogMode: strict|prefer|manual`, `catalogPrune`. При публикации `catalog:` заменяется реальным диапазоном — [pnpm: catalogs](https://pnpm.io/catalogs).
- Изоляция pnpm и фантомные зависимости разобраны в skill node-knowledge, `references/architecture.md`.
- Мобильные. Expo поддерживает Bun, npm, pnpm и Yarn, Metro настраивается автоматически с SDK 52, изолированные установки с SDK 54. Дублировать нативные модули нельзя, некоторые библиотеки RN ломаются при изоляции, запасной вариант `nodeLinker: hoisted` — [Expo: monorepos](https://docs.expo.dev/guides/monorepos/).

### Сравнение инструментов

| Инструмент | Сильная сторона | Ограничение | Источник |
|---|---|---|---|
| Turborepo | Простой кеш задач, remote cache бесплатен | `boundaries` экспериментальны | [блог Turborepo](https://turborepo.dev/blog) |
| Nx | Граф проектов, теги границ, `@nx/js` синхронизирует `references` | Больше концепций, conformance в Enterprise | [Nx docs](https://nx.dev/docs/features/enforce-module-boundaries) |

- Turborepo 2.9 (март 2026): заявлено «Up to 96% faster», `turbo query` стабилен. Цифра 96% — заявление вендора. 2.10 (июнь 2026): graceful shutdown задач, отложенное хеширование. 2.11 (сентябрь 2026): нативная поддержка Rust, Python и Go — [блог Turborepo](https://turborepo.dev/blog).
- `[устарело]` Утверждение на странице moon, что Turborepo поддерживает только Node.js: в 2.11 добавлены Rust, Python и Go — [moon: comparison](https://moonrepo.dev/docs/comparison), [блог Turborepo](https://turborepo.dev/blog).
- Выбор между Turborepo и Nx определяется тем, нужен ли встроенный контроль границ по тегам (Nx) или минимальный слой поверх `package.json` (Turborepo).

### Связывание внутренних пакетов

| Стратегия | Как устроена | Плюсы | Минусы | Источник и пример |
|---|---|---|---|---|
| Just-in-Time | `exports` указывает на `.ts` | Нет сборки | Нет кеша сборки; `paths` не работает (нужны subpath imports при TS 5.4+); ошибки типов переносятся на потребителя | [Turborepo: internal packages](https://turborepo.dev/docs/core-concepts/internal-packages) |
| Compiled | `types` на источник, `default` на `dist` | Кешируется | Настройка | там же |
| Publishable | Готов к npm | Для внешних | Самые строгие требования | там же |
| Project references | `composite`, `references`, `tsc -b` | Память, инкрементальность | Ручная синхронизация; нужны собранные `.d.ts` | [TS Handbook](https://www.typescriptlang.org/docs/handbook/project-references.html) |
| Custom export condition | Своя condition первой в `exports`, `customConditions` в tsconfig | Живые типы, один раз настроить | Настраивать каждый инструмент | [Colin McDonnell, 2024](https://colinhacks.com/essays/live-types-typescript-monorepo) |
| `publishConfig` | `exports` на исходники, переопределение при публикации | Просто | Только pnpm; случайный `npm publish` опасен | там же; пример — [effect/package.json](https://github.com/Effect-TS/effect/blob/main/packages/effect/package.json) |
| `paths` | Алиасы | Быстрый старт | Не создают границы, нужны инструменты времени выполнения | [monorepo.tools](https://monorepo.tools/typescript) |

Выбор по размеру (вывод из источников, не измерение):
- Малый монорепозиторий (до ~10 пакетов, одно приложение): JIT-пакеты + Turborepo.
- Средний и большой: Compiled + custom condition для разработки. Project references добавляйте, когда редактор упирается в память или полная проверка стала узким местом.
- Публикуемые библиотеки всё равно нуждаются в `dist` и `.d.ts`.

### Живые типы через custom condition

Идея: в `exports` пакета первой стоит своя condition, указывающая на исходники. Компилятор с `customConditions` читает исходники, а сборщик и Node без неё берут `dist`. Правки в пакете видны потребителю сразу, без пересборки.

Рабочая condition в реальном проекте Grafana:

```json
"exports": {
  ".": {
    "@grafana-app/source": "./src/index.ts",
    "types": "./dist/types/index.d.ts",
    "import": "./dist/esm/index.mjs",
    "require": "./dist/cjs/index.cjs"
  }
}
```

Источник — [grafana/packages/README.md](https://github.com/grafana/grafana/blob/main/packages/README.md). В tsconfig:

```json
{ "compilerOptions": { "customConditions": ["@grafana-app/source"] } }
```

- Опция действует только при `moduleResolution` `node16`, `nodenext` или `bundler` — [TSConfig: customConditions](https://www.typescriptlang.org/tsconfig/customConditions.html).
- Имя condition должно быть уникальным: обобщённое `source` может совпасть с condition зависимости и замедлить TS Server — [Colin McDonnell, 2024](https://colinhacks.com/essays/live-types-typescript-monorepo).
- Condition должна быть первой в объекте: порядок ключей в `exports` значим, побеждает первое совпавшее условие.
- Настраивать её нужно в каждом инструменте, который резолвит пакеты: сборщик, тест-раннер, линтер. Если один инструмент condition не знает, он возьмёт `dist` и вы получите устаревшие типы или рассинхрон.

### Project references

- Рекомендация команды TS: примерно 5–20 проектов, равные по размеру. Группируйте файлы, редактируемые вместе, и держите тесты отдельно. Обратная сторона: каждый потребитель перепроверяет используемые типы пакета — [TS wiki: Performance](https://github.com/microsoft/TypeScript/wiki/Performance).
- Память с project references: менее 1 ГБ против примерно 3 ГБ (Nx, таймингов в тексте нет) — [Zack DeRose, Nx, 2025](https://nx.dev/blog/typescript-project-references).
- Иллюстрация Nx: холодная сборка 186,53 с с алиасами против 175,52 с с references; инкрементальная — 36,33 с — [monorepo.tools](https://monorepo.tools/typescript). Оба источника от вендора.

### TypeScript 7 и монорепозитории

TS 7.0 вышел 8 июля 2026, стандартный пакет `typescript` и команда `tsc`.

Числа из анонса (измерения Microsoft, вендорские):

| Проект | TS 6 | TS 7 (4 checkers) | Ускорение |
|---|---|---|---|
| vscode, полная сборка | 125,7 с | 10,6 с | 11,9x |
| sentry | 139,8 с | 15,7 с | около 8,9x |
| tldraw | 11,2 с | 1,46 с | около 7,7x |

Память vscode: 5,2 ГБ → 4,2 ГБ. В редакторе открытие файла с ошибкой: около 17,5 с → менее 1,3 с — [Announcing TypeScript 7.0 — Daniel Rosenwasser, 2026](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/). Ускорения для sentry и tldraw посчитаны здесь по приведённым секундам.

Независимая миграция Prisma: монорепо на десятки пакетов, TS 5.8.2 → 7.0.2, проверка всего репозитория около 74 с → около 24 с, то есть 3x, а не 10x. Причина разницы: `tsc` составляет лишь часть времени CI, остальное (линт, тесты, генерация, установка) не ускорилось. Изменения в миграции: убран `baseUrl`, обновлён `vite-tsconfig-paths`, убран флаг 8 ГБ — [Datta, Lahtinen, Prisma, 2026](https://www.prisma.io/blog/typescript-7-native-compiler-faster-type-checking).

Почему цифры VS Code и Prisma различаются:
- VS Code измеряет чистую сборку компилятором на 4 checkers, это потолок для самой проверки типов. Prisma измеряет проверку репозитория целиком в своём CI.
- Исходная версия тоже разная: у Prisma старт с TS 5.8.2, у Microsoft сравнение в пределах анонса.
- Ожидание от своего репозитория: выигрыш ограничен долей `tsc` во времени конвейера (закон Амдала). Сначала замерьте эту долю.

Параллелизм и режим сборки:
- `--checkers` (по умолчанию 4) и `--builders` для project references, оба экспериментальные. Сборки references «fundamentally bottlenecked by the dependency graph» — [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/); [7.0 Beta, 2026](https://devblogs.microsoft.com/typescript/?p=5152).
- Статус `--build`: ранние обзоры расходились, но README репозитория портирования отмечает «Build mode / project references: done» — [typescript-go README](https://github.com/microsoft/typescript-go). Утверждение о неполном `--build` ([ecorpit](https://ecorpit.com/typescript-7-migration-readiness-eslint-astro-blockers-2026/)) не подтверждено `[не проверено]`.

Что убрано и что изменилось:
- `[устарело]` Удалены в 7.0: `baseUrl` (делайте `paths` относительными), `moduleResolution: node/node10` и `classic` (нужны `nodenext` или `bundler`). Дефолты сменились: `rootDir: ./`, `types: []`, `strict: true`, `module: esnext` — [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/).
- `[устарело]` `@typescript/native-preview` и команда `tsgo` → `typescript@7`, `tsc`. Репозиторий `microsoft/typescript-go` перемещён: он архивирован, разработка теперь в [microsoft/TypeScript](https://github.com/microsoft/TypeScript) (в корне `go.work`, `packages`, `tsc`).

Инструменты и API:
- В 7.0 нет программного API: инструменты вроде Volar и шаблонов Angular требуют TS 6 — [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/).
- Распространённая связка держит оба: `typescript` как алиас `@typescript/typescript6`, `@typescript/native` как TS 7 — [vscode/package.json](https://github.com/microsoft/vscode/blob/main/package.json), [supabase/pnpm-workspace.yaml](https://github.com/supabase/supabase/blob/master/pnpm-workspace.yaml).
- Настройка tsconfig и миграция флагов — [toolchain.md](toolchain.md).

### isolatedDeclarations

- С ним `.d.ts` генерируются пофайлово, без type checker, поэтому проекты можно проверять параллельно, не дожидаясь зависимостей. Требует явных аннотаций на экспортах. Сам по себе флаг не ускоряет: выигрыш зависит от внешних инструментов — [TS 5.5 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-5.html).

### Версионирование и кеш

- Changesets хранит описание релиза рядом с изменением и выпускает версии, changelog и публикацию — [changesets](https://github.com/changesets/changesets). Turborepo рекомендует его для публикуемых пакетов — [Turborepo](https://turborepo.dev/docs/core-concepts/internal-packages).
- Remote cache Turborepo: кешируются вывод и логи, подпись HMAC-SHA256 (`remoteCache.signature`), самостоятельный хостинг по открытой спецификации API. Документация предупреждает о рисках при неверной настройке переменных окружения — [Turborepo: remote caching](https://turborepo.dev/docs/core-concepts/remote-caching).

## Масштабные миграции

Приёмы повторяются: автоматизированные codemod, подавление ошибок вместо немедленного исправления, разбиение через project references или build-граф, постепенный allowlist для строгих проверок. Большой взрыв работает там, где код сильно связан и есть автоматизация. Цифры ниже заявлены самими компаниями.

| Компания | Что сделано | Метод | Цифры | Источник |
|---|---|---|---|---|
| Bloomberg | Внедрение TS в кодовой базе JS | Единый tsconfig, сгенерированные `.d.ts`, CI с beta/RC компилятора | 50+ млн строк JS, 10 000+ приложений, 2000 инженеров; 200+ проектов за год, «Zero projects went back» | [InfoQ о посте Rob Palmer, 2020](https://www.infoq.com/news/2020/11/bloomberg-typescript-adoption/); [оригинал](https://www.bloomberg.com/company/stories/10-insights-adopting-typescript-at-scale) вернул 403 |
| Stripe | Flow → TS, Dashboard | Большой взрыв одним PR, codemod | 3,7+ млн строк; `@ts-expect-error` 97 000 → 37 000 (около одного на тысячу строк); память лечили project references | [Andrew Lunny, 2022](https://stripe.dev/blog/migrating-to-typescript) |
| Airbnb | JS → TS | Один шаг на проект, ts-migrate | 50 000+ строк за один день; 86% фронтенда (6 млн строк) | [InfoQ, 2020](https://www.infoq.com/news/2020/08/airbnb-typescript-migration); [ts-migrate](https://github.com/airbnb/ts-migrate) |
| Airbnb | Bazel для веба | Поэтапно: typecheck, lint, тесты | 11+ млн строк; TS −34%, ESLint −35%, Jest −42% `[не проверено]` | [Airbnb](https://medium.com/airbnb-engineering/adopting-bazel-for-web-at-scale-a784b2dbe325); [цифры — The Stack](https://thestack.technology/airbnb-adopts-googles-bezel-for-all-builds-as-the-projects-open-sourcer-recalls-early-monorepo-baggage) |
| Figma | strictNullChecks | Allowlist по дереву зависимостей, затем denylist | 376 тыс. → 464 тыс. строк, 1162 файла / 4000+ ошибок; 30 инженеров | [Rudi Chen, 2020](https://www.figma.com/blog/inside-figma-a-case-study-on-strict-null-checks/) |
| Google | Компиляция TS в масштабе | Bazel-таргеты, `.d.ts` как API, проверка только своих исходников | миллионы строк; сотни тысяч шагов сборки | [Scaling TypeScript compilation, 2020](https://neugierig.org/software/blog/2020/10/scaling-typescript.html) |

Уроки:
- Google: работа должна быть пропорциональна размеру изменения. Интерфейс отделён от реализации, как заголовки C++. Выводимые типы блокируют параллельное извлечение API. Глобальные объявления ведут себя как побочные эффекты — [Scaling TypeScript compilation, 2020](https://neugierig.org/software/blog/2020/10/scaling-typescript.html). Автор на странице не назван; блог neugierig.org считается блогом Эвана Мартина из команды TS в Google `[не проверено]`.
- Bloomberg: цель «exactly-one» версия типов, отказ от глобальных модифицирующих модулей, один tsconfig — [InfoQ, 2020](https://www.infoq.com/news/2020/11/bloomberg-typescript-adoption/).

Практические правила (вывод из этих историй):
- Для strict-режима лучший шаблон: allowlist по графу зависимостей. Сначала разбейте большие циклы, иначе списки не сдвинутся.
- Для перехода с Flow или с JS в сильно связанной кодовой базе большой взрыв с подавлениями часто дешевле двух языков на годы, как у Stripe.
- Ускорение сборки на практике состоит из сокращения графа (убрать barrel, разбить на проекты) и смены инструмента (Bazel, TS 7). Prisma показывает потолок: выигрыш ограничен долей `tsc` в CI.

Не найдено: инженерного поста Notion о миграции на TS, сборке или монорепозитории; собственных цифр Vercel о внутреннем монорепозитории (только истории клиентов).

## Типы между слоями

Внутри одного монорепозитория удобнее всего вывод типов (tRPC, Hono RPC, oRPC, TanStack Start). Если есть внешние потребители, другие языки или разные команды, берите контракт (OpenAPI, GraphQL). Цена вывода типов — нагрузка на `tsserver`; её нужно закладывать в архитектуру.

### Сравнение подходов

| Подход | Источник истины | Кодогенерация | Несколько языков | Риск | Версия |
|---|---|---|---|---|---|
| tRPC | Роутер TS | нет | нет | Большой тип `AppRouter` | [11.25.2](https://registry.npmjs.org/@trpc%2Fserver) |
| oRPC | Функции или контракт | нет, OpenAPI выводится | через OpenAPI | Молодой, v2 в beta | [1.16.2](https://registry.npmjs.org/@orpc%2Fserver) |
| Hono RPC | Тип приложения | нет | нет | Нагрузка на tsserver | [4.13.17](https://registry.npmjs.org/hono) |
| TanStack Start | `createServerFn` | компилятор | нет | Привязка к фреймворку | [1.169.5](https://registry.npmjs.org/@tanstack%2Freact-start) |
| GraphQL Codegen | SDL | да | да | Сервер GraphQL | [cli 8.0.0](https://registry.npmjs.org/@graphql-codegen%2Fcli) |
| openapi-typescript | OpenAPI | только типы | да | Нет рантайм-клиента | [7.13.0](https://registry.npmjs.org/openapi-typescript) |
| Hey API | OpenAPI | SDK, плагины | да | Начальная разработка: фиксируйте версию | [0.99.0](https://registry.npmjs.org/@hey-api%2Fopenapi-ts) |
| orval | OpenAPI | клиент | да | | [8.47.0](https://registry.npmjs.org/orval) |

### Как выбирать

- Решение определяется потребителем. Один клиент в том же репозитории: вывод типов. Публичный API, мобильные клиенты на другом языке или внешние интеграторы: контракт OpenAPI или GraphQL.
- Возможен гибрид, как у Cal.com: tRPC для своего UI, версионируемый REST для внешних.
- Мобильный клиент с раздельными релизами живёт дольше версии API, поэтому вывод типов без версионирования опасен.
- Импорт типов сервера в клиенте — настоящая зависимость. Держите её через `import type` и один экспортируемый тип, а не через серверные модули.

### Детали по инструментам

- Hono: выносите `AppType` на сервере и передавайте в `hc<AppType>`. Известная проблема: больше маршрутов означает больше инстанцирования типов и медленный редактор. Лекарства: прекомпиляция клиента (`hcWithType`), разделение на под-приложения, project references. Версии Hono на клиенте и сервере должны совпадать — [Hono RPC](https://hono.dev/docs/guides/rpc).
- `[устарело]` ts-rest: проект объявил, что больше не сопровождается — [ts-rest.com](https://ts-rest.com/). Последний релиз [3.52.1 от марта 2025](https://registry.npmjs.org/@ts-rest%2Fcore). Замена для contract-first с OpenAPI — oRPC.

Не найдено: независимых замеров, какой из подходов дешевле для проверки типов на большом числе процедур; чисел о размере `AppRouter` в tRPC (документация по merge не затрагивает скорость проверки типов).

## Внедрение зависимостей

По умолчанию используйте функции и composition root без контейнера. Контейнер нужен при большом числе сервисов с лайфтаймами; при этом инжекция через параметры конструктора держится на legacy-режиме `experimentalDecorators`. Effect Layers дают проверку требований в типах ценой перехода на другую модель программирования. В библиотеке DI-контейнер не нужен: принимайте зависимости параметрами.

### Сравнение подходов

| Подход | Зависимость от decorators | Токен | Проверка на этапе компиляции | Версия |
|---|---|---|---|---|
| Функции + composition root | нет | параметры | да, обычные типы | — |
| Awilix | нет | имена | нет | [13.0.5](https://registry.npmjs.org/awilix) |
| NestJS | да | класс, символ, абстрактный класс | частично, ошибки на старте | [12.4.0](https://registry.npmjs.org/@nestjs%2Fcore) |
| tsyringe | да, legacy | класс, токен | нет | [4.10.0](https://registry.npmjs.org/tsyringe) |
| InversifyJS | см. раздел пробелов | символ, класс | нет | [8.3.0](https://registry.npmjs.org/inversify) |
| Effect Layers | нет | Tag/Context | да, в типе `Effect<A,E,R>` | [4.1.2](https://registry.npmjs.org/effect) |

### Детали

- Composition root — «a (preferably) unique location in an application where modules are composed together», максимально близко к точке входа — [Mark Seemann, 2011](https://blog.ploeh.dk/2011/07/28/CompositionRoot/). Альтернатива без контейнера: чистый код получает данные аргументами, а I/O вынесен наружу (бутерброд impure-pure-impure) — [Mark Seemann, 2017](https://blog.ploeh.dk/2017/02/02/dependency-rejection/).
- Stage-3 decorators (TS 5.0) не поддерживают параметры и несовместимы с `emitDecoratorMetadata` — [TS 5.0 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html). Страница decorators в Handbook всё ещё описывает `experimentalDecorators` — [TS Handbook: Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html).
- tsyringe требует `experimentalDecorators`, `emitDecoratorMetadata` и polyfill Reflect — [microsoft/tsyringe](https://github.com/microsoft/tsyringe). `[устарело]` как выбор для нового кода (риск сопровождения: последний релиз апрель 2025 — [npm](https://registry.npmjs.org/tsyringe)). Замена: функции + composition root или Awilix.
- Effect: `Layer<Out, E, In>`; `Layer.merge`, `Layer.provide`; программа с полностью разрешёнными зависимостями имеет требование `never` — [Effect: Layers](https://effect.website/docs/requirements-management/layers/). `[устарело]` Эта страница относится к документации v3; актуальная линия 4.x, руководство — [MIGRATION.md](https://github.com/Effect-TS/effect/blob/main/MIGRATION.md).

### Как выбирать

- Функции + composition root покрывают большинство фронтендов, библиотек, CLI и игр.
- Веб-сервер со скоупом на запрос выигрывает от Nest или Awilix; браузерное приложение обычно обходится контекстом или модулями.

Не проверено: требует ли InversifyJS 8 `reflect-metadata` и legacy-decorators (со страницы репозитория установить не удалось); судьба `experimentalDecorators` в TS 7 в прочитанных источниках прямо не названа; поддержка `emitDecoratorMetadata` в esbuild, SWC и oxc на ноябрь 2026.

## Состояние и побочные эффекты

Разделяйте серверное состояние (снимок чужих данных с устареванием) и клиентское (ваше). CQRS и event sourcing применяйте локально, а не как архитектуру всей системы. Local-first стал рабочим выбором, но Zero и TanStack DB молоды и требуют сравнения с вашей моделью прав.

### Серверное и клиентское состояние

- Данные принадлежат бэкенду, клиент держит устаревающий снимок. «resist the urge to sync server data to a different state manager» — [React Query as a State Manager — TkDodo, 2021](https://tkdodo.eu/blog/react-query-as-a-state-manager).
- Шаги выбора (вывод из источников):
  1. Серверные данные: Query или loader.
  2. Локальное UI-состояние: рядом с компонентом.
  3. Сквозное UI: лёгкий стор.
  4. Состояние редактора или симуляции: свой стор с диффами и историей.
- Фреймворковые детали — в [frontend.md](frontend.md).

### События, CQRS

- Четыре разных паттерна под словом event-driven: Event Notification, Event-Carried State Transfer, Event Sourcing, CQRS. Ловушка: команда, замаскированная под событие; поток виден только в рантайме — [What do you mean by Event-Driven? — Martin Fowler, 2017](https://martinfowler.com/articles/201701-event-driven.html).
- CQRS оправдан только для части системы (Bounded Context), сложного домена или сильного дисбаланса чтения и записи — [Martin Fowler, 2011](https://martinfowler.com/bliki/CQRS.html).

### Local-first и sync

- Семь идеалов local-first: быстродействие, мульти-устройство, офлайн, совместная работа, долговечность, приватность, контроль пользователя — [Kleppmann и др., Ink & Switch, 2019](https://www.inkandswitch.com/essay/local-first/).
- Zero объявлен стабильным с 1.0, «very minor update» к 0.26.2 — [Zero 1.0](https://zero.rocicorp.dev/docs/release-notes/1.0); новость — [InfoQ, 2026](https://infoq.com/news/2026/06/zero-version-1). Версия [1.11.4](https://registry.npmjs.org/@rocicorp%2Fzero).
- `[устарело]` Replicache: «now in maintenance mode» — [replicache.dev](https://replicache.dev/). Последняя версия [15.3.0, июль 2025](https://registry.npmjs.org/replicache). Замена той же команды — Zero.
- TanStack DB: коллекции, живые запросы, `persistedCollectionOptions`, `@tanstack/offline-transactions`. Writes идут через ваш API (`onInsert`). Поддерживается браузер, Node, мобильные, edge. Electric синхронизирует Postgres — [TanStack DB 0.6, Sam Willis, Kevin De Porre, 2026](https://electric.ax/blog/2026/03/25/tanstack-db-0.6-app-ready-with-persistence-and-includes). Состояние на 6 ноября 2026: [1.0.0-rc.1.4](https://registry.npmjs.org/@tanstack%2Fdb). Клиент Electric — [1.5.28](https://registry.npmjs.org/@electric-sql%2Fclient).
- Sync-движок заменяет API-слой только частично: права доступа и миграции схем остаются проектной работой.

### Тяжёлые вычисления и симуляции

- Comlink: RPC поверх `postMessage` через Proxy, удобно для worker-границы — [GoogleChromeLabs/comlink](https://github.com/GoogleChromeLabs/comlink). Выносите парсинг, индексацию и агрегации клиента с большими данными в worker за границей, принимающей сериализуемые сообщения.
- Для игр и симуляций чистый шаг состояния (functional core) плюс рендер и ввод снаружи даёт реплей и детерминированные тесты (вывод из источников). Практика по доменам — [domains.md](domains.md).

Не найдено: независимых сравнений Zero против TanStack DB с Electric по задержкам, правам и стоимости; детальных архитектурных страниц Zero (zero-cache, queries, mutators) в прочитанном нет.

## Ошибки, конфигурация, флаги и наблюдаемость на границах

На границе преобразуйте ввод и окружение в точные типы и держите транспортные детали снаружи домена. Флаги и телеметрию подключайте через абстракцию, а не прямым вызовом вендорского SDK.

- Cal.com фиксирует правило: `ErrorWithCode` в сервисах и репозиториях, `TRPCError` только в роутерах tRPC — [AGENTS.md](https://github.com/calcom/cal.diy/blob/main/AGENTS.md).
- Конфигурация: t3-env валидирует окружение по схеме (Standard Schema), серверные переменные на клиенте `undefined`, обращение бросает ошибку — [T3 Env](https://env.t3.gg/docs/introduction). Версия [0.13.11](https://registry.npmjs.org/@t3-oss%2Fenv-core).
- Флаги: категории Release, Experiment, Ops, Permissioning; отделяйте точку решения от логики, инвертируйте решение, передавая его конструктором — [Feature Toggles — Pete Hodgson, 2017](https://martinfowler.com/articles/feature-toggles.html).
- Наблюдаемость для библиотек: зависьте только от `@opentelemetry/api`, берите самую раннюю стабильную версию 1.0.\*. Без SDK инструментация ничего не делает — [OpenTelemetry: Libraries](https://opentelemetry.io/docs/concepts/instrumentation/libraries/).
- `[устарело]` neverthrow как основа для typed errors: последний релиз [8.2.0, февраль 2025](https://registry.npmjs.org/neverthrow). Замена для нового кода: собственный `Result`-тип или Effect (при принятии его модели).
- Точки расширения должны быть в composition root: логгер, трейсер, поставщик флагов передаются как зависимости, а не импортируются глобально.
- Архитектура ошибок и конфигурации на сервере — в skill node-knowledge, `references/architecture.md`.

Не проверено: сравнения Result-типов и исключений с замерами производительности или дефектов не искались.

## Архитектура библиотек

Новая библиотека сегодня ESM-only, если нет сильной потребности в CJS. Основа: `exports` с явными точками входа, `sideEffects`, отчёт о публичном API, проверка упакованного результата. SDK чаще генерируют, но рынок вендоров быстро меняется, а их сравнения предвзяты.

### Формат модулей

- `require(esm)` в Node: флаг снят в v22.12.0 и v20.19.0, предупреждение убрано в v22.13.0 и v20.19.0, статус «не экспериментальный» с v25.4.0. Ограничение: граф без top-level `await`, иначе `ERR_REQUIRE_ASYNC_MODULE` — [Node: Modules](https://nodejs.org/api/modules.html).
- Move on to ESM-only: двойная публикация — переходный инструмент; проблемы — dual package hazard, размер. Рекомендуется для новых, браузерных пакетов, CLI и Node evergreen — [Anthony Fu, 2025](https://antfu.me/posts/move-on-to-esm-only).
- Официальный анализ двойной публикации: одна компиляция не гарантирует типобезопасность обоих выводов, `verbatimModuleSyntax` несовместим с генерацией обоих форматов из одного исходника. Рекомендуются тесты и `@arethetypeswrong/cli` — [TS: Choosing compiler options](https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options.html).
- Настройки библиотек: `module: node18` и избегать `moduleResolution: bundler`, так как тот пропускает расширения, ломающиеся в Node — [там же](https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options.html).
- Реальная картина: Vite (`type: module`, только `dist/node/index.js`, 8.3.6) — [package.json](https://github.com/vitejs/vite/blob/main/packages/vite/package.json); Effect ESM-only — [package.json](https://github.com/Effect-TS/effect/blob/main/packages/effect/package.json); tRPC всё ещё двойной с `.mjs` и `.cjs` — [package.json](https://github.com/trpc/trpc/blob/main/packages/server/package.json).
- Сохраняйте CJS, только если потребители закреплены на Node ниже 20.19, если граф библиотеки содержит top-level `await`, а потребителям нужен `require`, или если вы поддерживаете прежнюю мажорную линию (вывод из источников).

### Сборка

- `[устарело]` tsup: README говорит «not actively maintained anymore» — [egoist/tsup](https://github.com/egoist/tsup), хотя версия [9.0.0](https://registry.npmjs.org/tsup) вышла в октябре 2026. Замена — tsdown ([0.23.7](https://registry.npmjs.org/tsdown)), есть гид миграции — [tsdown](https://tsdown.dev/guide/migrate-from-tsup). Настройки сборки — [toolchain.md](toolchain.md).

### Шаблон библиотеки

```text
src/index.ts                  # единственный barrel: публичный API
src/feature-a/index.ts        # отдельная точка входа
src/internal/...
package.json                  # exports: ".", "./feature-a", "./package.json"
```

В CI запускайте `publint` ([0.3.25](https://registry.npmjs.org/publint)) и `@arethetypeswrong/cli` ([0.18.5](https://registry.npmjs.org/@arethetypeswrong%2Fcli)).

### Tree-shaking и точки входа

- `sideEffects: false` или массив файлов; CSS-импорт надо перечислить; `/*#__PURE__*/`, `/*#__NO_SIDE_EFFECTS__*/` (webpack 5.107+) — [webpack: Tree Shaking](https://webpack.js.org/guides/tree-shaking/). Effect перечисляет единственный файл с побочным эффектом, TanStack Router ставит `false` — [effect](https://github.com/Effect-TS/effect/blob/main/packages/effect/package.json), [react-router](https://github.com/TanStack/router/blob/main/packages/react-router/package.json).
- Точки входа: у Effect подпути `./ai`, `./cli`, `./http`, `./cluster` — [package.json](https://github.com/Effect-TS/effect/blob/main/packages/effect/package.json). Драйверы БД и платформы вынесены в отдельные пакеты `packages/sql/*` и `packages/platform/*` — [pnpm-workspace.yaml](https://github.com/Effect-TS/effect/blob/main/pnpm-workspace.yaml). tRPC даёт адаптеры подпутями `./adapters/express`, `./adapters/aws-lambda` — [package.json](https://github.com/trpc/trpc/blob/main/packages/server/package.json).

### Контроль публичного API и тесты типов

- tldraw хранит `api-report.api.md` на пакет (5581 строка у editor) и проверяет `api-check` — [packages/editor](https://github.com/tldraw/tldraw/tree/main/packages/editor). Grafana различает стабильное, unstable и internal — [packages/README.md](https://github.com/grafana/grafana/blob/main/packages/README.md).
- Тесты типов: `*.test-d.*` у TanStack Router — [packages/AGENTS.md](https://github.com/TanStack/router/blob/main/packages/AGENTS.md); `__tests_dts__` у Vite — [packages/vite/src/node](https://github.com/vitejs/vite/tree/main/packages/vite/src/node); tstyche у Effect — [tstyche.json](https://github.com/Effect-TS/effect/blob/main/tstyche.json). Подробнее о тестировании типов — [testing.md](testing.md).

### Генерация SDK

- Сравнения публикуют сами вендоры, каждое в свою пользу: [Speakeasy, 2026](https://www.speakeasy.com/blog/comparison-sdk-generators-openapi), [Stainless](https://www.stainless.com/docs/compare/speakeasy/), [Fern](https://buildwithfern.com/post/fern-vs-speakeasy-sdk-generator).
- По одному обзору Anthropic купила Stainless в мае 2026, и та перестала брать новые проекты — [Geekflare](https://geekflare.com/guides/api-sdk-generators/) `[не проверено]`. В тех же результатах поиска упоминается покупка Fern компанией Postman в январе 2026 `[не проверено]`. Подтверждения от первичных источников нет.
- Выбор вендора проверяйте на своём OpenAPI: число зависимостей рантайма и языки расходятся у разных источников.

## Опыт крупных проектов

Повторяющиеся выводы из крупных кодовых баз, с числами (числа заявлены самими компаниями):
- Границы держат инструменты, а не договорённости. n8n держит ratchet с базой 105 нарушений; Shopify показал, что ноль нарушений статической проверки не равен изоляции ([Границы модулей](#границы-модулей)).
- Граф модулей дороже, чем кажется. Atlassian убрал barrel-файлы на почти 100 000 изменённых файлов: минуты сборки на коммит −75%, unit-тесты в среднем на 50% быстрее ([Barrel-файлы](#barrel-файлы)).
- Миграции работают через автоматизацию и подавления. Stripe: 3,7+ млн строк одним PR, `@ts-expect-error` 97 000 → 37 000. Figma: allowlist по графу зависимостей, сначала разбит цикл на 500+ файлов. Bloomberg: 200+ проектов за год, ни один не вернулся на JS ([Масштабные миграции](#масштабные-миграции)).
- Смена компилятора ускоряет только долю `tsc`: у Prisma 74 с → 24 с (3x) против 11,9x у VS Code на чистой сборке ([Монорепозитории](#монорепозитории)).
- Публичный API делят на уровни (`./`, `./unstable`, `./internal` у Grafana), а ядро отделяют от адаптеров ([Архитектура библиотек](#архитектура-библиотек)).

## Эталонные кодовые базы

Деревья проверены через `gh api` 8 ноября 2026. Изучайте у репозиториев конкретные механизмы, а не общую структуру. Утверждения о потоке зависимостей основаны на `package.json`, правилах линтера и документации, а не на чтении всего кода.

| Репозиторий | Что изучать | Где смотреть |
|---|---|---|
| [microsoft/vscode](https://github.com/microsoft/vscode) | Слои `base`→`platform`→`editor`→`workbench`, каталоги по рантайму (`common`, `browser`, `node`, `electron-*`), DI на параметрах, правило «ничто не зависит от contrib», свои ESLint-правила | [Source Code Organization](https://github.com/microsoft/vscode/wiki/Source-Code-Organization); [`eslint.config.js`](https://github.com/microsoft/vscode/blob/main/eslint.config.js) (`code-layering`, `code-import-patterns`); [.eslint-plugin-local](https://github.com/microsoft/vscode/tree/main/.eslint-plugin-local) |
| [microsoft/typescript-go](https://github.com/microsoft/typescript-go) (архив) → [microsoft/TypeScript](https://github.com/microsoft/TypeScript) | Конвейер компилятора: `scanner`, `parser`, `binder`, `checker`, `transformers`, `printer`; швы `vfs`, `lsp`, `project` (код на Go, ценна декомпозиция) | [internal/](https://github.com/microsoft/typescript-go/tree/main/internal) |
| [trpc/trpc](https://github.com/trpc/trpc) | Адаптеры подпутями, вывод типов через границу пакетов, «do-not-import» | [packages/server](https://github.com/trpc/trpc/tree/main/packages/server) |
| [TanStack/query](https://github.com/TanStack/query), [TanStack/router](https://github.com/TanStack/router) | Ядро без фреймворка и адаптеры, `query-core` без `dependencies`, тесты типов, разделение Start на client/server/plugin-core, `size-limit`, Nx | [query-core](https://github.com/TanStack/query/tree/main/packages/query-core), [router/packages](https://github.com/TanStack/router/tree/main/packages), [.size-limit.json](https://github.com/TanStack/query/blob/main/.size-limit.json) |
| [excalidraw/excalidraw](https://github.com/excalidraw/excalidraw) | Библиотека и приложение раздельно (`excalidraw-app`); `element` зависит от `common`, `math`; условные экспорты development/production; `paths` на исходники | [packages](https://github.com/excalidraw/excalidraw/tree/master/packages), [element/package.json](https://github.com/excalidraw/excalidraw/blob/master/packages/element/package.json) |
| [calcom/cal.diy](https://github.com/calcom/cal.diy) (бывш. cal.com; `calcom/cal.com` перенаправляется) | Поток `web`→`trpc`→`features`→`app-store`→`lib`, закреплённый запретами Biome; `services` и `repositories`; DI с `tokens.ts`; запрет barrel-файлов | [biome.json](https://github.com/calcom/cal.diy/blob/main/biome.json), [features/di](https://github.com/calcom/cal.diy/tree/main/packages/features/di), [AGENTS.md](https://github.com/calcom/cal.diy/blob/main/AGENTS.md) |
| [supabase/supabase](https://github.com/supabase/supabase) | Много приложений на общих `ui`, `ui-patterns`, `common`; каталог pnpm; `packages/api-types`; идущая миграция Studio на TanStack (`TANSTACK_MIGRATION.md`, рядом Next и Vite) | [AGENTS.md](https://github.com/supabase/supabase/blob/master/AGENTS.md), [apps/studio](https://github.com/supabase/supabase/tree/master/apps/studio) |
| [grafana/grafana](https://github.com/grafana/grafana) | Уровни API (`./`, `./unstable`, `./internal`), condition `@grafana-app/source`, контракт с внешними плагинами, `nx release` fixed | [packages/README.md](https://github.com/grafana/grafana/blob/main/packages/README.md), [public/app/features](https://github.com/grafana/grafana/tree/main/public/app/features) |
| [vitejs/vite](https://github.com/vitejs/vite) | Отдельный tsconfig на рантайм (`node`, `client`, `module-runner`, `shared`), ESM-only, плагинный конвейер, `playground/` как e2e | [packages/vite/src](https://github.com/vitejs/vite/tree/main/packages/vite/src) |
| [Effect-TS/effect](https://github.com/Effect-TS/effect) | Один модуль на файл (`src/Array.ts`); абстракции в ядре и реализации в `platform/{node,bun,browser,deno}` (по именам); `publishConfig` для исходников; project references; `erasableSyntaxOnly` | [packages/effect/src](https://github.com/Effect-TS/effect/tree/main/packages/effect/src), [tsconfig.base.json](https://github.com/Effect-TS/effect/blob/main/tsconfig.base.json) |
| [withastro/astro](https://github.com/withastro/astro) | Разделение `core` и `runtime`, логика в `vite-plugin-*`, интеграции как пакеты, адаптеры деплоя, публичные фасады в `exports` | [packages/astro/src](https://github.com/withastro/astro/tree/main/packages/astro/src) |
| [n8n-io/n8n](https://github.com/n8n-io/n8n) | Ratchet границ, модули и манифест с ленивыми импортами, `@n8n/di`, суффикс `.ee` для лицензируемого кода, узлы как плагины | [check-boundaries.mjs](https://github.com/n8n-io/n8n/blob/master/scripts/check-boundaries.mjs), [modules.manifest.ts](https://github.com/n8n-io/n8n/blob/master/packages/cli/src/modules/modules.manifest.ts), [packages/modules](https://github.com/n8n-io/n8n/tree/master/packages/modules) |
| [tldraw/tldraw](https://github.com/tldraw/tldraw) | `store` зависит от `state`, `editor` над `store`, `tlschema`, `state`, полный `tldraw` над `editor`; API-отчёты через api-extractor; `editor` без фигур и UI как основа SDK; запрет `export *` своим правилом | [AGENTS.md](https://github.com/tldraw/tldraw/blob/main/AGENTS.md), [packages/editor](https://github.com/tldraw/tldraw/tree/main/packages/editor) |
| [playcanvas/engine](https://github.com/playcanvas/engine) (игры, 3D) | Деление `core`, `platform`, `scene`, `framework`, отдельный `deprecated/` (JS с типами) | [src](https://github.com/playcanvas/engine/tree/main/src) |
| [BabylonJS/Babylon.js](https://github.com/BabylonJS/Babylon.js) (игры, 3D) | Ядро и отдельные пакеты `gui`, `loaders`, `materials`, `serializers`, `inspector` | [packages/dev](https://github.com/BabylonJS/Babylon.js/tree/master/packages/dev) |

Для Babylon.js и PlayCanvas просмотрено только дерево каталогов.

Порядок чтения: wiki VS Code (слои и рантаймы), README Grafana о пакетах (уровни API), TanStack или tldraw (ядро и адаптеры), скрипт n8n (проверки в старом коде). Многие из этих репозиториев держат файлы `AGENTS.md`, часто вложенные по каталогам: это краткая форма задокументированных архитектурных правил.


## Устаревшее и замены

Сводка меток `[устарело]` из всего файла. Даты и версии на 8 ноября 2026.

| Что | Состояние | Замена |
|---|---|---|
| ts-rest | Проект объявил, что не сопровождается; последний релиз 3.52.1, март 2025 | oRPC для contract-first с OpenAPI |
| tsup | README: «not actively maintained anymore» (при версии 9.0.0 в октябре 2026) | tsdown 0.23.7, есть гид миграции |
| Replicache | «now in maintenance mode»; последняя 15.3.0, июль 2025 | Zero от той же команды |
| Репозиторий `microsoft/typescript-go`, `@typescript/native-preview`, `tsgo` | Репозиторий перемещён (архивирован), разработка в `microsoft/TypeScript` | `typescript@7`, команда `tsc` |
| Репозиторий `calcom/cal.com` | Переименован, адрес перенаправляется | `calcom/cal.diy` |
| madge | Последний релиз 8.0.0, август 2024 | `no-circular` в dependency-cruiser |
| ts-arch (`tsarch`) | 5.4.1, декабрь 2024 | ArchUnitTS |
| `baseUrl`, `moduleResolution: node/node10`, `classic` | Удалены в TS 7.0 | относительные `paths`; `nodenext` или `bundler` |
| neverthrow как основа typed errors | 8.2.0, февраль 2025 | Свой `Result` или Effect |

## Чеклист ревью архитектуры

Чеклист применим к приложениям, библиотекам, инструментам, мобильным проектам, играм и клиентам с большими данными. Пункт закрыт, если его подтверждает машина или существующий код, а не договорённость. Основания — в разделах выше. Проверка «зачем»: какую реальную замену или изменение поддерживает абстракция — [Sandi Metz, 2016](https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction); [Kent C. Dodds, 2020](https://kentcdodds.com/blog/aha-programming).

Структура
- [ ] Верхний уровень называет домены или фичи, а не `controllers`, `models`, `utils`.
- [ ] Есть один composition root; модули не создают свои зависимости сами.
- [ ] Чистая логика лежит отдельно от ввода-вывода и тестируется без сети, файлов и рендера.
- [ ] Каждая абстракция имеет вторую реализацию или конкретный повод.
- [ ] Папка `shared` или `common` не превратилась в свалку: у каждого файла более одного потребителя.

Границы
- [ ] Направление зависимостей описано и проверяется в CI.
- [ ] У каждого внутреннего пакета есть `exports`; внутренние пути закрыты.
- [ ] Импорт через barrel запрещён внутри приложения; единственный barrel — точка входа библиотеки.
- [ ] Циклы проверяются; в старом коде стоит ratchet, который не даёт числу нарушений расти.
- [ ] Включён `verbatimModuleSyntax`; типы импортируются через `import type`.
- [ ] Инструмент границ реально работает с вашей версией TS: 0 найденных модулей — это ошибка, а не успех.
- [ ] Модули можно запускать и тестировать изолированно.

Монорепозиторий и TS
- [ ] Все зависимости объявлены; фантомные зависимости невозможны или ловятся.
- [ ] Выбрана и записана стратегия связывания пакетов; `paths` не подменяют workspace.
- [ ] Живые типы настроены через уникальную custom condition, и её видит каждый инструмент.
- [ ] Для TS 7 убраны `baseUrl` и `moduleResolution: node`; задан `rootDir` и `types`.
- [ ] Инструменты, требующие API компилятора, работают через TS 6 или 7.1.
- [ ] CI запускает только затронутое (`--affected`), remote cache подписан, env-переменные учтены в хешировании.
- [ ] Версии зависимостей централизованы каталогом.

Контракты и данные
- [ ] Выбор между выводом типов и контрактом соответствует реальным потребителям.
- [ ] Вход на границе разбирается в точный тип, а не только проверяется.
- [ ] Время проверки типов для большого API измерено; тяжёлые типы разделены.
- [ ] Серверное состояние не копируется в клиентский стор.
- [ ] CQRS, event sourcing и sync применены только там, где назван конкретный домен и причина.

Библиотеки и SDK
- [ ] Определён формат (ESM-only, либо обоснованный dual).
- [ ] `sideEffects` указан; `publint` и `@arethetypeswrong/cli` в CI.
- [ ] Публичный API зафиксирован отчётом или тестами типов.
- [ ] Ядро не зависит от фреймворка; адаптеры лежат отдельно.
- [ ] Телеметрия зависит только от API, флаги — от абстракции.

По типу продукта
- [ ] Мобильные: нет дублирующихся нативных модулей и React Native в графе.
- [ ] Игры и симуляции: шаг симуляции детерминирован и изолирован от рендера и ввода.
- [ ] Клиенты с большими данными: тяжёлые операции за worker-границей с сериализуемыми сообщениями.
- [ ] Плагины и расширения: у контракта есть уровни стабильности; плагин не может импортировать внутренности.

Пороговые значения (размер файла, число зависимостей пакета, глубина графа) не приведены: достоверных эмпирических порогов для TS найдено не было.

## Спорные места и пробелы

- Пороги перехода между стилями (сколько разработчиков, сколько файлов) никто не измерил; приведённые рекомендации по выбору дерева — оценка по источникам.
- Критика FSD с данными не найдена, только блог-посты `[не проверено]`.
- Поддержка TS 7 в eslint-plugin-boundaries, Sheriff и ArchUnitTS не проверена. Возможно, у них то же ограничение программного API, что у dependency-cruiser.
- Допускает ли TS циклы в project references и как это выглядит в TS 7, отдельно не проверено.
- Статус `--build` в TS 7 для всех комбинаций флагов (`--watch`, `--builders`) подтверждён только README и анонсом. Даты 7.1 RC и финала не подтверждены первичным источником.
- Независимого бенчмарка Turborepo против Nx против moon на одном репозитории нет; цифры вендорские (Turborepo «up to 96% faster», Nx 186,53 с против 175,52 с, moon сравнивает себя сам).
- Нет независимых замеров проверки типов для tRPC, Hono RPC, oRPC на большом числе процедур и конкретных размеров `AppRouter`.
- Требования InversifyJS 8 к `reflect-metadata` и legacy-decorators, судьба `experimentalDecorators` в TS 7 и поддержка `emitDecoratorMetadata` в esbuild, SWC и oxc на ноябрь 2026 не выяснены.
- Нет независимых сравнений Zero и TanStack DB с Electric по задержкам, правам и стоимости.
- Сделки по Fern (Postman, январь 2026) и Stainless (Anthropic, май 2026) подтверждены только одним обзором.
- Точная доля ESM-only в npm на ноябрь 2026 неизвестна; последняя цифра (25,8%) относится к концу 2024.
- Оригинал статьи Bloomberg и полный текст статьи Airbnb о Bazel недоступны для автоматического чтения (403); цифры Airbnb по Bazel помечены `[не проверено]`.
