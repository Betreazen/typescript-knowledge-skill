# Идиомы и паттерны системы типов TypeScript

Справочник по идиомам TypeScript: моделирование данных типами, generics, границы типобезопасности, ошибки, валидация на границах, классические и функциональные паттерны, типизация библиотек, стоимость типов при компиляции, антипаттерны и чеклист ревью. Состояние знаний на ноябрь 2026: `latest` в npm — TypeScript 7.0.2 (компилятор на Go), последний релиз 6.x — 6.0.3, в бете 7.1.0-beta (2026-10-20). «Проверено локально» значит Windows 11, Node 24.17.0 и три компилятора (7.0.2, 6.0.3, 7.1.0-beta). Каждый раздел начинается с вывода, затем идут детали, примеры «верно/неверно», условия применения и источники. Настройки tsconfig, type stripping, линтеры и публикация пакетов — в [toolchain.md](toolchain.md), замеры и профилирование — в [performance.md](performance.md) и [benchmarking.md](benchmarking.md), тесты типов — в [testing.md](testing.md), типизация UI-фреймворков — в [frontend.md](frontend.md), структура проектов — в [architecture.md](architecture.md).

- [Условия локальных проверок](#условия-локальных-проверок)
- [Моделирование типами](#моделирование-типами)
- [Generics и вывод типов](#generics-и-вывод-типов)
- [Границы типобезопасности](#границы-типобезопасности)
- [Ошибки](#ошибки)
- [Валидация на границах](#валидация-на-границах)
- [Мини-каталог паттернов](#мини-каталог-паттернов)
- [Типизация библиотек](#типизация-библиотек)
- [Стоимость типов при компиляции](#стоимость-типов-при-компиляции)
- [Антипаттерны](#антипаттерны)
- [Чеклист ревью типизации](#чеклист-ревью-типизации)
- [Спорные места и пробелы](#спорные-места-и-пробелы)

## Условия локальных проверок

Вывод: «проверено локально» в этом файле значит один и тот же стенд, и результаты одинаковы на всех трёх компиляторах, если не сказано иное.

- Платформа: Windows 11, Node 24.17.0. Компиляторы: TypeScript 7.0.2, 6.0.3 и 7.1.0-beta.
- Конфиг: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `module: nodenext`.
- Все строки с `@ts-expect-error` действительно дают ошибку: иначе компилятор выдал бы TS2578.
- Ловушка установки: при `typescript@7` рядом с `@typescript/typescript6` команда `npx tsc` напечатала 6.0.3, поэтому запускался `node_modules/typescript/bin/tsc`. После установки двух версий проверяйте `npx tsc -v`.

## Моделирование типами

Вывод: самый ценный приём остаётся прежним. Состояния описываются discriminated union, а новый вариант ломает компиляцию через `never`. Флаги `noUncheckedIndexedAccess` и `exactOptionalPropertyTypes` закрывают дыры, которые union не закрывает. `readonly`, brand и template literal дают гарантии только на уровне типов, и у каждого есть граница, за которой гарантия исчезает. Порядок внедрения по отдаче: discriminated union с `never`, затем `noUncheckedIndexedAccess`, затем brand на ключевых идентификаторах. Если гарантия держится на типах, а данные приходят извне, парсер на границе важнее самого точного типа.

### Discriminated union вместо набора необязательных полей

```ts
// Неверно: компилируется заведомая бессмыслица
type Bad<T> = { loading: boolean; data?: T; error?: Error };
const x: Bad<number> = { loading: true, data: 1, error: new Error("x") };

// Верно: каждому состоянию только его поля
type Fetch<T> =
  | { status: "idle" }
  | { status: "loading"; startedAt: number }
  | { status: "ok"; data: T }
  | { status: "err"; error: Error };

function assertNever(x: never): never { throw new Error(`unexpected: ${JSON.stringify(x)}`); }
function label<T>(s: Fetch<T>): string {
  switch (s.status) {
    case "idle": return "idle";
    case "loading": return `since ${s.startedAt}`;
    case "ok": return "ok";
    case "err": return s.error.message;
    default: return assertNever(s); // новый status → ошибка компиляции
  }
}
```

- Когда: у значения несколько взаимоисключающих форм.
- Когда нет: поля действительно независимы. Тогда union раздует код, а при сотнях вариантов становится дорогим (см. [Стоимость типов при компиляции](#стоимость-типов-при-компиляции)) (проверено локально).
- `assertNever` лучше голого `const _: never = x`: он ещё и падает в рантайме, если данные пришли с необъявленным вариантом.
- Источники: [Parse, don't validate](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/) (Alexis King, 2019); [Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) (TypeScript team, живой документ).

### Взаимное исключение полей через `?: never`

```ts
type ById = { id: string; slug?: never };
type BySlug = { slug: string; id?: never };
type Lookup = ById | BySlug;
// @ts-expect-error: нельзя оба сразу
const both: Lookup = { id: "a", slug: "b" };
```

Без `?: never` union пропустил бы объект с обоими полями. Когда нет: вариантов больше двух-трёх, тогда проще ввести явный `kind` (проверено локально). Источник: [Exclusive Or and the Optional never Trick](https://effectivetypescript.com/2021/11/11/optional-never/) (Dan Vanderkam, 2021).

### Branded-типы: что гарантируют и где теряются

```ts
declare const brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [brand]: B };
type Meters = Brand<number, "Meters">;
type Feet = Brand<number, "Feet">;
const m = (n: number) => n as Meters;
const f = (n: number) => n as Feet;
function addM(a: Meters, b: Meters): Meters { return (a + b) as Meters; }
// @ts-expect-error: футы не метры
addM(m(1), f(2));
const sum = m(1) + m(2); // тип number: арифметика стирает brand
```

- Brand не переживает арифметику и конкатенацию, поэтому результат нужно брендировать заново в одном месте (проверено локально). Конструктор с `as` должен быть единственным таким местом и выполнять проверку.
- Когда: идентификаторы, единицы измерения, проверенные строки.
- Когда нет: значение почти нигде не передаётся или брендинг заставит кастовать на каждом шаге.
- `z.string().brand<"UserId">()` работает как ожидается: голая строка в такой тип не присваивается (проверено локально).
- Источник: [Branded Types](https://www.learningtypescript.com/articles/branded-types) (Josh Goldberg, 2024).

### Template literal types

```ts
type Ev = `on${Capitalize<"click" | "focus">}`;
const a: Ev = "onClick";
// @ts-expect-error
const b: Ev = "onclick";
type Hex = `#${string}`; // принимает и "#zzz": это префикс, а не проверка формата
```

- Когда: строковые протоколы с конечным набором частей, ключи маршрутов, имена событий.
- Когда нет: нужна настоящая проверка формата (это работа рантайм-схемы) или перемножаются большие union.
- Перемножение растёт как произведение размеров. Union из 30×30×30 = 27 000 литералов создал 28 334 типа (проверено локально). Предел компилятора при построении пересечений union: 100 000 членов ([checker.go](https://raw.githubusercontent.com/microsoft/typescript-go/main/internal/checker/checker.go), TypeScript team, ветка main на 2026-11).
- Источники: [TypeScript 4.1 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-1.html) (TypeScript team, 2020); [TypeScript Splits the Atom!](https://effectivetypescript.com/2020/11/05/template-literal-types/) (Dan Vanderkam, 2020).

### `satisfies` против аннотации

```ts
const annotated: Record<string, number | string> = { a: 1, b: "x" };
// @ts-expect-error: аннотация расширила тип
annotated.a.toFixed();

const sat = { a: 1, b: "x" } satisfies Record<string, number | string>;
sat.a.toFixed(); // literal-типы сохранены
// @ts-expect-error: неверное значение всё равно ловится
const sat2 = { a: true } satisfies Record<string, number | string>;
```

- Когда: конфиги, таблицы обработчиков, карты маршрутов.
- Когда нет: экспортируемая функция или значение, тип которого должен быть контрактом. Там нужна аннотация: она останавливает вывод и нужна для `isolatedDeclarations` (проверено локально).
- Источники: [TypeScript 4.9](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html) (TypeScript team, 2022); [Clarifying the satisfies Operator](https://www.totaltypescript.com/clarifying-the-satisfies-operator) (Matt Pocock, 2023).

### `const`-параметры типа и две оговорки

```ts
function tuple<const T extends readonly unknown[]>(x: T): T { return x; }
const t1 = tuple([1, "a"]); // readonly [1, "a"]

// Неверно: изменяемое ограничение молча отменяет const
function noRo<const T extends unknown[]>(x: T): T { return x; }
const t2 = noRo([1, "a"]); // (string | number)[]
```

- Ограничение обязано быть `readonly`, иначе вывод откатывается к обычному. Модификатор влияет только на литералы, написанные прямо в вызове. Переданная переменная `arr` остаётся `string[]`. Поведение `noRo` проверено локально.
- Когда: функции-конфигураторы, где важны литералы (`pick`, ключи таблиц).
- Когда нет: обычные коллекции, где литеральный тип только мешает.
- Источники: [TypeScript 5.0](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html) (TypeScript team, 2023); [Const type parameters](https://www.totaltypescript.com/const-type-parameters) (Matt Pocock, 2023).

### Объект `as const` против `enum`

```ts
// Предпочтительно: стираемо, совместимо с JSON
const Level = { Low: "low", High: "high" } as const;
type Level = (typeof Level)[keyof typeof Level];
const lv: Level = "low";

enum E { A = "a" }
// @ts-expect-error: строковый enum номинален
const e1: E = "a";
enum N { A, B }
declare const someNum: number;
const n2: N = someNum; // числовой enum принимает любой number
```

- Числовой enum отвергает литерал вне диапазона (`const n: N = 99` — ошибка), но принимает значение типа `number`, так что проверка неполная (проверено локально).
- Хендбук прямо говорит, что в современном TS объекта `as const` может хватить: [Enums](https://www.typescriptlang.org/docs/handbook/enums.html) (TypeScript team, обновлено 2026-11-06).
- Аргументы против enum и эффект `erasableSyntaxOnly`: [Why I Don't Like Enums](https://www.totaltypescript.com/why-i-dont-like-typescript-enums) (Matt Pocock, 2024); [TypeScript 5.8 Ships --erasableSyntaxOnly](https://www.totaltypescript.com/erasable-syntax-only) (Matt Pocock, 2025).
- Разногласие: [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html) (Google, живой документ) запрещает только `const enum` и разрешает обычный `enum`. Для проектов с type stripping обычный enum не подходит, для прочих это вопрос соглашения. Если enum остаётся, включите [no-unsafe-enum-comparison](https://typescript-eslint.io/rules/no-unsafe-enum-comparison/) (typescript-eslint, живой документ).

### `readonly`: только мелкая и только компиляторная защита

```ts
type Cfg = { readonly tags: string[] };
const c: Cfg = { tags: [] };
c.tags.push("ok"); // компилируется: readonly не глубокий

const ro: readonly number[] = [1];
// @ts-expect-error: массивы проверяются
const mut: number[] = ro;

const alias: { readonly x: number } = { x: 1 };
const w: { x: number } = alias; // компилируется
w.x = 2; // readonly у свойств не влияет на присваиваемость
```

- `readonly T[]` защищает параметр от `push` и от проблемы ковариантности массивов. `readonly`-свойство обойти легко, как показывает третий пример (проверено локально). Рекомендация объявлять массивы-параметры `readonly`: [The Seven Sources of Unsoundness in TypeScript](https://effectivetypescript.com/2021/05/06/unsoundness/) (Dan Vanderkam, 2021).
- Google требует `readonly` для свойств, не переприсваиваемых вне конструктора ([Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)). Правило глубокой проверки есть, но требует информации о типах: [prefer-readonly-parameter-types](https://typescript-eslint.io/rules/prefer-readonly-parameter-types/) (typescript-eslint, живой документ).
- Когда нет: `readonly` не заменяет `Object.freeze` там, где важна неизменяемость в рантайме.

### Необязательное поле, `undefined` и `exactOptionalPropertyTypes`

```ts
type P = { name?: string };
// @ts-expect-error: поле либо есть со строкой, либо его нет
const p1: P = { name: undefined };
const p2: P = {};
type P3 = { name?: string | undefined }; // явно разрешаем undefined
```

- С флагом отсутствие ключа и `undefined` становятся разными состояниями ([exactOptionalPropertyTypes](https://www.typescriptlang.org/tsconfig/exactOptionalPropertyTypes.html), TypeScript team, живой документ). «Обязательное, но возможно undefined» — другой замысел, чем «необязательное» ([Optional vs. undefined](https://tkdodo.eu/blog/optional-vs-undefined), TkDodo, 2022).
- type-fest требует этот флаг: «Disabling it is unsupported» ([type-fest](https://github.com/sindresorhus/type-fest), Sindre Sorhus, живой документ).
- Валидаторы трактуют флаг по-разному: `z.number().optional()` и `v.optional()` дают `age?: number | undefined`, а `"age?"` в ArkType — `age?: number`. Значение из Valibot не присваивается типу ArkType, а наоборот можно (проверено локально).
- В приложении включайте флаг сразу, в существующем коде — вместе с проверкой типов схем.

### `noUncheckedIndexedAccess`: что сужает, а что нет

```ts
const arr = [1, 2];
const first = arr[0];
// @ts-expect-error: possibly undefined
first.toFixed();
for (const x of arr) x.toFixed(); // for-of не страдает
if (arr.length > 0) {
  const f0 = arr[0];
  // @ts-expect-error: проверка длины не сужает индекс
  f0.toFixed();
}
const ne: [number, ...number[]] = [1];
ne[0].toFixed(); // кортеж с головой безопасен
```

Проверка `length` не помогает. Выход: for-of, `.at()` с проверкой, деструктуризация с проверкой или тип `[T, ...T[]]` (проверено локально). Источники: [noUncheckedIndexedAccess](https://www.typescriptlang.org/tsconfig/noUncheckedIndexedAccess.html) (TypeScript team, живой документ); [Make accessing objects safer](https://www.totaltypescript.com/tips/make-accessing-objects-safer-by-enabling-nouncheckedindexedaccess-in-tsconfig) (Matt Pocock, год на странице не указан). Без флага индексный доступ входит в семь источников необоснованности типов: [Seven Sources](https://effectivetypescript.com/2021/05/06/unsoundness/).

## Generics и вывод типов

Вывод: параметр типа оправдан, только если связывает как минимум две позиции. Generic, встречающийся один раз, почти всегда лишний, а generic только в возвращаемом типе — скрытый каст. Вариантность аннотируют ради скорости и только после замера. В 7.1 ужесточены дистрибутивные условные типы, и библиотекам стоит проверить свой код заранее. При ревью generics задавайте один вопрос: какие две позиции связывает этот параметр. Если ответа нет, параметр удаляется.

### Золотое правило и generic только в возврате

```ts
// Неверно: возврат-only generic — скрытый `as`
function badParse<T>(s: string): T { return JSON.parse(s); }
const lie = badParse<{ a: number }>("1"); // компилируется, в рантайме 1

// Верно: unknown и разбор схемой
function parse(s: string): unknown { return JSON.parse(s); }
```

- Параметр типа должен встречаться минимум дважды: [The Golden Rule of Generics](https://effectivetypescript.com/2020/08/12/generics-golden-rule/) (Dan Vanderkam, 2020). Правило автоматизировано: [no-unnecessary-type-parameters](https://typescript-eslint.io/rules/no-unnecessary-type-parameters/) (typescript-eslint, живой документ), входит в `strict-type-checked`. В документации оговорено, что `T[]` считается вторым использованием, поэтому `createStateHistory<T>(): T[]` правило пропускает.
- Google: «Avoid creating APIs that have return type only generics» ([Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)). Угловые скобки при вызове «either unnecessary, or you're lying to yourself»: [Type-safe React Query](https://tkdodo.eu/blog/type-safe-react-query) (TkDodo, 2023).
- Излишний generic: `function len<T extends {length:number}>(x:T): number` не связывает ничего, достаточно параметра `{length:number}` (следует из золотого правила).

### Места вывода и частичное применение типов

```ts
// Частичного вывода в TS нет, каррирование создаёт вторую точку вывода
const route = <Ctx,>() =>
  <const P extends string>(path: P, h: (c: Ctx, p: P) => void) => ({ path, h });
const r = route<{ uid: string }>()("/x", (c, p) => { c.uid; /* p: "/x" */ });
```

- TS не поддерживает частичный вывод: указав один аргумент типа, надо указать все, пропущенные берут значения по умолчанию ([React Query and TypeScript](https://tkdodo.eu/blog/react-query-and-type-script), TkDodo, 2021, обновлено 2023). Каррирование и классы как новые места вывода: [Generic Tips Part 1](https://effectivetypescript.com/2020/12/04/gentips-1-curry/) (Dan Vanderkam, 2020). Пример проверен локально.
- Когда нет: достаточно типизировать вход и дать компилятору вывести остальное. Это и советует TkDodo вместо ручных generics.

### `NoInfer`

```ts
function createFSM<S extends string>(cfg: { states: S[]; initial: NoInfer<S> }) { return cfg; }
// @ts-expect-error: "c" нет в states
createFSM({ states: ["a", "b"], initial: "c" });

function bad<S extends string>(cfg: { states: S[]; initial: S }) { return cfg; }
bad({ states: ["a", "b"], initial: "c" }); // компилируется: "c" стал кандидатом S
```

Когда: параметр должен быть проверен, но не должен участвовать в выводе. Когда нет: единственное место вывода (тогда `T` вообще не выведется). Проверено локально. Источники: [TypeScript 5.4](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-4.html) (TypeScript team, 2024); [PR #56794](https://github.com/microsoft/TypeScript/pull/56794) (Anders Hejlsberg, 2023–2024); [NoInfer](https://www.totaltypescript.com/noinfer) (Matt Pocock, 2024).

### Аннотации вариантности `in` / `out`

```ts
interface Box<out T> { get(): T }
// @ts-expect-error: аннотация противоречит структуре
interface Bad<out T> { set: (v: T) => void }
```

- Хендбук категоричен: «Never write a variance annotation that doesn't match the structural variance!». Аннотации действуют только при сравнении инстанцирований одного типа. Выигрыш обещан лишь «small», и только после профайлера: [Generics → Variance Annotations](https://www.typescriptlang.org/docs/handbook/2/generics.html) (TypeScript team, живой документ); [PR #48240](https://github.com/microsoft/TypeScript/pull/48240) (Anders Hejlsberg, 2022); [TypeScript 4.7](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-7.html) (TypeScript team, 2022).
- Практика расходится с «small». В TanStack Table аннотация `Table_Internal` снизила инстанцирования react-адаптера с 136k до 66k, аннотация всех 166 параметров — до 54,7k. Причина: когда параметр проходит через условные типы, измерение вариантности помечается ненадёжным, и компилятор сравнивает структурно. Аннотация на `TValue` сломала сборку, запретив нужное ковариантное расширение: [TypeScript Performance in TanStack Table V9](https://tanstack.com/blog/tanstack-table-v9-typescript-performance) (Kevin Van Cott, 2026).
- В `effect` 4.1.2 объявлено `Effect<out A, out E = never, out R = never>`, а в `$ZodType` Zod 4.6.7 аннотаций нет (проверено локально по `.d.ts`).
- Аннотации разумно включать только в крупных generic-интерфейсах библиотек с условными типами, с замером до и после.

### Условные типы: дистрибуция и новое поведение 7.1

```ts
type D<T> = T extends string ? "s" : "n";          // D<string|number> = "s"|"n"
type ND<T> = [T] extends [string] ? "s" : "n";     // ND<string|number> = "n"

type U = { k: "a"; a: 1; id: string } | { k: "b"; b: 2; id: string };
type O1 = Omit<U, "id">;                                     // теряет связь: остаётся { k }
type DOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
// @ts-expect-error: дистрибутивный вариант сохраняет обязательность `a`
const o3: DOmit<U, "id"> = { k: "a" };
```

- Дистрибуция идёт только по «голому» параметру: [TypeScript 2.8](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html) (TypeScript team, 2018); [Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html) (TypeScript team, живой документ). Примеры проверены локально.
- 7.1 beta: внутри дистрибутивной ветки `A` уже сужен, и ограничения, полагавшиеся на недистрибутивный `A`, теперь падают: [Announcing TypeScript 7.1 Beta](https://devblogs.microsoft.com/typescript/announcing-typescript-7-1-beta/) (TypeScript team, 2026-10-20).

```ts
type Show<A extends number, B extends A> = `${B} extends ${A}`;
type Issue<A extends number, B extends A> = A extends B ? never : Show<A, B>;  // TS2344 в 7.1
type Fixed<A extends number, B extends A> = A extends B ? never : B extends A ? Show<A, B> : never;
```

Локально: `Issue` компилируется на 7.0.2 и даёт TS2344 на 7.1.0-beta («'B' is only assignable to the non-distributed 'A'»). Обход `Fixed` (вложенная проверка `B extends A`, которая возвращает ограничение) проходит на обоих. Изменение затрагивает в первую очередь type-level-библиотеки. Прогон CI на `typescript@beta` покажет проблему до релиза.

- Условный возвращаемый тип по-прежнему требует каста в теле: `if (typeof x === "string") return "a"` при возврате `T extends string ? string : number` даёт TS2322 на 7.0.2 и 7.1.0-beta (проверено локально). Перегрузки здесь часто честнее.

### Mapped types

```ts
type Getters<T> = { [K in keyof T & string as `get${Capitalize<K>}`]: () => T[K] };
```

Одна mapped-конструкция с `as` дешевле цепочки `Partial<Pick<Omit<…>>>`: «Use fewer mapped types that do more» ([TypeScript Type Performance Cheat Sheet](https://gist.github.com/ssalbdivad/ec7628cfc36354a5d20b86390586593e), David Blass, 2025). Когда нет: если проще интерфейс и наследование (Google: повторение дешевле сложных типов, [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)).

### Пределы рекурсии

Проверено в исходниках компилятора 7.

| Предел | Значение | Что происходит |
|---|---|---|
| Глубина инстанцирования | 100 | TS2589 |
| Счётчик инстанцирований | 5 000 000 | TS2589; счётчик периодически обнуляется |
| Хвостовая рекурсия условных типов | 1000 итераций | Ошибка глубины |
| Перемножение union при пересечении | 100 000 членов | «union type that is too complex» |

Источник: [checker.go](https://raw.githubusercontent.com/microsoft/typescript-go/main/internal/checker/checker.go) (TypeScript team, ветка main на 2026-11). Хвостовая рекурсия: [TypeScript 4.5](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-5.html) (TypeScript team, 2021); [PR #45711](https://github.com/microsoft/TypeScript/pull/45711) (Anders Hejlsberg, 2021).

```ts
// Верно: накопитель, вызов в хвостовой позиции
type Rep<S, N extends number, A extends S[] = []> =
  A["length"] extends N ? A : Rep<S, N, [...A, S]>;   // Rep<"x", 999> работает

// Неверно: рекурсия внутри кортежа не хвостовая
type NonTail<N extends number, A extends unknown[] = []> =
  A["length"] extends N ? [] : [0, ...NonTail<N, [...A, 0]>];   // NonTail<200> → TS2589
```

Проверено локально на всех трёх компиляторах. Сравнений с пределами других версий нет: цифры взяты из main. Цена глубокой хвостовой рекурсии на TS 7 выше, чем на 6.0 (см. [Стоимость типов при компиляции](#стоимость-типов-при-компиляции)).

### Перегрузки против union

```ts
function ov(x: string): string;
function ov(x: number): number;
function ov(x: string | number) { return x; }
declare const su: string | number;
// @ts-expect-error: перегрузка не принимает union
ov(su);

function un(x: string | number) { return x; } // принимает и union
```

- «Always prefer parameters with union types instead of overloads when possible» ([More on Functions](https://www.typescriptlang.org/docs/handbook/2/functions.html), TypeScript team, живой документ). Перегрузки, различающиеся только хвостовыми параметрами, заменяйте необязательными, если возвращаемый тип один: [Do's and Don'ts](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html) (TypeScript team, живой документ). Автопроверка: [unified-signatures](https://typescript-eslint.io/rules/unified-signatures/).
- Когда перегрузки уместны: возвращаемый тип зависит от входа. Порядок влияет на цену: в EdgeDB/Gel группировка перегрузок снизила инстанцирования оператора `++` со 102 до 8: [An approach to optimizing TypeScript type checking performance](https://www.geldata.com/blog/an-approach-to-optimizing-typescript-type-checking-performance) (Scott Trinh, 2024).

### Функциональное свойство против метода: бивариантность

```ts
interface MethodStyle<T> { accept(x: T): void }
interface PropStyle<T> { accept: (x: T) => void }
declare const m: MethodStyle<string>;
const m2: MethodStyle<string | number> = m;  // компилируется, это дыра
declare const p: PropStyle<string>;
// @ts-expect-error: strictFunctionTypes
const p2: PropStyle<string | number> = p;
```

- `strictFunctionTypes` не распространяется на методы, чтобы `Array<T>` оставался ковариантным: [TypeScript 2.6](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-6.html) (TypeScript team, 2017). Флага `strictMethodTypes` нет из-за массы существующего кода: [FAQ: Why Method Bivariance?](https://github.com/microsoft/TypeScript/wiki/FAQ) (TypeScript team, живой документ). Практика: [Method Shorthand Syntax Considered Harmful](https://www.totaltypescript.com/method-shorthand-syntax-considered-harmful) (Matt Pocock, 2024); правило [method-signature-style](https://typescript-eslint.io/rules/method-signature-style/) (typescript-eslint, живой документ). Проверено локально.
- Когда оставить метод: перегрузки или намеренное бивариантное поведение (классические иерархии обработчиков).

## Границы типобезопасности

Вывод: каждое `as`, `!`, `any`, пользовательский предикат или `@ts-expect-error` — ручная гарантия, которую компилятор не проверяет. Их стоит собирать в маленькие проверенные функции. Предикаты опаснее, чем кажутся, из-за ветки `false`. Полезная метрика ревью: число `as`, `!` и предикатов в доменном коде. Сами по себе они не ошибка, но каждый должен сидеть в одной функции с рантайм-проверкой.

### `any` против `unknown`

```ts
const a: any = JSON.parse("1");
const s: string = a;          // компилируется, any течёт дальше

const u: unknown = JSON.parse("1");
// @ts-expect-error
u.foo;
```

- «`any` is dangerous - it can mask severe programming errors» ([Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)). `any` стоит первым в списке источников необоснованности с рекомендацией заменять на `unknown`: [Seven Sources](https://effectivetypescript.com/2021/05/06/unsoundness/).
- Дополнительные правила: [no-unsafe-function-type](https://typescript-eslint.io/rules/no-unsafe-function-type/), [no-wrapper-object-types](https://typescript-eslint.io/rules/no-wrapper-object-types/), [no-empty-object-type](https://typescript-eslint.io/rules/no-empty-object-type/) (typescript-eslint, живые документы); базовые `no-unsafe-*` описаны в [toolchain.md](toolchain.md). Почему `{}` не означает «пустой объект»: [The Empty Object Type](https://www.totaltypescript.com/the-empty-object-type-in-typescript) (Matt Pocock, 2023).

### Assertions и non-null

```ts
// @ts-expect-error: TS2352, типы не пересекаются
const n1 = "a" as number;
const n2 = "a" as unknown as number; // компилируется: двойной каст снимает проверку
const m = new Map<string, number>();
m.get("a")!.toFixed();               // компилируется, падает в рантайме
```

- Утверждения «only silence the TypeScript compiler, but do not insert any runtime checks». Нужна «obvious or explicit reason». При двойном касте промежуточным должен быть `unknown`, а не `any` ([Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)).
- Линтер: [no-unsafe-type-assertion](https://typescript-eslint.io/rules/no-unsafe-type-assertion/) запрещает сужающие `as`, [no-non-null-assertion](https://typescript-eslint.io/rules/no-non-null-assertion/), [consistent-type-assertions](https://typescript-eslint.io/rules/consistent-type-assertions/), [no-unnecessary-type-assertion](https://typescript-eslint.io/rules/no-unnecessary-type-assertion/) (typescript-eslint, живые документы).
- Когда `as` оправдан: фабрика brand-типа, тест, место, где компилятор заведомо слабее (перед этим проверка в рантайме).
- Когда нет: данные извне.

### Предикаты: важна ветка `false`

```ts
// Неверно: false не значит "не string"
function isShort(x: string | number): x is string {
  return typeof x === "string" && x.length < 3;
}
declare const v: string | number;
if (!isShort(v)) v.toFixed(); // компилируется, но v может быть длинной строкой
```

- Предикат обязан быть верен «if and only if». Иначе ветка `else` получает ложный тип: [The Hidden Side of Type Predicates](https://effectivetypescript.com/2024/02/27/type-guards/) (Dan Vanderkam, 2024). Проверено локально. Компилятор тело предиката на соответствие не проверяет.
- Вывод предикатов (5.5) делает это за вас и не выводит предикат, если условие не iff: `filter(x => x !== null)` даёт `number[]`, а `[1,0,null].filter(x => !!x)` оставляет `null` в типе, потому что `0` тоже отбрасывается. Проверено локально. Источники: [TypeScript 5.5](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-5.html) (TypeScript team, 2024); [PR #57465](https://github.com/microsoft/TypeScript/pull/57465) (Dan Vanderkam, 2024); [The Making of a TypeScript Feature](https://effectivetypescript.com/2024/04/16/inferring-a-type-predicate/) (Dan Vanderkam, 2024).
- Когда: типы-сужения, где условие точно совпадает с типом.
- Когда нет: фильтры вида «число и маленькое»; там inline-условие даёт верные типы в обеих ветках.

### Asserts-функции

```ts
function assertS(x: unknown): asserts x is string { if (typeof x !== "string") throw new Error("no"); }

const arrow = (x: unknown): asserts x is number => { if (typeof x !== "number") throw 0; };
declare const w: unknown;
// @ts-expect-error: TS2775, имя должно иметь явную аннотацию
arrow(w);

```

Стрелка с `asserts` без явной аннотации переменной не работает, а `function`-объявление работает (проверено локально). Применяйте на пороге функции для инвариантов. Для ожидаемых ошибок лучше Result (см. [Ошибки](#ошибки)). Источник: [TypeScript 3.7](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html) (TypeScript team, 2019).

### `@ts-expect-error`

- `@ts-expect-error` падает, когда ошибки нет (TS2578), поэтому не устаревает молча: [TypeScript 3.9](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-9.html) (TypeScript team, 2020). Именно он поймал ошибку в типизированном builder (см. [Builder с типами](#builder-с-типами-типовая-ошибка-в-проверке)) (проверено локально).
- Разногласие: Google запрещает `@ts-ignore`, `@ts-expect-error` и `@ts-nocheck` вне тестов («You may use @ts-expect-error in unit tests, though you generally should not») ([Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)). Правило `ban-ts-comment` из typescript-eslint допускает директиву с описанием. Разумный компромисс: разрешить в тестах типов и в миграциях с обязательным комментарием-причиной.

### Declaration merging и module augmentation

```ts
declare global { interface ArrayConstructor { demoX?: number } } // только патч
```

- Ограничения: нельзя добавлять новые объявления верхнего уровня, только дополнять существующие; default-экспорт дополнить нельзя; классы не сливаются с классами и переменными. Более поздний интерфейс получает приоритет в списке перегрузок: [Declaration Merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html) (TypeScript team, живой документ).
- Слияние класса с интерфейсом добавляет поля, которых нет в рантайме: [no-unsafe-declaration-merging](https://typescript-eslint.io/rules/no-unsafe-declaration-merging/) (typescript-eslint, живой документ).
- JSR считает `declare global` и `declare module` «slow types», замедляющими потребителей: [About slow types](https://jsr.io/docs/about-slow-types) (Deno / JSR, живой документ).
- Новые в 7.1 ambient-объявления с атрибутами импорта (`declare module "*" with { type: "bytes" }`) не встроены. Команда TS рекомендует не включать их в опубликованные пакеты: [Announcing TypeScript 7.1 Beta](https://devblogs.microsoft.com/typescript/announcing-typescript-7-1-beta/).

### ts-reset

Меняет глобальные типы: `JSON.parse` и `.json()` возвращают `unknown`, `.filter(Boolean)` убирает ложные типы, `Array.isArray` не сужает до `any[]`. Правило: «ts-reset is designed to be used in application code, not library code» ([TS Reset — Official Docs](https://www.totaltypescript.com/ts-reset), Matt Pocock, живой документ; [mattpocock/ts-reset](https://github.com/mattpocock/ts-reset)). Работает на TS 7.0.2, включая `JSON.parse` → `unknown` и `.filter(Boolean)` (проверено локально). Последняя версия 0.6.1 от 2024-09-02 (npm, проверено локально).

## Ошибки

Вывод: типизированного `throws` в TS не будет, поэтому типизированные ошибки живут либо в возвращаемом значении, либо в эффект-системе. Самописного Result достаточно для большинства кодовых баз. `better-result` и `neverthrow` добавляют сцепку, Effect оправдан только при принятии всей его модели. Правило: ожидаемые отказы возвращаются значением, исключения оставляются для багов и нештатных ситуаций.

### `throws` отвергнут

Предложение о `throws` закрыто как Declined. Райан Кавано: «This issue is concluded and will not be reopened» (2023-11-10): [#13219](https://github.com/microsoft/TypeScript/issues/13219) (TypeScript team, 2016–2023). Обзор причин: [Why TypeScript Doesn't Include a throws Keyword](https://www.learningtypescript.com/articles/why-typescript-doesnt-include-a-throws-keyword) (Josh Goldberg, 2024).

### `catch` и `Error.cause`

```ts
class AppError<T extends string> extends Error {
  readonly tag: T;
  constructor(tag: T, msg: string, opts?: ErrorOptions) {
    super(msg, opts); this.tag = tag; this.name = tag;
  }
}
try { JSON.parse(s); }
catch (cause) { throw new AppError("ParseFailed", "bad input", { cause }); }
```

- `cause` типизирован как `unknown` (проверено локально на `lib: esnext`). Семантика: [Error: cause](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause) (MDN, живой документ). Параметр-свойство здесь намеренно не использован: оно несовместимо с type stripping (см. [toolchain.md](toolchain.md)).
- С `useUnknownInCatchVariables` переменная `e` — `unknown` ([TSConfig](https://www.typescriptlang.org/tsconfig/#useUnknownInCatchVariables), TypeScript team, живой документ; [TypeScript 4.4](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-4.html), 2021). Колбэк `.catch((e) => e.anything.goes)` всё ещё получает `any` (проверено локально), его закрывает [use-unknown-in-catch-callback-variable](https://typescript-eslint.io/rules/use-unknown-in-catch-callback-variable/). Бросать только Error: [only-throw-error](https://typescript-eslint.io/rules/only-throw-error/), [prefer-promise-reject-errors](https://typescript-eslint.io/rules/prefer-promise-reject-errors/) (typescript-eslint, живые документы). Извлечение сообщения из `unknown`: [Get a catch block error message with TypeScript](https://kentcdodds.com/blog/get-a-catch-block-error-message-with-typescript) (Kent C. Dodds, 2021).
- `Error.isError()` появляется в `--lib es2026` и стабильном target в 7.1 beta ([Announcing TypeScript 7.1 Beta](https://devblogs.microsoft.com/typescript/announcing-typescript-7-1-beta/)); предложение завершено ([TC39 finished proposals](https://github.com/tc39/proposals/blob/HEAD/finished-proposals.md)).

### Union ошибок как значение

```ts
type Err = { kind: "NotFound"; id: string } | { kind: "Conflict"; version: number };
type R<T, E> = { ok: true; value: T } | { ok: false; error: E };
declare function f(): R<number, Err>;
const r = f();
if (!r.ok) switch (r.error.kind) {
  case "NotFound": r.error.id; break;
  case "Conflict": r.error.version; break;
  default: { const n: never = r.error; }
}
```

Проверено локально. Формулировку разделения «значение для ожидаемого, исключение для бага» поддерживает [neverthrow README](https://github.com/supermacro/neverthrow) (Giorgio Delgado, живой документ): там обработка исключений сравнивается с `goto`, но признаётся, что полезные случаи `throw` остаются.

### Библиотеки Result и Effect

Версии по npm на 2026-11-08, размеры — минимальная сборка, gzip (проверено локально).

| Библиотека | Версия | Сильное | Слабое | Размер |
|---|---|---|---|---|
| Свой union | — | Без зависимостей, стираем | Нет сцепки | 0 |
| neverthrow | 8.2.0, 2025-02-21 | `ResultAsync`, `safeTry`, ESLint-плагин, аналог `must-use` | Нет релизов ~20 месяцев; инстанс-методы хуже tree-shake-ятся | 1 979 B |
| better-result | 3.0.1, 2026-08-11 | `Result.gen`, `TaggedError` с `.match`, `Panic` для дефектов | Молодая библиотека | 3 155 B |
| Effect | 4.1.2, 2026-11-02 | Типизированный канал ошибок, рантайм, ретраи, DI | Отдельный стиль программирования | 31 467 B |

- Все три API скомпилированы на TS 7.0.2, 6.0.3, 7.1.0-beta (проверено локально). В better-result 3 `class NotFound extends TaggedError("NotFound")<{ … }> {}` объявляется без завершающего вызова: тот убран в 3.0.
- [better-result](https://github.com/dmmulroy/better-result) (Dillon Mulroy, 2026): брошенное внутри колбэка исключение становится `Panic`, а не расширяет тип ошибки. `yield*` даёт объединение всех ошибок. `retry` со `signal` не отменяет саму операцию без проброса в неё.
- Различия Effect и neverthrow описаны на [Effect vs neverthrow](https://effect.website/docs/additional-resources/effect-vs-neverthrow/) (Effect team, живой документ): функции на `pipe` вместо методов, генераторы без оборачивания результата, отклонённый Promise становится `UnknownException`.
- Расхождение с вендором: [Effect 4.0](https://effect.website/blog/releases/effect/40) (Effect team, 2026-09-30) заявляет минимальную программу 7,1 kB gzip против 35,6 kB у 3.x. Сборка `Effect.runFork(Effect.succeed(1))` через esbuild 0.28.2 дала 31,5 kB. Блог не приводит тестовый файл, поэтому причина расхождения неясна.
- fp-ts `[устарело]` → `effect`.

Выбор: свой union (3–5 строк) по умолчанию. `better-result`, если нужны сцепка и генераторы. neverthrow — для тех, кто уже его использует, учитывая паузу в релизах. Effect — если команда принимает всю модель: только ради Result он не окупается.

## Валидация на границах

Вывод: Zod 4 — разумный выбор по умолчанию. Valibot выигрывает, когда важен бандл. TypeBox и ArkType подходят, когда важна скорость или JSON Schema, с поправкой на режим без `eval`. Код библиотек пишите против Standard Schema. В esbuild форма импорта Zod меняет размер в 3,7 раза.

### Таблица замеров

Условия (проверено локально): esbuild 0.28.2, `--bundle --minify`, gzip 9; одна схема email + password; для инстанцирований 100 схем на TS 7.0.2.

| Библиотека | min + gzip | Инстанцирований на 100 схем | Check, с (TS 7, медиана из 3) | `Function(` в рантайме |
|---|---|---|---|---|
| Valibot 1.5.0 | 1,4 kB | 38 537 | 0,046 | Нет (по документации) |
| Zod Mini 4.6.7 | 5,0 kB | 25 214 | 0,043 | Да, с флагом `jitless` |
| Zod 4.6.7, `import * as z` | 25,0 kB | 22 589 | 0,039 | Да, с флагом `jitless` |
| Zod 4.6.7, `import { z }` | 93,0 kB | то же | то же | то же |
| TypeBox 1.4.6, Value | 38,7 kB | 35 208 | 0,048 | В `evaluate.mjs` |
| TypeBox 1.4.6, Compile | 41,9 kB | то же | то же | С откатом без JIT |
| ArkType 2.2.9 | 47,8 kB | 206 038 | 0,163 | Да, есть `jitless` |
| Effect Schema 4.1.2 | 99,9 kB | не измерено | не измерено | — |

- Цифра для `import { z }` воспроизвелась с `zod/v4`: 92 938 B, а с `import * as z` — 25 001 B, на обеих платформах esbuild. В сборке `import * as z` заметно присутствуют `to-json-schema.js` и `json-schema-processors.js` (metafile). Другие бандлеры не проверялись, поэтому до выбора измерьте свой.
- Заявления вендоров другие, потому что другие входные файлы. Zod: 5,36 kB для `z.boolean().parse` на rollup, Mini — 1,88 kB ([Zod 4 release notes](https://zod.dev/v4), Colin McDonnell, 2025). Valibot: формуляр логина 1,37 kB против Zod 17,7 kB (esbuild) и Zod Mini ~6,88 kB ([Comparison](https://valibot.dev/guides/comparison/), Fabian Hiller, живой документ).
- Valibot признаёт, что по скорости валидации находится «in the midfield» и «much slower than Typia and TypeBox» ([Comparison](https://valibot.dev/guides/comparison/)). Относительная скорость (TypeBox и ArkType быстрее Ajv, Zod ~4–6×, Valibot ~16×) получена на другой машине и здесь не перемерялась `[не проверено]`; методика замеров — в [benchmarking.md](benchmarking.md).
- Для бэкенда разница в десятки kB обычно неважна, для браузера и edge решает. Форму импорта стоит измерить в любом случае.

### Режим без `eval` и CSP

- Zod 4 включает JIT по `globalConfig.jitless` и `allowsEval` (`v4/core/schemas.js`, проверено локально). С 4.4 jitless-режим не запускает проверку `eval`, если задан до первого обращения: [jitless-allows-eval.test.ts](https://unpkg.com/zod@4.4.3/src/v4/classic/tests/jitless-allows-eval.test.ts) (Zod, версия 4.4.3).
- TypeBox: «automatic fallback to dynamic validation in JIT restricted environments such as Cloudflare Workers» ([sinclairzx81/typebox](https://github.com/sinclairzx81/typebox), Haydn Paterson, живой документ).
- ArkType объявляет `jitless` в `@ark/schema/out/config.d.ts`, код содержит `new Function` (проверено локально). Официальной документации о поведении под CSP не найдено.

### Какой валидатор когда

| Случай | Выбор | Почему |
|---|---|---|
| Приложение, общий случай | Zod 4 (`import * as z`) | Экосистема, `z.toJSONSchema()` |
| Браузер или edge, важен размер | Valibot или Zod Mini | См. таблицу |
| Контракт уже на JSON Schema, Fastify | TypeBox | Сам является JSON Schema; поддерживает все драфты ([README](https://github.com/sinclairzx81/typebox)) |
| Максимальная скорость, TS-подобный синтаксис | ArkType | Самая дорогая для компилятора: 9× инстанцирований Zod |
| Типы уже описаны как TS, хочется AOT | typia | Нужен `ttsc`, а не stock `tsc` |
| Библиотека принимает схему пользователя | Standard Schema | Без зависимости от вендора |

- typia: для TS 7 нужен `ttsc` 0.36.3 и новее, поддерживаются 7.0 и 7.1; `tsc`, `ts-node` и `tsx` трансформер не применяют. Для TS < 7 — наследие на typia 12: [Typia Setup](https://typia.io/docs/setup) (Jeongho Nam, живой документ); [samchon/ttsc](https://github.com/samchon/ttsc). Сам трансформер локально не запускался.
- Standard Schema: `"~standard"` с `version: 1`, `vendor`, `validate`, опциональными `types`; расширение `StandardJSONSchemaV1` с target `draft-2020-12`, `draft-07`, `openapi-3.0`: [Standard Schema](https://standardschema.dev/) (Colin McDonnell, Fabian Hiller, David Blass, 2024–). Одна generic-функция приняла схемы Zod, Valibot и ArkType (проверено локально). На главной странице нет списка реализаций, он есть в репозитории.
- Рекомендация Zod авторам библиотек: при работе со схемой как чёрным ящиком использовать Standard Schema; иначе `zod/v4/core` как постоянную ссылку и `T extends z4.$ZodType` вместо `$ZodType<T>`: [For library authors](https://zod.dev/library-authors) (Colin McDonnell, живой документ). Исходная идея: [Designing the perfect Typescript schema validation library](https://colinhacks.com/essays/zod) (Colin McDonnell, 2020).

## Мини-каталог паттернов

Вывод: GoF в TS обычно сводится к функциям, union и таблицам. Builder с типами полезен только при реальной необходимости проверять полноту. Декораторы TC39 в 2026 году вернулись на Stage 2.7, что меняет оценку риска. `using` и iterator helpers готовы к применению. Для каждого паттерна ниже: пример, когда брать, когда нет.

### Builder с типами: типовая ошибка в проверке

```ts
class Req<Has extends string = never> {
  readonly #s: Record<string, string>;
  private constructor(s: Record<string, string>) { this.#s = s; }
  static create() { return new Req({}); }
  url(u: string): Req<Has | "url"> { return new Req({ ...this.#s, url: u }); }
  method(m: "GET" | "POST"): Req<Has | "method"> { return new Req({ ...this.#s, method: m }); }

  // Неверно: build(this: Req<"url" | "method">)
  // Req<"url"> присваивается Req<"url"|"method">, поэтому неполный builder проходит

  // Верно: требуем, чтобы все ключи входили в Has
  build(this: ["url" | "method"] extends [Has] ? Req<Has> : never) { return (this as Req<Has>).#s; }
}
Req.create().url("/").method("GET").build();
// @ts-expect-error: нет method
Req.create().url("/").build();
```

- Неверный вариант компилировался, и это обнаружил `@ts-expect-error`: проверка через расширяющийся union в `this` ложно успешна (проверено локально). Исправление: условный тип, который требует вхождения всех обязательных ключей в `Has`.
- Когда: API конфигурации с обязательными шагами.
- Когда нет: всё помещается в объект аргументов. Объект с обязательными полями проще и дешевле для компилятора.
- Негативные тесты с `@ts-expect-error` для такого builder обязательны.
- Источники: [Builder in TypeScript](https://refactoring.guru/design-patterns/builder/typescript/example) (Refactoring.Guru, живой документ); пример типизированного построителя запросов: [Kysely](https://kysely.dev/docs/intro) (Sami Koskimäki, живой документ).

### Конечный автомат: руками или XState

```ts
type S = { t: "idle" } | { t: "run"; pid: number } | { t: "done"; code: number };
type Ev = { t: "start"; pid: number } | { t: "exit"; code: number };
function step(s: S, e: Ev): S {
  switch (s.t) {
    case "idle": return e.t === "start" ? { t: "run", pid: e.pid } : s;
    case "run": return e.t === "exit" ? { t: "done", code: e.code } : s;
    case "done": return s;
  }
}
```

- Рукописный автомат: чистая функция, без зависимостей (проверено локально). Брать, когда состояний немного и они плоские.
- XState v5: нужен TS ≥ 5.0, типы задаются через `setup({ types })`, `strictNullChecks` «Strongly recommended». Typegen «не поддерживается в XState v5» `[устарело]` → `setup()` и `assertEvent`. `setup` проверен на TS 7.0.2 и 6.0.3 (проверено локально). Минимальная машина — 16,3 kB gzip (проверено локально). Брать, если нужны вложенные состояния, акторы, визуализация.
- Источники: [TypeScript | Stately](https://stately.ai/docs/typescript), [Setup](https://stately.ai/docs/setup), [Migrating from v4 to v5](https://stately.ai/docs/migration) (Stately, живые документы); [statelyai/xstate](https://github.com/statelyai/xstate).
- Сравнения скорости рукописного автомата и XState нет.

### Strategy как таблица функций

```ts
type Fmt = "json" | "csv";
// Верно: satisfies требует полноты и сохраняет точные ключи
const enc = {
  json: (x: unknown) => JSON.stringify(x),
  csv: (x: unknown) => String(x),
} satisfies Record<Fmt, (x: unknown) => string>;
// Без ключа csv satisfies даёт ошибку компиляции
```

Проверено локально. Классы-стратегии ([Strategy in TypeScript](https://refactoring.guru/design-patterns/strategy/typescript/example), Refactoring.Guru) нужны только при состоянии внутри стратегии или внедрении по интерфейсу.

### Repository и Mixins

- Repository: интерфейс-коллекция `Repo<T extends { id: string }>` с `find(id): Promise<T | undefined>` и `save(x): Promise<void>`, реализация для тестов — функция над `Map` (проверено локально). Смысл паттерна — коллекционный интерфейс поверх данных: [Repository](https://martinfowler.com/eaaCatalog/repository.html) (Martin Fowler, 2002). Обёртка над типизированной ORM только ради наличия слоя добавляет код без новых гарантий `[не проверено]`.
- Mixins: `type Ctor<T = object> = new (...a: any[]) => T` и функция, возвращающая `class extends Base` (проверено локально). Статические свойства mixin не параметризуются: [Mixins](https://www.typescriptlang.org/docs/handbook/mixins.html) (TypeScript team, живой документ). Применять редко; композиция обычно проще.

### Декораторы: стандарт и легаси

```ts
function logged<A extends unknown[], R>(fn: (...a: A) => R, ctx: ClassMethodDecoratorContext) {
  return function (this: unknown, ...a: A): R { return fn.apply(this, a); };
}
class Q { @logged m(x: number) { return x; } }
```

- В мае 2026 TC39 вернул декораторы со Stage 3 на Stage 2.7 из-за отсутствия прогресса в реализациях: [TC39 notes 2026-05-19](https://github.com/tc39/notes/blob/HEAD/meetings/2026-05/may-19.md); [proposal-decorators](https://github.com/tc39/proposal-decorators). Документация TS всё ещё называет их «Stage 3» `[устарело]`: [Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html) (TypeScript team, живой документ).
- Легаси и стандарт несовместимы: стандартные не поддерживают `emitDecoratorMetadata` и не декорируют параметры, а `--experimentalDecorators` остаётся «for the foreseeable future»: [TypeScript 5.0](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html). Поэтому фреймворкам с DI по параметрам нужен легаси-флаг.
- Нативной поддержки в V8 нет, а Node 24 падает на `@d` (см. [toolchain.md](toolchain.md)). Google: «Do not define new decorators» ([Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)).
- Когда: фреймворк требует.
- Когда нет: новый код, который можно написать обычной функцией-обёрткой.
- Декораторы стоит считать нестабильными на годы вперёд: сроков возврата на Stage 3 нет.

### `using` / `Disposable`

```ts
class Res implements Disposable { [Symbol.dispose]() {} }
function u() { using r = new Res(); }                    // освобождение при выходе из блока
async function au() {
  await using r = { async [Symbol.asyncDispose]() {} };
  const st = new DisposableStack(); st.defer(() => {}); st.dispose();
}
```

Проверено локально на всех трёх компиляторах с `lib: esnext`. Предложение значится в [finished proposals](https://github.com/tc39/proposals/blob/HEAD/finished-proposals.md), хотя README самого [proposal-explicit-resource-management](https://github.com/tc39/proposal-explicit-resource-management) ещё пишет «Stage 3»; приоритет у таблицы завершённых. Источники: [TypeScript 5.2](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-2.html) (TypeScript team, 2023); [using](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/using) (MDN, живой документ); [TypeScript 5.2's New Keyword: 'using'](https://www.totaltypescript.com/typescript-5-2-new-keyword-using) (Matt Pocock, 2023).

### Iterator helpers


Пример: `[1, 2, 3].values().filter(f).map(g).take(1).toArray()` и `gen().map(f).drop(0)` для генераторов (проверено локально). Ленивые, не создают промежуточных массивов. Типы: `IteratorObject` с 5.6 ([TypeScript 5.6](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-6.html), TypeScript team, 2024). Завершённое предложение ([proposal-iterator-helpers](https://github.com/tc39/proposal-iterator-helpers)); [Iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator) (MDN, живой документ); [Iterator helpers](https://v8.dev/features/iterator-helpers) (V8, 2024). `Iterator.concat` — в стабильном `es2026`; `Iterator.zip`, `chunks` — только `esnext` на 7.1 beta ([Announcing TypeScript 7.1 Beta](https://devblogs.microsoft.com/typescript/announcing-typescript-7-1-beta/)). Когда нет: мелкий массив, где `filter/map` читаются так же.

### Типобезопасный event emitter

```ts
type Events = { open: [id: string]; close: [] };
class Emitter<M extends Record<string, unknown[]>> {
  readonly #h: { [K in keyof M]?: Set<(...a: M[K]) => void> } = {};
  on<K extends keyof M>(k: K, f: (...a: M[K]) => void) {
    const s = (this.#h[k] ??= new Set()); s.add(f); return () => { s.delete(f); };
  }
  emit<K extends keyof M>(k: K, ...a: M[K]) { this.#h[k]?.forEach((f) => f(...a)); }
}
const em = new Emitter<Events>();
// @ts-expect-error: open требует id
em.emit("open");
```

- Mapped-поле избавляет от `as` в реализации (проверено локально; вариант с `Set<(...a: never[]) => void>` не компилировался, TS2352).
- Node: `new EventEmitter<{ data: [Buffer]; end: [] }>()` работает с `@types/node@24`, включая проверку аргументов (проверено локально).
- Готовые: [mitt](https://github.com/developit/mitt) (Jason Miller, 193 B gzip, проверено локально; у 3.0.1 с `module: nodenext` default-импорт из ESM даёт TS2349), [emittery](https://github.com/sindresorhus/emittery) (Sindre Sorhus).

### pipe / compose


- [Remeda](https://remedajs.com/docs/#pipe) (Remeda team, живой документ): `R.pipe([1, 2, 3], R.map((x) => x * 2), R.filter((x) => x > 2), R.first())` даёт `number | undefined`; data-last внутри `pipe`, ленивое исполнение только при data-last, 1,2 kB gzip для `pipe + map` (проверено локально). [Effect pipe](https://effect.website/docs/getting-started/building-pipelines/) (Effect team, живой документ).
- Pipeline operator по-прежнему Stage 2 ([proposal-pipeline-operator](https://github.com/tc39/proposal-pipeline-operator)), так что библиотечный `pipe` остаётся единственным вариантом.
- Когда нет: одна-две операции, тогда прямой вызов понятнее.

### ts-pattern


Пример: `match(value).with({ k: "a", v: P.number.gt(1) }, h).with({ k: "b" }, h2).exhaustive()` по discriminated union. 1,8 kB gzip (проверено локально; README: ~2 kB). `.exhaustive()` стоит «slightly longer compilation times», `.run()` небезопасен: [gvergnaud/ts-pattern](https://github.com/gvergnaud/ts-pattern) (Gabriel Vergnaud, живой документ). Pattern matching в языке всё ещё Stage 1 ([proposal-pattern-matching](https://github.com/tc39/proposal-pattern-matching)). Брать для вложенного сопоставления. Для плоского union обычный `switch` с `never` проще и не стоит зависимости.

## Типизация библиотек

Вывод: хороший API не просит пользователя писать угловые скобки, а опубликованные `.d.ts` не требуют вывода. У каждой библиотеки должен быть измеренный бюджет сложности типов, проверяемый в CI. ts-toolbelt и hotscript фактически заброшены. Минимальный набор для автора: явные типы экспортов, attw + publint (см. [toolchain.md](toolchain.md)), `@ark/attest` или аналог на ключевых вызовах, CI на минимальной поддерживаемой версии TS и на `typescript@beta`.

### Эргономика API

- Пользователь не должен думать о generics: это деталь реализации ([Type-safe React Query](https://tkdodo.eu/blog/type-safe-react-query), TkDodo, 2023). Единый объект параметров с выводом: [The Query Options API](https://tkdodo.eu/blog/the-query-options-api) (TkDodo, 2024); [TanStack Query: TypeScript](https://tanstack.com/query/latest/docs/framework/react/typescript) (TanStack, живой документ). Типизация UI-фреймворков — в [frontend.md](frontend.md).
- Generic на всю схему, а не на её результат: `T extends z4.$ZodType`, а не `schema: z4.$ZodType<T>`: [For library authors](https://zod.dev/library-authors).

### Качество `.d.ts`

- `tsc` не должен выводить типы при генерации деклараций. На JSR экспортированная функция без явного возвращаемого типа, объектный литерал со сложным выражением, суперклассы из вызова считаются «slow types». Они замедляют потребителей «at least on the order of 1.5-2x for most packages», при этом внутренние (неэкспортируемые) slow types не мешают: [About slow types](https://jsr.io/docs/about-slow-types). Смысл совпадает с `isolatedDeclarations`.
- `import("...")` в `.d.ts` — повод добавить аннотацию: [Performance](https://github.com/microsoft/TypeScript/wiki/Performance) (TypeScript team, ред. 2026-02-20).
- Выведенные типы, ссылающиеся на внутренние хелперы, дают TS2742, TS2883, TS4023, TS4058. Лечится явной аннотацией экспорта, а `type-fest` должен быть прямой зависимостью пакета, генерирующего декларации: [type-fest](https://github.com/sindresorhus/type-fest).

### Бюджет сложности типов

- «Always use the simplest type construct that can possibly express your code» ([Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)).
- Опасный предел, названный в документации: типы, принимающие все члены union в любом порядке, растут факториально: «8 members already take seconds to type-check and 9 members can crash TypeScript» ([type-fest](https://github.com/sindresorhus/type-fest)).
- Бюджет можно закрепить в тестах: `bench(...).types([N, "instantiations"])` в [@ark/attest](https://github.com/arktypeio/arktype/tree/main/ark/attest) (David Blass, живой документ). Drizzle держит такие тесты, например `.types([13129, "instantiations"])` для `createSelectSchema`, но этот пример взят из поисковой выдачи `[не проверено]`.
- Общепринятого численного порога нет, каждый проект задаёт свой.

### Утилитарные библиотеки

Версии по npm на 2026-11-08.

| Библиотека | Состояние | Вердикт |
|---|---|---|
| [type-fest](https://github.com/sindresorhus/type-fest) | 5.10.0, 2026-09-17. Требует TS ≥ 6, ESM, `strict`, `exactOptionalPropertyTypes` | Основной выбор. Можно скопировать лишь нужные типы вместо зависимости |
| [remeda](https://github.com/remeda/remeda) | 2.58.0, 2026-11-01 | Рантайм-утилиты с выводом типов |
| [ts-toolbelt](https://github.com/millsp/ts-toolbelt) | 9.6.0, последняя публикация 2021-03-10 | `[устарело]` → type-fest |
| [hotscript](https://github.com/gvergnaud/hotscript) | 1.0.13, 2023-07-03 | `[устарело]`: вычисления на уровне типов лучше избегать, а точечно брать type-fest |
| `ts-essentials` | 10.2.1 | Альтернатива type-fest, в деталях не сравнивалась |

- Самостоятельно написать редкий тип дешевле, чем тащить ради него библиотеку, если он короток. Документация type-fest сама это допускает.
- В `lib.d.ts` не принимают новые утилитарные типы: [FAQ](https://github.com/microsoft/TypeScript/wiki/FAQ) (TypeScript team).

## Стоимость типов при компиляции

Вывод: наибольшую цену подтверждают три вещи: глубокие рекурсивные типы, большие пересечения (включая пересечения union) и вывод огромных анонимных деревьев типов там, где их можно сгенерировать или назвать. Инстанцирования — хороший, но неполный показатель: пересечения на 300 уровней стоили в 20 раз больше времени при нуле инстанцирований. Авторы библиотек режут работу за счёт ленивости, интерфейсов, генерации типов, аннотаций вариантности и тестов-регрессий. На TS 7 большинство типичных паттернов обходятся в доли секунды, поэтому оптимизировать стоит то, что видно в трассе.

### Локальная синтетика

Проверено локально: TS 7.0.2, `--checkers` по умолчанию, медиана 3 прогонов; TS 6.0.3, один прогон.

| Случай | Инстанцирований | Check, с (TS 7) | Check, с (TS 6) | Вывод |
|---|---|---|---|---|
| `interface extends`, 300 уровней | 0 | 0,042 | 0,08 | База |
| Пересечения `&`, 300 уровней | 0 | **0,901** | **1,11** | 21× на 7.0; инстанцирования этого не показывают |
| Цепочка 60 `Omit` | 6 145 | 0,003 | 0,03 | «Build up, not down»: дешевле интерфейсы |
| `interface`-иерархия, 60 уровней | 0 | 0,001 | 0,02 | То же |
| Union 400 членов, 100 `switch` | 0 | 0,019 | 0,10 | Сам union при сужении недорог |
| Поиск `Map[K]`, 400 ключей | 300 | 0,015 | 0,11 | Сравнимо |
| Шаблон 30×30×30 | 0 (28 334 типа) | 0,024 | 0,03 | Цена в памяти, а не в инстанцированиях |
| `UnionToIntersection`, 400 | 4 815 | **0,337** | **1,31** | Дорого при малом числе инстанцирований |
| Inline-условный возврат, 500 функций | 4 500 (6 344 типа) | 0,018 | 0,15 | Больше типов |
| Именованный алиас, 500 функций | 7 505 (3 355 типов) | 0,012 | 0,11 | Меньше типов и времени, но больше инстанцирований |
| Хвостовая рекурсия, 50 × 500 | 6 487 875 | **9,20** | **7,14** | На этой нагрузке TS 7 медленнее |
| Generic без аннотации, 300 пар | 18 | 0,008 | 0,07 | |
| Generic с `out`, 300 пар | 19 | 0,008 | 0,08 | На простом случае не важно |

Данные синтетические, с одной машины; различия в тысячных долях секунды лежат в пределах шума. Два вывода, которые таблица подтверждает: пересечения `&` на 300 уровней в 21 раз дороже `interface extends` при нулевых инстанцированиях, а глубокая хвостовая рекурсия бывает медленнее на TS 7, чем на 6.0 (9,20 с против 7,14 с). Как изменится цена рекурсивных типов в следующих релизах TS 7, неизвестно.

### Официальные правила

[Performance](https://github.com/microsoft/TypeScript/wiki/Performance) (TypeScript team, ред. 2026-02-20): `extends` интерфейсов лучше пересечений; union больше «dozen elements» может стать проблемой; именованные алиасы для условных типов; аннотации возврата в найденных горячих местах; `--strictFunctionTypes` для быстрых проверок вариантности. Локальный union на 400 членов проблемой не стал, так что порог зависит от того, что с union делают. Пересечения дают «inherently O(N^2)» ([Blass](https://gist.github.com/ssalbdivad/ec7628cfc36354a5d20b86390586593e)).

### Как это делают библиотеки

| Проект | Приём | Эффект | Источник |
|---|---|---|
| tRPC | Убран `OmitNeverKeys`, чтобы mapped-тип снова считался лениво; v9-процедуры в отдельном поле вместо фильтрации в типах; генерируемый роутер 3500 процедур в тестах | 332 → 136 мс (−59 %) | [TypeScript performance lessons](https://trpc.io/blog/typescript-performance-lessons) (Sachin Raja, 2023) |
| TanStack Router | Генерировать карты путь → маршрут вместо вывода дерева; обход `ParseRoute`; сужение через `from`/`to` | Первый файл с `<Link>` больше не выводит всё дерево. Без числовых результатов, только трассы | [A milestone for TypeScript Performance](https://tanstack.com/blog/tanstack-router-typescript-performance) (Christopher Horobin, 2024); [Type Safety](https://tanstack.com/router/latest/docs/guide/type-safety) |
| TanStack Table v9 | Feature-карты с общим хелпером, `Table_Internal` как интерфейс, `in out`, явные аргументы типа в адаптерах | core −78,3 %, адаптеры −62…−86 % инстанцирований | [TypeScript Performance in TanStack Table V9](https://tanstack.com/blog/tanstack-table-v9-typescript-performance) (Kevin Van Cott, 2026) |
| Zod 4 | Упрощены generics `ZodObject`, чтобы избежать «instantiation explosions» | >25 000 → ~175; цепочка `.extend`/`.omit` 4000 → 400 мс | [Zod 4](https://zod.dev/v4) (Colin McDonnell, 2025) |
| Drizzle 1.0 beta и Prisma | Drizzle сократил работу со схемой; Prisma предвычисляет типы кодогенерацией в `.d.ts` | Схема: Drizzle 41 150 → 5 017, Prisma 428 инстанцирований | [Why Prisma ORM Checks Types Faster Than Drizzle](https://www.prisma.io/blog/why-prisma-orm-checks-types-faster-than-drizzle) (Nikolas Burk, Ankur Datta, 2025) (данные конкурента) |
| Effect | Вариантность параметров объявлена через `out` | Числа опубликованы не были | `effect/dist/Effect.d.ts` (проверено локально) |
| Gel | Группировка перегрузок, порядок ветвей условных типов | Оператор `++` 102 → 8 инстанцирований | [Gel](https://www.geldata.com/blog/an-approach-to-optimizing-typescript-type-checking-performance) (Scott Trinh, 2024) |

- Советы Блэсса: «Build up, not down»; относиться к generics как к мемоизированным функциям; передавать минимум данных в параметр; меньше, но более мощных mapped-типов: [TypeScript Type Performance Cheat Sheet](https://gist.github.com/ssalbdivad/ec7628cfc36354a5d20b86390586593e) (David Blass, 2025).

### Счётчик инстанцирований — не всё

- В исследовании Prisma: в Drizzle beta RQB-запросы используют меньше инстанцирований (530 против 785), но проверяются примерно в 1,5 раза дольше, откуда вывод, что сами инстанцирования не меряют реальную скорость ([Prisma, 2025](https://www.prisma.io/blog/why-prisma-orm-checks-types-faster-than-drizzle)). TanStack предупреждает, что с tsgo инстанцирования могут хуже соответствовать времени ([TanStack, 2026](https://tanstack.com/blog/tanstack-table-v9-typescript-performance)). Локальная таблица подтверждает это (пересечения, `UnionToIntersection`, хвостовая рекурсия).
- Противоречие: Scott Trinh и Spiko считают инстанцирования хорошим показателем ([Gel](https://www.geldata.com/blog/an-approach-to-optimizing-typescript-type-checking-performance); [Spiko](https://tech.spiko.io/posts/benchmarking-typescript-type-checking)), Prisma и локальные замеры показывают исключения. Вывод: инстанцирования подходят для регрессий внутри одной конструкции, а сравнивать разные конструкции надо по времени.

## Антипаттерны

Вывод: почти все антипаттерны сводятся к одному: разработчик утверждает то, что компилятор не проверил, или платит за сложность типов, которая не даёт гарантий. Пункты 2, 4, 5, 6, 9, 10 и 21 ловятся правилами typescript-eslint, остальные требуют ревью или замеров.

| № | Антипаттерн | Замена |
|---|---|---|
| 1 | Набор необязательных полей вместо union состояний | Discriminated union |
| 2 | `switch` без `never` по union | `assertNever` или правило |
| 3 | Generic только в возврате | `unknown` и схема |
| 4 | Параметр типа один раз | Обычный тип |
| 5 | `any` на границах | `unknown` |
| 6 | `as` или `!` на внешних данных | Разбор схемой |
| 8 | Предикат с условием «не iff» | Inline-условие |
| 9 | `@ts-ignore` | `@ts-expect-error` с причиной |
| 10 | Метод-сигнатура ради краткости в типах колбэков | Свойство-функция |
| 11 | Аннотация вариантности, не совпадающая со структурой | Убрать |
| 12 | Цепочки `Omit`/`Pick` как основной способ строить типы | Наращивание интерфейсов |
| 13 | Глубокие пересечения `&` | `interface extends` |
| 14 | Не хвостовая рекурсия типов | Накопитель |
| 15 | `Omit` на union с ожиданием распределения | `DOmit` |
| 16 | `<const T extends unknown[]>` | `readonly unknown[]` |
| 17 | `enum` при type stripping; `const enum` | `as const`; `const enum` не использовать никогда |
| 23 | ts-reset в опубликованной библиотеке | Только в приложении |
| 24 | Новые декораторы в прикладном коде | Функции-обёртки |
| 25 | Builder с проверкой через расширяющийся union в `this` | Условный тип с проверкой полноты |
| 26 | `import { z } from "zod"` при важном размере бандла на esbuild | `import * as z` |
| 27 | Зависимость библиотеки от конкретного валидатора, когда схема — чёрный ящик | Standard Schema |
| 28 | Экспорт без явных типов в опубликованной библиотеке | Аннотация |
| 29 | Перестановочные типы на больших union | Отказаться |
| 31 | Mapped-фильтр, форсирующий вычисление всех ключей ради удаления `never` | Разделить структуру |
| 32 | Вывод огромного дерева типов при каждом обращении | Генерация карт |
| 33 | Оптимизация по числу инстанцирований без измерения времени | Обе метрики |

Частоты этих антипаттернов в реальном коде никто не измерял.

## Чеклист ревью типизации

Вывод: ревью типов идёт сверху вниз. Сначала достоверность данных, затем гарантии компилятора, затем сложность и стоимость. Пункты с пометкой CI стоит автоматизировать; тогда ревьюеру остаётся вопрос о достоверности данных, правильности модели и о том, оправдана ли сложность типа. Чеклист не проверялся на реальных pull request.

Модель
- [ ] Состояния — discriminated union, а не набор необязательных полей.
- [ ] `switch` по union завершается `never` (CI: switch-exhaustiveness-check).
- [ ] Идентификаторы и единицы, которые легко перепутать, брендированы, а конструктор проверяет.
- [ ] Литеральные конфиги через `satisfies`, контракты через аннотацию.
- [ ] Значения enum — объект `as const` или union; `const enum` отсутствует.
- [ ] Входные массивы и объекты `readonly`.
- [ ] Включены `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` (CI: tsconfig).

Границы
- [ ] Внешние данные проходят рантайм-схему до использования.
- [ ] `any`, `as`, `!` единичны и обоснованы (CI: `no-unsafe-*`, no-unsafe-type-assertion).
- [ ] Предикаты удовлетворяют «if and only if».
- [ ] `@ts-expect-error` с причиной, `@ts-ignore` нет.
- [ ] Augmentation собраны в одном файле и не добавляют новых верхних объявлений.
- [ ] ts-reset отсутствует в коде библиотек.

Generics и функции
- [ ] Каждый параметр типа связывает минимум две позиции (CI: no-unnecessary-type-parameters).
- [ ] Вызовы не требуют ручных угловых скобок, если нет причины.
- [ ] Union предпочтён перегрузкам, где возможно.
- [ ] Колбэки в типах — свойства, а не методы (CI: method-signature-style).
- [ ] Рекурсивные типы хвостовые.
- [ ] Аннотации вариантности есть только там, где это подтверждено замером.

Ошибки
- [ ] Ожидаемые отказы — значением, баги — исключением.
- [ ] Обёртка хранит `cause`.
- [ ] `catch` работает с `unknown`, и колбэки `.catch` тоже (CI: use-unknown-in-catch-callback-variable).
- [ ] Бросаются только `Error` (CI: only-throw-error).

Паттерны
- [ ] `using` для ресурсов с детерминированной очисткой.
- [ ] Новых декораторов нет без требования фреймворка.
- [ ] У builder с типами есть негативные тесты.

Библиотеки
- [ ] Экспорты с явными типами, `isolatedDeclarations`.
- [ ] Схема принимается через Standard Schema, если нужен только `validate`.
- [ ] В CI есть минимальная версия TS и `typescript@beta`.
- [ ] Ключевые вызовы защищены бенчмарком типов.

Стоимость компиляции
- [ ] При замедлении сначала `--extendedDiagnostics` и трасса.
- [ ] Огромные деревья типов генерируются, а не выводятся.

## Спорные места и пробелы

- Статистики внедрения `noUncheckedIndexedAccess` и `exactOptionalPropertyTypes` нет; трение со сгенерированными типами описано только вторичными источниками `[не проверено]`.
- Дата финального TypeScript 7.1 неизвестна: на 2026-11-08 `next` — 7.1.0-dev, RC нет. Какие популярные библиотеки ломаются из-за изменения дистрибутивных условных типов в 7.1, неизвестно.
- Пределы рекурсии взяты из main компилятора на Go и сверены только с 7.0.2, 6.0.3 и 7.1.0-beta. Как изменится цена рекурсивных типов в следующих релизах TS 7, неизвестно.
- Нет данных, сколько багов предотвращают `no-unsafe-type-assertion` и похожие правила, и как часто антипаттерны встречаются в реальном коде. Чеклист не проверялся на реальных pull request.
- Нет независимого сравнения neverthrow, better-result и Effect на реальном проекте. Расхождение размера Effect (31,5 kB локально против 7,1 kB в блоге) без исходного теста объяснить нельзя.
- Effect Schema не измерен по инстанцированиям; нет сравнения всех валидаторов в режиме без JIT; поведение ArkType под строгой CSP документацией не подтверждено; форма импорта Zod проверена только на esbuild.
- Общепринятого порога бюджета сложности типов нет; числа тестов Drizzle взяты из поисковой выдачи `[не проверено]`. Скорость рукописного автомата и XState не сравнивалась, публичных замеров типов Effect нет. Трансформер typia под TS 7 локально не запускался.
