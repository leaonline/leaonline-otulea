import { Session } from '../Session'
import { Meteor } from 'meteor/meteor'
import { TestCycle } from '../../testcycle/TestCycle'
import { generateFeedback } from '../../feedback/api/generateFeedback'
import { addRecord } from '../../record/api/addRecord'

export const generateResults = async ({
  sessionId,
  userId,
  debug,
  flagFromDb = true,
}) => {
  const sessionDoc = await Session.collection().findOneAsync(sessionId)

  if (!sessionDoc) {
    throw new Meteor.Error(
      'generateFeedback.error',
      'generateFeedback.sessionNotFound',
      {
        userId,
        sessionId,
      },
    )
  }

  const testCycleDoc = await TestCycle.collection().findOneAsync(
    sessionDoc.testCycle,
  )

  if (!testCycleDoc) {
    throw new Meteor.Error(
      'generateFeedback.error',
      'generateFeedback.testCycleNotFound',
      {
        userId,
        sessionId,
        testCycle: sessionDoc.testCycle,
        completedAt: sessionDoc.completedAt,
        progress: sessionDoc.progress,
        maxProgress: sessionDoc.maxProgress,
      },
    )
  }

  const feedbackDoc = await generateFeedback({
    sessionDoc,
    testCycleDoc,
    userId,
    flagFromDb,
    debug,
  })

  // if the feedback is new we also want to add a new entry record
  // we need this flag, because users can reload the page to retrieve
  // the feedback doc as often as they want to and we don't want to
  // create a new record every time they do so
  if (!feedbackDoc.fromDB) {
    debug('add records for session', sessionId)
    // if this fails it will not affect the user experience in the client
    // but it will also not automatically send an error email to our system
    Meteor.defer(async function addRecordFromFeedback() {
      const recordsAdded = await addRecord({
        userId,
        sessionDoc,
        testCycleDoc,
        feedbackDoc,
      })
      debug(
        '[Session.generateResults]: records from feedback added',
        recordsAdded,
      )
    })
  }

  return feedbackDoc
}
