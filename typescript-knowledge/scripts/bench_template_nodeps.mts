// Запасной шаблон бенчмарка без зависимостей: нужен, только если mitata поставить нельзя.
// Основной шаблон — bench_template.mts. Скопируйте в benchmarks/bench.mts проекта и замените примеры.
//
// Прогон:    node benchmarks/bench.mts > bench/before/run1.json     (Node 22.18+, только стираемый синтаксис TS)
// Сравнение: node <путь к скиллу>/scripts/bench_compare.mjs bench/before bench/after
//
// Прогрев такой же, как в основном шаблоне. Замер идёт пачками: одиночный короткий вызов меньше шага таймера.
// Список бенчмарков и их порядок должны совпадать в прогонах «до» и «после»: места вызова fn общие для всех.

const BATCH = 1_000 // вызовов в одной пачке прогрева
const MIN_CALLS = 20_000 // до оптимизации время тоже стабильно, поэтому сначала обязательный минимум вызовов
const AGREE = 0.02 // две пачки подряд совпали по времени с точностью 2% — прогрев закончен
const MAX_PREWARM_MS = 5_000
const MIN_SAMPLE_MS = 5 // одна выборка — пачка вызовов не короче этого времени
const MIN_SAMPLES = 7
const MAX_SAMPLES = 200
const SAMPLE_BUDGET_MS = 1_500

let sink: unknown // сюда пишется каждый результат, чтобы V8 не выкинул работу

/** Вызывает fn пачками: сначала MIN_CALLS раз, затем пока время пачки не стабилизируется. Возвращает мс на вызов. */
function prewarm(fn: () => unknown): number {
  const started = performance.now()
  const deadline = started + MAX_PREWARM_MS
  let prev = 0
  let calls = 0
  for (;;) {
    const t0 = performance.now()
    for (let i = 0; i < BATCH; i++) {
      sink = fn()
      calls++
      if (performance.now() > deadline) return (performance.now() - started) / calls // медленная функция: лимит времени важнее
    }
    const t = performance.now() - t0
    if (calls >= MIN_CALLS && prev > 0 && Math.abs(t - prev) / prev < AGREE) return t / BATCH
    prev = t
  }
}

function quantile(sorted: readonly number[], q: number): number {
  const pos = (sorted.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (pos - lo)
}

interface Result {
  name: string
  median: number
  q1: number
  q3: number
  mean: number
  samples: number
}

/** Прогревает fn и снимает выборки. Результат fn() нужно возвращать. Время — наносекунды на вызов. */
function measure(name: string, fn: () => unknown): Result {
  const perCallMs = prewarm(fn)
  const batch = Math.max(1, Math.ceil(MIN_SAMPLE_MS / Math.max(perCallMs, 1e-6)))
  const samples: number[] = []
  const budgetEnd = performance.now() + SAMPLE_BUDGET_MS
  while (samples.length < MIN_SAMPLES || (samples.length < MAX_SAMPLES && performance.now() < budgetEnd)) {
    const t0 = performance.now()
    for (let i = 0; i < batch; i++) sink = fn()
    samples.push(((performance.now() - t0) * 1e6) / batch)
  }
  const sorted = [...samples].sort((a, b) => a - b)
  const mean = samples.reduce((sum, x) => sum + x, 0) / samples.length
  return { name, median: quantile(sorted, 0.5), q1: quantile(sorted, 0.25), q3: quantile(sorted, 0.75), mean, samples: samples.length }
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
const benchmarks = [
  measure('sum/reduce', () => data.reduce((a, b) => a + b, 0)),
  measure('sum/for', () => {
    let s = 0
    for (let i = 0; i < data.length; i++) s += data[i]!
    return s
  }),
]

// JSON в stdout в общем формате bench_compare.mjs. Поле sink делает запись в него наблюдаемой.
console.log(JSON.stringify({ unit: 'ns', sink: typeof sink, benchmarks }))
