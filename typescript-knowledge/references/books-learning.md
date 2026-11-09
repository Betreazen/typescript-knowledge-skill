# Блоги, рассылки, доклады и курсы

Раздел каталога источников. Индекс, короткий список и маршрут чтения — [books.md](books.md).

## Блоги и рассылки

Первоисточник один: блог TypeScript и репозиторий `typescript-go`. Из людей самые ценные Matt Pocock (обучение), Dan Vanderkam (глубокие разборы), Andrew Branch (модули), Josh Goldberg (линтинг и инструменты), Marvin Hagemeister (скорость). Для слежения за TS 7 достаточно трёх источников: блог TypeScript, `CHANGES.md` и TypeScript.fm.

### Блоги и официальные материалы

| Источник | Автор | Уровень | Что там |
|---|---|---|---|
| [TypeScript Blog](https://devblogs.microsoft.com/typescript/) | Microsoft | все | Релизы и планы |
| [Total TypeScript Articles](https://www.totaltypescript.com/articles) и [TSConfig Cheat Sheet](https://www.totaltypescript.com/tsconfig-cheat-sheet) | Matt Pocock | начальный, средний | Cheat sheet сверять с умолчаниями TS 6 |
| [Effective TypeScript blog](https://effectivetypescript.com/) | Dan Vanderkam | средний, продвинутый | Последние записи: декабрь 2025 («A Small Year for tsc, a Giant Year for TypeScript») |
| [Goldblog](https://www.joshuakgoldberg.com/blog/) и [статьи Learning TypeScript](https://www.learningtypescript.com/articles) | Josh Goldberg | средний | Линтинг, инструменты |
| [Блог Andrew Branch](https://blog.andrewbran.ch/) | Andrew Branch | продвинутый | Редкие точные тексты о модулях: «Is nodenext right for libraries that don't target Node.js?» (ноябрь 2023), «Default exports in CommonJS libraries» (апрель 2024). Новых записей с 2024 нет |
| [Блог Jake Bailey](https://jakebailey.dev/) | Jake Bailey | продвинутый | Порт на Go и DefinitelyTyped как монорепо; 4 записи, последняя в апреле 2025 |
| [oida.dev](https://oida.dev/) | Stefan Baumgartner | средний | На fettblog.eu открывается тот же блог |
| [TkDodo's blog](https://tkdodo.eu/blog/) | Dominik (TkDodo) | средний | Практические статьи |
| [typescript-eslint blog](https://typescript-eslint.io/blog) | команда typescript-eslint | средний | Важен для перехода на TS 7 |
| [2ality](https://2ality.com/) | Axel Rauschmayer | средний | `[не проверено]`: сейчас отключён автором, зеркало на onrender вернуло 404 |

Отдельного блога или доклада Ryan Cavanaugh подтвердить не удалось. Его публичная позиция видна в [Why Go?](https://github.com/microsoft/typescript-go/discussions/411) и [Design Goals](https://github.com/microsoft/TypeScript/wiki/TypeScript-Design-Goals).

### Рассылки

| Рассылка | Заметка |
|---|---|
| [TypeScript Weekly](https://www.typescript-weekly.com/) | Единственная рассылка именно о TS |
| [JavaScript Weekly](https://javascriptweekly.com/), [Frontend Focus](https://frontendfoc.us/), [React Status](https://react.statuscode.com/) | Семейство Cooperpress |
| [Bytes](https://bytes.dev/) | Лёгкая подача |
| [This Week In React](https://thisweekinreact.com/) | Новости React |

## Доклады и видео

Для понимания TS 7 достаточно трёх материалов: документальный фильм о происхождении языка, доклад Хейлсберга о нативном порте и подкаст Syntax. Для типов на продвинутом уровне ценен канал Michigan TypeScript. Конкретное видео про Doom на канале Michigan TypeScript подтвердить не удалось, подтверждены канал и репозиторий.

| Материал | Автор, дата | Уровень | О чём |
|---|---|---|---|
| [TypeScript Origins: The Documentary](https://www.youtube.com/watch?v=U6s2pdxebSo) | документальный фильм | все | История языка |
| [A 10x Faster TypeScript](https://www.youtube.com/watch?v=pNlq-EVld70) | Anders Hejlsberg, март 2025 | средний | Нативный порт |
| [Syntax #884](https://syntax.fm/884) | Hejlsberg и Rosenwasser, март 2025 | средний | Подкаст о нативном порте |
| [Syntax #969](https://syntax.fm/969) | подкаст Syntax | средний | Doom на типах, TypeSlayer для диагностики скорости типов |
| [Michigan TypeScript](https://www.youtube.com/@MichiganTypeScript) | Dimitri Mitropoulos | продвинутый | Канал и проект запуска Doom на типах TS (WebAssembly-рантайм в типах, февраль 2025): [репозиторий](https://github.com/MichiganTypeScript/typescript-types-only-wasm-runtime), [разбор Socket](https://socket.dev/blog/typescript-types-running-doom) |
| [Interview The Peterman Pod](https://commandline.microsoft.com/?p=368) | Hejlsberg, после 7.0 | средний | Интервью |
| [Интервью DevClass, январь 2026](https://www.devclass.com/2026/01/28/typescript-inventor-anders-hejlsberg-ai-is-a-big-regurgitator-of-stuff-someone-has-done) | Hejlsberg | средний | Про неудачную попытку портировать с помощью AI |
| [TypeScript.fm](https://typescript.fm/) | еженедельный подкаст | средний | Свежие выпуски про 7.1 Beta |
| [Software Engineering Daily: Running Doom in TypeScript](https://softwareengineeringdaily.com/2025/11/25/running-doom-in-typescript-with-dimitri-mitropoulos/) | ноябрь 2025 | продвинутый | Беседа с Mitropoulos |
| [JS Party](https://changelog.com/jsparty) | Changelog | средний | Подкаст о JS |

YouTube-каналы: [Matt Pocock](https://www.youtube.com/@mattpocockuk), [Jack Herrington](https://www.youtube.com/@jherr), [Theo - t3.gg](https://www.youtube.com/@t3dotgg) (мнения, факты проверять).

Конференции:

- TSConf `[устарело]`: tsconf.io теперь ведёт на сайт SitePen. Замена: [SquiggleConf](https://squiggleconf.com/).
- [TypeScript Congress](https://typescriptcongress.com/): последнее событие на сайте сентябрь 2023, записи доступны на [GitNation](https://gitnation.com/events/typescript-congress-2023).

## Курсы и практика

Из платного сильнее всего Total TypeScript Workshops и Type-Level TypeScript. Бесплатного хватает для среднего уровня: книга Pocock, Handbook, Exercism, type-challenges. Платить разумно за обратную связь и упражнения, содержание уровня Handbook и Essentials доступно бесплатно. Цены на Execute Program, Type-Level TypeScript и Master.dev не проверялись.

### Курсы

| Курс | Автор, платформа, дата | Уровень | Статус |
|---|---|---|---|
| [Total TypeScript Workshops](https://www.totaltypescript.com/workshops) | Matt Pocock | средний, продвинутый | Актуально, цену проверять (в [объявлении автора](https://www.totaltypescript.com/announcing-a-free-book-a-course-a-huge-price-cut) Pro Essentials стоил $200) |
| [Free TypeScript Tutorials](https://www.totaltypescript.com/tutorials) | Matt Pocock | начальный | Бесплатно, включая Beginner's TypeScript и Zod |
| [Type-Level TypeScript](https://type-level-typescript.com/) | Gabriel Vergnaud | продвинутый | Актуально |
| [Execute Program: TypeScript Basics](https://www.executeprogram.com/courses/typescript-basics) | интерактивный курс | начальный, средний | Актуально |
| [TypeScript 5+ Fundamentals, v4](https://master.dev/courses/typescript-v4/) и [Intermediate TypeScript, v2](https://master.dev/courses/intermediate-typescript-v2/) | Mike North, Master.dev, декабрь 2023 | начальный, средний | Актуально для TS 5. [Путь обучения](https://master.dev/learn/typescript/) |
| [Enterprise TypeScript](https://master.dev/courses/enterprise-typescript/) | Master.dev, декабрь 2023 | продвинутый | Миграции и тестирование типов в больших кодовых базах, полезно командам |
| [Web Performance Fundamentals, v2](https://master.dev/courses/web-perf-v2/) | Master.dev, 22 октября 2024 | средний | Актуально, автор не проверен |
| [Learn TypeScript](https://www.boot.dev/courses/learn-typescript) | Boot.dev | начальный | Актуально |
| [Epic React](https://www.epicreact.dev/) и [Epic Web](https://www.epicweb.dev/) | Kent C. Dodds | средний | Обучение через стек, а не через TS |
| [Learn TypeScript](https://www.codecademy.com/learn/learn-typescript) (Codecademy) и [Learn TypeScript With This Crash Course](https://www.freecodecamp.org/news/learn-typescript-with-this-crash-course/) (freeCodeCamp) | — | начальный | Первое знакомство |
| [Путь Microsoft Learn](https://learn.microsoft.com/en-us/training/paths/build-javascript-applications-typescript/) | Microsoft | — | `[устарело]`, перенаправляет на typescriptlang.org, замена: Handbook |

### Практика

| Ресурс | Статус | Уровень |
|---|---|---|
| [type-challenges](https://github.com/type-challenges/type-challenges) | 48,5 тыс. звёзд, обновлялся в октябре 2026 | средний, продвинутый |
| [TypeHero](https://typehero.dev/) | Интерактивные задачи | средний |
| [TypeScript on Exercism](https://exercism.org/tracks/typescript) | Бесплатный трек | начальный, средний |
| [TypeScript Exercises](https://typescript-exercises.github.io/) ([GitHub](https://github.com/typescript-exercises/typescript-exercises)) | Обновлялся в марте 2026 | начальный, средний |

Сообщества: [TypeScript Community в Discord](https://discord.com/invite/typescript), [список ресурсов](https://www.typescriptlang.org/community/), [Reactiflux](https://www.reactiflux.com/).
