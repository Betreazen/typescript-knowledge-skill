# Книги, курсы, блоги, доклады и маршрут чтения по TypeScript

Аннотированный каталог источников по TypeScript для тех, кто пишет, ревьюит и оптимизирует код во фронтенде, бэкенде, библиотеках, инструментах, мобильных приложениях и играх. Внутри книги по языку, дизайну и архитектуре, производительности, официальная документация, блоги, рассылки, доклады, курсы, практика, ресурсы по доменам и на русском, затем маршрут чтения по уровням. Состояние на ноябрь 2026 года: TypeScript 6.0 вышел 23 марта 2026, 7.0 (компилятор на Go) 8 июля 2026, 7.1 Beta 20 октября 2026. Ни одна книга не описывает TS 7. Самые сильные печатные книги: Effective TypeScript 2nd ed. (2024), Total TypeScript: The Essentials (апрель 2026, также бесплатно онлайн), TypeScript Cookbook (2023) и официальный Handbook. Главы про `tsconfig` и модули во всех книгах до 2026 года нужно сверять с релиз-нотами, главы про систему типов в основном остаются верными. Сайты Акселя Раушмайера (exploringjs.com, 2ality.com) сейчас отключены автором. Технические детали лежат в соседних файлах: [types-patterns.md](types-patterns.md), [toolchain.md](toolchain.md), [performance.md](performance.md), [architecture.md](architecture.md), [frontend.md](frontend.md), [domains.md](domains.md), [testing.md](testing.md).

Метки: `[устарело]` означает устаревшее издание или содержание, рядом названа замена. `[не проверено]` означает один вторичный источник или то, что содержание прочитать не удалось. Уровни: начальный, средний, продвинутый. Слова «устарело» и советы «что читать» опираются на даты и изменения языка; сами даты и изменения подтверждены источниками. Если год не подтвердился, так и написано.

Каталог разбит по темам. Читайте один файл, нужный по вопросу.

| Тема | Файл |
|---|---|
| Книги о языке и типах, официальные материалы, основы JavaScript | [books-typescript.md](books-typescript.md) |
| Дизайн, рефакторинг, паттерны, моделирование типами, DDD, архитектура, функциональный стиль | [books-design.md](books-design.md) |
| Производительность: книги, веб-скорость, движки, скорость компилятора | [books-performance.md](books-performance.md) |
| Блоги, рассылки, доклады, видео, курсы, практика | [books-learning.md](books-learning.md) |
| Источники по доменам: игры, мобильные, инструменты и другие | [books-domains.md](books-domains.md) |
| Материалы на русском | [books-ru.md](books-ru.md) |

В этом файле: [С чего начать](#с-чего-начать), [Версии языка как мерка для книг](#версии-языка-как-мерка-для-книг), [Маршрут чтения](#маршрут-чтения), [Спорные места и пробелы](#спорные-места-и-пробелы).

## С чего начать

Шесть-семь источников дают больше всего: две книги о типах, один официальный справочник по настройке, один текст о модулях, одна книга о дизайне, один источник по производительности и релиз-ноты, которые лечат устаревшие советы.

| Источник | Автор, год | Уровень | Зачем |
|---|---|---|---|
| [Effective TypeScript, 2nd ed.](https://www.oreilly.com/library/view/effective-typescript-2nd/9781098155056/) | Dan Vanderkam, O'Reilly, апрель 2024 | средний, продвинутый | Лучшая книга о том, как думать типами. Для практикующего разработчика это первая покупка |
| [Total TypeScript: The Essentials](https://www.totaltypescript.com/books/total-typescript-essentials) | Matt Pocock с Taylor Bell, No Starch, апрель 2026 | начальный, средний | Самая свежая печатная книга, веб-версия бесплатна. Лучший вход для новичка |
| [TSConfig Reference](https://www.typescriptlang.org/tsconfig/) и [Modules: Theory](https://www.typescriptlang.org/docs/handbook/modules/theory.html) | команда TypeScript, живые документы | средний | Лекарство от устаревших советов о настройке и разрешении модулей |
| [Релиз-ноты TS 6.0](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/) и [TS 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) | Microsoft, 2026 | все | Список умолчаний, удалённых опций и отсутствующего API. Читать до любой книги о настройке |
| [A Philosophy of Software Design, 2nd ed.](https://web.stanford.edu/~ouster/cgi-bin/aposd.php) | John Ousterhout, 2021 | средний | Короткая книга о сложности и глубоких модулях, язык не важен |
| [Shapes and Inline Caches](https://mathiasbynens.be/notes/shapes-ics) и [Speeding up the JavaScript ecosystem](https://marvinh.dev/blog/speeding-up-javascript-ecosystem/) | Bynens, Meurer; Marvin Hagemeister | средний, продвинутый | Что стоит дорого в движке и в экосистеме инструментов |
| [type-challenges](https://github.com/type-challenges/type-challenges) | сообщество, 48,5 тыс. звёзд | средний, продвинутый | Практика типов; без неё чтение книг остаётся пассивным |

TS 7 и книги. Книги о нём ещё не написаны. TS 6.0 сменил умолчания, TS 7.0 превратил устаревания в жёсткие ошибки. Поэтому главы про `tsconfig`, `moduleResolution`, `baseUrl`, `esModuleInterop`, `outFile`, ES5 и compiler API в любой книге до 2026 года проверяйте по релиз-нотам. Главы про generics, conditional и mapped types, narrowing, discriminated unions и дизайн типов в основном остаются верными. Это вывод из дат и списка изменений; исключений в конкретных книгах никто не проверял.

Что переехало или не работает:

- exploringjs.com и 2ality.com: отключены автором, показывают заглушку. Причины, которые называет автор: доход от книг упал до нуля в 2026, трафик AI-краулеров вырос. Срок возвращения не назван, сказано только «месяцы». Адрес exploringjs.com/tackling-ts отдаёт 404.
- tsconf.io теперь ведёт на сайт SitePen. Замена: SquiggleConf.
- frontendmasters.com перенаправляет на master.dev.
- Путь Microsoft Learn по TypeScript перенаправляет на typescriptlang.org.
- Русской версии документации по адресу typescriptlang.org/ru нет (404).
- Fluent TypeScript: книги с таким названием не найдено.

## Версии языка как мерка для книг

Любую книгу нужно измерять по тому, что изменилось в языке. Хронология и список ниже подтверждены блогом TypeScript и документом различий порта.

- TS 6.0 (23 марта 2026) сменил умолчания: `strict: true`, `module: esnext`, `target` следует за последним ES (сейчас es2025), `types: []`, `rootDir` равен каталогу `tsconfig.json`. Источник: [Announcing TypeScript 6.0](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/).
- TS 6.0 объявил устаревшими или убрал `target: es5`, `downlevelIteration`, `moduleResolution node/node10/classic`, `module amd/umd/systemjs/none`, `baseUrl` как корень поиска, `outFile`, `esModuleInterop: false`, ключевое слово `module` для пространств имён, `asserts` у импортов.
- TS 7.0 (8 июля 2026) сделал эти устаревания жёсткими ошибками, ускорил полную сборку примерно в 8-12 раз (VS Code: 125,7 с против 10,6 с). Вышел без программного API (новый API ожидается в 7.1). Инструменты для встроенных языков (Vue, Svelte, Astro, MDX, шаблоны Angular) пока не поддержаны. Источник: [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/); различия 6.0 и 7.0 перечислены в [CHANGES.md](https://github.com/microsoft/typescript-go/blob/main/CHANGES.md).
- 7.1 Beta вышла 20 октября 2026. Стабильного 7.1 на странице [блога TypeScript](https://devblogs.microsoft.com/typescript/) нет.

Правило для чтения: типы читать смело, настройку, модули и compiler API сверять с релиз-нотами.

## Маршрут чтения

Четыре ступени: основы по Total TypeScript или Learning TypeScript; глубина по Effective TypeScript и Cookbook; архитектура через Philosophy of Software Design и Domain Modeling Made Functional; производительность через Shapes and Inline Caches, вики TS и серию Хагемайстера. На каждой ступени настройку берут из официальной документации, а не из книг. Порядок «типы, архитектура, производительность» снижает риск преждевременной оптимизации: сначала появляется корректная модель, потом измерения. Это рекомендация по содержанию и актуальности материалов; сравнительных данных об эффективности путей обучения нет.

Перед любой ступенью с настройкой прочитайте релиз-ноты [TS 6.0](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/) и [TS 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/).

### Начальный уровень

1. [Eloquent JavaScript](https://eloquentjavascript.net/), если JS слабый.
2. [Total TypeScript Essentials](https://www.totaltypescript.com/books/total-typescript-essentials) или [Learning TypeScript](https://www.learningtypescript.com/).
3. Практика на [Exercism](https://exercism.org/tracks/typescript).
4. Настройка по [TSConfig Reference](https://www.typescriptlang.org/tsconfig/).

### Средний уровень

1. [Effective TypeScript 2nd ed.](https://www.oreilly.com/library/view/effective-typescript-2nd/9781098155056/).
2. [TypeScript Cookbook](https://typescript-cookbook.com/).
3. [Modules: Theory](https://www.typescriptlang.org/docs/handbook/modules/theory.html).
4. [Five Lines of Code](https://www.manning.com/books/five-lines-of-code) и [Patterns.dev](https://www.patterns.dev/).
5. Задачи уровня medium в [type-challenges](https://github.com/type-challenges/type-challenges).

### Продвинутый уровень

1. [Type-Level TypeScript](https://type-level-typescript.com/).
2. [A Philosophy of Software Design](https://web.stanford.edu/~ouster/cgi-bin/aposd.php).
3. [Domain Modeling Made Functional](https://pragprog.com/titles/swdddf/domain-modeling-made-functional/).
4. [Fundamentals of Software Architecture 2nd ed.](https://www.oreilly.com/library/view/fundamentals-of-software/9781098175504/).
5. Для тех, кто пишет инструменты: [mini-typescript](https://github.com/sandersn/mini-typescript) и [Crafting Interpreters](https://craftinginterpreters.com/).

### Специалист по производительности

1. [Shapes and Inline Caches](https://mathiasbynens.be/notes/shapes-ics) и [V8 Hidden Classes](https://v8.dev/docs/hidden-classes).
2. [Analyze runtime performance](https://developer.chrome.com/docs/devtools/performance) и [Learn Performance](https://web.dev/learn/performance).
3. [TS Performance wiki](https://github.com/microsoft/TypeScript/wiki/Performance) и [Speeding up the JavaScript ecosystem](https://marvinh.dev/blog/speeding-up-javascript-ecosystem/).
4. [HPBN](https://hpbn.co/) для сети, [Web Performance Engineering in the Age of AI](https://www.oreilly.com/library/view/web-performance-engineering/9798341660182/) как общий обзор.

### Ответвления по доменам

- Библиотеки: Declaration Files, Are The Types Wrong?, How To Create An NPM Package.
- Игры: Game Programming Patterns, Data-Oriented Design.
- Мобильные: Callstack Guide и документация React Native и Expo.
- Инструменты: ts-morph, Crafting Interpreters.
- Фронтенд и бэкенд: Bulletproof React, Feature-Sliced Design, Domain-Driven Hexagon.

Ссылки на эти источники даны в тематических файлах `books-*.md`. Приёмы: [types-patterns.md](types-patterns.md), [testing.md](testing.md).

## Спорные места и пробелы

- Новых изданий Effective TypeScript, Learning TypeScript, Programming TypeScript и TypeScript Cookbook под TS 6/7 не найдено. Отсутствие анонса не доказывает отсутствие планов.
- Возвращение exploringjs.com неизвестно: автор называет только «месяцы». Издание Exploring TypeScript для TS 5.8 подтверждено только вторичным источником.
- Оглавления страниц O'Reilly и Packt напрямую не читались (сайты отвечали отказом), они проверены лишь там, где их показала выдача поиска.
- Версия TS, под которую написана Total TypeScript: The Essentials, на странице издателя не указана.
- Годы Learning Patterns, Software Design by Example, Cosmic Python, Game Programming Patterns, Data-Oriented Design и Callstack Guide не подтверждены со страниц самих проектов. Автор и год Mostly Adequate Guide не подтверждены.
- Книги с полным разбором DDD и гексагональной архитектуры на TS не найдено; выводы опираются на открытые репозитории.
- Для инструментов, зависящих от API 6.0 (линтеры, редакторская поддержка встроенных языков), замеров после TS 7 нет. Что именно станет узким местом, неизвестно.
- Цены на Execute Program, Type-Level TypeScript и Master.dev не проверялись. Качество русских видеокурсов не оценивалось: независимых обзоров нет.
- Какой путь обучения эффективнее, источники не сравнивают. Маршрут выше опирается только на содержание и актуальность материалов.
