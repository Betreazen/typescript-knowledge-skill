// Шаблон бенчмарка на mitata с явным прогревом JIT. Скопируйте в benchmarks/bench.mts проекта и замените примеры.
// Расширение .mts нужно, чтобы файл был ESM независимо от поля "type" в package.json.
//
// Установка: npm i -D mitata
// Прогон:    node benchmarks/bench.mts > bench/before/run1.json     (Node 22.18+, только стираемый синтаксис TS)
//            npx tsx benchmarks/bench.mts > bench/before/run1.json  (если проект импортирует без расширений или через paths)
// Сравнение: node <путь к скиллу>/scripts/bench_compare.mjs bench/before bench/after
//
// Зачем прогрев: V8 переводит функцию на оптимизирующий компилятор по числу выполнений, а не по времени.
// Без прогрева в выборку попадают медленные вызовы до оптимизации, и среднее «уезжает» от медианы.

import { bench, group, run, do_not_optimize } from 'mitata'

const BATCH = 1_000 // вызовов в одной пачке прогрева
const MIN_CALLS = 20_000 // до оптимизации время тоже стабильно, поэтому сначала обязательный минимум вызовов
const AGREE = 0.02 // после минимума две пачки подряд совпали по времени с точностью 2% — прогрев закончен
const MAX_CALLS = 100_000
const MAX_MS = 5_000

/** Вызывает fn пачками: сначала MIN_CALLS раз, затем пока время пачки не стабилизируется. Не дольше MAX_MS. */
function prewarm(fn: () => unknown): void {
  const deadline = performance.now() + MAX_MS
  let prev = 0
  for (let calls = 0; calls < MAX_CALLS; calls += BATCH) {
    const t0 = performance.now()
    for (let i = 0; i < BATCH; i++) {
      do_not_optimize(fn())
      if (performance.now() > deadline) return // медленная функция: лимит времени важнее числа вызовов
    }
    const t = performance.now() - t0
    if (calls >= MIN_CALLS && prev > 0 && Math.abs(t - prev) / prev < AGREE) return
    prev = t
  }
}

/** Регистрирует бенчмарк и прогревает его до замера. Результат fn() нужно возвращать: иначе V8 может выкинуть работу. */
function measure(name: string, fn: () => unknown): void {
  prewarm(fn)
  bench(name, () => do_not_optimize(fn()))
}

// ---- Входные данные: готовятся вне измеряемой функции, генератор с фиксированным seed. ----
/** mulberry32: детерминированный генератор на 32-битной арифметике, числа в [0, 1). */
function rng(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32
  }
}
const random = rng(42)
const data = Array.from({ length: 10_000 }, () => Math.floor(random() * 1_000))

// ---- Бенчмарки: горячие пути из спецификации. Замените примеры своими функциями. ----
group('sum', () => {
  measure('reduce', () => data.reduce((a, b) => a + b, 0))
  measure('for', () => {
    let s = 0
    for (let i = 0; i < data.length; i++) s += data[i]!
    return s
  })
})

// JSON в stdout — его читает bench_compare.mjs. context.noop занимает десятки мегабайт и для сравнения не нужен.
const result = await run({ format: 'json', print: () => {} })
delete (result.context as { noop?: unknown }).noop
console.log(JSON.stringify(result))
