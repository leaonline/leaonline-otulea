# Agent Instructions

## Project

`otu.lea` is the diagnostic application in the lea.online ecosystem. It is a
desktop-focused PWA used primarily for supervised literacy assessment. The active stack is
Meteor 3.4, Blaze, MongoDB, and JavaScript.

Use the current source, tests, and configuration as the authority for product behavior. Consult
`README.md` for repository operation and `DOMAIN.md` for shared terminology and invariants. Do not
transfer assumptions from other lea.online applications without evidence in this repository.

## Architecture

- `client` and `server` contain the Meteor entry points.
- `imports/contexts` defines domain contexts, schemas, collections, and their APIs.
- `imports/api` contains cross-context services such as scoring, accounts, content access, and TTS.
- `imports/infrastructure` contains reusable collection, method, publication, and environment
  helpers.
- `imports/startup` wires client and server behavior; keep import-time side effects deliberate.
- `imports/ui` contains the Blaze UI, routing, loading, and item renderers.
- `resources` contains translations and application configuration templates.
- Tests live beside their subjects and under `tests`; full-app tests use `*.app-tests.js`.

Preserve Meteor's client/server boundary. Validate method arguments, derive identity from the
invocation, enforce ownership on the server, and use Meteor 3 async database and Accounts APIs on
server paths. Reuse existing contexts, factories, and shared packages before adding abstractions.


Sessions, responses, scoring, evaluation, and progress are distinct domain concepts. Preserve
their schemas and state transitions unless explicitly requested for change,
and add focused tests when changing them.
Keep accessible feedback and navigation behavior intact when changing diagnostic flows.

## Optional Content Service

`../leaonline-content` is an independent, read-only reference repository for the `lea.content`
service. Inspect it when needed to confirm shared schemas, context names, or remote method
contracts. Do not edit it or alter its Git state unless the user explicitly expands the task.

The relationship is intentionally weak: `otu.lea` synchronizes configured content into local
collections, but it must still start and use its existing local data when the service is absent.
Do not turn content synchronization into a hard startup dependency, add direct browser access to
the service, or make ordinary tests depend on a live content instance. Preserve local data on
connection failures or invalid/empty remote results.

## Working Rules

- Inspect the working tree first and preserve unrelated or in-progress changes.
- Keep changes small and scoped; inspect nearby code and tests before changing public contracts.
- Use the repository's existing npm/Meteor packages and scripts; keep `package-lock.json` in sync
  when dependencies intentionally change.
- Treat settings, credentials, deployment data, patches, and migrations as sensitive. Do not
  modify or execute them unless the task explicitly requires it.
- Do not deploy, publish, push, commit, rewrite history, or perform destructive Git operations
  unless explicitly requested.
- Never expose secrets or use production data in tests.

## Validation

Prefer focused validation first, followed by the broadest relevant check:

- `./test.sh -o -g '<pattern>'` runs matching tests once.
- `./test.sh -o -a server` or `./test.sh -o -a client` limits the architecture.
- `./test.sh -o` runs the unit/integration suite once.
- `./test.sh -o -f` runs full-app tests.
- `meteor npm run lint:code` checks code lint; `meteor npm run format:code` checks formatting.

Do not use the scripts' default watch mode for unattended validation. Report commands run,
results, and anything not verified.

## Subagents

Do not spawn subagents by default. Spawn them only when the user's current prompt explicitly asks
for subagents, delegation, or parallel agent work. Task size alone is not authorization. If they
are requested, assign bounded, non-overlapping work, tell each agent that the working tree is
shared, and keep final integration and validation with the parent agent.
