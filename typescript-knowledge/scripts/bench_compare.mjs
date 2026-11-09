#!/usr/bin/env node
// Сравнивает прогоны «до» и «после» по их JSON-файлам. Без зависимостей, Node 18+.
//
// Запуск: node bench_compare.mjs <base> <diff> [--threshold 5]
// <base> и <diff> — JSON-файл одного прогона или папка с JSON нескольких прогонов.
//
// Понимает форматы (определяются по содержимому файла):
// - mitata:     await run({ format: 'json' })
// - Vitest 5:   vitest bench --run --reporter=json --outputFile.json=bench/before/run1.json
// - hyperfine:  hyperfine -N -n <имя> --export-json run1.json '<команда>'
// - Lighthouse: файлы lhr-*.json из .lighthouseci или *.report.json
// - size-limit: size-limit --json > run1.json
// - tachometer: tach --json-file=run1.json
// - общий:      { "unit": "ns"|"us"|"ms"|"s"|"bytes"|"count",
//                 "benchmarks": [{ "name", "median", "q1", "q3", "mean"?, "unit"?, "kind"?, "higherIsBetter"? }] }
//   В него выгружают tinybench, Playwright-обвязки, замеры кадров и любой другой инструмент.
//   tsc_diag.mjs делает такой файл из вывода tsc --extendedDiagnostics.
//   Поля строки: unit заменяет единицу файла; kind — time, bytes, count, unitless или score.
//
// Шум между прогонами одного и того же кода на обычной машине доходит до 5-10%,
// и статистика одного прогона его не видит. Поэтому снимайте по 5 прогонов на сторону,
// чередуя «до» и «после» и меняя порядок (A B B A A B B A A B). Правило вердикта:
// - меньше 8 прогонов на какой-то стороне: медиана медиан сдвинулась больше порога, и медианы всех
//   прогонов одной стороны лежат строго по одну сторону от другой. При 5+5 это точный тест
//   Манна-Уитни при U = 0 (p = 0,0079);
// - от 8 прогонов на сторону: сдвиг больше порога и U-тест Манна-Уитни с p < 0,01;
// - по одному прогону: сдвиг больше порога и непересечение межквартильных интервалов,
//   с предупреждением, что такому вердикту доверять нельзя (кроме детерминированных метрик: байты, счётчики).
// Вердикты: faster/slower для времени, better/worse для остальных метрик, same — в пределах шума.
// Бенчмарк только с одной стороны — only-base/only-diff, упавший хотя бы в одном прогоне — failed.
// Код выхода: 0 — регрессий нет; 1 — есть slower, worse, failed или only-base;
// 2 — ошибка ввода: нет файлов, неизвестный формат, одно имя дважды в файле, нечисловые значения,
// нет общих бенчмарков, счётчики компиляторов разных поколений, разные типы метрик у одного имени.

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'

const TIME_UNIT_NS = { ns: 1, us: 1e3, ms: 1e6, s: 1e9 }
const KINDS = new Set(['time', 'bytes', 'count', 'unitless', 'score'])
const DETERMINISTIC = new Set(['bytes', 'count'])
// Файлы, которые lhci кладёт рядом с отчётами: это не прогоны.
const SKIPPED_FILES = new Set(['manifest.json', 'assertion-results.json', 'links.json'])
// Среднее заметно выше медианы: в выборке тяжёлый хвост или две моды (вызовы до оптимизации JIT, GC, деоптимизации).
const SKEW_LIMIT = 1.25
const U_TEST_MIN_RUNS = 8
const Z_FOR_P_001 = 2.576
const LH_METRICS = {
  LCP: 'largest-contentful-paint',
  FCP: 'first-contentful-paint',
  TBT: 'total-blocking-time',
  SI: 'speed-index',
  CLS: 'cumulative-layout-shift',
}

/** Квантиль отсортированного массива с линейной интерполяцией. */
function quantile(sorted, q) {
  const pos = (sorted.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}

function median(values) {
  return quantile([...values].sort((a, b) => a - b), 0.5)
}

/** mitata: benchmarks[].runs[].stats.{p25,p50,p75} в наносекундах. */
function fromMitata(data) {
  const out = []
  for (const bench of data.benchmarks) {
    const group = data.layout?.[bench.group]?.name
    for (const run of bench.runs) {
      const name = group ? `${group} > ${run.name}` : run.name
      if (!run.stats) {
        // бенчмарк упал, у прогона есть только error
        out.push({ name, error: String(run.error?.message ?? run.error ?? 'no stats') })
        continue
      }
      out.push({ name, kind: 'time', median: run.stats.p50, q1: run.stats.p25, q3: run.stats.p75, mean: run.stats.avg })
    }
  }
  return out
}

/**
 * Vitest 5, JSON-репортёр: testResults[].assertionResults[].benchmarks[].tasks[], статистика tinybench в мс.
 * У tinybench нет p25, поэтому q1 оценивается симметрично: p50 - (p75 - p50).
 * Строки из bench.from() (fromStore) — сохранённые данные, а не замер этого прогона; они пропускаются.
 */
function fromVitest(data) {
  const out = []
  for (const file of data.testResults) {
    for (const test of file.assertionResults ?? []) {
      for (const group of test.benchmarks ?? []) {
        for (const task of group.tasks) {
          if (task.fromStore) continue
          const name = `${group.name} > ${task.name}`
          if (!task.latency) {
            // задача упала: без пометки failed она молча выпала бы из сравнения
            out.push({ name, error: 'no latency' })
            continue
          }
          const { p50, p75, mean } = task.latency
          out.push({
            name,
            kind: 'time',
            median: p50 * 1e6,
            q1: (2 * p50 - p75) * 1e6,
            q3: p75 * 1e6,
            mean: mean * 1e6,
          })
        }
      }
    }
  }
  return out
}

/** hyperfine --export-json: results[].times в секундах. Имя берётся из -n, иначе из самой команды. */
function fromHyperfine(data) {
  return data.results.map((r) => {
    const times = [...r.times].sort((a, b) => a - b)
    return {
      name: r.command,
      kind: 'time',
      median: quantile(times, 0.5) * 1e9,
      q1: quantile(times, 0.25) * 1e9,
      q3: quantile(times, 0.75) * 1e9,
    }
  })
}

/** Lighthouse: audits[id].numericValue и categories.performance.score. TBT и CLS могут быть нулём. */
function fromLighthouse(data) {
  const page = new URL(data.finalDisplayedUrl ?? data.requestedUrl).pathname
  const out = []
  for (const [label, id] of Object.entries(LH_METRICS)) {
    const audit = data.audits[id]
    if (!audit || typeof audit.numericValue !== 'number') continue
    const isTime = audit.numericUnit === 'millisecond'
    const value = isTime ? audit.numericValue * 1e6 : audit.numericValue
    out.push({ name: `${page} ${label}`, kind: isTime ? 'time' : 'unitless', allowZero: true, median: value, q1: value, q3: value })
  }
  const score = data.categories?.performance?.score
  if (score !== undefined) {
    out.push({ name: `${page} score`, kind: 'score', allowZero: true, higherIsBetter: true, median: score, q1: score, q3: score })
  }
  return out
}

/** size-limit --json: массив { name, size } в байтах. */
function fromSizeLimit(data) {
  return data.map((r) => {
    if (typeof r.name !== 'string') throw new TypeError('size-limit entry has no name; set "name" in the config')
    return { name: r.name, kind: 'bytes', allowZero: true, median: r.size, q1: r.size, q3: r.size }
  })
}

/** tachometer --json-file: benchmarks[].samples в миллисекундах. */
function fromTachometer(data) {
  return data.benchmarks.map((b) => {
    const times = [...b.samples].sort((x, y) => x - y)
    return {
      name: b.version ? `${b.name}@${b.version}` : b.name,
      kind: 'time',
      median: quantile(times, 0.5) * 1e6,
      q1: quantile(times, 0.25) * 1e6,
      q3: quantile(times, 0.75) * 1e6,
      mean: (times.reduce((sum, t) => sum + t, 0) / times.length) * 1e6,
    }
  })
}

/** Единица и тип метрики строки общего формата. Время приводится к наносекундам, остальное не масштабируется. */
function genericScale(benchmark, fileUnit) {
  const unit = benchmark.unit ?? fileUnit
  const isTimeUnit = Object.hasOwn(TIME_UNIT_NS, unit)
  if (!isTimeUnit && unit !== 'bytes' && unit !== 'count') throw new TypeError(`unknown unit "${unit}"`)
  const kind = benchmark.kind ?? (isTimeUnit ? 'time' : unit)
  if (!KINDS.has(kind)) throw new TypeError(`benchmark "${benchmark.name}" has unknown kind "${kind}"`)
  return { kind, scale: kind === 'time' && isTimeUnit ? TIME_UNIT_NS[unit] : 1 }
}

function fromGeneric(data) {
  const fileUnit = data.unit ?? 'ns'
  return data.benchmarks.map((b) => {
    for (const key of ['median', 'q1', 'q3']) {
      if (typeof b[key] !== 'number') throw new TypeError(`benchmark "${b.name}" has no numeric ${key}`)
    }
    const { kind, scale } = genericScale(b, fileUnit)
    return {
      name: b.name,
      kind,
      allowZero: kind !== 'time' || b.allowZero === true,
      higherIsBetter: b.higherIsBetter === true || kind === 'score',
      compiler: data.compiler,
      median: b.median * scale,
      q1: b.q1 * scale,
      q3: b.q3 * scale,
      mean: typeof b.mean === 'number' ? b.mean * scale : undefined,
    }
  })
}

function parseFile(file) {
  const data = JSON.parse(readFileSync(file, 'utf8'))
  if (typeof data.lighthouseVersion === 'string' && data.audits) return fromLighthouse(data)
  if (Array.isArray(data) && data[0] && 'size' in data[0] && 'name' in data[0]) return fromSizeLimit(data)
  if (Array.isArray(data.benchmarks) && Array.isArray(data.benchmarks[0]?.samples) && data.benchmarks[0]?.mean?.low !== undefined) {
    return fromTachometer(data)
  }
  if (Array.isArray(data.results) && data.results[0]?.times) return fromHyperfine(data)
  if (Array.isArray(data.testResults)) return fromVitest(data)
  if (Array.isArray(data.benchmarks) && data.benchmarks[0]?.runs) return fromMitata(data)
  if (Array.isArray(data.benchmarks)) return fromGeneric(data)
  throw new TypeError(`${file}: unknown format (expected mitata, Vitest 5, hyperfine, Lighthouse, size-limit, tachometer or generic JSON)`)
}

function checkValues(file, run) {
  const valid = [run.median, run.q1, run.q3].every(Number.isFinite) && run.median >= 0
  if (!valid) throw new Error(`${file}: benchmark "${run.name}" has non-finite or negative statistics`)
  if (run.median === 0 && !run.allowZero) {
    // Ноль здесь — ошибка квантования таймера (браузер без изоляции), а не результат замера.
    throw new Error(
      `${file}: benchmark "${run.name}" has median 0: the timer is too coarse. ` +
        'Enable cross-origin isolation (COOP/COEP), measure in batches (mitata) or compare a larger unit of work',
    )
  }
}

/**
 * Читает один JSON или все *.json из папки.
 * Возвращает runs (имя бенчмарка → прогоны) и failed (имена бенчмарков, упавших хотя бы в одном прогоне).
 */
function loadRuns(path) {
  const files = statSync(path).isDirectory()
    ? readdirSync(path)
        .filter((f) => f.endsWith('.json') && !SKIPPED_FILES.has(f))
        .sort()
        .map((f) => join(path, f))
    : [path]
  if (files.length === 0) throw new Error(`no *.json in ${path}`)
  const runs = new Map()
  const failed = new Set()
  for (const file of files) {
    const seen = new Set()
    for (const run of parseFile(file)) {
      if (seen.has(run.name)) throw new Error(`${file}: benchmark "${run.name}" appears twice; give benchmarks unique names`)
      seen.add(run.name)
      if (run.error !== undefined) {
        failed.add(run.name)
        continue
      }
      checkValues(file, run)
      if (!runs.has(run.name)) runs.set(run.name, [])
      runs.get(run.name).push(run)
    }
  }
  return { runs, failed, fileCount: files.length }
}

const center = (runs) => median(runs.map((r) => r.median))

/** Вероятность, что n и m прогонов одного и того же кода случайно разделятся полностью: 2 / C(n+m, n). */
function chanceSeparation(n, m) {
  let binom = 1
  for (let i = 1; i <= n; i++) binom = (binom * (m + i)) / i
  return 2 / binom
}

/**
 * U-тест Манна-Уитни в нормальном приближении с поправкой на непрерывность.
 * Поправки на совпадения нет: дисперсия слегка завышена, тест при совпадениях строже.
 * Возвращает -1, если значения diff значимо меньше base, 1, если больше, 0 — иначе.
 */
function mannWhitneyDirection(baseValues, diffValues) {
  const n = baseValues.length
  const m = diffValues.length
  let u = 0
  for (const b of baseValues) {
    for (const d of diffValues) u += d < b ? 1 : d === b ? 0.5 : 0
  }
  const shift = u - (n * m) / 2
  const z = (Math.abs(shift) - 0.5) / Math.sqrt((n * m * (n + m + 1)) / 12)
  if (z < Z_FOR_P_001) return 0
  return shift > 0 ? -1 : 1
}

/** Направление достоверного сдвига значений diff относительно base: -1 вниз, 1 вверх, 0 — нет. */
function shiftDirection(base, diff) {
  const baseMedians = base.map((r) => r.median)
  const diffMedians = diff.map((r) => r.median)
  if (base.length >= U_TEST_MIN_RUNS && diff.length >= U_TEST_MIN_RUNS) return mannWhitneyDirection(baseMedians, diffMedians)
  if (base.length > 1 && diff.length > 1) {
    if (Math.max(...diffMedians) < Math.min(...baseMedians)) return -1
    if (Math.min(...diffMedians) > Math.max(...baseMedians)) return 1
    return 0
  }
  // Хотя бы с одной стороны один прогон: сравниваются межквартильные интервалы.
  const q = (runs, key) => median(runs.map((r) => r[key]))
  if (q(diff, 'q3') < q(base, 'q1')) return -1
  if (q(diff, 'q1') > q(base, 'q3')) return 1
  return 0
}

function verdict(base, diff, threshold) {
  const baseCenter = center(base)
  const diffCenter = center(diff)
  const { kind, higherIsBetter } = base[0]
  const improved = kind === 'time' ? 'faster' : 'better'
  const regressed = kind === 'time' ? 'slower' : 'worse'
  // От нулевой базы процент не определён, поэтому порог не применяется, но проверка значимости остаётся.
  if (baseCenter !== 0 && Math.abs(diffCenter / baseCenter - 1) <= threshold) return 'same'
  const direction = shiftDirection(base, diff)
  if (direction === 0 || direction !== Math.sign(diffCenter - baseCenter)) return 'same'
  return (direction < 0) === !higherIsBetter ? improved : regressed
}

function fmtTime(ns) {
  for (const [unit, scale] of [['s', 1e9], ['ms', 1e6], ['us', 1e3]]) {
    if (ns >= scale) return `${(ns / scale).toFixed(3)} ${unit}`
  }
  return `${ns.toFixed(1)} ns`
}

function fmtValue(kind, value) {
  if (kind === 'bytes') return `${Math.round(value)} B`
  if (kind === 'count') return String(Math.round(value))
  if (kind === 'unitless' || kind === 'score') return value.toFixed(3)
  return fmtTime(value)
}

/** Изменение в процентах; от нулевой базы процент не определён. */
function fmtChange(baseCenter, diffCenter) {
  if (baseCenter === 0) return diffCenter === 0 ? '+0.0%' : 'n/a'
  const change = (diffCenter / baseCenter - 1) * 100
  return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`
}

/**
 * Текст ошибки, если прогоны одного бенчмарка нельзя сравнивать между собой, иначе null.
 * Счётчики TS 6 и TS 7 считаются разными компиляторами; байты нельзя сравнивать с временем.
 */
function findMismatch(base, diff) {
  for (const name of new Set([...base.keys(), ...diff.keys()])) {
    const runs = [...(base.get(name) ?? []), ...(diff.get(name) ?? [])]
    const [first] = runs
    for (const run of runs) {
      if (run.compiler !== first.compiler) {
        return `compiler counters are not comparable (${first.compiler ?? 'unknown'} vs ${run.compiler ?? 'unknown'}): compare wall time with hyperfine instead`
      }
      if (run.kind !== first.kind || Boolean(run.higherIsBetter) !== Boolean(first.higherIsBetter)) {
        return `metric kind mismatch for "${name}": all runs must use the same kind and direction`
      }
    }
  }
  return null
}

function parseCli(argv) {
  const args = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { threshold: { type: 'string', default: '5' }, help: { type: 'boolean', short: 'h' } },
  })
  const [basePath, diffPath] = args.positionals
  const thresholdOk = /^\d+(\.\d+)?$/.test(args.values.threshold)
  return { basePath, diffPath, thresholdOk, thresholdText: args.values.threshold, help: args.values.help }
}

function report(base, diff, failed, threshold, thresholdText) {
  const names = [...new Set([...base.keys(), ...diff.keys(), ...failed])].sort()
  const width = Math.max(9, ...names.map((n) => n.length))
  const row = (name, runs, a, b, change, label) =>
    console.log(`${name.padEnd(width)}  ${runs.padStart(5)}  ${a.padStart(12)}  ${b.padStart(12)}  ${change.padStart(8)}  ${label}`)
  row('Benchmark', 'Runs', 'Base median', 'Diff median', 'Change', 'Verdict')

  const stats = { regressions: 0, missing: 0, singleRunNoisy: false, worstChance: 0 }
  for (const name of names) {
    const b = base.get(name)
    const d = diff.get(name)
    if (failed.has(name) || !b || !d) {
      // Упавший бенчмарк или бенчмарк, пропавший из diff, мог скрыть регрессию.
      const label = failed.has(name) ? 'failed' : b ? 'only-base' : 'only-diff'
      if (label !== 'only-diff') stats.missing++
      row(name, '', '', '', '', label)
      continue
    }
    const { kind } = b[0]
    const usesRunSeparation = b.length > 1 && d.length > 1
    if (!usesRunSeparation && !DETERMINISTIC.has(kind)) stats.singleRunNoisy = true
    if (usesRunSeparation && !DETERMINISTIC.has(kind) && (b.length < U_TEST_MIN_RUNS || d.length < U_TEST_MIN_RUNS)) {
      stats.worstChance = Math.max(stats.worstChance, chanceSeparation(b.length, d.length))
    }
    const v = verdict(b, d, threshold)
    if (v === 'slower' || v === 'worse') stats.regressions++
    row(name, `${b.length}/${d.length}`, fmtValue(kind, center(b)), fmtValue(kind, center(d)), fmtChange(center(b), center(d)), v)
  }
  console.log(`\nthreshold ${thresholdText}%; regressions: ${stats.regressions}; failed or missing in diff: ${stats.missing}`)
  return stats
}

/** Бенчмарк есть не во всех файлах стороны: вердикт посчитан по меньшему числу прогонов. */
function warnPartialRuns(side, runs, fileCount) {
  const partial = [...runs].filter(([, r]) => r.length < fileCount).map(([name]) => name)
  if (partial.length > 0) {
    console.error(`warning: missing from some ${side} runs (of ${fileCount} files): ${partial.join(', ')}`)
  }
}

function warnSkewed(base, diff) {
  const skewed = new Set()
  for (const runs of [...base.values(), ...diff.values()]) {
    for (const r of runs) if (r.mean / r.median > SKEW_LIMIT) skewed.add(r.name)
  }
  if (skewed.size === 0) return
  console.error(
    `warning: mean/median > ${SKEW_LIMIT} in ${[...skewed].join(', ')}: heavy tail or bimodal samples ` +
      '(unfinished JIT warm-up, GC, deopts, or intermittent slow calls). Verdicts use medians; check the warm-up, ' +
      'and compare p99 too if latency or frame time matters (see references/benchmarking.md)',
  )
}

function main(argv) {
  let cli
  try {
    cli = parseCli(argv)
  } catch (err) {
    console.error(err.message)
    return 2
  }
  if (cli.help || !cli.basePath || !cli.diffPath || !cli.thresholdOk) {
    console.error('usage: node bench_compare.mjs <base> <diff> [--threshold 5]')
    return cli.help ? 0 : 2
  }

  let base
  let diff
  let failed
  let baseFiles
  let diffFiles
  try {
    const b = loadRuns(cli.basePath)
    const d = loadRuns(cli.diffPath)
    base = b.runs
    diff = d.runs
    baseFiles = b.fileCount
    diffFiles = d.fileCount
    failed = new Set([...b.failed, ...d.failed])
  } catch (err) {
    console.error(`cannot read input: ${err.message}`)
    return 2
  }
  if (![...base.keys()].some((name) => diff.has(name))) {
    console.error('no benchmark is present on both sides: nothing to compare (renamed benchmarks or wrong folders?)')
    return 2
  }
  const mismatch = findMismatch(base, diff)
  if (mismatch) {
    console.error(mismatch)
    return 2
  }

  const stats = report(base, diff, failed, Number(cli.thresholdText) / 100, cli.thresholdText)
  warnPartialRuns('base', base, baseFiles)
  warnPartialRuns('diff', diff, diffFiles)
  if (stats.singleRunNoisy) {
    console.error('warning: one run per side cannot separate a change from run-to-run noise; repeat 5 interleaved runs per side')
  }
  warnSkewed(base, diff)
  if (stats.worstChance > 0.05) {
    console.error(
      `warning: identical code separates fully by chance with p=${(stats.worstChance * 100).toFixed(1)}% at this run count; ` +
        'use 5 runs per side (p=0.8%) and alternate the order (A B B A ...)',
    )
  }
  return stats.regressions || stats.missing ? 1 : 0
}

process.exitCode = main(process.argv.slice(2))
