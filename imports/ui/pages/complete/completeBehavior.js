export const completionStates = {
  showResults: 'showResults',
  showDecision: 'showDecision',
  showFailed: 'showFailed',
}

export const completionStateValues = Object.values(completionStates)

export const resolveCompletionView = (value) => {
  const index = Number.parseInt(value ?? 0, 10)
  return completionStateValues[index] || completionStates.showResults
}

export const completionViewIndex = (state) =>
  completionStateValues.indexOf(state)

export const createCompletionFailureState = (error) => ({
  competenciesLoaded: true,
  sessionLoaded: true,
  failed: error
    ? {
        error: error.error ?? 'error.default',
        reason: error.reason || error.message,
      }
    : true,
})

export const resolveCompletionSession = ({ sessionData, sessionId }) => {
  if (!sessionData) throw new Error('Expected completion session data')
  if (sessionData.action === 'next' || sessionData.action === 'exit') {
    return { action: 'exit', args: { sessionId } }
  }
  return { action: 'show', state: sessionData }
}

export const shouldLoadResponses = ({
  user,
  callingResponses,
  responsesAttempted,
}) => !!user?.debug && !callingResponses && !responsesAttempted

/**
 * Response details are diagnostic-only data. They get one automatic attempt
 * per completion-page lifetime. A rejected request is surfaced through the
 * normal failure state and is not retried by the reactive computation.
 */
export const createResponseDetailsLoader = ({
  sessionId,
  debug,
  load,
  onFailed,
}) => {
  let stopped = false

  return {
    stop() {
      stopped = true
    },
    async run({ user, state }) {
      if (
        stopped ||
        !shouldLoadResponses({
          user,
          callingResponses: state.get('callingResponses'),
          responsesAttempted: state.get('responsesAttempted'),
        })
      ) {
        return false
      }

      state.set({ callingResponses: true, responsesAttempted: true })
      try {
        const responses = await load({ sessionId, debug })
        if (!stopped) {
          state.set({ responses, responsesLoaded: true })
        }
        return !stopped
      } catch (error) {
        if (!stopped) onFailed(error)
        return false
      } finally {
        if (!stopped) state.set('callingResponses', false)
      }
    },
  }
}

export const completionNavigation = (action) => {
  if (action === 'end') return 'end'
  if (action === 'continue' || action === 'overview') return 'next'
  return undefined
}
