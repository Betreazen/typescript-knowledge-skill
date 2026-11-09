# Книги о дизайне, паттернах и архитектуре

Раздел каталога источников. Индекс, короткий список и маршрут чтения — [books.md](books.md).

## Дизайн, паттерны и архитектура

Книги с полным разбором DDD и гексагональной архитектуры именно на TypeScript не найдено, ближе всего открытые репозитории. Рабочая связка: A Philosophy of Software Design и Refactoring 2nd ed. для дизайна, Domain Modeling Made Functional для моделирования типами (идеи с F# переносятся на discriminated unions), Five Lines of Code как книга с примерами на TS, Patterns.dev для паттернов фронтенда. Подробнее о приёмах в коде: [types-patterns.md](types-patterns.md) и [architecture.md](architecture.md).

### Дизайн и рефакторинг

| Источник | Автор, год | Уровень | Зачем |
|---|---|---|---|
| [A Philosophy of Software Design, 2nd ed.](https://web.stanford.edu/~ouster/cgi-bin/aposd.php) | John Ousterhout, 2021 | средний | Сложность и глубокие модули. Во 2-м издании новая глава «Decide What Matters» |
| [Refactoring, 2nd ed.](https://martinfowler.com/books/refactoring.html) ([каталог приёмов](https://refactoring.com/)) | Martin Fowler, конец 2018, примеры на JavaScript | средний | Актуально |
| [Five Lines of Code](https://www.manning.com/books/five-lines-of-code) | Christian Clausen, Manning, 2021, 336 с. | начальный, средний | Самая практичная книга о рефакторинге на TS |
| [Refactoring TypeScript](https://leanpub.com/refactoringtypescript) | James Hickey, Leanpub, обновлена 27 сентября 2019, 110 с. | начальный | `[устарело]`, замена: Five Lines of Code |
| [clean-code-typescript](https://github.com/labs42io/clean-code-typescript) | labs42io, июль 2025, 9,8 тыс. звёзд | начальный, средний | Чек-лист, а не догма |
| [Software Design by Example](https://third-bit.com/sdxjs/) | Greg Wilson, примеры на JS, год не подтверждён | средний | Дизайн через сборку маленьких инструментов |

### Паттерны

| Источник | Автор, год | Уровень | Зачем |
|---|---|---|---|
| [Patterns.dev](https://www.patterns.dev/) | Lydia Hallie, Addy Osmani | средний | Паттерны дизайна, рендеринга и производительности |
| [Learning Patterns](https://www.patterns.dev/book/) | Lydia Hallie, Addy Osmani, 435+ страниц, бесплатно, год не подтверждён | средний | Книжная версия Patterns.dev |
| [Learning JavaScript Design Patterns, 2nd ed.](https://www.oreilly.com/library/view/learning-javascript-design/9781098139865/) | Addy Osmani, O'Reilly, апрель 2023, 298 с. | средний | Глава 7 про паттерны JS, далее React, code-splitting, MVC/MVP/MVVM |
| [TypeScript 5 Design Patterns and Best Practices, 2nd ed.](https://www.oreilly.com/library/view/typescript-5-design/9781835883228/) ([Packt](https://www.packtpub.com/en-mx/product/typescript-5-design-patterns-and-best-practices-9781835883228)) | Theofanis Despoudis, Packt, февраль 2025, 430 с. | средний | GoF-паттерны, функциональное и реактивное программирование на TS 5 |
| [Design Patterns in TypeScript](https://refactoring.guru/design-patterns/typescript) | Refactoring.Guru | начальный, средний | Быстрый справочник с кодом |

GoF-паттерны стоит читать выборочно: часть из них в TS заменяется функциями и union-типами.

### Моделирование типами и DDD

| Источник | Автор, год | Уровень | Зачем |
|---|---|---|---|
| [Domain Modeling Made Functional](https://pragprog.com/titles/swdddf/domain-modeling-made-functional/) | Scott Wlaschin, Pragmatic, январь 2018, 310 с., F# | средний | Главы 4-7 (типы, целостность, workflow) и 9-10 (конвейер, ошибки) хорошо ложатся на discriminated unions |
| [Designing with types](https://fsharpforfunandprofit.com/series/designing-with-types/) и [Railway Oriented Programming](https://fsharpforfunandprofit.com/rop/) | Scott Wlaschin, F# | средний | Те же идеи в коротких статьях |
| [Parse, don't validate](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/) | Alexis King, 2019, Haskell | средний | Идея прямо переносится на Zod и подобные библиотеки |
| [Learning Domain-Driven Design](https://www.oreilly.com/library/view/learning-domain-driven-design/9781098100124/) | Vlad Khononov, O'Reilly, октябрь 2021 (2-й релиз март 2024) | средний | Стратегический и тактический DDD |
| [DDD Resources](https://www.domainlanguage.com/ddd/) | Domain Language (Eric Evans) | средний | Отправная точка к первоисточнику |
| [Balancing Coupling in Software Design](https://vladikk.com/page/books/) ([сайт модели](https://coupling.dev/)) | Vlad Khononov, Pearson, 2024 | продвинутый | Связность как инструмент решений |
| [Domain-Driven Hexagon](https://github.com/Sairyss/domain-driven-hexagon) | Sairyss, Node/TS/NestJS, 15 тыс. звёзд, последний push в июне 2024 | средний, продвинутый | Обзор паттернов, код сверять с текущими версиями |
| [typescript-ddd-example](https://github.com/CodelyTV/typescript-ddd-example) | CodelyTV, последний push в августе 2024 | средний | Гексагональная архитектура, DDD, CQRS как пример |
| [Статьи о DDD на TypeScript](https://khalilstemmler.com/articles/categories/domain-driven-design/) и [solidbook](https://solidbook.io/) | Khalil Stemmler | средний | Даты отдельных статей не проверены |
| [Architecture Patterns with Python (Cosmic Python)](https://www.cosmicpython.com/) | Harry Percival, Bob Gregory, бесплатно, год не подтверждён | средний | Адаптируемый материал по репозиторию, Unit of Work и событиям |

### Архитектура систем и приложений

| Источник | Автор, год | Уровень | Зачем |
|---|---|---|---|
| [Fundamentals of Software Architecture, 2nd ed.](https://www.oreilly.com/library/view/fundamentals-of-software/9781098175504/) | Mark Richards, Neal Ford, O'Reilly, март 2025 | средний | Пять новых глав, включая стиль модульного монолита |
| [Designing Data-Intensive Applications, 2nd ed.](https://www.oreilly.com/library/view/designing-data-intensive/9781098119058/) ([Schweitzer](https://www.schweitzer-online.de/en/buch/Kleppmann/Designing-Data-Intensive-Applications/9781098119065/A74497115/)) | Martin Kleppmann, Chris Riccomini, O'Reilly, начало 2026 (магазины дают даты от 27 февраля до 31 марта) | продвинутый | Данные, репликация, согласованность |
| [Building Micro-Frontends, 2nd ed.](https://www.oreilly.com/library/view/building-micro-frontends-2nd/9781098170776/) | Luca Mezzalira, O'Reilly, октябрь 2025 | продвинутый | Актуально |
| [Micro Frontends in Action](https://www.manning.com/books/micro-frontends-in-action) | Michael Geers, Manning, 2020 | средний | `[устарело]`, замена: Building Micro-Frontends, 2nd ed. |
| [Building Large Scale Web Apps: A React Field Guide](https://leanpub.com/large-scale) | Addy Osmani, Hassan Djirdeh, апрель 2024 | средний | Актуально |
| [Bulletproof React](https://github.com/alan2207/bulletproof-react) | alan2207, май 2026, 36 тыс. звёзд | средний | Структура большого React-приложения |
| [Feature-Sliced Design](https://feature-sliced.design/) ([на русском](https://fsd.how/ru/)) | сообщество | средний | Актуально |
| [Monorepo Explained](https://monorepo.tools/) | monorepo.tools | начальный, средний | Сайт поддерживается вендорами инструментов, учитывать это |

### Функциональный стиль

| Источник | Автор, год | Уровень | Статус |
|---|---|---|---|
| [Grokking Simplicity](https://www.manning.com/books/grokking-simplicity) | Eric Normand, Manning, 2021, 592 с. | начальный, средний | Актуально, оглавление не проверено |
| [Mostly Adequate Guide to Functional Programming](https://mostly-adequate.gitbook.io/mostly-adequate-guide) | открытая книга, автор и год не подтверждены | средний | Актуально для идей, код на JS |
| [Документация Effect](https://effect.website/docs/) | команда Effect | продвинутый | Актуально, основной адрес уже ведёт на v4 |
| [fp-ts](https://gcanti.github.io/fp-ts/) | gcanti | продвинутый | Только как справочник, актуальность не проверялась |
| [The Effect Book](https://leanpub.com/theeffectbook) | Jitin Kayyala, Leanpub, обновлена 17 апреля 2026 | средний | `[не проверено]`: единственный источник, автор малоизвестен, книга учит Effect v3, документация уже про v4 |
