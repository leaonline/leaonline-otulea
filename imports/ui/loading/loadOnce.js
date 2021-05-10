import { ReactiveVar } from 'meteor/reactive-var'

const cache = new Map()

export const loadOnce = function (asyncInitFunc) {
  if (cache.has(asyncInitFunc)) {
    return cache.get(asyncInitFunc)
  }

  const initialized = new ReactiveVar(false)
  asyncInitFunc()
    .catch(e => console.error(e))
    .finally(() => {
      initialized.set(true)
      cache.set(asyncInitFunc, initialized)
    })

  return initialized
}
