import {
  runRateLimiter as runRegisteredRateLimiter,
  rateLimitMethods as registerMethodLimits,
  rateLimitPublications as registerPublicationLimits,
  rateLimitAccounts as registerAccountLimits,
} from 'meteor/leaonline:ratelimit-factory'

const methods = new Set()
const publications = new Set()
let accounts = false
let running = false

/** A read-only inventory used by startup diagnostics and integration tests. */
export const RateLimitInventory = {
  hasMethod: (name) => methods.has(name),
  hasPublication: (name) => publications.has(name),
  hasAccounts: () => accounts,
  isRunning: () => running,
  counts: () => ({ methods: methods.size, publications: publications.size }),
}

export const rateLimitMethods = (definitions) => {
  definitions.forEach(({ name }) => methods.add(name))
  return registerMethodLimits(definitions)
}

export const rateLimitPublications = (definitions) => {
  definitions.forEach(({ name }) => publications.add(name))
  return registerPublicationLimits(definitions)
}

export const rateLimitAccounts = (...args) => {
  accounts = true
  return registerAccountLimits(...args)
}

export const runRateLimiter = (...args) => {
  running = true
  return runRegisteredRateLimiter(...args)
}
