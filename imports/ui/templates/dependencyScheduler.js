/**
 * Start all requested template dependencies and return their reactive
 * completion handles. Contexts are synchronous and are initialized first.
 */
export const scheduleDependencies = ({
  contexts = [],
  language = false,
  tts = false,
  loaders = [],
  initClientContext,
  initLanguage,
  initializeTTS,
  loadOnce,
  onError,
  debug,
}) => {
  contexts.forEach((context) => initClientContext(context))

  const pending = []
  if (language) {
    pending.push(loadOnce(initLanguage, { onError, name: 'language' }))
  }
  if (tts) {
    pending.push(
      loadOnce(initializeTTS, {
        onError,
        name: 'tts',
        debug,
      }),
    )
  }
  loaders.forEach((loader) => {
    pending.push(loadOnce(loader, { onError }))
  })
  return pending
}

/**
 * Observe dependency handles and complete the template exactly once. A
 * translation failure is reported but does not leave the page permanently
 * waiting, matching the existing adapter contract.
 */
export const observeDependencies = ({
  pending,
  autorun,
  translations,
  loadTranslations,
  onComplete,
  onTranslationError,
}) => {
  let started = false
  let completed = false
  const completeOnce = () => {
    if (completed) return
    completed = true
    onComplete()
  }

  if (pending.length === 0) {
    completeOnce()
    return undefined
  }

  return autorun((computation) => {
    if (started || !pending.every((handle) => handle.get())) return
    started = true
    computation.stop()

    if (!translations) {
      completeOnce()
      return
    }

    Promise.resolve(loadTranslations(translations))
      .catch(onTranslationError)
      .then(completeOnce)
  })
}
