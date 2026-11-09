# TypeScript вне классического фронтенда и Node-серверов

Справочник по десяти областям, где TypeScript работает за пределами веб-фронтенда на React/Vue и серверов на Node.js: мобильные приложения, десктоп, браузерные игры и реальное время, визуализация и тяжёлый UI, расширения браузера, edge и serverless, AI и LLM-приложения, инструменты разработчика и компиляторы, embedded, взаимодействие с WebAssembly. Состояние знаний на ноябрь 2026: версии пакетов сняты через `npm view <пакет> version` 8 ноября 2026 (Deno дополнительно через `dl.deno.land/release-latest.txt`), каждая ссылка открывалась HTTP-запросом 9 ноября 2026. Страницы с пометкой `(403)` закрыты от ботов, их содержание взято из поисковой выдачи, поэтому рядом стоит `[не проверено]`. Метки: `[устарело]` с названием замены; `[не проверено]` для утверждений с единственным вторичным источником. Цифры вендоров подписаны как вендорские. Каждый раздел начинается с вывода, затем идут версии, архитектура, таблица «симптом → техника → источник», измерения и образцовые проекты. Всё, что осталось неизвестным, собрано в конце файла. Общие вопросы сборки и запуска TS — в [toolchain.md](toolchain.md), профилирование — в [performance.md](performance.md), измерения — в [benchmarking.md](benchmarking.md), клиентский веб — в [frontend.md](frontend.md).

- [Как выбрать](#как-выбрать)
- [Мобильные приложения](#мобильные-приложения)
- [Десктоп](#десктоп)
- [Браузерные игры и реальное время](#браузерные-игры-и-реальное-время)
- [Визуализация и тяжёлый UI](#визуализация-и-тяжёлый-ui)
- [Расширения браузера](#расширения-браузера)
- [Edge и serverless](#edge-и-serverless)
- [AI и LLM-приложения](#ai-и-llm-приложения)
- [Инструменты разработчика и компиляторы](#инструменты-разработчика-и-компиляторы)
- [Embedded и необычные цели](#embedded-и-необычные-цели)
- [Взаимодействие с WebAssembly](#взаимодействие-с-webassembly)
- [Спорные места и пробелы](#спорные-места-и-пробелы)

---

## Как выбрать

| Задача | Стартовый выбор | Главная оговорка |
|---|---|---|
| Мобильное приложение на React | React Native 0.88 + Expo SDK 58 | Только New Architecture; компиляция TS в нативный код в Hermes не готова |
| Веб-приложение в оболочке на iOS/Android | Capacitor 8 | Нужны Node 22+ и Xcode 26+ |
| Десктоп, важны размер и память | Tauri 2 | IPC сериализует аргументы в JSON |
| Десктоп, нужен Node и единый Chromium | Electron 45 | Резервы в ленивой загрузке и отказе от синхронного IPC |
| 2D-игра в браузере | Phaser 4 или PixiJS 8 | Бенчмарков между ними нет |
| 3D-игра или сцена | Three.js r187 с `WebGLRenderer` или Babylon 9 | WebGPURenderer в Three.js остаётся экспериментальным |
| Таблица или график на миллионы точек | Виртуализация, Canvas, deck.gl, бинарные колонки Arrow | Один буфер в Chrome ограничен 1 ГБ |
| Расширение браузера | WXT | Service worker умирает после 30 с простоя |
| Edge-функция | Cloudflare Workers + Wrangler 4 | Лимит 64 МиБ несжатого бандла и 1 с на глобальную область |
| Запуск TS без сборки | Deno 2.9 или Bun 1.4 | Ни тот, ни другой не проверяет типы при запуске |
| LLM-приложение | AI SDK 7 или SDK вендора; MCP через `@modelcontextprotocol/server` v2 | AI SDK 7 только ESM, Node 22+ |
| Инструмент поверх компилятора | `typescript` 7.0 для проверки, алиас на 6.0 для API | API у 7.0 нет, он появится в 7.1 |
| Микроконтроллер | Moddable XS или Espruino | TS компилируется в JS, на устройстве работает подмножество |
| Горячий числовой код | Wasm с редкими пересечениями границы | Дорого перемещение данных, а не сам вызов |

---

## Мобильные приложения

Вывод: React Native работает только на New Architecture с версии 0.82, Hermes V1 стал движком по умолчанию в 0.84, а компиляция TS в нативный код в Hermes названа «not ready for use». Планировать её в продакшене нельзя.

### Стек и версии

Версии на 2026-11-08.

| Пакет | Версия | Примечание |
|---|---|---|
| `react-native` | 0.88.1 | Релиз 0.88 от 2026-10-19 |
| `expo` | 58.0.23 | SDK 58 от 2026-10-15 работает на RN 0.88 |
| `@shopify/flash-list` | 2.3.3 | v2 только для New Architecture |
| `react-native-reanimated` | 4.7.1 | Reanimated 3 не поддерживается |
| `react-native-nitro-modules` | 0.37.2 | Нативные модули на JSI |
| `@capacitor/core` | 8.6.0 | Требует Node 22+, Xcode 26+ |
| `@ionic/core` | 9.0.10 | |
| `@nativescript/core` | 9.1.3 | V8 14.9, Vite 8 HMR |
| `@lynx-js/react` | 0.129.2 | |
| `@lynx-js/rspeedy` | 0.18.5 | |
| `reassure` | 1.6.1 | Замеры рендера в PR |

Что вышло в последних версиях RN, по [React Native Blog](https://reactnative.dev/blog): 0.88 принёс веб-путь диспетчеризации событий по умолчанию, variable fonts, `ArrayBuffer` для Java TurboModules и React 19.3.0; в 0.85 появился New Animation Backend; в 0.87 Strict TypeScript API стал дефолтом, минимумами стали Node 22, AGP 9 и Kotlin 2.0+.

### Текущие факты

| Утверждение | Источник |
|---|---|
| С 0.82 значения `newArchEnabled=false` и `RCT_NEW_ARCH_ENABLED=0` игнорируются, interop-слои остаются «на обозримое будущее» | [React Native 0.82 - A New Era](https://reactnative.dev/blog/2025/10/08/react-native-0.82) |
| Hermes V1 по умолчанию с 0.84; откат через `hermes-compiler` 0.15.0 и сборку из исходников; предкомпилированные `.xcframework` на iOS включены по умолчанию | [React Native 0.84 - Hermes V1 by Default](https://reactnative.dev/blog/2026/02/11/react-native-0.84) |
| Типизированная компиляция Hermes «under active development and not ready for use»; TypeScript конвертируется во Flow AST-проходом | [facebook/hermes](https://github.com/facebook/hermes) |
| JS-to-native компиляции и JIT из доклада RN EU 2023 в Hermes V1 нет | [React Native 0.82](https://reactnative.dev/blog/2025/10/08/react-native-0.82) |
| Expo SDK 58: `expo-modules-core` с предкомпилированными Android-библиотеками, чистая debug-сборка в тесте Expo упала примерно с 80 до 39 с; экспериментальный Rust-трансформер Noxcturnal бандлит холодные сборки примерно вдвое быстрее Babel | [Expo SDK 58](https://expo.dev/changelog/sdk-58) |
| Capacitor 8: Node 22+, Xcode 26+, iOS 15, Android minSdk 24 и target 36; новые iOS-проекты создаются на SPM | [Updating to Capacitor 8](https://capacitorjs.com/docs/updating/8-0) |
| NativeScript 9.1 отдаёт платформенные API напрямую в JS-рантайм со строгими типами | [NativeScript Docs](https://docs.nativescript.org/) |

`[устарело]` Любые гайды про Legacy Architecture и отключение New Architecture. Замена: New Architecture.

`[устарело]` Название «Static Hermes» как отдельного движка. Замена: Hermes V1. Ветка `static_h` стала основной линией, README формулирует это как «It is not a separate engine; it is Hermes» ([facebook/hermes](https://github.com/facebook/hermes)); кодовое имя упразднено и по словам Callstack ([From Static Hermes to Hermes V1](https://www.callstack.com/podcasts/from-static-hermes-to-hermes-v1-the-road-to-default)).

### Архитектура

- Рекомендуемый набор: FlashList v2 для списков, Reanimated 4 для анимаций, Nitro или Turbo Modules для нативных модулей, Reassure и Flashlight для измерений. Для тяжёлой графики документация Reanimated советует react-native-skia ([Reanimated Performance](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/)).
- Nitro построен на JSI напрямую, без кодогенерации TurboModule ([Nitro: Comparison](https://nitro.margelo.com/docs/comparison)).
- Lynx исполняет код приложения на двух потоках, поэтому при синхронно доступных данных первый экран рисуется на главном потоке без промежуточных состояний. Асинхронная загрузка бандла или основного контента ломает этот режим ([Lynx: Instant First-Frame Rendering](https://lynxjs.org/guide/interaction/ifr.html)).
- Типы модуля Nitro и TurboModule описываются в TS; общие приёмы типизации границ — в [types-patterns.md](types-patterns.md).

### Симптом → техника → источник

| Симптом | Техника | Источник |
|---|---|---|
| Низкий FPS при скролле с множеством анимированных компонентов | RN 0.80+, Reanimated 4.2+, флаг `USE_COMMIT_HOOK_ONLY_FOR_REACT_COMMITS` | [Reanimated Performance](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/) |
| Дрожит sticky header на `useAnimatedScrollHandler` | RN 0.81+, `preventShadowTreeCommitExhaustion`, `DISABLE_COMMIT_PAUSING_MECHANISM` | там же |
| Просадка при множестве одновременных анимаций | `ANDROID_` и `IOS_SYNCHRONOUSLY_UPDATE_UI_PROPS` для opacity и transform; ориентир не более 100 компонентов на слабом Android и 500 на iOS | там же |
| Подвисает JS-поток | Не читать shared values из JS-потока: чтение блокирует его до ответа UI-потока | там же |
| Пустые области при скролле | FlashList v2; у Shopify до 50% меньше blank area на New Architecture | [FlashList v2](https://shopify.engineering/flashlist-v2) |
| После миграции список падает или ругается на пропсы | Удалить `estimatedItemSize` и другие пропсы v1; v2 бросает ошибку на старой архитектуре. `[устарело]` `estimatedItemSize`, замена: авто-измерение v2 | [FlashList v2 Migration](https://shopify.github.io/flash-list/docs/v2-migration) |
| Горячий цикл вызовов натива | Nitro; вендорский тест 100k вызовов `addNumbers`: Expo 434.85 мс, Turbo 115.86 мс, Nitro 7.27 мс | [Nitro: Comparison](https://nitro.margelo.com/docs/comparison), код в [NitroBenchmarks](https://github.com/mrousavy/NitroBenchmarks) |
| Долгий TTI | Обновиться до Hermes V1; у New Expensify TTI −2.5% iOS и −7.6% Android, загрузка бандла −9% и −3.1% | [Welcoming the next generation of Hermes](https://swmansion.com/blog/welcoming-the-next-generation-of-hermes-67ab5679e184) |
| Анимации медленнее после перехода на Expo 53+ | Перейти на Reanimated 4. `[устарело]` Reanimated 3, замена: Reanimated 4 | [Reanimated Performance](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/) |
| WebView перезагружается при ресайзе в Capacitor | Добавить `density` в `configChanges` | [Updating to Capacitor 8](https://capacitorjs.com/docs/updating/8-0) |

### Измерения

| Инструмент | Что делает | Источник |
|---|---|---|
| Reassure | Время рендера через `measureRenders`, каждый сценарий по умолчанию 10 прогонов на ветку, результат постится в PR через Danger | [Reassure Installation](https://oss.callstack.com/reassure/docs/installation) |
| Flashlight | Единый performance score без изменения кода приложения, `flashlight test` и `flashlight cloud` для CI; только Android, iOS запланирован | [bamlab/flashlight](https://github.com/bamlab/flashlight) |
| JS FPS во Flashlight | Падение в 0 означает неотзывчивое приложение | [Flashlight: JS FPS](https://docs.flashlight.dev/guides/react-native/js-fps) |
| Сборка `debugOptimized` | Разрыв производительности в основном виден в debug-сборках; на Android с RN 0.82+ помогает этот вариант | [Reanimated Performance](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/) |

### Образцовые материалы

- [The Ultimate Guide to React Native Optimization, издание 2026](https://www.callstack.com/ebooks/the-ultimate-guide-to-react-native-optimization) (Callstack): JS, нативная производительность, стоимость бандла.
- Независимый бенчмарк [React Native Bridge vs TurboModules vs Nitro](https://javascript.plainenglish.io/react-native-bridge-vs-turbomodules-vs-nitro-a-real-benchmark-820bff620069) (403): Bridge около 0.80 мс, Turbo около 0.18 мс, Nitro около 0.11 мс `[не проверено]`.
- Разрыв между вендорскими 15× и независимыми около 1.6× у Nitro объясняется, вероятно, разной нагрузкой (пропускная способность против round-trip). Брать Nitro стоит при подтверждённом узком месте на границе.

---

## Десктоп

Вывод: Tauri выигрывает по размеру и памяти, но его IPC сериализует аргументы в JSON. В Electron основные резервы лежат в ленивой загрузке, отказе от синхронного IPC и обновлении до линии со встроенным кодовым кэшем.

### Стек и версии

Версии на 2026-11-08.

| Пакет | Версия | Примечание |
|---|---|---|
| `electron` | 45.2.3 | |
| `@tauri-apps/api`, `@tauri-apps/cli` | 2.12.4 | |
| `@neutralinojs/lib` | 6.10.0 | |
| `@neutralinojs/neu` | 11.8.0 | |
| `electrobun` | 2.0.6 | |
| Wails | v3.0.0 | Тег от 26 октября, Go 1.26+, iOS и Android экспериментальны |

`[устарело]` Статьи про Wails v3 как alpha. Замена: стабильный v3.0.0 ([Wails v3.0.0](https://github.com/wailsapp/wails/releases/tag/v3.0.0)).

### Архитектура и цена IPC

| Платформа | Модель | Источник |
|---|---|---|
| Tauri 2, команды | JSON-RPC-подобный протокол, аргументы и результаты должны сериализоваться в JSON | [Tauri: Inter-Process Communication](https://v2.tauri.app/concept/inter-process-communication/) |
| Tauri 2, события и каналы | События «not designed for low latency or high throughput»; каналы предназначены быть «fast and deliver ordered data» | [Tauri: Calling the Frontend from Rust](https://v2.tauri.app/develop/calling-frontend/) |
| Electron | Обычный IPC умеет `send` и один ответ на `invoke`; `MessagePort` даёт поток ответов и прямую связь окон в обход main-процесса | [Electron: MessagePorts](https://www.electronjs.org/docs/latest/tutorial/message-ports) |
| Wails v3 | Привязки генерируются статическим анализом Go-кода, структуры становятся классами или интерфейсами TS; вызовы из дочерних фреймов идут по HTTP на `/wails/runtime`, встроенный iframe получает доступ к привязанным методам | [Wails v3.0.0](https://github.com/wailsapp/wails/releases/tag/v3.0.0) |
| Neutralino | Расширения работают отдельными процессами и общаются JSON-сообщениями через WebSocket на localhost; лимиты размера и пропускной способности не документированы, процессы не завершаются автоматически | [Neutralinojs Extensions](https://neutralino.js.org/docs/how-to/extensions-overview/) |

Tauri использует системный WebView, поэтому результаты на WKWebView (macOS) нельзя переносить на WebView2 или WebKitGTK. Большие бинарные данные через `invoke` упираются в JSON; для потоков начинайте с Channels и измеряйте на реальном размере сообщений.

### Симптом → техника → источник

| Симптом | Техника | Источник |
|---|---|---|
| Зависает UI из-за main-процесса | Вынести CPU-работу в worker, скрытое окно или процесс; убрать синхронный IPC и `@electron/remote` | [Electron Performance](https://www.electronjs.org/docs/latest/tutorial/performance) |
| Медленный холодный старт от `require` | Проверять стоимость модулей, откладывать загрузку, бандлить в один файл | там же |
| Лишняя инициализация | `Menu.setApplicationMenu(null)` до ready, если меню не нужно | там же |
| Долгий старт sandboxed renderer | Electron 42.3.3+ или 43+: встроенный кэш снижает `DidClearWindowObject` с 9.8 до 6.4 мс (−35%) ценой около 3.5 МБ | [PR #51697](https://releases.electronjs.org/pr/51697) |
| Дорогой Node-бутстрап main-процесса | Стартовый снапшот Node на этапе сборки Electron | [PR #51703](https://releases.electronjs.org/pr/51703) `[не проверено]` по статусу выхода |
| Много мелких `require` при старте | V8-снапшот приложения; эксперимент на macOS: старт 426 → 272 мс, `require` 215 → 41 мс | [electron-snapshot-experiment](https://github.com/raisinten/electron-snapshot-experiment) `[не проверено]` |
| Поток данных через события Tauri тормозит | Перейти на Channels | [Tauri: Calling the Frontend](https://v2.tauri.app/develop/calling-frontend/) |
| Окна общаются через main и нагружают его | `MessageChannelMain` и прямые порты | [Electron: MessagePorts](https://www.electronjs.org/docs/latest/tutorial/message-ports) |

### Измерения

- Electron рекомендует `node --cpu-prof --heap-prof -e "require('<module>')"`, вкладки Performance и Memory в DevTools и Chrome Tracing для нескольких процессов ([Electron Performance](https://www.electronjs.org/docs/latest/tutorial/performance)). Общие приёмы профилирования — в [performance.md](performance.md).
- Бенчмарк Hopp (macOS, N=1, 6 окон): Tauri около 172 МБ и 8.6 МиБ, Electron около 409 МБ и 244 МиБ, разница старта незначительна; первая сборка Tauri 1:21 против 15.8 с ([Tauri vs Electron: performance, bundle size, and the real trade-offs](https://dev.to/gethopp/tauri-vs-electron-performance-bundle-size-and-the-real-trade-offs-1el4)). Один прогон на одной ОС, это ориентир порядка, а не результат.

### Образцовые материалы

- [How to make your Electron app launch 1,000ms faster](https://dev.to/craftzdog/how-to-make-your-electron-app-launch-1-000ms-faster-3e0l): разбор V8-снапшотов на реальном приложении Inkdrop.

---

## Браузерные игры и реальное время

Вывод: движки разделились по рендереру. Phaser 4 целиком на новом WebGL-конвейере, PixiJS 8 и Babylon 9 поддерживают WebGPU, а WebGPURenderer в Three.js официально остаётся экспериментальным, что бы ни писали блоги. Общие правила для всех жанров: фиксированный шаг симуляции, отсутствие аллокаций в кадре, детерминизм там, где нужны сетевой код или повторы.

### Стек и версии

Версии на 2026-11-08.

| Область | Пакеты |
|---|---|
| Движки | `phaser` 4.2.1, `pixi.js` 8.22.0, `three` 0.187.0, `@babylonjs/core` 9.35.0, `playcanvas` 2.23.3, `excalibur` 1.0.0 |
| ECS | `bitecs` 0.4.0, `koota` 0.6.6, `@lastolivegames/becsy` 0.16.1, `miniplex` 2.0.0 |
| Физика, сеть, жанровые библиотеки | `@dimforge/rapier3d` 0.21.0, `colyseus` 0.18.12, `@geckos.io/server` 3.1.0, `boardgame.io` 0.50.2, `rot-js` 2.2.1 |
| Ассеты | `@gltf-transform/core` 4.5.1 |

- `[устарело]` `miniplex`: последняя публикация 2023-07, замена: `koota` при интеграции с React.
- `[устарело]` `netplayjs` 0.4.1: последняя публикация 2023-04, замены той же зрелости не найдено; использовать как учебный пример.
- Excalibur 1.0.0 опубликован 2026-11-08: 2D-освещение, сериализация, плагин-API, кодмоды, ESM-only ([Excalibur Releases](https://github.com/excaliburjs/Excalibur/releases)). `[устарело]` Описания Excalibur как 0.x.

### Движки

| Движок | Ключевой факт | Источник |
|---|---|---|
| Phaser 4 | Конвейеры заменены render nodes. SpriteGPULayer рисует всё одним draw call, стоимость TilemapGPULayer привязана к пикселям экрана, атлас PCT на 90–95% меньше JSON. Бенчмарков FPS нет | [Phaser 3 vs Phaser 4](https://phaser.io/news/2026/05/phaser-3-vs-phaser-4), [Phaser 4 Rendering Concepts](https://phaser.io/tutorials/phaser-4-rendering-concepts) |
| PixiJS 8 | `autoDetectRenderer` выбирает WebGL или WebGPU ([PixiJS v8 beta](https://pixijs.com/blog/pixi-v8-beta)). Батчинг до 16 текстур; смена blend mode и чередование спрайтов с Graphics рвут батч; culling выключен по умолчанию и помогает только при упоре в GPU | [PixiJS Performance Tips](https://pixijs.com/8.x/guides/concepts/performance-tips) |
| Three.js r187 | WebGPURenderer «experimental», возможен откат на WebGL 2. `ShaderMaterial`, `onBeforeCompile` и `EffectComposer` не поддерживаются, нужен TSL. Для чистого WebGL 2 рекомендован `WebGLRenderer` | [WebGPURenderer manual](https://threejs.org/manual/pages/webgpurenderer.html) |
| Babylon 9 | Кластерное освещение на WebGPU и WebGL 2 | [Announcing Babylon.js 9.0](https://blogs.windows.com/windowsdeveloper/2026/03/26/announcing-babylon-js-9-0) |
| PlayCanvas 2 | 100–200 draw calls для слабых телефонов, динамический DPR, `autoRender=false` для статичных сцен, преаллокация векторов | [PlayCanvas Optimization Guidelines](https://developer.playcanvas.com/user-manual/optimization/guidelines/) |

Конфликт источников по Three.js: обзор [WebGPU/WebGL 2026](https://www.youngju.dev/blog/culture/2026-05-16-webgpu-webgl-2026-three-js-r3f-babylon-playcanvas-tres-needle-native-webgpu-wgsl-deep-dive.en) утверждает, что с r182 WebGPURenderer рекомендован, а WebGL стал fallback. Официальный manual этого не подтверждает, поэтому для продакшена верен manual. Практический перенос описан в [WebGPU + Three.js Migration Guide](https://www.utsubo.com/blog/webgpu-threejs-migration-guide).

### ECS, цикл, память, сеть, физика

| Тема | Факт | Источник |
|---|---|---|
| bitECS 0.4 | Не навязывает хранение, SoA и AoS, около 5 кБ | [bitECS](https://github.com/NateTheGreatt/bitECS) |
| Koota | SoA-трейты для скаляров и AoS для объектов, React-хуки; советы: `updateEach`, функции на уровне модуля, кэш через `createQuery` | [Koota](https://github.com/pmndrs/koota) |
| Becsy и Miniplex | Becsy заявляет многопоточность; Miniplex хранит сущности как обычные объекты | [becsy](https://github.com/LastOliveGames/becsy), [miniplex](https://github.com/hmans/miniplex) |
| Сравнение ECS (вендорское) | Fragmented Iteration: bitECS 8.72 мс против Koota 12.92 мс; Add/Remove: 25.25 против 47.09 мс | [EliCS Benchmarks](https://elixr-games.github.io/elics/benchmarks.html) |
| Фиксированный шаг | Аккумулятор, ограничение времени кадра (пример 0.25 с) против спирали смерти, интерполяция по alpha | [Fix Your Timestep!](https://gafferongames.com/post/fix_your_timestep/) |
| Фоновые вкладки | Браузер троттлит rAF, стратегию пропуска, догонки или ресинхронизации выбирают заранее | [Anatomy of a video game](https://developer.mozilla.org/en-US/docs/Games/Anatomy) |
| Пулы объектов | Пул на тип с высокой текучестью убирает пилу на графике памяти, ценой медленного старта и памяти, которая не сжимается; при возврате очищать ссылки | [Static memory JavaScript with Object Pools](https://web.dev/articles/speed-static-mem-pools), [Object Pool](https://gameprogrammingpatterns.com/object-pool.html) |
| Предел пулов | Переработалась примерно половина `b2Vec2` `[не проверено]` | [How to write low garbage real-time Javascript](https://www.construct.net/en/blogs/construct-official-blog-1/write-low-garbage-real-time-761) (403) |
| Пространственное разбиение | Сетка дешевле O(n²) для соседей, но перемещение объектов требует обновлять структуру | [Spatial Partition](https://gameprogrammingpatterns.com/spatial-partition.html) |
| Авторитарный сервер | Сервер не доверяет клиенту; лаг-компенсация проверяет выстрел по прошлому состоянию мира | [Client-Server Game Architecture](https://www.gabrielgambetta.com/client-server-game-architecture.html), [Lag Compensation](https://www.gabrielgambetta.com/lag-compensation.html) |
| Rollback в браузере | Логика на таймере отдельно от rAF, состояние сохраняется вместе с seed, буфер входа больше половины пинга; автор допускает рассинхрон из-за плавающей тригонометрии | [WebRTC Pong](https://mitxela.com/projects/webrtc-pong), введение [Netcode](https://words.infil.net/w02-netcode.html), библиотека [NetplayJS](https://github.com/rameshvarun/netplayjs) |
| Rapier и детерминизм | WASM «fully cross-platform deterministic» при одинаковой версии и порядке добавления объектов; `Math.sin` при инициализации не гарантирован; `world.takeSnapshot()` даёт байты для хэша | [Rapier Determinism](https://rapier.rs/docs/user_guides/javascript/determinism/) |
| Rapier, пакеты | Пакеты `-compat` встраивают WASM в base64 | [Rapier Getting Started](https://rapier.rs/docs/user_guides/javascript/getting_started_js) |
| Colyseus | Шлёт только изменённые поля с интервалом `patchRate`; лимит 63 поля на Schema; `NaN` кодируется как 0 | [Colyseus State](https://docs.colyseus.io/state) |
| WebTransport | Baseline с марта 2026: датаграммы для состояния, потоки для критичных событий, нужен HTTP/3-сервер | [MDN WebTransport](https://developer.mozilla.org/en-US/docs/Web/API/WebTransport_API) |
| geckos.io | UDP через WebRTC, нужно открыть диапазон UDP-портов | [geckos.io](https://github.com/geckosio/geckos.io) |

Детерминизм в JS достижим при запрете `Math.random`, `Date.now` и трансцендентных функций внутри симуляции. Это согласуется с Rapier и WebRTC Pong. Пул не универсален: при малом числе объектов или неполном переиспользовании выигрыш мал, решение принимают по профилю памяти. Для 2D-игр с большими объёмами важнее GPU-слои и батчинг, чем выбор ECS: вендорские разрывы ECS измеряются миллисекундами на синтетике.

### Жанровая матрица (симптом → техника → источник)

Строки намеренно одинакового размера: ни один жанр не разобран подробнее другого. Каждая ячейка опирается на источник из последней колонки.

| Жанр | Симптом | Техника | Источник |
|---|---|---|---|
| Экшен | Рывки GC от большого числа снарядов | Пулы объектов, отрисовка большими слоями | [Object Pools](https://web.dev/articles/speed-static-mem-pools), [Phaser SpriteGPULayer](https://phaser.io/news/2026/05/phaser-3-vs-phaser-4) |
| Шутеры | Промахи при точном прицеливании | Предсказание, интерполяция, лаг-компенсация, датаграммы | [Gambetta](https://www.gabrielgambetta.com/lag-compensation.html), [WebTransport](https://developer.mozilla.org/en-US/docs/Web/API/WebTransport_API) |
| RPG | Огромные карты, медленные тайлы | TilemapGPULayer, горячие алгоритмы в компонентах (опыт CrossCode) | [Phaser 4](https://phaser.io/news/2026/05/phaser-3-vs-phaser-4), [Optimizing an HTML5 game engine](https://www.indiedb.com/news/optimizing-an-html5-game-engine-using-composition-over-inheritance) (403) `[не проверено]` |
| Стратегии | Тысячи юнитов, дорогой A* | Flow field на всех юнитов, сетка для поиска соседей | [Red Blob Games](https://www.redblobgames.com/pathfinding/tower-defense/), [flow-field](https://github.com/vonwolfehaus/flow-field) |
| Платформеры | Неровная прыгучесть, застревания | Фиксированный шаг, целочисленные позиции, модель Actors и Solids | [Fix Your Timestep!](https://gafferongames.com/post/fix_your_timestep/), [Celeste & TowerFall Physics](https://maddymakesgames.com/articles/celeste_and_towerfall_physics) |
| Головоломки | Батарея уходит на пустые кадры, нужен undo | Цикл по событиям, рендер по требованию, паттерн Command | [MDN Anatomy](https://developer.mozilla.org/en-US/docs/Games/Anatomy), [PlayCanvas `autoRender`](https://developer.playcanvas.com/user-manual/optimization/guidelines/), [Command](https://gameprogrammingpatterns.com/command.html) |
| Гонки | Подгрузка мира, стоимость физики | LOD вдоль дороги, переиспользование тайлов, рейкаст-подвеска вместо полной физики | [Slow Roads](https://web.dev/case-studies/slow-roads), [DynamicRayCastVehicleController](https://rapier.rs/javascript3d/classes/DynamicRayCastVehicleController.html) |
| Карточные и настольные | Утечка скрытой информации клиенту | Чистые функции ходов, фильтрация состояния на сервере | [boardgame.io](https://github.com/boardgameio/boardgame.io), [Colyseus State](https://docs.colyseus.io/state) |
| Рогалики | Повторяемость и стоимость FOV | Готовые FOV, карты, RNG, планировщик и поиск пути из rot.js; запись команд вместо состояния | [rot.js Manual](https://ondras.github.io/rot.js/manual/), [Command](https://gameprogrammingpatterns.com/command.html) |
| Онлайн, .io | Трафик и нагрузка на сервер | Дельта-синхронизация только изменённых полей | [Colyseus State](https://docs.colyseus.io/state) |
| Мобильный казуал | Лимит веса и перегрев | ZIP до 5 МБ и 512 файлов у Google, HTML менее 5 МБ у Unity, снижение DPR | [Google Ads HTML5](https://support.google.com/google-ads/answer/9981650), [Unity Playable Specs](https://docs.unity.com/en-us/user-acquisition/creatives/specifications/playable.md), [PlayCanvas](https://developer.playcanvas.com/user-manual/optimization/guidelines/) |

Проверка по оригиналу. Неофициальные зеркала документации OpenFrontIO описывали симуляцию в web worker, сервер как ретранслятор намерений игроков и случайность от seed, но эти страницы теперь отвечают 404 или 410. Поэтому ячейки про детерминированные intent-команды (строка «Стратегии») и про ретрансляцию команд сервером (строка «Онлайн, .io») оставлены без этих утверждений: ни у одной из них нет другого источника. Если нужна эта часть, её сверяют с кодом в `/packages/engine` репозитория [OpenFrontIO](https://github.com/openfrontio/OpenFrontIO) (AGPL-3.0), где лежит детерминированная симуляция. Бинарный формат `zbin` тоже упомянут только в связи с этим репозиторием и не проверен.

### Конвейер ассетов

- glTF Transform делает Draco, Meshopt, WebP и KTX2 (UASTC, ETC1S) ([glTF Transform](https://gltf-transform.dev/)).
- Модуль Basis добавляет 253 КБ gzip к предзагрузке и ограничен текстурами 4096×4096 ([PlayCanvas Texture Compression](https://developer.playcanvas.com/user-manual/optimization/texture-compression/)).
- В Slow Roads WebP вдвое сократил бандл, генерация окружения в среднем занимает 3.2 с, больше 55 FPS получают только 52% игроков ([Slow Roads](https://web.dev/case-studies/slow-roads)).

### Измерения

| Инструмент | Что даёт | Источник |
|---|---|---|
| Babylon `EngineInstrumentation`, `SceneInstrumentation` | Счётчики кадра и сцены | [Babylon Optimize Your Scene](https://doc.babylonjs.com/features/featuresDeepDive/scene/optimize_your_scene/) |
| WebGPU snapshot rendering | Экономит только JS-сторону, проверять по Frame total | [WebGPU Snapshot Rendering](https://doc.babylonjs.com/setup/support/webGPU/webGPUOptimization/webGPUSnapshotRendering) |
| Thin instances | Дешевле обычных, но видимы все разом | [Thin Instances](https://doc.babylonjs.com/features/featuresDeepDive/mesh/copies/thinInstances) |
| Полевая телеметрия | Slow Roads собирает FPS и разрешение от реальных игроков | [Slow Roads](https://web.dev/case-studies/slow-roads) |
| WebGPU против WebGL | Chrome заявляет снижение нагрузки JS и более чем трёхкратный рост ML-инференса | [WebGPU overview](https://developer.chrome.com/docs/web-platform/webgpu/overview) |

### Образцовые проекты

- [OpenFrontIO](https://github.com/openfrontio/OpenFrontIO): детерминированная симуляция в `/packages/engine`, см. оговорку выше.
- [Slow Roads](https://web.dev/case-studies/slow-roads): гонки, процедурная генерация и полевая телеметрия.
- Независимых бенчмарков Phaser 4, PixiJS 8 и WebGPURenderer между собой нет; выбор движка проверяют на собственной сцене (методика — [benchmarking.md](benchmarking.md)).

---

## Визуализация и тяжёлый UI

Вывод: выбор определяется объёмом и временем жизни данных. DOM с виртуализацией для таблиц, Canvas для графиков, WebGL/WebGPU для миллионов точек. Самый дешёвый путь в браузере идёт через бинарные колонки (Arrow, TypedArray) в обход JS-объектов.

### Стек и версии

Версии на 2026-11-08.

| Пакет | Версия | Примечание |
|---|---|---|
| `d3` | 7.9.2 | Примитивы шкал и раскладок, рендер выбирается отдельно ([D3](https://d3js.org/)) |
| `echarts` | 6.1.0 | |
| `deck.gl` | 9.4.1 | |
| `apache-arrow` | 21.2.0 | |
| `@tanstack/virtual-core` | 3.19.11 | |
| `@tanstack/react-virtual` | 3.14.26 | |
| `@tanstack/react-table` | 9.3.1 | |
| `ag-grid-community` | 36.3.0 | |
| `uplot` | 1.6.32 | |
| `@glideapps/glide-data-grid` | 6.0.3 | |
| `@finos/perspective` | 3.8.0 | |
| `@duckdb/duckdb-wasm` | тег `latest` указывает на 1.33.1-dev57.0 | Документация DuckDB указывает стабильную 2.0.0 ([DuckDB Wasm Overview](https://duckdb.org/docs/2.0/clients/wasm/overview.html)); версию закрепляют явно |

### Архитектура

| Компонент | Факт | Источник |
|---|---|---|
| DuckDB-Wasm | Предел 4 ГБ памяти, браузеры могут требовать меньше, многопоточность экспериментальна; встроенный httpfs может скачать файл целиком, JS-httpfs читает только нужные диапазоны | [DuckDB Wasm Overview](https://duckdb.org/docs/2.0/clients/wasm/overview.html) |
| DuckDB-Wasm, данные | Результаты сериализуются как Arrow IPC и читаются прямо из кучи Wasm, запросы идут в web worker | [DuckDB-Wasm, VLDB 2022](https://www.vldb.org/pvldb/vol15/p3574-kohn.pdf), [DuckDB-Wasm launch](https://duckdb.org/2021/10/29/duckdb-wasm) |
| Perspective | Движок C++ в Wasm, сборка `memory64` для данных больше 4 ГБ, пейджинг через OPFS, одинаковый клиентский API в потоке, worker и по WebSocket | [finos/perspective](https://github.com/finos/perspective) |
| Glide Data Grid | Ячейки рисуются на canvas лениво: DOM-виртуализация упёрлась в сотни элементов на кадр | [glide-data-grid](https://github.com/glideapps/glide-data-grid) |
| TanStack Virtual | Без разметки и стилей; React, Vue, Svelte, Solid, Lit, Angular | [TanStack Virtual](https://tanstack.com/virtual/latest/docs/introduction) |

При пределе 4 ГБ в DuckDB-Wasm данные сверх нескольких гигабайт разумнее держать на сервере или рассмотреть memory64-сборку Perspective. Цепочка Arrow → GPU не материализует JS-объекты, это снимает основную нагрузку на GC в таких дашбордах.

### Симптом → техника → источник

| Симптом | Техника | Источник |
|---|---|---|
| deck.gl пересчитывает все буферы при каждом рендере | Мемоизировать `data`, использовать `updateTriggers` | [deck.gl Performance](https://deck.gl/docs/developer-guide/performance) |
| Краш на 10–100 млн элементов | Делить на несколько слоёв: Chrome ограничивает одну аллокацию 1 ГБ | там же |
| Догрузка чанков пересобирает всё | Слой на чанк со стабильным `id` или async iterable | там же |
| Аллокации в аксессорах | Константы, запись в `target`, TypedArray и атрибуты из worker | там же |
| Высокий fill rate | `useDevicePixels=false`, `pickable=false`, если не нужно | там же |
| Много точек в ECharts | Canvas начиная примерно с 1k элементов, TypedArray, инкрементальный рендер | [Canvas vs SVG](https://echarts.apache.org/handbook/en/best-practices/canvas-vs-svg/), [ECharts Features](https://echarts.apache.org/en/feature.html) |
| Память на слабых Android при множестве графиков | SVG-рендерер | [Canvas vs SVG](https://echarts.apache.org/handbook/en/best-practices/canvas-vs-svg/) |
| Таймсерии реального времени | uPlot: 166 650 точек за 25 мс, 3600 точек при 60 FPS и 10% CPU. `[устарело]` Таблица сравнения снята в 2023 на ECharts 5, актуальна ECharts 6.1 | [uPlot](https://github.com/leeoniya/uPlot) |
| Медленная таблица в AG Grid | Виртуализация, `rowBuffer`, лимит 500 строк | [AG Grid DOM Virtualisation](https://www.ag-grid.com/javascript-data-grid/dom-virtualisation/) |
| Длинная страница с закадровым контентом | `content-visibility: auto`, в примере рендер 232 → 30 мс | [content-visibility](https://web.dev/articles/content-visibility) |

### Измерения

- deck.gl: ориентир 60 FPS до около 1 млн элементов, 10–20 FPS около 10 млн, на MacBook 2015 ([deck.gl Performance](https://deck.gl/docs/developer-guide/performance)).
- lonboard: 3 млн точек отрисованы за 2.5 с, ipyleaflet и pydeck упали ([Lonboard](https://developmentseed.org/blog/2023-10-23-lonboard/)).
- Общая методика замера рендера и памяти — в [performance.md](performance.md).

### Образцовые материалы

- [GeoArrow deck.gl layers](https://github.com/geoarrow/deck.gl-layers): бинарные буферы Arrow копируются в GPU напрямую.
- [My browser WASM't prepared for this](https://motifanalytics.medium.com/my-browser-wasmt-prepared-for-this-using-duckdb-apache-arrow-and-web-workers-in-real-life-e3dd4695623d) (403): практика DuckDB, Arrow и Web Workers `[не проверено]`.
- Для cross-origin worker нужен Blob URL ([DuckDB WASM + Next.js tutorial](https://noqta.tn/tutorials/duckdb-wasm-browser-analytics-nextjs-2026)) `[не проверено]`.

---

## Расширения браузера

Вывод: для новых проектов разумный выбор WXT. Главные архитектурные ограничения задают жизненный цикл service worker и JSON-сериализация сообщений в Chrome.

### Стек и версии

Версии на 2026-11-08.

| Пакет | Версия | Примечание |
|---|---|---|
| `wxt` | 0.21.5 | |
| `plasmo` | 0.90.5 | Публикация 2025-05-17 |
| `@webext-core/messaging` | 4.0.1 | Типизированный протокол сообщений |
| `webextension-polyfill` | 0.12.0 | Публикация 2024-05-14 |

- WXT отмечает Plasmo как находящийся, по-видимому, в режиме поддержки ([WXT Comparison](https://wxt.dev/guide/resources/compare)). README Plasmo называет проект «currently alpha software», открыто 346 issues ([PlasmoHQ/plasmo](https://github.com/PlasmoHQ/plasmo)). Сравнение написано авторами WXT, поэтому важнее дата последней публикации из npm.
- `[не проверено]` В поисковой выдаче встретилась статья о «WXT 2.0» и «Plasmo 4.0». Таких версий в npm нет, страница вернула 404.
- `[устарело]` Обязательный [webextension-polyfill](https://github.com/mozilla/webextension-polyfill). Замена: нативный namespace `browser`, доступный с Chrome 148; полифил нужен для более старых версий ([Chrome incompatibilities](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Chrome_incompatibilities)).

### Архитектура

| Тема | Факт | Источник |
|---|---|---|
| Service worker | Останавливается после 30 с простоя, одно событие ограничено 5 минутами, ответ `fetch` 30 секундами; с Chrome 116 активный WebSocket продлевает жизнь; с Chrome 120 минимальный период alarms 30 с | [Service Worker Lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle) |
| Сообщения | Chrome сериализует в JSON до 64 МиБ, Firefox использует structured clone; для async-ответа нужен `return true`; возврат Promise доступен с Chrome 148 с постепенной раскаткой | [Message Passing](https://developer.chrome.com/docs/extensions/develop/concepts/messaging), [Chrome incompatibilities](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Chrome_incompatibilities) |
| Offscreen-документ | Один на расширение, доступен только `runtime`, ограничение времени только у `AUDIO_PLAYBACK` | [chrome.offscreen](https://developer.chrome.com/docs/extensions/reference/api/offscreen) |
| Типизация сообщений | `ProtocolMap` передаётся в `defineExtensionMessaging<ProtocolMap>()`, имя, payload и ответ проверяются | [@webext-core/messaging](https://webext-core.aklinker1.io/messaging/installation) |
| WXT и сообщения | Встроенной обёртки нет; рекомендованы `@webext-core/messaging`, `@webext-core/proxy-service`, Comctx, trpc-chrome | [WXT Messaging](https://wxt.dev/guide/essentials/messaging) |

Состояние service worker нельзя считать постоянным: его хранят в `storage` и восстанавливают при старте. Типизированный протокол не защитит от потерь при JSON-сериализации, поэтому в схему сообщений включают только JSON-совместимые типы (приёмы типизации — [types-patterns.md](types-patterns.md)).

### Симптом → техника → источник

| Симптом | Техника | Источник |
|---|---|---|
| Таймер не срабатывает после простоя | `chrome.alarms` с периодом от 30 с | [SW Lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle) |
| Worker умирает на медленном ответе | Учитывать лимит `fetch` 30 с, разбивать работу короче 5 минут | там же |
| Нужен DOM в фоне | Offscreen-документ с указанием `reasons` | [chrome.offscreen](https://developer.chrome.com/docs/extensions/reference/api/offscreen) |
| `undefined` превращается в `null`, теряются типы | Прогонять данные через `JSON.parse(JSON.stringify(x))`, чтобы браузеры вели себя одинаково | [Chrome incompatibilities](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Chrome_incompatibilities) |
| Ответ слушателя не доходит | `return true` до повсеместного Chrome 148 | [Message Passing](https://developer.chrome.com/docs/extensions/develop/concepts/messaging) |
| Ошибка в слушателе теряется | С Chrome 146 ошибка отклоняет `sendMessage`, раскатка постепенная | там же |

### Измерения

- Размер сборки: WXT 832 КБ, Plasmo 1365 КБ ([addfox/benchmark](https://github.com/addfox/benchmark)).
- Опыт перехода: [Migrating from Plasmo to WXT](https://dev.to/gorvgoyl/the-journey-of-migrating-our-browser-extension-from-plasmo-to-wxt-framework-2c83). Обзор альтернатив: [Plasmo vs WXT vs CRXJS vs Extension.js](https://merginit.com/blog/23082026-plasmo-vs-wxt-vs-crxjs-extension-js).
- Официальной методики замера памяти и времени пробуждения service worker в источниках нет.

---

## Edge и serverless

Вывод: `deno run` и Bun запускают TS без проверки типов, поэтому отдельный шаг проверки в CI обязателен. На Workers важнее лимит времени старта и модель изолятов, чем размер бандла.

### Стек и версии

Версии на 2026-11-08.

| Пакет | Версия | Примечание |
|---|---|---|
| `wrangler` | 4.158.0 | |
| `@cloudflare/workers-types` | 5.20261108.1 | |
| `bun` | 1.4.4 | Anthropic приобрела Bun, объявлено 2025-12-02, проект остаётся под MIT ([Bun joins Anthropic](https://bun.com/blog/bun-joins-anthropic)) |
| Deno | 2.9.8 по `dl.deno.land` | npm-пакет `deno` 2.9.6 отстаёт |

### Лимиты Workers

По [Workers Limits](https://developers.cloudflare.com/workers/platform/limits/):

| Параметр | Значение |
|---|---|
| Размер бандла | 64 МиБ несжатого на обоих тарифах; лимита на сжатый размер нет |
| Память | 128 МБ на изолят |
| CPU | 10 мс на Free; до 5 минут на Paid (по умолчанию 30 с) |
| Глобальная область | Должна выполниться за 1 с |
| Подзапросы | 50 или 10 000 в зависимости от тарифа |

`[устарело]` Советы об ограничении сжатого размера бандла. Замена: лимит несжатого бандла 64 МиБ. Отсутствие лимита сжатого размера не отменяет лимит старта в 1 с: большой бандл по-прежнему нужно разобрать и исполнить.

### Что отличается от Node

| Тема | Факт | Источник |
|---|---|---|
| Модель изолята | Изолят не живёт долго и может быть вытеснен; один инстанс обслуживает параллельные запросы, поэтому глобальное состояние мутировать нельзя | [How Workers works](https://developers.cloudflare.com/workers/reference/how-workers-works/) |
| Совместимость с Node | С даты совместимости 2026-08-04 включена по умолчанию; `node:http2`, `node:vm`, `node:cluster`, `node:sqlite` и ряд других нерабочие заглушки, полифилы unenv бросают «not implemented» | [Node.js compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs/) |
| Deno | `deno run` не проверяет типы; `deno test` и `deno bench` проверяют; enums и параметр-свойства работают без флагов; `tsgo` за нестабильным флагом | [Deno TypeScript](https://docs.deno.com/runtime/fundamentals/typescript/) |
| Bun | Рантайм и сборщик удаляют типы и никогда их не проверяют | [Bun Compiler Troubleshooting](https://bun.com/docs/compiler/troubleshooting) |
| Bun, tsconfig | Рекомендованы `module: Preserve`, `moduleResolution: bundler`, `verbatimModuleSyntax` | [Bun TypeScript](https://bun.com/docs/runtime/typescript) |

Конфликт источников: обзор [Deno 2 vs Bun 1.3 (KO)](https://jangwook.net/ko/blog/ko/deno-2-vs-bun-nodejs-runtime-2026-comparison/) пишет, что Deno проверяет типы при запуске; официальная документация Deno это опровергает для `deno run`. Модель прав и совместимость рантаймов сведены в [PkgPulse](https://www.pkgpulse.com/guides/nodejs-runtime-comparison) `[не проверено]`. Конфигурацию проверки типов и запуск TS в Node см. в [toolchain.md](toolchain.md).

### Симптом → техника → источник

| Симптом | Техника | Источник |
|---|---|---|
| Деплой падает на старте скрипта | Убрать тяжёлую работу из глобальной области, лимит 1 с | [Workers Limits](https://developers.cloudflare.com/workers/platform/limits/) |
| Холодные старты на малотрафиковых Worker | Шардирование платформы уже снизило долю с 0.1% до 0.01% | [Eliminating cold starts 2](https://blog.cloudflare.com/eliminating-cold-starts-2-shard-and-conquer/) |
| «[unenv] is not implemented» в рантайме | Проверить модуль по таблице совместимости | [Node.js compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs/) |
| Ошибки типов доходят до продакшена | `deno check` или `bunx tsc --noEmit` в CI | [Deno TypeScript](https://docs.deno.com/runtime/fundamentals/typescript/), [Bun Troubleshooting](https://bun.com/docs/compiler/troubleshooting) |
| Состояние «протекает» между запросами | Не использовать глобальные переменные | [How Workers works](https://developers.cloudflare.com/workers/reference/how-workers-works/) |

### Измерения

- Изолят стартует примерно в 100 раз быстрее Node-процесса и потребляет на порядок меньше памяти, абсолютных чисел Cloudflare не даёт ([How Workers works](https://developers.cloudflare.com/workers/reference/how-workers-works/)).
- Цифры холодного старта Deno и Bun расходятся. Один автор замерил Bun 0.243 с и Deno 0.067 с ([Deno 2 vs Bun 1.3](https://dev.to/jangwook_kim_e31e7291ad98/deno-2-vs-bun-13-nodejs-runtime-alternatives-compared-in-2026-typescript-speed-and-security-46da)). Другой обзор приводит Bun 8–15 мс против Deno 40–60 мс ([PkgPulse](https://www.pkgpulse.com/guides/bun-2-vs-nodejs-24-vs-deno-3-2026)) `[не проверено]`. Расхождение, вероятно, вызвано разными программами и окружениями, поэтому решение должно опираться на собственный замер ([benchmarking.md](benchmarking.md)).

---

## AI и LLM-приложения

Вывод: экосистема движется к Standard Schema (MCP SDK v2, бета-хелперы Anthropic) и потоковым структурированным данным. Частичные объекты при стриминге нельзя валидировать до завершения, и это нужно отразить в типах интерфейса.

### Стек и версии

Версии на 2026-11-08.

| Пакет | Версия | Примечание |
|---|---|---|
| `ai` | 7.0.165 | Только ESM, Node 22+ |
| `@ai-sdk/openai` | 4.0.111 | |
| `@ai-sdk/mcp` | 2.0.93 | |
| `@anthropic-ai/sdk` | 1.6.0 | |
| `openai` | 7.53.0 | |
| `@modelcontextprotocol/server`, `@modelcontextprotocol/client` | 2.4.0 | MCP TS SDK v2 |
| `@modelcontextprotocol/sdk` | 1.32.2 | Линия v1 |
| `langchain` | 1.6.3 | |
| `@langchain/core` | 1.3.5 | |
| `@langchain/langgraph` | 1.7.2 | |
| `@mastra/core` | 1.82.0 | |
| `@huggingface/transformers` | 4.3.2 | |
| `@mlc-ai/web-llm` | 0.2.87 | |
| `zod` | 4.6.7 | |

### Архитектура и API

| Тема | Факт | Источник |
|---|---|---|
| AI SDK 7 | Только ESM, Node 22+; опция `system` переименована в `instructions`; системные сообщения внутри `messages` по умолчанию отклоняются; OpenTelemetry вынесен в `@ai-sdk/otel` | [Migration Guide 7.0](https://ai-sdk.dev/docs/migration-guides/migration-guide-7-0) |
| AI SDK, обзор | Общая картина и `HarnessAgent`; анонс | [AI SDK Introduction](https://ai-sdk.dev/docs/introduction), [Vercel Weekly](https://community.vercel.com/t/vercel-weekly-2026-06-29/44602) |
| Структурные данные | `generateText` с `Output.object()`; `streamText` даёт `partialOutputStream` и `elementStream` | [Generating Structured Data](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data) |
| `generateObject` | Устаревание утверждают только вторичные источники, официальный гайд по миграции статус не меняет `[не проверено]` | там же |
| MCP TS SDK v2 | Разделён на `@modelcontextprotocol/server` и `@modelcontextprotocol/client`, использует Standard Schema (Zod v4, Valibot, ArkType); ветка `v1.x` получает исправления не менее шести месяцев | [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) |
| Anthropic SDK | Node 20+, Deno, Bun, Workers, Edge; React Native не поддерживается; браузер только с `dangerouslyAllowBrowser` | [anthropic-sdk-typescript](https://github.com/anthropics/anthropic-sdk-typescript) |
| Anthropic SDK, хелперы | `messages.stream()` собирает сообщение; `toolRunner()` (beta) автоматизирует цикл инструментов; `messages.parse()` с `zodOutputFormat` даёт `parsed_output` | [helpers.md](https://raw.githubusercontent.com/anthropics/anthropic-sdk-typescript/main/helpers.md) |
| LangChain | `createAgent` с middleware поверх LangGraph | [LangChain Overview](https://docs.langchain.com/oss/javascript/langchain/overview) |
| Mastra | Агенты и `createTool()`; базовый агент основан на AI SDK | [Mastra Docs](https://mastra.ai/docs), [Using AI SDK with Mastra](https://mastra.ai/blog/using-ai-sdk-with-mastra) |
| OpenAI SDK | Страницы-хелперы по проверенным адресам не открылись; структура SDK подтверждена только ссылкой на репозиторий | [openai-node](https://github.com/openai/openai-node) |

`[устарело]` `@modelcontextprotocol/sdk` v1 для новых проектов. Замена: пакеты `@modelcontextprotocol/server` и `@modelcontextprotocol/client` v2.

Standard Schema снижает привязку к Zod, но каждый SDK поддерживает разное подмножество возможностей, поэтому схему проверяют на конкретном провайдере.

### На устройстве

| Тема | Факт | Источник |
|---|---|---|
| Transformers.js v4 | WebGPU-рантайм переписан на C++ с командой ONNX Runtime, около 200 архитектур; вендорские цифры: около 4× на BERT-эмбеддингах, около 60 токенов/с у GPT-OSS 20B на M4 Pro Max, `transformers.web.js` на 53% меньше | [Transformers.js v4](https://huggingface.co/blog/transformersjs-v4) |
| Transformers.js 4.3 | Структурированный вывод и Safari 26+ | [v4.3.0](https://newreleases.io/project/github/huggingface/transformers.js/release/4.3.0), все релизы — [GitHub](https://github.com/huggingface/transformers.js/releases) |
| WebLLM | Совместим с OpenAI API, streaming и JSON-режим, работает в Web Worker и Service Worker | [web-llm](https://github.com/mlc-ai/web-llm) |

Для браузерного инференса важнее измерять токены в секунду и размер модели на целевом железе, чем ориентироваться на цифры с M4.

### Симптом → техника → источник

| Симптом | Техника | Источник |
|---|---|---|
| UI получает невалидные частичные объекты | Частичные значения в отдельном типе, `elementStream` для готовых элементов массива | [Structured Data](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data) |
| Квадратичный перепарсинг потока | Инкрементальный парсинг с кэшем завершённых утверждений: 2.6–3.3× | [OpenUI: Rust WASM parser](https://www.openui.com/blog/rust-wasm-parser) |
| Лишняя память при стриме | `messages.create({stream:true})` вместо сборки сообщения | [helpers.md](https://raw.githubusercontent.com/anthropics/anthropic-sdk-typescript/main/helpers.md) |
| Модель загружается при каждом визите | WebLLM в Service Worker с обработкой его вытеснения | [web-llm](https://github.com/mlc-ai/web-llm) |
| Инференс блокирует UI | Выделенный Web Worker | там же |

### Измерения

- Телеметрия AI SDK подключается через `registerTelemetry(new OpenTelemetry())` ([Migration Guide 7.0](https://ai-sdk.dev/docs/migration-guides/migration-guide-7-0)).
- Независимых бенчмарков накладных расходов LangChain и Mastra нет.

---

## Инструменты разработчика и компиляторы

Вывод: TypeScript 7 на Go даёт ускорение проверки в 8–12 раз, но не имеет API. Новый API появляется только в 7.1, поэтому инструменты, зависящие от `typescript`, пока остаются на алиасе к 6.0.

### Стек и версии

Версии на 2026-11-08.

| Пакет | Версия | Примечание |
|---|---|---|
| `typescript` | 7.0.2 | `beta` 7.1.0-beta, `next` 7.1.0-dev.20261108.1 |
| `ts-morph` | 28.0.0 (2026-04-12) | Обёртка классического Compiler API |
| `typescript-eslint` | 8.72.1 | |
| `oxc-parser` | 0.157.0 | |
| `@swc/core` | 1.16.22 | |
| `@babel/parser` | 8.1.0 | |
| `@vscode/vsce` | 4.1.0 | |
| `oclif` | 6.0.15 | |
| `commander` | 15.1.0 | |
| `ink` | 8.0.0 | |
| `citty` | 0.2.2 | |
| `@clack/prompts` | 1.8.1 | |

`[устарело]` `@typescript/native-preview` и команда `tsgo`. Замена: `typescript` 7.x и `tsc`. `[устарело]` Репозиторий `microsoft/typescript-go` закрыт, разработка перешла в `microsoft/TypeScript` ([typescript-go](https://github.com/microsoft/typescript-go)).

### Архитектура

| Тема | Факт | Источник |
|---|---|---|
| TS 7.0 без API | «While TypeScript 7.0 is here, it does not ship with an API.» Пакет `@typescript/typescript6` даёт `tsc6` и реэкспортирует API 6.0; Volar, Vue, MDX, Astro, Svelte и, вероятно, Angular остаются на 6.0 | [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) |
| API в 7.1 Beta | Шесть точек входа: sync- и async-клиенты, файловые хелперы, типы AST, type guards и фабрики; `API` и `Program` disposable, снапшоты обновляются инкрементально; content mappers для Vue, Svelte, Astro требуют `--runExternalCode` | [Announcing TypeScript 7.1 Beta](https://devblogs.microsoft.com/typescript/announcing-typescript-7-1-beta/) |
| Мотивация переноса на Go | Исходное обоснование | [A 10x Faster TypeScript](https://devblogs.microsoft.com/typescript/typescript-native-port/) |
| ts-morph | Обёртка классического Compiler API; справочник API | [ts-morph](https://github.com/dsherret/ts-morph), [Using the Compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API) |
| Блокировка на 7.0 | ts-morph, typescript-eslint и ts-jest не работают на 7.0 `[не проверено]` | [ecorpit](https://ecorpit.com/typescript-7-migration-readiness-eslint-astro-blockers-2026/); способ с алиасом также в [Developers Digest](https://www.developersdigest.tech/blog/typescript-7-native-compiler-migration-guide) |
| Библиотеки | Только указатель | [publint](https://publint.dev/) (`publint` 0.3.25, `tsdown` 0.23.7) |

До стабилизации 7.1 инструменты AST разумно держать на API 6.0 или на Oxc, если нужен синтаксис без семантики типов. Переход на async-клиент 7.1 потребует переписать синхронные обходы, поэтому абстракцию над компилятором лучше ввести заранее (структурирование — [architecture.md](architecture.md)).

### Симптом → техника → источник

| Симптом | Техника | Источник |
|---|---|---|
| Медленная проверка типов | `tsc` 7: проект vscode 125.7 → 10.6 с (11.9×), с `--checkers 8` 16.7× | [TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) |
| Не хватает памяти в CI | Меньше `--checkers`, `--singleThreaded`; следить за умножением с `--builders` | там же |
| Разные результаты при смене `--checkers` | Зафиксировать значение, порядок может влиять | там же |
| Инструмент падает на импорте `typescript` | npm-алиас на `@typescript/typescript6` | там же |
| Медленный разбор AST | Oxc: минимум 3× быстрее swc (данные проекта) | [Oxc Benchmarks](https://oxc.rs/docs/guide/benchmarks) |
| Долгая транспиляция Babel | Oxc: 40× быстрее и на 70% меньше памяти (данные проекта) | там же |
| Долгий линт ESLint | Oxlint: 50–100× (данные проекта); для [typescript-eslint](https://github.com/typescript-eslint/typescript-eslint) команда TS рекомендует алиас на 6.0 | [Oxc Benchmarks](https://oxc.rs/docs/guide/benchmarks), [oxc](https://github.com/oxc-project/oxc) |
| Расширение замедляет запуск VS Code | Специфичные activation events, `onStartupFinished` вместо `*` | [Activation Events](https://code.visualstudio.com/api/references/activation-events) |
| Много файлов в расширении | Бандлинг esbuild, `tsc --noEmit` отдельно | [Bundling Extensions](https://code.visualstudio.com/api/working-with-extensions/bundling-extension) |
| Медленный старт CLI | `module.enableCompileCache()`, стабильно с Node 25.4 | [Node.js module API](https://nodejs.org/api/module.html) |

### Измерения

- Встроенные таблицы TS 7 с разбивкой по проектам; `node --cpu-prof` для CLI (профилирование Node — [performance.md](performance.md)).
- Обзор сроков API: [Digital Applied](https://www.digitalapplied.com/blog/typescript-7-0-rc-go-native-compiler-2026-upgrade-guide) `[не проверено]`.

### Образцовые проекты CLI

[commander.js](https://github.com/tj/commander.js), [Ink](https://github.com/vadimdemedes/ink).

---

## Embedded и необычные цели

Вывод: TS на микроконтроллерах сводится к компиляции в JS с последующим запуском на компактном движке. Компиляция TS в нативный код остаётся экспериментальной. Для устройств с малым объёмом памяти TS служит инструментом разработки, а на устройстве работает результат с ограниченным подмножеством языка.

### Цели и их ограничения

| Цель | Что известно | Источник |
|---|---|---|
| Espruino | Исполняет код, разбирая его на лету, без hoisting; ES6 поддержан частично, нет async-функций и `Map`/`Set`; npm-пакет CLI `espruino` 0.1.67 | [Espruino Features](https://www.espruino.com/Features) |
| Moddable XS | Реализует стандарт 2025 с соответствием выше 99%; сборка через `mcconfig` | [XS Differences](https://moddable.com/documentation/xs/XS%20Differences), [Moddable Tools](https://www.moddable.com/documentation/tools/tools) |
| Moddable, версия 3.9.7 | Целевой язык es2022, флаг `-tc` запускает проверку TS | [Moddable SDK 3.9.7](https://www.github.com/Moddable-OpenSource/moddable/releases/tag/3.9.7) |
| Moddable, практика | TypeScript с xs-dev; позиция компании по типам в JS | [xs-dev TypeScript guide](https://xs-dev.js.org/guide/usage-with-typescript/), [Why Moddable supports JS0/JSSugar](https://moddable.com/blog/js0-jsSugar/) |
| AssemblyScript 0.28.20 | Компилирует вариант TS в Wasm заранее, использует типы `i32` и т.п.; пакеты npm обычно не работают, полного TS не будет | [AssemblyScript Introduction](https://www.assemblyscript.org/introduction.html) |
| `shermes` | Компилирует JS в нативный код; типизированный вход даёт намного лучший результат, но типизированный режим «not ready for use» | [facebook/hermes](https://github.com/facebook/hermes) |
| `shermes`, практика | Компиляция реального CLI; нативное приложение на TS | [Compiling a real-world CLI tool to native with Static Hermes](https://speakerdeck.com/tmikov2023/compiling-a-real-world-cli-tool-to-native-with-static-hermes), [Creating a native app in TypeScript](https://vexcess.github.io/blog/creating-a-native-app-in-typescript) `[не проверено]` |
| Porffor | Компилирует JS заранее в C через IR | [Porffor](https://github.com/CanadaHonk/porffor) |

### Симптом → техника → источник

| Симптом | Техника | Источник |
|---|---|---|
| Нехватка возможностей ES на плате | Проверять по таблице Features до написания кода | [Espruino Features](https://www.espruino.com/Features) |
| Ошибки типов проходят в сборку Moddable | Флаг `-tc` | [Moddable SDK 3.9.7](https://www.github.com/Moddable-OpenSource/moddable/releases/tag/3.9.7) |
| Нужна скорость чисел | AssemblyScript с типами `i32` | [AssemblyScript Introduction](https://www.assemblyscript.org/introduction.html) |

### Измерения

Сравнительных измерений памяти и скорости XS, Espruino и `shermes` в источниках нет; статус TypeScript в Porffor на прочитанной странице не указан. Для выбора движка измеряют собственную программу на целевой плате.

---

## Взаимодействие с WebAssembly

Вывод: сам вызов через границу дёшев, дорого перемещение данных. Wasm оправдан для вычислений с редкими пересечениями границы и не оправдан для разбора текста в JS-объекты. Парсер OpenUI на Rust/Wasm оказался медленнее TS-реализации в 2.2–4.6 раза именно из-за передачи данных.

### Стек и версии

Версии на 2026-11-08.

| Пакет | Версия | Примечание |
|---|---|---|
| `wasm-pack` | 0.15.1 | |
| `@bytecodealliance/jco` | 1.41.0 | |
| `@bytecodealliance/componentize-js` | 0.23.0 | |
| `wasm-bindgen` (крейт) | 0.2.129 | В таблице MSRV на 2026-09-23 ([wasm-bindgen](https://github.com/wasm-bindgen/wasm-bindgen)) |
| `wasm-bindgen` (npm) | 0.0.1-security | Судя по номеру, заглушка безопасности; ставить из npm не следует (вывод из версии реестра) |

`[устарело]` Организация `rustwasm` на GitHub распущена, репозитории переданы новым сопровождающим ([Sunsetting the rustwasm GitHub org](https://blog.rust-lang.org/inside-rust/2025/07/21/sunsetting-the-rustwasm-github-org)). Замена: `drager/wasm-pack` перенаправляет на [wasm-bindgen/wasm-pack](https://github.com/wasm-bindgen/wasm-pack). Альтернативный подход: [Life after wasm-pack](https://nickb-dev.pages.dev/blog/life-after-wasm-pack-an-opinionated-deconstruction).

### Архитектура

- Jco транспилирует компоненты в ES-модули для Node и браузеров, собирает компоненты из JS/TS через `componentize-js`, шаблоны по умолчанию на WASI 0.3 ([jco](https://github.com/bytecodealliance/jco)). Учебник: [Component Model: JavaScript](https://component-model.bytecodealliance.org/language-support/building-a-simple-component/javascript.html).
- Стоимость самого вызова: в Firefox 100 млн вызовов JS→wasm ускорились с около 5500 до около 450 мс, встроенные DOM-функции по-прежнему идут через JS ([Calls between JavaScript and WebAssembly are finally fast](https://hacks.mozilla.org/2018/10/calls-between-javascript-and-webassembly-are-finally-fast-%F0%9F%8E%89/)). Цифры 2018 года описывают Firefox и не годятся как абсолютный ориентир для современных движков.
- Для тонких API данные держат в линейной памяти Wasm и передают только смещения. Так устроены DuckDB-Wasm и Perspective (раздел «Визуализация и тяжёлый UI») и Rapier (раздел «Браузерные игры и реальное время»): редкие пересечения границы, данные остаются внутри.

### Что измерил OpenUI

| Результат | Условия | Источник |
|---|---|---|
| TS-реализация быстрее Wasm-парсера в 2.2–4.6× | Убраны лишние пересечения границы, сравнение с TS | [OpenUI](https://www.openui.com/blog/rust-wasm-parser) |
| Прямой возврат объектов через `serde-wasm-bindgen` на 9–29% хуже JSON-строки | Вернулись к JSON-строке | [OpenUI](https://www.openui.com/blog/rust-wasm-parser), [serde-wasm-bindgen](https://github.com/RReverser/serde-wasm-bindgen) |
| Инкрементальный парсинг с кэшем завершённых утверждений: 2.6–3.3× | Квадратичный перепарсинг потока LLM | [OpenUI](https://www.openui.com/blog/rust-wasm-parser) |

Выводы по этим числам: разбор текста в JS-объекты упирается в копирование и создание объектов на границе, а не в скорость Rust. Алгоритмический выигрыш (инкрементальность) оказался больше, чем выигрыш от смены языка.

### Симптом → техника → источник

| Симптом | Техника | Источник |
|---|---|---|
| Wasm-парсер медленнее TS | Убрать пересечения границы, сравнить с TS-реализацией | [OpenUI](https://www.openui.com/blog/rust-wasm-parser) |
| `serde-wasm-bindgen` замедлил возврат объектов | Вернуться к JSON-строке | [OpenUI](https://www.openui.com/blog/rust-wasm-parser), [serde-wasm-bindgen](https://github.com/RReverser/serde-wasm-bindgen) |
| Дорогая передача строк | Передавать числа и индексы; в Screeps строка 10 000 стоит около 110 CPU на 1000 итераций против около 23 у массива | [Screeps Clockwork](https://glitchassassin.github.io/screeps-clockwork/wasm/boundary.html) |
| Копирование больших массивов | Вернуть Rust-структуру-обёртку, освобождать вручную | там же |
| Неясны масштабы затрат | Ориентиры: целые 50–100 нс, короткая строка 600–2500 нс, 1 МБ массива 1–3 мс | [Lviv University paper](https://publications.lnu.edu.ua/collections/index.php/electronics/article/download/5101/5613) `[не проверено]` |

### Измерения

OpenUI использует 30 разогревочных и 1000 замеренных итераций `performance.now()` с медианой. Это подходит как шаблон для собственных замеров границы ([OpenUI](https://www.openui.com/blog/rust-wasm-parser); общая методика — [benchmarking.md](benchmarking.md)).

---

## Спорные места и пробелы

Что неизвестно или не подтверждено первичными источниками на ноябрь 2026.

| Область | Что неизвестно |
|---|---|
| Мобильные | Абсолютные цифры Hermes V1 опубликованы только для одного приложения (New Expensify), в посте 0.84 их нет. Независимых сравнений Lynx и React Native нет. Приёмов измерения Capacitor WebView в официальных документах нет. Flashlight не покрывает iOS: сквозной инструмент для обеих платформ придётся собирать отдельно |
| Десктоп | Воспроизводимых сравнений IPC Tauri и Electron нет; в блогах встречается 0.12 против 0.45 мс, методика и первоисточник не установлены. Пост «A faster electron» с цифрой около 43% нашёлся только на preview-домене, адрес на electronjs.org вернул 404 `[не проверено]`. Измерений Wails v3 и Neutralino под нагрузкой нет |
| Игры | Независимых бенчмарков Phaser 4, PixiJS 8 и WebGPURenderer между собой нет. Зеркала документации OpenFrontIO вернули 404/410, поэтому утверждения об intent-командах и ретрансляции сервером надо сверять с `/packages/engine`. Утверждение, что Vampire Survivors начинался на Phaser и автор планировал смену движка, опирается на [Wikipedia](https://en.wikipedia.org/wiki/Vampire_Survivors) и [GamingOnLinux](https://gamingonlinux.com/2023/01/vampire-survivors-dev-poncle-outlines-2023-plans); точный движок и дата порта из первичных источников не подтверждены, сведения о Unity встречаются только на форумах. Страница Secret State в boardgame.io автоматически не читается, детали `playerView` проверяют вручную. Управление памятью Rapier (`free`) и его производительность в JS-документации не найдены |
| Визуализация | Цифр для связки DuckDB-Wasm → Arrow → deck.gl на миллионах строк нет. Свежих сравнений ECharts 6 с uPlot нет. Точные значения режимов `large` и `progressive` в ECharts 6 не описаны на прочитанных страницах |
| Расширения | Официальной методики замера памяти и времени пробуждения service worker нет. Блокировка Tailwind v4 устаревшим Parcel в Plasmo подтверждена только вторичной сводкой, без проверенного URL |
| Edge | Официальная страница о `--bytecode` в Bun не открылась, эффект не подтверждён. Сообщения о переписывании Bun с Zig на Rust найдены только во вторичных источниках. Методика профилирования CPU в Workers не вычитывалась |
| AI | Заявления о 10–50× у Transformers.js есть только во вторичных блогах, официальный пост их не содержит. README MCP SDK указывает спецификацию 2026-07-28 и релиз v2 2026-07-27: расхождение дат не разрешено. Независимых бенчмарков накладных расходов LangChain и Mastra нет |
| Инструменты | Сроки поддержки API 7.1 в ts-morph и typescript-eslint в первичных источниках не заявлены. Тестов производительности кодогенераторов (ts-proto, openapi-typescript и других) нет |
| Embedded | Сравнительных измерений памяти и скорости XS, Espruino и `shermes` нет; статус TypeScript в Porffor неизвестен |
| Wasm | Измерений lifting и lowering Canonical ABI в jco не опубликовано. Статус JS String Builtins и JSPI на ноябрь 2026 не подтверждён: страница `v8.dev/blog/js-string-builtins` вернула 404, первичного источника нет |
