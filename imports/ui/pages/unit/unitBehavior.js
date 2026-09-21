export const resolveUnitSession = ({
  sessionId,
  unitId,
  responseData,
  currentPageCount = 0,
  isComplete,
  isCurrentUnit,
}) => {
  if (!sessionId || !unitId || !responseData) return { action: 'exit' }

  const {
    sessionDoc,
    unitDoc,
    unitSetDoc,
    dimensionDoc,
    levelDoc,
    color,
  } = responseData
  if (!sessionDoc || !unitDoc || !unitSetDoc || !dimensionDoc || !levelDoc) {
    return { action: 'exit' }
  }
  if (isComplete(sessionDoc)) {
    return { action: 'finish', args: { sessionId } }
  }
  if (!isCurrentUnit({ sessionDoc, unitId })) {
    return {
      action: 'next',
      args: { unitId: sessionDoc.currentUnit, sessionId },
    }
  }

  const pages = unitDoc.pages || []
  if (currentPageCount > 0) {
    sessionDoc.progress += currentPageCount
  }
  unitDoc.pages = pages
  return {
    action: 'show',
    state: {
      sessionDoc,
      unitSetDoc,
      dimensionDoc,
      levelDoc,
      color,
      unitDoc,
      currentPageCount,
      maxPages: pages.length,
      hasNext: pages.length > currentPageCount + 1,
    },
  }
}

export const submitAndAdvancePage = async ({
  sessionId,
  unitDoc,
  sessionDoc,
  currentPageCount,
  newPage,
  submitItems,
  savePage,
  delay = () => Promise.resolve(),
}) => {
  if (!newPage.currentPage) {
    throw new Error(`Undefined page for current index ${newPage.currentPageCount}`)
  }

  await delay()
  await submitItems({ sessionId, unitDoc, page: currentPageCount })
  sessionDoc.progress += 1
  const nextPage = { ...newPage, sessionDoc }
  savePage(
    { unitId: unitDoc._id, sessionId },
    newPage.currentPageCount,
  )
  return nextPage
}

const tagTransitionError = (error, stage) => {
  const tagged =
    error && typeof error === 'object' ? error : new Error(String(error))
  tagged.unitTransitionStage = stage
  return tagged
}

export const finishUnit = async ({
  sessionId,
  unitDoc,
  page,
  submitItems,
  flushResponses,
  callNext,
  clearPage,
}) => {
  try {
    await submitItems({ sessionId, unitDoc, page })
  } catch (error) {
    throw tagTransitionError(error, 'submission')
  }

  flushResponses()
  let sessionUpdate
  try {
    sessionUpdate = await callNext({ sessionId })
  } catch (error) {
    throw tagTransitionError(error, 'session')
  }

  clearPage({ sessionId, unitId: unitDoc._id })
  return {
    sessionUpdate,
    fadeTarget: sessionUpdate.completed
      ? '.lea-unit-container'
      : '.lea-unit-content-container',
    navigation: {
      sessionId,
      unitId: sessionUpdate.nextUnit,
      unitSetId: sessionUpdate.nextUnitSet,
      hasStory: sessionUpdate.hasStory,
      completed: sessionUpdate.completed,
    },
  }
}
