import { ReactiveVar } from 'meteor/reactive-var'

const cache = new Map()

/**
 * Calls an async (init-) function once and returns a ReactiveVar that resolves
 * to {true} once the function's execution has completed.
 * @param asyncInitFunc
 * @param completeOnError
 * @param onError
 * @return {any}
 */
export const loadOnce = function (asyncInitFunc, { onError, debug = () => {}, name } = {}) {
  if (cache.has(asyncInitFunc)) {
    return cache.get(asyncInitFunc)
  }

  const initialized = new ReactiveVar(false)
  cache.set(asyncInitFunc, initialized)

  asyncInitFunc()
    .catch(e => {
      debug('[loadOnce]: failed with error:')
      debug(e)

      if (onError) {
        onError(e)
      }
    })
    .finally(() => {
      debug('[loadOnce]: loaded', name)
      initialized.set(true)
    })

  return initialized
}
