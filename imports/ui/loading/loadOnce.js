import { ReactiveVar } from 'meteor/reactive-var'

const cache = new Map()

export const loadOnce = function (asyncInitFunc, { completeOnError = false, onError } = {}) {
  if (cache.has(asyncInitFunc)) {
    return cache.get(asyncInitFunc)
  }

  const initialized = new ReactiveVar(false)
  asyncInitFunc()
    .catch(e => {
      if (onError) {
        onError(e)
      }

      else {
        console.error(e)
      }

      if (completeOnError) {
        initialized.set(true)
        cache.set(asyncInitFunc, initialized)
      }
    })
    .finally(() => {
      initialized.set(true)
      cache.set(asyncInitFunc, initialized)
    })

  return initialized
}
