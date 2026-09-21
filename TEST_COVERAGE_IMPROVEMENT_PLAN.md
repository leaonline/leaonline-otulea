# Test Coverage Improvement Plan

Status: revised proposal only. This document does not implement tests or change production code.

This revision supersedes the earlier extraction/refactoring and app-flow phases. The remaining
coverage work is strictly test-only and behavior-preserving. In particular, it must not refactor
client code, add production test seams, extend the existing app-flow suite, or introduce E2E tests.

Coverage snapshot reviewed: `.coverage/lcov.info` and the result of
`node scripts/check-coverage.mjs`, generated on 2026-09-21. Test inventories were read from
`.test-results/`.

## Why the reported percentage fell

The earlier percentage was calculated over an incomplete production inventory. The current
coverage plumbing excludes test files and measures almost the entire application, including the
client template registration modules that the client suite now imports.

| Metric | Earlier incomplete production snapshot | Corrected current baseline | Percentage change |
| --- | ---: | ---: | ---: |
| Lines | 1,180 / 1,489 (79.25%) | 2,338 / 3,838 (60.92%) | -18.33 points |
| Branches | 399 / 652 (61.20%) | 903 / 1,588 (56.86%) | -4.34 points |
| Functions | 223 / 311 (71.70%) | 504 / 1,047 (48.14%) | -23.56 points |
| Production inventory | 115 of 208 files reported | 206 reported + 11 allowlisted of 217 | fully accounted |

The hit counts increased substantially. The percentage fell because 91 additional production
modules became visible and nine production modules were added during the earlier work. Client
templates contribute many helper, event, and lifecycle callbacks, which explains the particularly
large function-denominator increase. This is a scope correction, not a reason to exclude the new
records.

The corrected baseline is internally consistent:

- `imports/` contains 217 production JavaScript files.
- LCOV reports 206 of them; the remaining 11 have specific reasons in
  `coverage-allowlist.json`; there are zero unexplained files.
- No test/support file is included in the evaluated production metrics.
- The unit suite reports 191 server and 178 client tests, with zero pending or focused tests.
- The existing full-app suite reports one server and two client tests. Those tests remain frozen
  and are not part of this coverage-improvement plan.

## Where the uncovered denominator is now

| Area | Lines | Branches | Functions |
| --- | ---: | ---: | ---: |
| API | 390 / 408 (95.59%) | 159 / 192 (82.81%) | 92 / 102 (90.20%) |
| Contexts | 632 / 810 (78.02%) | 168 / 256 (65.63%) | 116 / 162 (71.60%) |
| Infrastructure | 170 / 171 (99.42%) | 60 / 68 (88.24%) | 39 / 41 (95.12%) |
| Patches | 122 / 290 (42.07%) | 41 / 156 (26.28%) | 20 / 48 (41.67%) |
| Queries | 2 / 25 (8.00%) | 0 / 4 (0.00%) | 0 / 14 (0.00%) |
| Startup | 159 / 211 (75.36%) | 11 / 30 (36.67%) | 15 / 46 (32.61%) |
| UI | 789 / 1,830 (43.11%) | 433 / 836 (51.79%) | 195 / 602 (32.39%) |
| Utilities | 74 / 93 (79.57%) | 31 / 46 (67.39%) | 27 / 32 (84.38%) |

UI modules account for 1,041 of 1,500 uncovered lines (69.4%), 403 of 685 uncovered branches
(58.8%), and 407 of 543 uncovered functions (75.0%). The six largest page adapters alone account
for 762 uncovered lines:

| Existing adapter | Lines | Branches | Functions |
| --- | ---: | ---: | ---: |
| `welcome/welcome.js` | 16 / 203 | 0 / 64 | 6 / 70 |
| `overview/overview.js` | 4 / 153 | 0 / 59 | 0 / 48 |
| `internal/internal.js` | 7 / 152 | 0 / 56 | 0 / 47 |
| `unit/unit.js` | 39 / 136 | 9 / 49 | 3 / 38 |
| `complete/complete.js` | 4 / 98 | 0 / 28 | 0 / 43 |
| `diagnostics/diagnostics.js` | 4 / 94 | 0 / 18 | 0 / 29 |

By contrast, the already extracted `welcomeBehavior`, `overviewBehavior`, `storyBehavior`,
`unitBehavior`, and `completeBehavior` modules have 100% line coverage and near-complete branch
coverage. Adding more behavior modules or more tests for those modules would not address the
remaining denominator. The work must exercise the existing adapters as they are.

## Non-negotiable scope and safety rules

Treat the current post-implementation source tree as the production baseline. Each follow-up
coverage slice must be reviewed relative to that baseline, separately from the earlier refactor.

Allowed changes:

- Add or extend `*.tests.js` files and test-only fixtures/helpers under `tests/` or an existing
  `tests/` directory.
- Add the corresponding imports to existing test index modules.
- Raise `test-count-minimums.json` and the coverage hit-count floors after a clean, unfiltered run.
- Update coverage documentation with reproducible before/after evidence.

Forbidden changes:

- No changes to `client/`, `server/`, or production files under `imports/`, including template
  adapters, behavior modules, loaders, routers, contexts, and startup modules.
- No extraction, renaming, signature change, dependency-injection parameter, new production
  export, wrapper, or branch rewrite to make a module easier to test.
- No new coverage exclusions and no expansion of `coverage-allowlist.json`. In particular, client
  template modules must remain in the denominator.
- No blanket startup/template imports whose only purpose is to mark files as loaded.
- No changes to `imports/integration/appFlow.app-tests.js`, no new `*.app-tests.js` files, and no
  Playwright, Cypress, or other E2E work. The existing full-app suite may be run unchanged as a
  regression check, but it must not provide the claimed coverage gain.
- No broad DOM snapshots, CSS-class inventories, real external services, real speech output, real
  service workers, or network-dependent tests.
- No pending tests, focused tests, swallowed setup failures, or reduced coverage/test-count gates.

If current behavior appears defective while adding a test, record a minimal reproducer for a
separate bug-fix change. Do not modify production behavior inside a coverage-only slice, and do not
merge the reproducer as skipped or pending.

## Test strategy

Use the existing `meteortesting:mocha` client runner with headless Chromium. These are isolated
client component tests, not app-flow tests: render one template with controlled data, exercise one
observable interaction or lifecycle transition, and remove it before the next test.

Create or repair a test-only Blaze harness that:

- retains the `Blaze.renderWithData` view handle;
- waits for `Tracker.afterFlush` after rendering and reactive changes;
- dispatches real DOM events against the rendered template;
- calls `Blaze.remove(view)` before removing the host element;
- uses a Sinon sandbox and restores timers, Meteor/browser stubs, global helpers, console methods,
  local storage, and temporary collection data in `afterEach`;
- provides deterministic fakes for existing boundaries such as template `initDependencies`,
  `instance.api`, Meteor calls, routing callbacks, speech, printing, WebGL, and service workers;
- uses current public exports and observable DOM/callback behavior rather than Blaze private helper
  or event registries.

The existing `UITests.withRenderedTemplate` helper is not sufficient for this work because it does
not retain and remove the Blaze view and removes its host immediately. It may be replaced or
supplemented only in test code; production templates must not be changed.

Use fake timers only around a specific scheduled operation, advance them explicitly, then restore
them. Never retain real 100/300/500/1500 ms waits. Use real Mongo/Minimongo with unique fixture IDs
where collection behavior matters, and stub only external or irreversible boundaries.

## Implementation sequence

### 1. Freeze and verify the corrected baseline

- Preserve the current inventory: 217 production files, 206 LCOV records, 11 allowlisted files,
  and zero unexplained files.
- Preserve the exact denominators: 3,838 lines, 1,588 branches, and 1,047 functions. A test-only
  change should not alter them. If it does, stop and explain the instrumentation change rather than
  accepting a new baseline.
- Keep the present hit floors of 2,338 lines, 903 branches, and 504 functions until tests prove
  higher values. Never lower a hit floor.
- Confirm that a clean unfiltered run, not a `MOCHA_GREP` subset, is the source of every ratchet.

Completion criteria:

- The existing combined suite and coverage check reproduce the baseline.
- The current test counts and zero-pending/zero-focused checks remain intact.
- The baseline is recorded separately from all subsequent test-only slices so production changes
  cannot be hidden in a coverage diff.

### 2. Establish direct client-template coverage with small modules

Use the test-only Blaze harness first on smaller adapters. This proves the isolation and cleanup
model before applying it to the large pages.

Add focused client tests for:

1. `Routes.js`: paths, trigger lists, route data callbacks, missing-session fallbacks, story/unit/
   completion choices, scroll hooks, and environment-specific registration. Invoke one route
   callback at a time; do not navigate through a multi-page flow.
2. `fatal.js`, `navbar.js`, and `footer.js`: dependency success/error, modal/open state, progress
   derivation, exit confirmation, legal/link/logo helpers, delayed initialization, and teardown.
3. `login.js`, `logout.js`, `notFound.js`, `loading.js`, and `legal.js`: initial/authenticated
   states, method success/error, legal lookup/parse failure, back/logout/navigation callbacks, and
   displayed error state.
4. `story.js`: missing identifiers, loader success/failure, renderer readiness, helper data,
   finish navigation, and abort behavior.
5. `defaultMarkdownRenderer.js`, `initMarkdownRenderer.js`, and `initDependencies.js`: empty/string/
   token TTS input, renderer scheduling, no-dependency completion, dependency success/failure,
   translation failure, existing API wiring, and exactly-once completion.

All of these tests must use existing interfaces. If a branch cannot be reached through rendering,
an existing export, or a replaceable external API, leave it uncovered and document it; do not add
a production seam.

Completion criteria:

- Each selected template has at least one rendered lifecycle assertion, one observable helper or
  DOM-state assertion, and relevant event success/failure assertions.
- Every view, Tracker computation, timer, stub, and temporary global is cleaned up.
- No test chains routes or depends on the full application being started.

### 3. Cover the large user-facing adapters without extracting more logic

Add template-level tests to the existing files. Do not duplicate the already-covered behavior
module cases; verify only the adapter's state, lifecycle, event, and callback wiring.

| Adapter | Additive client-unit cases |
| --- | --- |
| `welcome.js` | Cached-code/no-code creation; server-code success and fallback; rendered helper states; valid/invalid paste and input; keyboard deletion; login/register success and failure; logout, back, beta-toggle, and overview callbacks. |
| `overview.js` | Dependency/content load success and failure; dimension/level visibility and selection; query-param events; continue/restart/new-session method wiring; launch success and rejected-session handling; story versus unit callback selection. |
| `unit.js` | Missing and valid session parameters; loader success/failure; renderer readiness; page/navbar data; item callbacks; next/back/finish events; rejected durable submission; completion/exit callbacks; lifecycle cleanup. |
| `complete.js` | Data/session loader success and failure; valid/invalid view parameter; one-time response-detail loading; helper view states; print/toggle/navigation events; response-loader cleanup on destroy. |

Work in separate slices: `welcome`/`overview`, then `unit`/`complete`. These templates sit on the
critical assessment path, so assertions should focus on current observable sequencing and failure
handling rather than markup snapshots.

Completion criteria:

- The adapter files themselves, not only their behavior modules, show material line, branch, and
  function increases in LCOV.
- Existing route names, method arguments, persisted shapes, timing order, and callbacks remain
  unchanged because no production file was edited.
- A test failure caused by an apparent product defect is moved to a separate bug-fix scope rather
  than repaired here.

### 4. Cover diagnostics and internal tooling in isolation

These modules are large but have more browser and global side effects, so address them only after
the harness cleanup rules have proved reliable.

- Test exported `runDiagnostics` through controlled browser environments: performance marks,
  service-worker absent/not-found/found states, local-storage success/failure, screen data, WebGL
  absent/basic/debug-info states, font detection, OS-info failure, TTS initialization/config/play
  success and failure, timeout handling, and normalized errors.
- Render `diagnostics.js` with `Diagnostics.api.run`, language setup, method calls, and console
  methods controlled by the sandbox. Cover confirmation, result flattening, send success/failure,
  displayed errors, and guaranteed restoration of every console stub in test teardown.
- Render `internal.js` with existing content loaders stubbed. Cover empty/invalid searches,
  unit/unit-set success and failure, color fallback, unit/story selection, page navigation, and
  presentation-mode events without contacting a content service.

Stop this slice if deterministic cleanup would require changing either production module. Global
leaks or inaccessible behavior are reasons to defer a case, not authorization to refactor it.

Completion criteria:

- No test leaves console, storage, DOM, timer, service-worker, WebGL, or performance state changed.
- No live content service, speech engine, device API, or remote endpoint is used.
- The diagnostics and internal templates are tested independently; they are not combined into an
  app flow.

### 5. Add tests for meaningful non-UI residual gaps

API and infrastructure coverage is already strong. Do not spend effort on fully covered factories
or trivial declarations merely to raise counts. Add server tests only where the remaining behavior
is substantial:

1. `alphaUsers.js`: use isolated real collection fixtures and a stubbed `fs.writeFile`; cover
   incomplete users/sessions, missing test cycles, generated/existing/duplicate feedback,
   competency/alpha aggregation, optional columns, dates/duration, dry-run behavior, and write
   success/failure.
2. `getResponses.js`: cover invalid/demo/debug users, missing units, item index resolution,
   response/score serialization, dry-run behavior, and stubbed write success/failure.
3. `createCorpusQuery.js`: stub the `SpeechCorpus` package boundary; verify source extraction,
   default/explicit output options, log build, transformed build, and rejection propagation
   without writing files.
4. Add narrow cases for `Videos.js`, `Record.js`, and `Response.js` only where LCOV identifies an
   untested application-owned branch. Do not re-test schemas or package behavior.

Do not import `startup/server/patches.js` under artificial settings merely to execute its lines.
The exported patch functions carry the behavior; import-time scheduling and notification changes
belong in a separate production-change proposal if they cannot be observed safely as-is.

Completion criteria:

- Tests use unique fixtures and remove them in `afterEach`, including after rejection.
- No real filesystem output, email, content connection, or production data is used.
- Assertions verify returned/output behavior and database postconditions rather than execution
  alone.

### 6. Ratchet from verified hit counts

After each slice:

1. Run focused tests while developing.
2. Run the complete affected architecture.
3. Run the unfiltered combined suite and clean coverage job.
4. Inspect per-file LCOV changes for the intended production modules.
5. Run the clean coverage job a second time; denominators and inventory must match, and hit counts
   must be stable.
6. Raise the exact `hit` values in `coverage-thresholds.json` to the lower verified result. Keep all
   `found` values and inventory limits unchanged.
7. Raise `test-count-minimums.json` to the newly observed unfiltered test counts.

The first realistic tests-only milestone on the fixed denominator is:

| Metric | Current floor | First milestone | Additional hits required |
| --- | ---: | ---: | ---: |
| Lines | 2,338 / 3,838 (60.92%) | 2,687 / 3,838 (70.01%) | 349 |
| Branches | 903 / 1,588 (56.86%) | 953 / 1,588 (60.01%) | 50 |
| Functions | 504 / 1,047 (48.14%) | 576 / 1,047 (55.01%) | 72 |

After reaching that milestone, reassess a second tests-only target of 75% lines, 65% branches, and
60% functions. Neither target permits production refactoring, denominator reduction, or app-flow/
E2E expansion. If the tests-only ceiling is lower, document the inaccessible branches and handle
them in a separately approved plan.

## Validation commands

Use focused commands during development, followed by the broad checks:

```sh
./test.sh -o -a client -g '<suite pattern>'
./test.sh -o -a server -g '<suite pattern>'
./test.sh -o -a client
./test.sh -o -a server
./test.sh -o
./test.sh -c -o
meteor npm run lint:code
```

Run `./test.sh -f -o` once at final handoff only to confirm that the pre-existing full-app safety
net still passes unchanged. Do not add cases to it and do not count it as evidence for this plan's
coverage gains.

## Review and completion criteria

Use separate reviewable changes for the test harness, each small-template group, each large-page
pair, diagnostics/internal tooling, and server maintenance utilities. Every change must include its
clean before/after line, branch, function, production-inventory, and test-count evidence.

The plan is complete when:

- the first milestone is reached, or a lower tests-only ceiling is demonstrated without violating
  the stop rules;
- every coverage increase comes from assertions against existing behavior;
- no production client/server module changed relative to the corrected baseline;
- production inventory remains fully accounted, with no new allowlist or exclusion entry;
- thresholds and test-count floors only move upward;
- unit suites have zero pending/focused tests and no leaked client state; and
- the existing app-flow suite remains unchanged and green, with all E2E expansion deferred to its
  separate plan.
