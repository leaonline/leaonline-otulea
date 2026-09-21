import fs from 'node:fs'
import path from 'node:path'

const [
  ,
  ,
  outputFile,
  expectedServer = '1',
  expectedClient = '1',
  expectedFullApp = '0',
  explicitlyFiltered = '0',
] = process.argv

if (!outputFile) {
  throw new Error(
    'Usage: node scripts/check-test-output.mjs <output> [server] [client] [full-app] [filtered]',
  )
}

const minimumsPath = path.join(process.cwd(), 'test-count-minimums.json')
const minimums = JSON.parse(fs.readFileSync(minimumsPath, 'utf8'))
if (minimums.version !== 1) {
  throw new Error(`Unsupported test-count baseline version ${minimums.version}`)
}

const stripAnsi = (value) =>
  value.replace(/[\u001b\u009b][[\]()#;?]*(?:(?:(?:[a-zA-Z\d]*(?:;[-a-zA-Z\d\/#&.:=?%@~_]+)*)?\u0007)|(?:(?:\d{1,4}(?:[;:]\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~]))/g, '')

const output = stripAnsi(fs.readFileSync(outputFile, 'utf8'))
const wantsServer = expectedServer === '1'
const wantsClient = expectedClient === '1'
const errors = []

const noBrowserMessage =
  'Load the app in a browser to run client tests, or set the TEST_BROWSER_DRIVER environment variable.'

const serverStarted =
  output.includes('RUNNING SERVER TESTS') ||
  output.includes('RUNNING APP SERVER TESTS')
const clientStarted =
  output.includes('RUNNING CLIENT TESTS') ||
  output.includes('RUNNING APP CLIENT TESTS')

if (wantsServer && !serverStarted) {
  errors.push('the requested server suite did not start')
}
if (wantsClient && !clientStarted) {
  errors.push('the requested client suite did not start')
}
if (wantsServer && output.includes('SKIPPING SERVER TESTS')) {
  errors.push('the requested server suite was skipped')
}
if (wantsClient && output.includes('SKIPPING CLIENT TESTS')) {
  errors.push('the requested client suite was skipped')
}
if (wantsClient && output.includes(noBrowserMessage)) {
  errors.push('no browser connected for the requested client suite')
}
if (/\b\d+\s+pending\b/i.test(output)) {
  errors.push('the suite contains pending tests')
}

const fullApp = expectedFullApp === '1'
const mode = fullApp ? 'fullApp' : 'unit'
const architectureHeading = (architecture) =>
  fullApp
    ? `RUNNING APP ${architecture.toUpperCase()} TESTS`
    : `RUNNING ${architecture.toUpperCase()} TESTS`
const passingCount = (architecture) => {
  const start = output.indexOf(architectureHeading(architecture))
  if (start < 0) return 0
  const remaining = output.slice(start + architectureHeading(architecture).length)
  const nextHeading = remaining.search(/RUNNING (?:APP )?(?:SERVER|CLIENT) TESTS/)
  const section = nextHeading < 0 ? remaining : remaining.slice(0, nextHeading)
  const counts = [...section.matchAll(/\b(\d+)\s+passing\b/g)].map((match) =>
    Number.parseInt(match[1], 10),
  )
  return counts.at(-1) ?? 0
}

const sourceRoots = ['tests', 'imports']
const focusedPatterns = [/\b(?:describe|it|test)\.only\s*\(/, /\bfdescribe\s*\(/, /\bfit\s*\(/]
const focused = []

const visit = (entry) => {
  if (!fs.existsSync(entry)) return
  const stat = fs.statSync(entry)
  if (stat.isDirectory()) {
    for (const child of fs.readdirSync(entry)) visit(path.join(entry, child))
    return
  }
  if (!entry.endsWith('.js')) return
  const source = fs.readFileSync(entry, 'utf8')
  if (focusedPatterns.some((pattern) => pattern.test(source))) {
    focused.push(path.relative(process.cwd(), entry))
  }
}

for (const root of sourceRoots) visit(root)
if (focused.length > 0) {
  errors.push(`focused tests found: ${focused.join(', ')}`)
}

const architectureNames = []
if (wantsServer) architectureNames.push('server')
if (wantsClient) architectureNames.push('client')
const summary = Object.fromEntries(
  architectureNames.map((name) => [name, passingCount(name)]),
)

for (const architecture of architectureNames) {
  const observed = summary[architecture]
  if (observed <= 0) {
    errors.push(`${mode} ${architecture} reported ${observed} passing tests`)
    continue
  }
  if (explicitlyFiltered !== '1') {
    const minimum = minimums.modes?.[mode]?.[architecture]
    if (!Number.isSafeInteger(minimum) || minimum <= 0) {
      errors.push(`missing positive ${mode} ${architecture} count baseline`)
    } else if (observed < minimum) {
      errors.push(
        `${mode} ${architecture} count regressed: minimum ${minimum}, observed ${observed}`,
      )
    }
  }
}

fs.mkdirSync('.test-results', { recursive: true })
const modePrefix = fullApp ? 'app-' : ''
const summaryName = `${modePrefix}${architectureNames.join('-') || 'none'}`
fs.writeFileSync(
  `.test-results/${summaryName}.json`,
  `${JSON.stringify({ version: minimums.version, mode, architectures: summary, pending: 0, focused: 0 }, null, 2)}\n`,
)

console.log(
  `[test-inventory] ${architectureNames.map((name) => `${name}=${summary[name]}`).join(' ')}`,
)

if (errors.length > 0) {
  for (const error of errors) console.error(`[test-inventory] ${error}`)
  process.exitCode = 1
}
