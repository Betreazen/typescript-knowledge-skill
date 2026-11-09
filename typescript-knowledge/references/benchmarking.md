# Бенчмарки и замеры производительности в TypeScript

Как измерять скорость, размер и стоимость типов в проектах на TypeScript любого вида: сайты, веб-приложения, игры и визуализации, библиотеки и инструменты. Для каждой метрики указаны инструмент, точная команда, формат вывода и типовые ошибки замера (прогрев JIT, шаг таймера, раздутый JSON mitata, архивный tachometer, агрегация в Lighthouse CI, счётчики `tsc` разных версий, статистика на малом числе прогонов). Форматы файлов, которые понимает [bench_compare.mjs](../scripts/bench_compare.mjs), и конвертер [tsc_diag.mjs](../scripts/tsc_diag.mjs) описаны в разделе про сравнение. Состояние знаний: ноябрь 2026, версии из `npm view` на 8 ноября 2026. Пометка `[проверено локально]` означает проверку запуском на Windows 11, Ryzen 9 5950X, Node 24.17, npm 11.13, Chrome 156.0.8078.80. `[устарело]` указывает замену, `[не проверено]` значит опору на один вторичный источник. Общий цикл замеров — [pipeline.md](pipeline.md), приёмы оптимизации — [performance.md](performance.md), тесты — [testing.md](testing.md).

Нагрузочное тестирование HTTP на Node (autocannon, oha, k6): см. скилл node-knowledge.

- [Метрика → инструмент → команда](#метрика--инструмент--команда)
- [Микробенчмарки](#микробенчмарки)
- [Метрики страницы](#метрики-страницы)
- [Взаимодействия](#взаимодействия)
- [Кадры и рендер](#кадры-и-рендер)
- [Размер бандла](#размер-бандла)
- [Проверка типов и сборка](#проверка-типов-и-сборка)
- [Статистика и шум](#статистика-и-шум)
- [Сравнение прогонов: форматы и скрипты](#сравнение-прогонов-форматы-и-скрипты)
- [Профилирование](#профилирование)
- [Что может агент без браузера с окном](#что-может-агент-без-браузера-с-окном)
- [Спорные места и пробелы](#спорные-места-и-пробелы)

## Метрика → инструмент → команда

Выбор инструмента определяется тем, что именно изменилось. Функцию меряют микробенчмарком, страницу меряют Lighthouse, размер считает size-limit, стоимость типов даёт `tsc`. Все команды из таблицы запускались `[проверено локально]`, кроме строк с пометкой.

| Что мерим | Инструмент | Команда | Что читает скрипт сравнения | Статистика |
| --- | --- | --- | --- | --- |
| Функция в Node | mitata | `node bench.mjs > before/run1.json` (внутри `run({format:'json'})`) | `benchmarks[].runs[].stats.p50` (нс) | медиана медиан, 5 прогонов ABBA |
| Функция в проекте на Vitest | Vitest 5 bench | `vitest bench --run --reporter=json --outputFile.json=run1.json` | `…benchmarks[].tasks[].latency.p50` (мс) | то же; `bench.compare` чередует итерации |
| Функция в браузере | mitata (бандл esbuild) через Playwright, либо Vitest browser | см. [Микробенчмарки](#микробенчмарки) | как выше | изолировать страницу (COOP/COEP), иначе шаг таймера 100 мкс |
| Загрузка страницы | Lighthouse CI | `lhci collect && lhci assert` | `audits[id].numericValue` | 5 прогонов, `aggregationMethod: median-run` |
| A/B двух версий страницы | tachometer (архивирован) | `tach a.html b.html --json-file=x.json` | `benchmarks[].samples` и `differences[]` | 95% ДИ разности, автодобор выборки |
| Реальные пользователи | web-vitals + CrUX API | `onINP(...)`; POST `records:queryRecord` | `percentiles.p75` | p75, окно 28 дней |
| Взаимодействие | Playwright + web-vitals/attribution + LoAF | `page.click`, затем чтение метрик | `value`, `attribution.*` | медиана не менее 5 прогонов |
| Кадры, анимация, игра | свой сэмплер rAF, stats-gl, timestamp-query | массив `performance.now()` на кадр | p50, p95, p99 времени кадра, доля кадров сверх бюджета | перцентили, длинный прогон |
| Размер бандла | size-limit | `size-limit --json` | `[].size` (байты) | детерминирован, порог в байтах |
| Состав бандла | rollup-plugin-visualizer `raw-data`, sonda | конфиг сборщика | свой разбор | не сравнивать медианы, смотреть список модулей |
| Проверка типов (время) | hyperfine | `hyperfine -N --runs 10 -n old '…' -n new '…' --export-json r.json` | `results[].times` (с) | медиана |
| Проверка типов (счётчики) | `tsc --extendedDiagnostics`, attest | `tsc --noEmit --extendedDiagnostics` | текст, нужен разбор через [tsc_diag.mjs](../scripts/tsc_diag.mjs) | детерминированы при одной версии TS |
| CI с шумными раннерами | CodSpeed (симуляция CPU) | см. [Статистика и шум](#статистика-и-шум) | сервис | один прогон, счёт инструкций |

Три правила для любой строки: перед первым доверием стенду сделайте A/A; порог регрессии ставьте не ниже удвоенного измеренного шума; сравнивайте только числа одного инструмента, версии и машины (счётчики TS 6 и TS 7, `benchmarkIndex` разных машин, снимки разных браузеров несравнимы).

## Микробенчмарки

Вывод: в Node по умолчанию mitata. В браузере тот же mitata работает из бандла, потому что пакетный режим обходит грубый таймер. Vitest bench в браузерном режиме на функциях короче примерно 100 мкс даёт `p50 = 0`, и использовать его как источник медианы нельзя без изоляции страницы или укрупнения пачки. Tachometer архивирован.

### Прогрев JIT и защита от оптимизатора

Результат без явного прогрева ничего не значит. V8 работает на четырёх уровнях: Ignition, Sparkplug, Maglev (с Chrome M117) и TurboFan; пороги перехода статья не называет ([Maglev, V8 blog](https://v8.dev/blog/maglev)). Прогрев обязан дойти до верхнего уровня, иначе в выборку попадают вызовы интерпретатора, и медиана описывает не тот код, который работает в продакшене. Числа прогрева для конкретного размера функции — в [pipeline.md](pipeline.md).

Ловушки оптимизатора: мёртвый код (результат не используется, вызов выкидывается; используйте результат, в mitata `do_not_optimize(value)`), вынос инварианта из цикла и свёртка констант (меняйте входные данные на каждой итерации, берите их из массива, а не из литерала), вычитание пустого цикла (не вычитайте, мерьте пачками).

- Егоров о ловушках: вынос инвариантов из цикла и свёртка констант делают разность «цикл с операцией минус пустой цикл» бессмысленной; советы — избегать инвариантных и константных выражений, использовать и проверять результат — [microbenchmarks fairy tale](https://mrale.ph/blog/2012/12/15/microbenchmarks-fairy-tale.html). Пост 2012 года, примеры на Hydrogen устарели, принципы нет.
- По итогам исследования виртуальных машин «at most 43.5% of <VM, benchmark> pairs consistently reach a steady state of peak performance» — [Virtual Machine Warmup Blows Hot and Cold](https://arxiv.org/abs/1602.00602). Поэтому нельзя считать, что после прогрева распределение стационарно.
- Если среднее заметно больше медианы (в скрипте порог 1,25), в выборке тяжёлый хвост или две моды: недогрев JIT, GC или деоптимизация. Проверьте флагами `--trace-opt --trace-deopt`.

### mitata

Вывод: mitata подходит как основной инструмент в Node. Три практических вопроса: формат JSON, раздувание файла и отсутствие счётчиков железа на Windows.

- `await run({ format: 'json' })` даёт JSON; `do_not_optimize(value)` «emits code that causes side-effects» и защищает от выкидывания мёртвого кода — [mitata README](https://github.com/evanwashere/mitata). Версия 1.0.34 (последнее обновление 2025-02).
- Счётчики железа (`@mitata/counters`: IPC, циклы, инструкции, L1) работают только на macOS Apple Silicon и Linux amd64/aarch64; на Linux нужно `perf_event_paranoid ≤ 2`, часть виртуальных машин PMU отключает — [mitata README](https://github.com/evanwashere/mitata). На Windows и в большинстве облачных раннеров этого источника данных нет.
- GC запускается один раз после прогрева каждого бенчмарка (`gc('once')`, нужен `--expose-gc`); `gc('inner')` запускается перед каждой итерацией пачки — [mitata README](https://github.com/evanwashere/mitata).
- Раздувание JSON, `[проверено локально]`: файл из двух бенчмарков весил 20,9 МБ, из них 20,87 МБ занимал `context.noop` с отладочными строками сгенерированного кода. Такие файлы нельзя коммитить; перед сохранением удаляйте `context.noop`.
- Из сгенерированного кода, `[проверено локально]`: квантиль берётся как `samples[(q*(n-1))|0]` без интерполяции; при `n > 12` отбрасываются по 2 выборки с каждого края; пачка по умолчанию 4096 вызовов на выборку (для коротких функций).
- Форма, `[проверено локально]`: `{ layout: [{name, types}], benchmarks: [{kind, args, alias, group, baseline, runs: [{name, args, stats}], style}], context: {now, arch, version, runtime, cpu, noop} }`. Поля `stats`: `kind, debug, samples, min, max, p25, p50, p75, p99, p999, avg, ticks, heap`. Время в наносекундах.

Перед сохранением удаляйте `context.noop` из результата: [шаблон бенчмарка](../scripts/bench_template.mts) делает это сам, и файл занимает около 9 КБ.

### tinybench 6, Vitest bench, benchmark.js, bench-node, CodSpeed

| Инструмент | Что важно | Источник |
| --- | --- | --- |
| tinybench 6.2.3 | Образцы по умолчанию не хранятся («does not keep the samples for `latency` and `throughput`»); есть `timestampProvider` (`hrtimeNow`, `performanceNow`, `auto`), `subtractTimerOverhead`, `bench.table()`; готового JSON-вывода README не описывает | [tinybench README](https://github.com/tinylibs/tinybench) |
| Vitest 5 bench | `bench` стал фикстурой внутри `test()`; бенчмарк-файлы идут отдельным проектом, последовательно; `bench.compare` чередует итерации | [Vitest Benchmarking guide](https://vitest.dev/guide/benchmarking) |
| benchmark.js | `[устарело]`: репозиторий архивирован 11 апреля 2024, read-only. Замена: mitata (Node, браузер) или tinybench/Vitest bench | [bestiejs/benchmark.js](https://github.com/bestiejs/benchmark.js) |
| bench-node 0.15.0 | По умолчанию `V8NeverOptimizePlugin`; `detectDeadCodeElimination` (opt-in), `ttest: true` (тест Уэлча, сам ставит `repeatSuite=30`), `useWorkers` (экспериментально); JSON-репортёр `{name, opsSec, runsSampled, min, max, plugins}` | [bench-node README](https://github.com/RafaelGSS/bench-node) |
| CodSpeed | Режим симуляции запускает бенчмарк один раз и оценивает циклы по инструкциям и промахам кеша, системные вызовы исключены; режим walltime меряет реальное время | [CodSpeed CPU instrument](https://codspeed.io/docs/instruments/cpu) |

Подробности по каждому:

- tinybench, `[проверено локально]`: `task.result` содержит `state, latency, period, throughput, totalTime, runtime, runtimeVersion, timestampProviderName`. Поля `latency`: `aad, critical, df, mad, max, mean, min, moe, p50, p75, p99, p995, p999, rme, samples, samplesCount, sd, sem, variance`. Единицы — миллисекунды. Поля p25 нет, поэтому для общего формата `q1` приходится оценивать (так же, как для Vitest).
- Vitest 5: `bench` стал фикстурой внутри `test()`, а старые опции `benchmark.*` и `--compare` удалены; вместо них `--reporter=json --outputFile=<путь>`, `writeResult` и `bench.from()` — [Vitest Migration Guide](https://vitest.dev/guide/migration). Релиз 5.0 от 3 сентября 2026 — [Vitest 5 announcement](https://v5.cn.vitest.dev/blog/vitest-5).
- Vitest 5: Tinybench «handles warmup automatically», опции передаются последним аргументом; доступен `expect(a).toBeFasterThan(b, {delta})`; `perProject: true` гоняет один бенчмарк в chromium, firefox и webkit — [Vitest Benchmarking guide](https://vitest.dev/guide/benchmarking).
- CodSpeed: `@codspeed/vitest-plugin` 6.1.1 объявляет совместимость с Vitest `^3.2 || ^4 || ^5` и tinybench `>=2.9.0` (`npm view`, ноябрь 2026).

### Vitest в браузере: p50 = 0 — это ошибка замера

Вывод: нулевая медиана у Vitest browser на короткой функции означает не «функция мгновенная», а то, что шаг таймера 100 мкс больше времени вызова. Ноль нельзя разрешать в сравнении и нельзя записывать как результат.

- В браузере Vitest сам предупреждает: «Browsers may reduce `performance.now()` precision, so increase `iterations`» — [Vitest Benchmarking guide](https://vitest.dev/guide/benchmarking).
- `[проверено локально]` Vitest 5.1 + `@vitest/browser-playwright` + `channel: 'chrome'`, функция около 500 нс: `latency.p50 = 0`, `mean = 0.000403` мс, `samplesCount = 495964`. Медиана нулевая из-за шага таймера. Ранжирование по среднему остаётся осмысленным, а скрипт сравнения завершается с кодом 2 и сообщением «non-finite or non-positive statistics». Это правильная реакция.
- Три выхода: включить cross-origin isolation на тестовом сервере (шаг падает до 5 мкс), укрупнить пачку (вызывать функцию N раз внутри одного замера и делить), либо сравнивать `mean` с оговоркой.
- Ограничение: нулевое значение допустимо для TBT и CLS, где ноль настоящий. Для времени функции ноль всегда означает квантование.

### Шаг таймера: 100 мкс, 5 мкс и COOP/COEP

Разрешение `performance.now()` в Chrome: 100 мкс без изоляции и 5 мкс при cross-origin isolation — [Chrome for Developers: cross-origin isolated high-resolution timers](https://developer.chrome.com/blog/cross-origin-isolated-hr-timers). `[проверено локально]` Подтверждено на Chrome 156: минимальный шаг 0,1 мс без изоляции и 0,005 мс с заголовками.

```text
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

Ставьте эти заголовки на тестовом сервере всегда: это дешевле, чем любая другая мера против 100-микросекундного шага. Проверка: в консоли страницы посчитайте минимальную положительную разность двух вызовов `performance.now()` в цикле; ожидаемо 0,1 мс или 0,005 мс.

### mitata в браузере через esbuild

`[проверено локально]` Рабочая схема для коротких функций в браузере:

```bash
esbuild m.js --bundle --format=iife --external:bun:jsc --outfile=m.bundle.js
```

Без `--external:bun:jsc` сборка падает. Бандл подключается на странице, затем Playwright вызывает `page.evaluate(() => run({format:'json', print: () => {}}))`. Результат: `context.runtime = "browser"`, `p50 = 705 нс`. В консоль идут безвредные ошибки загрузки `node:os` и `node:v8`.

Для коротких функций это надёжнее Vitest browser: mitata делит время пачки (4096 вызовов) на их число, а Vitest меряет каждый вызов отдельно. Вывод из одного сравнения на одной функции, проверяйте A/A.

### Tachometer: архивирован

- Возможности: минимум 50 выборок, таймаут автодобора 3 минуты, режимы callback, Performance API (только в конфиге), `window.tachometerResult`, FCP; браузеры chrome, firefox, safari, edge, ie; можно подменять версии пакетов — [tachometer README](https://raw.githubusercontent.com/google/tachometer/main/README.md).
- `[устарело]` Репозиторий архивирован: `gh api repos/google/tachometer` на 8 ноября 2026 даёт `archived: true`, последний push 2025-07-03. Прямой замены от Google нет. Практичная замена — своя обвязка на Playwright, которая открывает страницы A и B попеременно (ABBA), снимает `performance.measure` и пишет в общий формат `{unit, benchmarks}`.
- Обход для Windows, `[проверено локально]`: `tach` на Node 24 падает на старте с `spawn EINVAL` (вызов `npm.cmd` через `execFile` без `shell`), и это необработанный reject. Запускайте с `NODE_OPTIONS=--unhandled-rejections=warn`.
- Второй подвох на Windows: мажор ChromeDriver обязан совпадать с мажором Chrome, иначе сессия не создаётся (`only supports Chrome version 157` при Chrome 156 и последнем `chromedriver` из npm). Ставьте `npm i -D chromedriver@<мажор Chrome>`.
- После этого прогон проходит: `tach bench.html slow.html --browser=chrome-headless --sample-size=12 --timeout=0 --json-file=x.json`.

## Метрики страницы

Вывод: Lighthouse CI — стандартный путь для страницы: 5 прогонов, `median-run`, симулированный троттлинг. Главные ловушки: `aggregationMethod` по умолчанию `optimistic`, budgets удалены из Lighthouse ещё в 12.0, значения TBT и CLS часто равны нулю. Лабораторные данные нужны для отладки и сравнения, приоритеты задаёт полевая статистика.

### Форма JSON Lighthouse

`[локально, 13.6.0]`

- Верхний уровень LHR: `lighthouseVersion, requestedUrl, mainDocumentUrl, finalDisplayedUrl, finalUrl, fetchTime, gatherMode, runWarnings, userAgent, environment, audits, configSettings, categories, categoryGroups, stackPacks, entities, fullPageScreenshot, timing, i18n`.
- Аудит: `{id, title, description, score, scoreDisplayMode, numericValue, numericUnit, displayValue, scoringOptions: {p10, median}}`. Для LCP, FCP, TBT, SI `numericUnit: "millisecond"`, для CLS `"unitless"`.
- Сводка метрик: `audits.metrics.details.items[0]`: `firstContentfulPaint, largestContentfulPaint, interactive, speedIndex, totalBlockingTime, cumulativeLayoutShift, timeToFirstByte, observed*`.
- Оценка: `categories.performance.score` от 0 до 1. Веса в 13.6: LCP 25, TBT 30, CLS 25, FCP 10, SI 10 (из `auditRefs`). Они совпадают с таблицей Lighthouse 10 в [Lighthouse performance scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring).
- Документация описывает поля `id, title, score, scoreDisplayMode, numericValue, displayValue` и верхнеуровневые `lighthouseVersion, requestedUrl, finalDisplayedUrl, categories, timing, runtimeError, runWarnings` — [Understanding results](https://raw.githubusercontent.com/GoogleChrome/lighthouse/main/docs/understanding-results.md). `numericUnit` и `environment` там не упомянуты, но в реальном файле есть.
- `environment.benchmarkIndex` пишется в каждый отчёт (`[проверено локально]`: 2564–2659 за 10 прогонов). По нему замечают смену железа или фоновую нагрузку — [Lighthouse throttling](https://raw.githubusercontent.com/GoogleChrome/lighthouse/main/docs/throttling.md). Сравнивать отчёты с разным `benchmarkIndex` нельзя; записывайте индекс в журнал и предупреждайте при расхождении более примерно 10%.

### Что изменилось в Lighthouse

Lighthouse 12.0.0 (2024-04-22) удалил budgets. Lighthouse 13.0.0 (2025-10-10) заменил часть аудитов производительности insight-аудитами и требует Node 22.19 и выше.

Источник: [Lighthouse changelog](https://raw.githubusercontent.com/GoogleChrome/lighthouse/main/changelog.md). `[проверено локально]` В LHR 13.6 есть `*-insight` (`lcp-breakdown-insight`, `inp-breakdown-insight`, `render-blocking-insight` и другие); аудитов с `budget` в названии нет.

`budget.json` и `budgetsFile` `[устарело]`: опция ещё описана в [LHCI configuration](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md), но сами budgets из Lighthouse удалены. Замена — `assertions` с `maxNumericValue`.

### Lighthouse CI

Рабочая конфигурация, `[проверено локально]`:

```json
{"ci":{"collect":{"staticDistDir":"./dist","numberOfRuns":5,
  "settings":{"chromeFlags":"--headless=new --no-sandbox","onlyCategories":["performance"]}},
 "assert":{"assertions":{"largest-contentful-paint":["error",{"maxNumericValue":2500,"aggregationMethod":"median-run"}],
   "total-blocking-time":["warn",{"maxNumericValue":300,"aggregationMethod":"median-run"}]}},
 "upload":{"target":"filesystem","outputDir":"./lh-out"}}}
```

Запуск: `CHROME_PATH=… lhci collect && lhci assert && lhci upload`. `lhci assert` завершился с кодом 1 при превышении.

- `aggregationMethod`: `median`, `optimistic`, `pessimistic`, `median-run`. Без опций действует `{"aggregationMethod": "optimistic", "minScore": 1}`. `optimistic` выбирает значение, которое скорее всего пройдёт, поэтому шумные пики проходят незаметно. Указывайте `median-run` или `median` у каждого ключевого утверждения. `numberOfRuns` в CLI по умолчанию 3. Цель `filesystem` пишет `manifest.json`: `url, isRepresentativeRun, htmlPath, jsonPath, summary` — [LHCI configuration](https://raw.githubusercontent.com/GoogleChrome/lighthouse-ci/main/docs/configuration.md).
- `[проверено локально]` Каталог `.lighthouseci/`: `lhr-<время>-<id>.json`, `.html` и `assertion-results.json` с элементами `{name, expected, actual, values, operator, passed, auditId, level, url, auditTitle, auditDocumentationLink}`. Манифест — массив, `isRepresentativeRun: true` у одной записи на URL. Файлы `manifest.json` и `assertion-results.json` не являются отчётами и сравнению не подлежат.
- Для единичных запусков есть `computeMedianRun` из `lighthouse/core/lib/median-run.js` ([Lighthouse variability](https://raw.githubusercontent.com/GoogleChrome/lighthouse/main/docs/variability.md)).
- Схема ABBA для Lighthouse: запускайте `lhci collect --numberOfRuns=1` попеременно для каждой стороны и копируйте `lhr-*.json` в `before/` и `after/`.

### Изменчивость и шум

- «The median Lighthouse score of 5 runs is twice as stable as 1 run». Нужны минимум 2 выделенных ядра и 2 ГБ памяти; нельзя снимать несколько отчётов одновременно на одной машине; избегайте burstable-инстансов и serverless — [Lighthouse variability](https://raw.githubusercontent.com/GoogleChrome/lighthouse/main/docs/variability.md).
- Там же таблица источников шума: недетерминизм страницы и нагрузка на клиента имеют высокое влияние; симулированный троттлинг снимает сетевую вариативность полностью, а контендинг ресурсов лишь частично.
- На реальных сайтах CoV FCP за один прогон был 9,5–13,2%, TTI 4,1–10,2%; три прогона снижали CoV TTI на 37%, семь примерно вдвое — [DebugBear: web performance test variability](https://www.debugbear.com/blog/web-performance-test-variability).
- A/A, `[проверено локально]`, простая локальная страница, симулированный троттлинг, 5+5 прогонов: LCP 752,7–761,5 мс (медианы 753,1 и 753,4, расхождение 0,04%); TBT 1482–1594 мс (медианы 1503 и 1551, +3,2%); FCP 601,3–605,7 мс; SI 601–665 мс; CLS 0; оценка 0,74 во всех прогонах.

На реальном сайте разброс будет больше; цифры показывают только порядок шума самого инструмента.

### Троттлинг

- По умолчанию сеть Slow 4G: 150 мс, 1,6 Мбит/с вниз, 750 Кбит/с вверх; CPU ×4 — [Lighthouse throttling](https://raw.githubusercontent.com/GoogleChrome/lighthouse/main/docs/throttling.md). `[проверено локально]` В `configSettings`: `{"rttMs":150,"throughputKbps":1638.4,"cpuSlowdownMultiplier":4}`, `throttlingMethod: "simulate"`, `formFactor: "mobile"`.
- Множитель подбирают по `benchmarkIndex`: высокий десктоп 1500–2000, средний телефон 125–800; ключ `--throttling.cpuSlowdownMultiplier=6`. Режим `--throttling-method=devtools` реальный, но шумнее. Спорные выигрыши подтверждайте режимом `devtools` на той же машине, потому что симуляция лишь моделирует эффект времён сети и ЦП.
- В DevTools троттлинг относителен к вашему железу; есть **Calibrate** в Capture settings → CPU — [Performance features reference](https://developer.chrome.com/docs/devtools/performance/reference).
- `[проверено локально]` `Emulation.setCPUThrottlingRate {rate: 4}` через CDP на Playwright: цикл 45,4–46,5 мс превратился в 187,9–188,3 мс (×4,1).

### User flows и WebPageTest

- Lighthouse user flows: режимы navigation, timespan, snapshot; timespan не даёт оценки и моментных метрик вроде LCP; SPA-переходы и формы navigation не анализирует; JSON получают через `flow.createFlowResult()` — [Lighthouse user flows](https://raw.githubusercontent.com/GoogleChrome/lighthouse/main/docs/user-flows.md).
- WebPageTest: API `runtest.php` с параметрами `runs` (1–9 на публичном инстансе), `fvonly=1`, `f=json`, ключ в заголовке `X-WPT-API-KEY`; `jsonResult.php` группирует по `average`, `standardDeviation`, `median`, `runs` — [Catchpoint WebPageTest legacy API](https://docs.catchpoint.com/wpt/docs/webpagetest-legacy-api.md). Вложенность `.data.median.firstView` — [Using jq with the WebPageTest API](https://nooshu.com/blog/2020/10/09/using-jq-with-the-webpagetest-api/) `[не проверено]`: один источник 2020 года.
- На момент проверки домен `docs.webpagetest.org` отдавал сертификат с несоответствием имени (`*.netlify.app`). Документацию надёжнее читать на docs.catchpoint.com.

### Playwright и DevTools API

- Трейсы Playwright — средство отладки; `trace: 'on'` «not recommended as it's performance heavy», замеры в трейсе смещены — [Trace viewer](https://playwright.dev/docs/trace-viewer).
- `browser.startTracing` управляет низкоуровневым Chromium Tracing; CDP «only supported on Chromium-based browsers» — [Browser API](https://playwright.dev/docs/api/class-browser). `[проверено локально]` Трейс: `{traceEvents, metadata}`, 150 событий на 86 КБ при категориях `devtools.timeline, blink.user_timing, loading, disabled-by-default-devtools.timeline`. `performance.measure` появляется как пара событий `ph: "b"` и `"e"` категории `blink.user_timing`.
- `performance.measure(name, {start, end, duration, detail})` — [MDN Performance.measure](https://developer.mozilla.org/en-US/docs/Web/API/Performance/measure). Поле `detail.devtools` (`track`, `trackGroup`, `color` и другие) выводит замеры в отдельную дорожку панели Performance; `console.timeStamp` дешевле для горячих путей — [Performance extensibility API](https://developer.chrome.com/docs/devtools/performance/extension).
- `[проверено локально]` CDP `Performance.getMetrics` возвращает `ScriptDuration, TaskDuration, LayoutDuration, RecalcStyleDuration, V8CompileDuration, JSHeapUsedSize, JSHeapTotalSize, Nodes, LayoutCount` и другие. Для счётчиков «до/после» это самый дешёвый способ без разбора трейса.

### Полевые данные: RUM и CrUX

- Лаборатория удобна для отладки и воспроизводимости, полевая статистика — распределение, обычно p75. Лабораторный прогон холодный, без bfcache; CLS учитывает только сдвиги при загрузке в первом экране; LCP-элемент может отличаться — [Why lab and field data can be different](https://web.dev/articles/lab-and-field-data-differences).
- CrUX API: `POST https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=…`, тело `{url|origin, formFactor, metrics}`, ответ `record.metrics.largest_contentful_paint.percentiles.p75`, `histogram[]`, `collectionPeriod`. Окно скользящие 28 дней, обновление ежедневно около 04:00 UTC, 150 запросов в минуту — [CrUX API](https://developer.chrome.com/docs/crux/api).
- web-vitals 6.2.3: `onCLS, onFCP, onINP, onLCP, onTTFB`; объект `{name, value, rating, delta, id, entries, navigationType, …}`; сборка `web-vitals/attribution` на примерно 1,5 КБ больше; `reportAllChanges` не для продакшена; `durationThreshold` INP по умолчанию 40 мс; `onCLS` только в Chromium — [web-vitals README](https://raw.githubusercontent.com/GoogleChrome/web-vitals/main/README.md). `onFID` `[устарело]`, удалён в v5.0.0, замена `onINP` — [web-vitals CHANGELOG](https://github.com/GoogleChrome/web-vitals/blob/main/CHANGELOG.md).

## Взаимодействия

Вывод: INP в лаборатории снимается только для сценария, который вы проигрываете. Рабочая схема — Playwright, `web-vitals/attribution` и LoAF. Для сравнения берите простые сценарии и медиану нескольких прогонов, а тонкую разметку времени берите из атрибуции.

### INP и LoAF

- INP: хорошо ≤200 мс, плохо >500 мс, p75 по загрузкам; берётся худшее взаимодействие, при более чем 50 взаимодействиях отбрасывается одно наибольшее на каждые 50 — [Interaction to Next Paint](https://web.dev/articles/inp).
- В лаборатории INP измерим только при моделировании действий, TBT — лишь приближение; стоит взаимодействовать ещё во время загрузки — [Interaction to Next Paint](https://web.dev/articles/inp).
- Три части: задержка ввода, обработка, задержка показа; их сумма даёт длительность — [Optimize INP](https://web.dev/articles/optimize-inp).
- LoAF: `PerformanceObserver` с `type: 'long-animation-frame'`, порог 50 мс, поля `duration, blockingDuration, renderStart, styleAndLayoutStart, firstUIEventTimestamp, scripts[]` (`invoker, invokerType, sourceURL, forcedStyleAndLayoutDuration`). Буфер 200 записей; Chrome и Edge 123+, Firefox и Safari не поддерживают. Аудит Lighthouse о долгих задачах использует long tasks, а не LoAF — [Long Animation Frames API](https://developer.chrome.com/docs/web-platform/long-animation-frames).

### Опыт запуска, `[проверено локально]`

Headless Chrome 156 через Playwright, `page.click` на кнопку с блокировкой 180 мс.

Результат: web-vitals вернул `INP` 192 мс (`rating: good`), атрибуция `inputDelay` 0,2, `processingDuration` 181, `presentationDelay` 10,8, `interactionTarget "#b"`, `interactionType "pointer"`. LoAF: `duration` 182,1, `blockingDuration` 131,6, `scripts[0].invoker = "BUTTON#b.onclick"`.

Две ловушки того же прогона:

- При первой попытке web-vitals подключался через `page.addScriptTag` за 300 мс до клика, и `INP` остался `undefined`. Когда библиотека загружалась вместе со страницей, а до клика проходило 1,2 с, значение пришло. Причину не выяснял. Безопаснее подключать библиотеку в HTML и выдерживать паузу.
- Все длительности из Event Timing в том прогоне были кратны 8 мс (192, 104 и так далее). Изменения меньше 8 мс таким способом не различимы. Причина кратности первоисточником не проверена.

`blockingDuration` LoAF лучше `duration` как метрика регрессии: он исключает безобидную часть длинного кадра. Атрибуция полезнее итогового INP при поиске причин: `processingDuration` указывает на обработчик, `presentationDelay` на рендер.

### Методика js-framework-benchmark

Подходит для любых приложений со списками, таблицами и частичными обновлениями.

- Длительность — от начала клика до первого commit после последнего `fireAnimationFrame`, `timerFire`, `layout` или `functioncall`; если такого нет, берётся последний commit — [How the duration is measured](https://github.com/krausest/js-framework-benchmark/wiki/How-the-duration-is-measured).
- Итог с Chrome 118 — взвешенное геометрическое среднее коэффициентов отставания от самой быстрой реализации. Вес равен обратному 90-му перцентилю — [Computation of the weighted geometric mean](https://github.com/krausest/js-framework-benchmark/wiki/Computation-of-the-weighted-geometric-mean):

Веса: `01_run1k` 0.64, `02_replace1k` 0.56, `03_update10th1k_x16` 0.56, `04_select1k` 0.19, `05_swap1k` 0.13, `06_remove-one-1k` 0.53, `07_create10k` 0.56, `08_create1k-after1k_x2` 0.55, `09_clear1k_x8` 0.42.

- Определения бенчмарков: `warmupCount` 5 (у `03_update10th1k_x16` — 3); троттлинг CPU ×4 у partial update, select, swap, clear и ×2 у remove row; `04_select1k` имеет 10 дополнительных прогонов — [benchmarksCommon.ts](https://raw.githubusercontent.com/krausest/js-framework-benchmark/master/webdriver-ts/src/benchmarksCommon.ts).
- Результаты пишутся в `webdriver-ts/results/<framework>_<benchmark>.json` с полями `mean, median, geometricMean, values`. Окно Chrome нужно держать видимым, иначе paint может пропускаться — [js-framework-benchmark README](https://raw.githubusercontent.com/krausest/js-framework-benchmark/master/README.md).
- Для прикладного проекта стоит взять принципы: конец операции определять по commit после последнего рендера, а не по `requestAnimationFrame`, и задавать троттлинг только быстрым операциям, иначе они уйдут в шум таймера.

## Кадры и рендер

Вывод: средний FPS скрывает рывки, поэтому отчёт должен опираться на время кадра: p50, p95, p99 и долю кадров сверх бюджета. CPU-часть меряется на каждом кадре через `performance.now()`, GPU-часть — через timestamp-query или таймер-запросы. Эти цифры сравнимы только внутри одного тестового стенда. Раздел относится к играм, визуализациям, картам и анимированным интерфейсам.

### Сэмплер времени кадра

```js
const dt = []
let p = performance.now()
function f() {
  const n = performance.now()
  dt.push(n - p)
  p = n
  if (dt.length < N) requestAnimationFrame(f)
}
requestAnimationFrame(f)
```

- Перед анализом отбросьте 60–120 первых кадров. `[проверено локально]` Headless Chrome 156, 120 кадров: p50 16,70 мс, p95 16,80 мс, максимум 108,5 мс (первые кадры). Без отбрасывания начала прогона максимум и p99 врут.
- Считайте p50, p95, p99 и долю `dt > 16,67` мс (для 120 Гц порог 8,33 мс).
- Выгружайте в общий формат: `{unit: 'ms', benchmarks: [{name, median, q1, q3, mean}]}`.
- rAF вызывается с частотой дисплея (60, 75, 120, 144 Гц), точность отметки времени «minimal precision of 1 millisecond»; в фоне и скрытых iframe вызовы приостанавливаются — [MDN requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame).
- Для симуляции или игрового тика надёжнее мерить тик отдельно микробенчмарком, а кадр целиком — только для рендера: rAF подчинён vsync, поэтому слабые изменения в CPU на нём не видны.

### GPU и показ кадра

| Источник | Что даёт | Ограничения |
| --- | --- | --- |
| WebGPU `timestamp-query` | значения в наносекундах на проход (`querySet`, `timestampWrites`, `resolveQuerySet`) | опциональная возможность; по умолчанию квантуется до 100 мкс; результаты зависят от реализации; годится для сравнения техник, а не общей производительности |
| stats-gl 4.2.3 | панели FPS, CPU, GPU, CPT; WebGL через таймер-запросы; нативный WebGPU через `stats.getTimestampWrites()` и `stats.end(encoder)`; `StatsProfiler` для воркера и OffscreenCanvas | в Safari нужен флаг «WebGL Timer Queries» |
| Панель Performance, треки Frames | idle, on time, partially presented, dropped | только Chromium DevTools |
| PresentMon | CSV через ETW: `CPUFrameTime`, `msGPUActive`, `DisplayLatency` и другие | Windows, нужна группа Performance Log Users или права администратора; единственный из источников показывает реальный показ кадра, а не момент колбэка |

Источники: [WebGPU Timing Performance](https://webgpufundamentals.org/webgpu/lessons/webgpu-timing.html) (в примере статьи проход был в 5 раз быстрее по таймерам, а общий результат оказался обратным); [stats-gl README](https://github.com/RenaudRohlinger/stats-gl); [Performance features reference](https://developer.chrome.com/docs/devtools/performance/reference); [PresentMon](https://github.com/GameTechDev/PresentMon).

- Определения перцентилей отличаются у разных инструментов: «1% low» может быть средним худшего 1% кадров или значением по времени — [Explanation of different performance metrics](https://www.capframex.com/blog/post/Explanation%20of%20different%20performance%20metrics) `[не проверено]`. Указывайте определение рядом с числом.
- Headless-прогоны годятся для CPU-части кадра и JS. Выводы про GPU и реальный показ кадра подтверждайте в headed-режиме на целевом железе.
- Детали API `EXT_disjoint_timer_query_webgl2` не проверены (страница MDN по прямому адресу вернула 404); опора на stats-gl.

## Размер бандла

Вывод: контроль бюджета — size-limit, состав бандла — sonda или rollup-plugin-visualizer. Размер детерминирован, поэтому порог и статистика другие: один прогон и абсолютный бюджет в байтах. bundlesize и source-map-explorer для новых проектов не брать.

| Инструмент | Статус и назначение | Источник |
| --- | --- | --- |
| size-limit 14.3.0 | Бюджет в CI. Плагины `file`, `webpack`, `time`, `esbuild`, `rolldown`; пресеты `preset-app`, `preset-big-lib`, `preset-small-lib`; по умолчанию Brotli (`gzip: true` переключает); `--why` использует Statoscope; `size-limit-action` комментирует PR. Флаг `--json` в README не описан | [size-limit README](https://github.com/ai/size-limit) |
| bundlesize 0.18.2 | `[устарело]`: метаданные от 2024-03, README называет использование только через CLI потенциально устаревающим. Замена: size-limit | [bundlesize README](https://github.com/siddharthkp/bundlesize) |
| source-map-explorer 2.5.3 | `[устарело]`: последний push 2023-03-14, README требует «Node 10 or later». Замена: sonda | [source-map-explorer README](https://github.com/danvk/source-map-explorer) |
| rollup-plugin-visualizer 7.1.3 | Шаблоны `sunburst, treemap, treemap-3d, network, raw-data, list, markdown, flamegraph`; `raw-data` даёт JSON, `list` — YAML для коммита; `gzipSize`, `brotliSize`; CLI объединяет отчёты | [rollup-plugin-visualizer](https://github.com/btd/rollup-plugin-visualizer) |
| sonda 0.14.0 | Анализ итоговых source map; Vite, Rollup, esbuild, webpack, Rolldown, Rspack; HTML и JSON | [Sonda](https://sonda.dev/) |
| statoscope 5.29.0 | Анализ и валидация webpack-статистики, CLI | [statoscope](https://github.com/statoscope/statoscope) |
| compressed-size-action | Сравнение размеров сборок PR и целевой ветки; входы `pattern, exclude, compression` (gzip по умолчанию), `minimum-change-threshold`, `strip-hash`, `build-script`; выход `comment-body` | [compressed-size-action](https://github.com/preactjs/compressed-size-action) |

`[проверено локально]` `npx size-limit --json` печатает в stdout массив; при превышении лимита код выхода 1, JSON при этом выводится:

```json
[
  {"name": "lib", "passed": true, "size": 56, "sizeLimit": 10000},
  {"name": "lib-tiny", "passed": false, "size": 56, "sizeLimit": 1},
  {"name": "lib-brotli", "size": 56}
]
```

Без `limit` полей `passed` и `sizeLimit` нет. По исходнику `create-reporter.js`: с плагином `time` появляются `running` (`runTime`) и `loading` (`loadTime`). `size` — байты. Задавайте `name` в конфиге: от него зависят ключи при сравнении.

Как строить бюджет:

- В CI ставьте `size-limit` с абсолютным лимитом, который блокирует слияние, и compressed-size-action для показа разницы в PR. Порог в процентах не нужен: измерение детерминировано.
- Для библиотек задавайте отдельный лимит на подключаемую часть: `import` в size-limit проверяет tree-shaking.
- Для игр и визуализаций основную долю часто дают ассеты (текстуры, модели, шрифты, данные), а не JS; добавьте проверку файлов ассетов через `@size-limit/file` или отчёт сборщика с `raw-data`. Состав бандла сравнивайте по списку модулей, не по медианам.

## Проверка типов и сборка

Вывод: время меряйте hyperfine с `-N` и явными именами команд. Рост сложности типов отслеживайте по счётчикам `Instantiations` и `Types` из `--extendedDiagnostics` только внутри одной версии TS. Счётчики TS 6 и TS 7 несравнимы. attest на релизном TS 7.0.2 не работает.

### hyperfine и tsc

`[проверено локально]` Команда:

```bash
hyperfine -N --warmup 1 --runs 5 \
  -n ts6 'node node_modules/@typescript/typescript6/bin/tsc --noEmit' \
  -n ts7 'node node_modules/typescript/bin/tsc --noEmit' \
  --export-json r.json
```

Результат на маленьком проекте (76 файлов, в основном lib): TS 6.0.3 420,4 ± 5,1 мс, TS 7.0.2 189,0 ± 4,9 мс, разница 2,22 ± 0,06 раза. Проект слишком мал для оценки реального ускорения.

Подвохи:

| Подвох | Причина | Что делать |
| --- | --- | --- |
| С `-N` команда `npx tsc --noEmit` на Windows падает: «program not found» | нужен `npx.cmd`, а `-N` не использует оболочку | Вызывать компилятор по прямому пути: `node node_modules/typescript/bin/tsc` |
| `npx tsc --version` показывает 6.0.3 при установленном `typescript@7` | alias `@typescript/typescript6` занимает `node_modules/.bin/tsc` | Запускать по прямому пути к нужной версии |
| hyperfine останавливается на первой ошибке | `tsc` с типовыми ошибками возвращает ненулевой код | Добавить `-i` и проверять `exit_codes` в результате |
| Смена команды ломает сравнение: `no benchmark is present on both sides` | имена берутся из команд | Задавать стабильные имена `-n` |
| `memory_usage_byte` содержит нули | на Windows поле не заполняется | Брать `Memory used` из диагностики `tsc` |
| `--prepare` запускается перед каждым прогоном | поведение hyperfine | Использовать для сброса кэша; `--runs` по умолчанию не фиксирован, задавайте явно |

Форма JSON hyperfine, `[проверено локально]`: `{"results":[{"command","mean","stddev","median","user","system","min","max","times":[…],"memory_usage_byte":[…],"exit_codes":[…]}]}`, время в секундах. В README упомянута метрика `memory_peak_resident` с пометкой о неподдержке на Windows — [hyperfine README](https://github.com/sharkdp/hyperfine); в версии 1.20.0 поле называется `memory_usage_byte`. В каталоге скриптов hyperfine есть `welch_ttest.py` и `advanced_statistics.py` — [hyperfine scripts](https://github.com/sharkdp/hyperfine/tree/master/scripts).

### --extendedDiagnostics

Формат — текст `Ключ: значение`, у двух компиляторов разные поля, `[проверено локально]` на одном проекте из 76 файлов:

```text
# TS 6.0.3                         # TS 7.0.2
Files:                    76       Files:              76
Types:                    90       Types:             345
Instantiations:            0       Instantiations:      0
Memory used:          58270K       Memory used:    25633K
Parse time:            0.17s       Parse time:     0.037s
Check time:            0.01s       Check time:     0.001s
Total time:            0.33s       Total time:     0.061s
```

У TS 6 есть ещё `Lines of Library`, `Identifiers`, `Symbols`, `Assignability cache size`, `I/O Read time`, `Program time`, `Bind time`, `printTime time`, `Emit time`. У TS 7 вместо них `Lines`, `Identifiers`, `Symbols`, `Memory allocs`, `Config time`, `Bind time`.

- Смысл полей: Parse, Program (объединяет чтение, разбор и граф), Bind, Check, I/O Read/Write. `Total time` не равен сумме, потому что фазы пересекаются — [TypeScript wiki: Performance](https://github.com/microsoft/TypeScript/wiki/Performance).
- Счётчики разных компиляторов несравнимы, `[проверено локально]`: на одном проекте `Types` 90 (TS 6) против 345 (TS 7), на другом 396 против 651. При переходе TS 6 на TS 7 скрипт сравнения без учёта версии ошибочно показал бы `Types +64.4% slower`. Сравнивайте счётчики только пары «до/после» одной версии.
- В TS 7 есть `--checkers`, `--builders`, `--singleThreaded`, `--pprofDir` (вывод `tsc --all`). Параллелизм влияет на `user` и `system`, поэтому сравнивайте настенное время. Для стабильной проверки одиночных изменений пригоден `--singleThreaded`.
- Для CI-гейта типов хватает двух чисел: `Instantiations` как детерминированного индикатора роста и настенного времени hyperfine как проверки эффекта. Внутри одной версии TS `--extendedDiagnostics` даёт более дешёвый сигнал, чем `generateTrace`.
- Для памяти сборки на Windows подходит `Memory used` из диагностики. Работает ли `memory_usage_byte` на Linux, не проверялось.

Конвертация в общий формат (подробности в [следующем разделе](#сравнение-прогонов-форматы-и-скрипты)):

```bash
node node_modules/typescript/bin/tsc --noEmit --extendedDiagnostics --checkers 1 \
  | node <путь к скиллу>/scripts/tsc_diag.mjs > bench/types-before.json
```

Конвертер читает stdin и берёт только `Types`, `Instantiations` и `Memory used`: время одного прогона — это шум, его мерьте через hyperfine. `--checkers 1` нужен только на TS 7, на TS 6 такого флага нет. В файл пишется поле `compiler` (`tsc-go` или `tsc-js`), и скрипт сравнения откажется сравнивать счётчики разных поколений.

### --generateTrace

- Команда: `tsc -p dir --generateTrace dir --incremental false`; в build-режиме нужен `-f`. Результат: `trace.json`, `types.json`, для проектов `legend.json` и нумерованные файлы. Формат нестабилен, файлы содержат пути и исходники. Анализ через `@typescript/analyze-trace`, просмотр в `about://tracing` или DevTools — [Performance Tracing](https://github.com/microsoft/TypeScript/wiki/Performance-Tracing).
- `[проверено локально]` TS 6 пишет `trace.json` и `types.json`. TS 7 пишет `trace.json`, `legend.json` и по файлу `types_0.json … types_3.json` на чекер. `legend.json` — массив `{configFilePath, tracePath, typesPath, checkerId}`.
- `[проверено локально]` `analyze-trace` на трейсе TS 7 не упал, напечатал «Found nothing in 1 project(s)» и вернул код 1. Проект крошечный, поэтому полная совместимость не подтверждена.

### attest

- `bench("имя", () => …).types([169, "instantiations"])` записывает значение как inline-снапшот; `.mean([2, "ms"])`. Порог `--benchPercentThreshold` по умолчанию 20%, `--benchErrorOnThresholdExceeded`; запуск `node` или `tsx` файла — [Attest benches](https://arktype.io/docs/attest/benches).
- Опция `checker`: `tsjs` (TS ≤6), `tsgo`, `tsrs`. `benchErrorOnThresholdExceeded` по умолчанию `true`. Настройка через аргумент, `ATTEST_*` или `attest.setup` — [Attest options](https://arktype.io/docs/attest/options). Attest официально «still in alpha» — [Attest](https://arktype.io/docs/attest).
- `[проверено локально]` На TS 6.0.3 работает: `⛳ Result: 179 instantiations`, `📈 'm' exceeded baseline by 17800.00% (threshold is 20%)`, код выхода 1. Нужен `tsconfig.json` с явным `moduleResolution`, иначе падение с TS5107 про `node10`. Файл должен быть ESM.
- `[проверено локально]` На TS 7.0.2: `Error: @ark/attest requires TypeScript 7.1+ (found 7.0.2)`. Последняя стабильная версия `typescript` в npm — 7.0.2 (@ark/attest 0.58.0), поэтому на релизном TS 7 attest пока использовать нельзя. Нужен alias на TS 6 либо `tsrs`.
- Работает ли attest с `tsrs` на Windows, не проверялось.

## Статистика и шум

Вывод: базовый рецепт — 5–10 чередующихся прогонов на сторону, медиана медиан, A/A перед доверием любому стенду. Минимум как статистика вводит в заблуждение. В шумном CI надёжнее счёт инструкций, а время подтверждайте на выделенной машине.

### Порядок работы на новом стенде

1. A/A: два запуска одного и того же кода по полной схеме (те же команды, число прогонов, ABBA). Ожидаемый вердикт `same`.
2. Измерьте межпрогонный разброс на A/A и назначьте порог не ниже его удвоенного значения. Если расхождение медиан дошло до 3,2% (как TBT выше), порог не меньше 6,4%, а обычные 5% скрипта слишком малы.
3. Чередуйте стороны: A B B A A B B A A B. Прогон сразу после другого варианта бывает систематически быстрее или медленнее.
4. Одна машина, один браузер, одна версия инструмента, закрытые фоновые процессы.

`[проверено локально]` A/A для скрипта сравнения: 5+5 прогонов Lighthouse на одной странице дали `same` по всем метрикам при пороге 5%.

### Число прогонов и правило вердикта

- Правило скрипта: «faster» или «slower» только если медиана медиан сдвинулась больше порога и медианы всех прогонов одной стороны лежат строго по одну сторону от другой. Это критерий полного разделения.
- Критерий полного разделения при 5 прогонах на сторону равен точному двустороннему тесту Манна–Уитни при U = 0: p = 2/C(10,5) ≈ 0,0079. Отдельный тест при n = 5 ничего не добавит, уровень значимости уже жёсткий.
- При n ≥ 10 требование полного разделения становится слишком строгим, и стоит считать настоящий U-тест.
- benchstat: тест Манна–Уитни, α = 0,05, медиана и 95% ДИ медианы; «at least 10, ideally 20» прогонов — [benchstat](https://pkg.go.dev/golang.org/x/perf/cmd/benchstat).
- Один прогон на сторону: вердикт по порогу и непересечению межквартильных интервалов, но такому вердикту доверять нельзя. Для детерминированных метрик (размеры, счётчики) предупреждение об одном прогоне не нужно: ориентируйтесь на абсолютный лимит.

### Какую статистику выбирать

Медиана подходит для задержек и времени операции, среднее для суммарной стоимости (энергия, время пачки), p95 и p99 для рывков и кадров. Размеры и счётчики типов детерминированы, хватает одного значения. Минимум годится только как диагностика, не как итог.

- Минимум опасен: «it gives you false confidence that you can avoid thinking about a benchmark's overall performance distribution». У программы может быть несколько точек производительности; сообщайте распределение и не ждите, что центральная предельная теорема спасёт зависимые данные — [Minimum Times Tend to Mislead When Benchmarking](https://tratt.net/laurie/blog/2019/minimum_times_tend_to_mislead_when_benchmarking.html).
- Kalibera и Jones предлагают повторять замеры на том уровне (сборка, процесс, итерация), где неопределённость выше, и сообщать доверительные интервалы размера эффекта — [Rigorous Benchmarking in Reasonable Time](https://kar.kent.ac.uk/33611/). Georges и соавторы: сравнение лучших прогонов даёт ложные выводы — [Statistically Rigorous Java Performance Evaluation](https://dri.es/files/oopsla07-georges.pdf).
- Tachometer считает ДИ по t-распределению Стьюдента (дисперсии складываются, степени свободы по меньшей выборке; консервативнее метода Уэлча; [tachometer stats.ts](https://raw.githubusercontent.com/google/tachometer/main/src/stats.ts)); bench-node использует тест Уэлча и 30 повторов ([bench-node README](https://github.com/RafaelGSS/bench-node)).

### Шум раннеров CI

- A/A на GitHub Actions (два одинаковых коммита, каждые 6 часов, 16 дней): стратегия с двумя чередующимися проходами давала 3,7% ложных срабатываний, без чередования 9,99%, один проход 12,5%. Выбросы отношений в пределах 0,5–1,4, то есть надёжно видны лишь регрессии около 50% и больше — [Is GitHub Actions suitable for running benchmarks?](https://www.dev.to/quansightlabs/is-github-actions-suitable-for-running-benchmarks-111h). Это 16 дней одного Python-проекта и небольшие счётчики ложных срабатываний, цифры считайте ориентиром.
- Симуляция на Callgrind детерминирована на одной машине (0% RSD на 100 прогонов), но смена CPU в пуле раннеров даёт разброс до 0,505% (`glibc malloc` подстраивается под CPU). Варианты: большие раннеры, bare metal, `GLIBC_TUNABLES` — [CodSpeed blog: unrelated benchmark regression](https://codspeed.io/blog/unrelated-benchmark-regression).
- Схема для CI: счёт инструкций (CodSpeed, Callgrind) на каждый PR, настенное время на отдельной машине перед релизом.

## Сравнение прогонов: форматы и скрипты

Скрипт [bench_compare.mjs](../scripts/bench_compare.mjs) сравнивает папки или файлы «до» и «после». Формат определяется по содержимому файла. Запуск:

```bash
node <путь к скиллу>/scripts/bench_compare.mjs bench/before bench/after --threshold 5
```

Каждая сторона — один JSON-файл или папка с JSON нескольких прогонов. Вердикты: `faster` и `slower` для времени, `better` и `worse` для байтов, счётчиков и оценок, `same` — в пределах шума. Код выхода: 0 — регрессий нет; 1 — есть `slower`, `worse`, `failed` или `only-base`; 2 — ошибка ввода (нет файлов, неизвестный формат, нулевая медиана времени, нечисловая статистика, нет общих бенчмарков, счётчики разных поколений компилятора).

Правило вердикта зависит от числа прогонов. При 2–7 на сторону прогоны двух сторон должны полностью разделиться, при 5+5 это точный тест Манна-Уитни с p = 0,0079. От 8 прогонов считается U-тест с p < 0,01. При одном прогоне сравниваются межквартильные интервалы, а скрипт предупреждает, что доверять этому нельзя; для байтов и счётчиков предупреждения нет, потому что они детерминированы.

Понимаемые форматы:

| Формат | Как получить | Что скрипт берёт |
| --- | --- | --- |
| mitata | `node bench.mjs > before/run1.json` | `benchmarks[].runs[].stats` (p25, p50, p75, avg), нс |
| Vitest 5 JSON reporter | `vitest bench --run --reporter=json --outputFile.json=before/run1.json` | `…benchmarks[].tasks[].latency` (p50, avg; q1 оценивается), мс |
| hyperfine | `hyperfine --export-json run1.json -n имя '<команда>'` | `results[].times`, секунды |
| Lighthouse | `npx lighthouse "$URL" --output=json --output-path=before/run1.json --only-categories=performance --quiet --chrome-flags=--headless=new`, либо `.lighthouseci/lhr-*.json`, либо `*.report.json` из `lhci upload --target=filesystem` | `audits[id].numericValue` для LCP, FCP, TBT, SI, CLS и `categories.performance.score`; имя составляется из пути страницы и метрики |
| size-limit | `size-limit --json > before/size.json` | массив, `size` в байтах, `name` |
| tachometer | `tach … --json-file=x.json` | `benchmarks[].samples` в мс, из них медиана и квартили |
| generic | любой инструмент (tinybench, свой сэмплер кадров) | см. ниже |

Общий формат:

```json
{
  "unit": "ms",
  "benchmarks": [
    { "name": "frame/render", "median": 6.2, "q1": 6.0, "q3": 6.5, "mean": 6.3, "kind": "time" },
    { "name": "bundle/main.js", "median": 48211, "q1": 48211, "q3": 48211, "kind": "bytes" }
  ]
}
```

- `unit`: `ns`, `us`, `ms`, `s`, `bytes` или `count`.
- `name` стабильный и уникальный в файле; одно имя дважды — ошибка ввода.
- `median`, `q1`, `q3` обязательны; для детерминированных метрик ставьте одно и то же значение во все три.
- `mean` необязателен; по соотношению среднего и медианы скрипт предупреждает о тяжёлом хвосте.
- `kind` необязателен и отделяет время от других метрик в одном файле: `time`, `bytes`, `count`, `unitless` или `score`. У `score` чем больше, тем лучше; для других метрик это задаёт `"higherIsBetter": true`. У строки можно задать свой `unit` вместо единицы файла.
- Ноль допустим для всех метрик, кроме времени: нулевая медиана времени означает слишком грубый таймер. Если ноль настоящий, поставьте `"allowZero": true`.

Файлы `manifest.json`, `assertion-results.json` и `links.json` (Lighthouse CI) скрипт пропускает сам. Другие файлы вне формата из папок с прогонами уберите.

Где скрипт не поможет:

- Vitest browser с `p50 = 0`: код 2, и это правильно (см. [Микробенчмарки](#vitest-в-браузере-p50--0--это-ошибка-замера)).
- Счётчики `tsc` разных версий TS сравнивайте только внутри одной версии; вывод `tsc --extendedDiagnostics` превращает в общий формат [tsc_diag.mjs](../scripts/tsc_diag.mjs).
- hyperfine: нужны стабильные имена `-n`; для `tsc` с ошибками `-i` и проверка `exit_codes`.
- Tachometer: в файле уже есть `differences[j].percentChange {low, high}`. «Быстрее» — если весь интервал ниже `-threshold`, «медленнее» — если весь выше `+threshold`, иначе неопределённо.

## Профилирование

Вывод: без окна агент надёжно работает только с Chromium: профили, трейсы и снимки кучи через CDP и chrome-devtools-mcp. Firefox доступен частично через переменные окружения, Safari — в основном интерактивно.

### Chromium

- Базовый профиль для агента: CDP `Profiler.*`, затем `.cpuprofile`, затем разбор `samples` и `timeDeltas` в топ функций. Это не требует MCP и работает в CI. `[проверено локально]`:

```js
const c = await page.context().newCDPSession(page)
await c.send('Profiler.enable')
await c.send('Profiler.setSamplingInterval', { interval: 100 })
await c.send('Profiler.start')
// ... сценарий ...
const { profile } = await c.send('Profiler.stop')
```

Форма `profile`: `{nodes:[{id, callFrame, hitCount, children}], startTime, endTime, samples:[…], timeDeltas:[…]}`; сохраняется как `.cpuprofile`. `Runtime.getHeapUsage` возвращает `usedSize, totalSize, embedderHeapUsedSize, backingStorageSize`.

- CDP Session «only supported on Chromium-based browsers» — [Playwright Browser API](https://playwright.dev/docs/api/class-browser).
- Панель Performance Insights `[устарело]`: выведена из эксплуатации в Chrome 131 и подлежала удалению, замена — insights в основной панели Performance — [Deprecation of the Performance Insights panel](https://developer.chrome.com/blog/insights-panel-deprecation). Текущая панель: живые метрики CWV, вкладка Insights, Frames, CPU/Network с калибровкой — [Performance features reference](https://developer.chrome.com/docs/devtools/performance/reference).
- Снимки кучи: Summary, Comparison, Containment; shallow и retained; фильтр «Objects retained by detached nodes» — [Record heap snapshots](https://developer.chrome.com/docs/devtools/memory-problems/heap-snapshots).
- `performance.measureUserAgentSpecificMemory()`: нужна cross-origin isolation, только Chromium (89+), результат `{bytes, breakdown:[{bytes, attribution, types}]}`, может ждать сборки мусора до 20 с — [web.dev: monitor total page memory usage](https://web.dev/articles/monitor-total-page-memory-usage).
- speedscope 1.25.0 импортирует профили Chrome, Firefox, Safari, Node и других экосистем; `speedscope /path/to/profile` открывает их в браузере — [speedscope](https://github.com/jlfwong/speedscope).

### chrome-devtools-mcp

- chrome-devtools-mcp 1.12.0: 61 инструмент. Производительность — `performance_start_trace` (`reload, autoStop, ignoreCache, filePath`), `performance_stop_trace`, `performance_analyze_insight`; также `lighthouse_audit`, `emulate` (`cpuThrottlingRate`, `networkConditions`, `viewport`), `take_heapsnapshot`. Большинство инструментов сравнения снимков требует `--memoryDebugging=true` — [chrome-devtools-mcp tool reference](https://raw.githubusercontent.com/ChromeDevTools/chrome-devtools-mcp/main/docs/tool-reference.md).
- Флаги `--headless`, `--isolated`, `--slim`. `--no-performance-crux` отключает отправку URL трейсов в CrUX API: ставьте при анализе сторонних URL, чтобы адреса не утекали. `--no-usage-statistics` или переменные `CI`, `CHROME_DEVTOOLS_MCP_NO_USAGE_STATISTICS` отключают телеметрию. Поддерживаются только Chrome и Chrome for Testing — [chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp). `engines.node`: `^20.19.0 || ^22.12.0 || >=23` (`npm view`).
- MCP удобен для разведки, регрессионные замеры делайте повторяемым скриптом Playwright.

### Firefox и Safari

- Firefox: `MOZ_PROFILER_STARTUP=1`, `MOZ_PROFILER_STARTUP_ENTRIES`, `_INTERVAL`, `_FEATURES`, `_FILTERS`, `MOZ_PROFILER_HELP=1` — [Firefox Profiler: startup and shutdown](https://raw.githubusercontent.com/firefox-devtools/profiler/main/docs-user/guide-startup-shutdown.md). Запись в файл при выходе (`MOZ_PROFILER_SHUTDOWN=<файл>`) показана в отчёте об ошибке [Bug 1612310](https://bugzilla.mozilla.org/show_bug.cgi?id=1612310) `[не проверено]`; в пользовательской документации этого приёма нет, запуск не выполнялся.
- Safari: вкладка Timelines (JS, рендеринг, CPU, память, аллокации, экспорт записи), `console.profile/profileEnd`, `console.takeHeapSnapshot` — [Timelines Tab](https://webkit.org/web-inspector/timelines-tab/). Автоматизации без интерфейса страница не описывает.

## Что может агент без браузера с окном

Вывод: на Windows, Linux и macOS агент без окна снимает метрики Lighthouse, профили CDP, трейсы и счётчики. Реальный показ кадра, GPU-таймеры и профили Safari требуют интерфейса или целевого железа. Строка Windows проверена `[проверено локально]`, остальное из документации; это выводы, а не гарантии.

| Возможность | Windows | Linux | macOS |
| --- | --- | --- | --- |
| Headless Chrome через Playwright, Lighthouse, LHCI | да | да | да |
| CDP: `.cpuprofile`, heap usage, трейс | да | да | да |
| chrome-devtools-mcp | не запускал | не запускал (README не перечисляет ОС) | не запускал (README не перечисляет ОС) |
| mitata, счётчики железа | нет | да (`perf_event_paranoid ≤ 2`) | да (Apple Silicon) |
| hyperfine: `memory_usage_byte` | нули | не проверял | не проверял |
| Firefox: стартовый профиль через переменные | не запускал | не запускал (документация без привязки к ОС) | не запускал (документация без привязки к ОС) |
| Safari: запись профиля | нет | нет | только интерактивно или из кода страницы |
| PresentMon | да, с правами | нет | нет |
| GPU-таймеры в headless | не проверял | не проверял | не проверял |

## Спорные места и пробелы

Не проверялось или не описано в источниках:

- bench-node: есть ли поддержка браузера (README не описывает). CodSpeed: как работает с браузерным кодом (ответа нет).
- Vitest browser: как реально работает `warmupIterations` (ошибок нет, прогрев не измерялся).
- Изменчивость LCP и TBT на реальных сайтах для текущего Lighthouse (официальных данных нет). `budgetsFile` в LHCI 0.16 при Lighthouse 13 (опция описана, запуск не проверялся). Поведение `lhci collect --additive` при повторном запуске. Адаптер для `flow.createFlowResult()` (форма не описана).
- Лимиты бесплатного уровня WebPageTest в 2026 году (в официальных источниках не найдены).
- Сравнимость лабораторного INP с полевым (количественных источников нет). Причина кратности 8 мс у Event Timing (наблюдение одного прогона).
- Рендерер GPU в headless Chrome на разных ОС и его влияние на цифры. `EXT_disjoint_timer_query_webgl2` (страница MDN вернула 404, детали не проверены).
- Точная JSON-схема sonda и пример `raw-data` visualizer.
- attest с `tsrs` на Windows. Полная совместимость `analyze-trace` с раскладкой TS 7. `memory_usage_byte` hyperfine на Linux и macOS.
- A/A для браузерных бенчмарков на современных раннерах (данные Quansight относятся к Python-набору). Связь «счёт инструкций → время» для кода с JIT.
- Профили Firefox из headless-автоматизации, chrome-devtools-mcp в headless на Windows и Linux, Safari и Playwright WebKit в headless (данных нет).
- Преимущество mitata над tinybench для коротких функций в браузере выведено из одного сравнения на одной функции.
- Адаптеры скрипта сравнения прогонялись на искусственных страницах и бандлах, не на реальном проекте.
