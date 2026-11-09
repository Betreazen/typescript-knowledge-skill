#!/usr/bin/env node
// Переводит текст tsc --extendedDiagnostics в общий JSON-формат bench_compare.mjs. Без зависимостей, Node 18+.
//
// Запуск: node node_modules/typescript/bin/tsc --noEmit --extendedDiagnostics --checkers 1 | node tsc_diag.mjs > bench/before/run1.json
// Понимает раскладку TS 6 и TS 7 (--checkers есть только в TS 7).
//
// Берутся только Types, Instantiations и Memory used: время одного прогона — это шум, его мерьте через hyperfine.
// Счётчики сравнимы только внутри одного поколения компилятора и при одном числе чекеров,
// поэтому в файл пишется поле compiler, и bench_compare.mjs откажется сравнивать TS 6 с TS 7.
// Код выхода: 0 — готово; 2 — на входе нет диагностики (например, tsc упал раньше).

import { readFileSync } from 'node:fs'

const LINE = /^([A-Za-z/ ]+):\s+([\d.]+)(K)?\s*$/
const COUNT_FIELDS = new Set(['Types', 'Instantiations'])
const MEMORY_FIELD = 'Memory used'
const BYTES_IN_K = 1024
const EXPECTED_FIELDS = COUNT_FIELDS.size + 1 // счётчики и память
// Строка «Memory allocs» есть только в выводе компилятора на Go.
const GO_COMPILER_MARKER = /^Memory allocs:/m

/** Одна строка диагностики как строка общего формата или null, если поле не нужно. */
function toBenchmark(name, value, suffix) {
  const row = (unit, v) => ({ name, unit, median: v, q1: v, q3: v })
  if (COUNT_FIELDS.has(name)) return row('count', value)
  if (name === MEMORY_FIELD) return row('bytes', suffix === 'K' ? value * BYTES_IN_K : value)
  return null
}

function main() {
  const text = readFileSync(0, 'utf8')
  const benchmarks = []
  for (const line of text.split(/\r?\n/)) {
    const match = LINE.exec(line)
    if (!match) continue
    const row = toBenchmark(match[1], Number(match[2]), match[3])
    if (row) benchmarks.push(row)
  }
  if (benchmarks.length < EXPECTED_FIELDS) {
    const found = benchmarks.map((b) => b.name).join(', ') || 'nothing'
    console.error(`incomplete --extendedDiagnostics output on stdin (found: ${found}); check that tsc did not crash and that its output layout is unchanged`)
    return 2
  }
  const compiler = GO_COMPILER_MARKER.test(text) ? 'tsc-go' : 'tsc-js'
  process.stdout.write(`${JSON.stringify({ unit: 'count', compiler, benchmarks }, null, 1)}\n`)
  return 0
}

process.exitCode = main()
