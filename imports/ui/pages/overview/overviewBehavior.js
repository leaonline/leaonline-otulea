export const collectContentFilters = (testCycles) => {
  const dimensions = new Set()
  const levels = new Set()
  testCycles.forEach(({ dimension, level }) => {
    dimensions.add(dimension)
    levels.add(level)
  })
  return {
    dimensionIds: Array.from(dimensions),
    levelIds: Array.from(levels),
  }
}

export const classifySession = ({ sessionDoc, testCycle }) => {
  if (!sessionDoc) {
    return {
      completedSessionDetected: false,
      abortedSessionDetected: false,
      sessionDoc: null,
    }
  }
  if (sessionDoc.completedAt) {
    return { completedSessionDetected: true, sessionDoc }
  }
  if (testCycle && sessionDoc.testCycle === testCycle._id) {
    return { abortedSessionDetected: true, sessionDoc }
  }
  return {
    completedSessionDetected: false,
    abortedSessionDetected: false,
  }
}

export const sessionRequest = {
  start(testCycleId) {
    return { args: { testCycleId }, isFreshStart: true }
  },
  continue(sessionId) {
    return { args: { sessionId }, isFreshStart: false }
  },
  cancel(sessionId) {
    return { args: { sessionId } }
  },
}

export const resolveLaunchNavigation = ({
  sessionDoc,
  unitSetDoc,
  isFreshStart,
  showStoryBeforeUnit,
}) => {
  const sessionId = sessionDoc._id
  const unitId = sessionDoc.currentUnit
  const unitSetId = unitSetDoc._id
  if (isFreshStart && showStoryBeforeUnit(unitId, unitSetDoc)) {
    return {
      target: 'story',
      args: { sessionId, unitId, unitSetId },
    }
  }
  return { target: 'next', args: { sessionId, unitId } }
}

export const getScrollTarget = (dimension, level) => {
  if (!dimension && !level) return 'overview-dimensions-container'
  if (dimension && !level) return 'overview-level-container'
  if (dimension && level) return '.overview-session-container'
  return undefined
}
