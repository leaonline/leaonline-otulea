export const resolveStorySession = ({ unitId, sessionId, responseData }) => {
  if (!unitId || !sessionId || !responseData) return { action: 'exit' }
  const { sessionDoc, unitSetDoc, dimensionDoc, levelDoc, color } = responseData
  if (!sessionDoc || !unitSetDoc || !dimensionDoc || !levelDoc) {
    return { action: 'exit' }
  }
  return {
    action: 'show',
    state: { sessionDoc, unitSetDoc, dimensionDoc, levelDoc, color },
  }
}

export const storyNavigation = ({ sessionDoc, unitId }) => ({
  sessionId: sessionDoc._id,
  unitId,
})
