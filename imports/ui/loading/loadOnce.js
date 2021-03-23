import { ReactiveVar } from 'meteor/reactive-var'

const cache = new Map()

export const loadOnce = function (asyncInitFunc) {
  if (cache.has(asyncInitFunc)) {
    return cache.get(asyncInitFunc)
  }

  const initialized = new ReactiveVar(false)
  asyncInitFunc()
    .then(() => {
      initialized.set(true)
      cache.set(asyncInitFunc, initialized)
    })
    .catch(e => console.error(e))

  return initialized
}
