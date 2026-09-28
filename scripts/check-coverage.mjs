import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const coverageDir = path.join(root, '.coverage')
const lcovPath = path.join(coverageDir, 'lcov.info')
const allowlistPath = path.join(root, 'coverage-allowlist.json')
const thresholdsPath = path.join(root, 'coverage-thresholds.json')

const normalize = (file) => {
  const normalized = file.trim().replaceAll('\\', '/')
  const relative = path.isAbsolute(normalized) ? path.relative(root, normalized) : normalized
  return relative.replace(/^\.\//, '').replaceAll('\\', '/')
}

const isTestOrSupport = (file) =>
  file.startsWith('tests/') ||
  file.includes('/tests/') ||
  file.endsWith('.tests.js') ||
  file.endsWith('.app-test.js') ||
  file.endsWith('.app-tests.js')

const productionFiles = []
const visit = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      visit(absolute)
    } else if (entry.name.endsWith('.js')) {
      const relative = normalize(absolute)
      if (!isTestOrSupport(relative)) productionFiles.push(relative)
    }
  }
}
visit(path.join(root, 'imports'))
productionFiles.sort()

if (!fs.existsSync(lcovPath)) {
  throw new Error(`Coverage report not found at ${lcovPath}`)
}

const records = fs
  .readFileSync(lcovPath, 'utf8')
  .split('end_of_record')
  .map((record) => record.trim())
  .filter(Boolean)

const coveredFiles = new Set()
const unexpected = []
const totals = {
  lines: { found: 0, hit: 0 },
  branches: { found: 0, hit: 0 },
  functions: { found: 0, hit: 0 },
}

for (const record of records) {
  const values = Object.fromEntries(
    record
      .split('\n')
      .filter((line) => /^(?:SF|LF|LH|BRF|BRH|FNF|FNH):/.test(line))
      .map((line) => {
        const splitAt = line.indexOf(':')
        return [line.slice(0, splitAt), line.slice(splitAt + 1)]
      }),
  )
  if (!values.SF) continue
  const file = normalize(values.SF)
  if (isTestOrSupport(file)) {
    unexpected.push(file)
    continue
  }
  if (!file.startsWith('imports/')) continue
  coveredFiles.add(file)
  totals.lines.found += Number(values.LF ?? 0)
  totals.lines.hit += Number(values.LH ?? 0)
  totals.branches.found += Number(values.BRF ?? 0)
  totals.branches.hit += Number(values.BRH ?? 0)
  totals.functions.found += Number(values.FNF ?? 0)
  totals.functions.hit += Number(values.FNH ?? 0)
}

const allowlist = JSON.parse(fs.readFileSync(allowlistPath, 'utf8'))
const thresholds = JSON.parse(fs.readFileSync(thresholdsPath, 'utf8'))
const missing = productionFiles.filter((file) => !coveredFiles.has(file))
const unexplained = missing.filter((file) => !allowlist[file])
const staleAllowlist = Object.keys(allowlist).filter(
  (file) => !productionFiles.includes(file) || coveredFiles.has(file),
)
const weakReasons = Object.entries(allowlist)
  .filter(([, reason]) => typeof reason !== 'string' || reason.trim().length < 20)
  .map(([file]) => file)

const percentage = ({ found, hit }) => (found === 0 ? 100 : (hit / found) * 100)
const summaryMetrics = Object.fromEntries(
  Object.entries(totals).map(([name, total]) => [
    name,
    { ...total, pct: Number(percentage(total).toFixed(2)) },
  ]),
)

const summary = {
  metrics: summaryMetrics,
  inventory: {
    production: productionFiles.length,
    reported: coveredFiles.size,
    allowlisted: missing.length - unexplained.length,
    unexplained: unexplained.length,
  },
}

fs.writeFileSync(
  path.join(coverageDir, 'coverage-summary.json'),
  `${JSON.stringify(summary, null, 2)}\n`,
)

const errors = []
if (unexpected.length > 0) {
  errors.push(`test/support files were instrumented: ${unexpected.join(', ')}`)
}
if (unexplained.length > 0) {
  errors.push(`production files missing from LCOV: ${unexplained.join(', ')}`)
}
if (staleAllowlist.length > 0) {
  errors.push(`stale coverage allowlist entries: ${staleAllowlist.join(', ')}`)
}
if (weakReasons.length > 0) {
  errors.push(`coverage allowlist reasons are too vague: ${weakReasons.join(', ')}`)
}
if (thresholds.version !== 1) {
  errors.push(`unsupported coverage baseline version ${thresholds.version}`)
}
if (productionFiles.length !== thresholds.inventory.productionFiles) {
  errors.push(
    `production inventory changed: expected ${thresholds.inventory.productionFiles}, found ${productionFiles.length}`,
  )
}
if (missing.length > thresholds.inventory.maxAllowlisted) {
  errors.push(
    `allowlisted inventory grew: maximum ${thresholds.inventory.maxAllowlisted}, found ${missing.length}`,
  )
}
for (const metric of ['lines', 'branches', 'functions']) {
  const baseline = thresholds.metrics?.[metric]
  if (
    !Number.isSafeInteger(baseline?.found) ||
    !Number.isSafeInteger(baseline?.hit)
  ) {
    errors.push(`missing exact ${metric} coverage baseline`)
    continue
  }
  if (summaryMetrics[metric].found !== baseline.found) {
    errors.push(
      `${metric} denominator changed: expected ${baseline.found}, found ${summaryMetrics[metric].found}`,
    )
  }
  if (summaryMetrics[metric].hit < baseline.hit) {
    errors.push(
      `${metric} coverage regressed: minimum ${baseline.hit}/${baseline.found}, found ${summaryMetrics[metric].hit}/${summaryMetrics[metric].found}`,
    )
  }
}

console.log(
  `[coverage] lines=${summaryMetrics.lines.pct}% branches=${summaryMetrics.branches.pct}% functions=${summaryMetrics.functions.pct}%`,
)
console.log(
  `[coverage-inventory] production=${productionFiles.length} reported=${coveredFiles.size} allowlisted=${summary.inventory.allowlisted} unexplained=${summary.inventory.unexplained}`,
)

if (errors.length > 0) {
  for (const error of errors) console.error(`[coverage] ${error}`)
  process.exitCode = 1
}
