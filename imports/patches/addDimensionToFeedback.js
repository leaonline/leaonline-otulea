import { Feedback } from '../contexts/feedback/Feedback'
import { TestCycle } from '../contexts/testcycle/TestCycle'

export const addDimensionToFeedback = ({ dryRun, debug = () => {} } = {}) => {
  const tcCache = new Map()
  const FeedbackCollection = Feedback.collection()
  const TestCycleCollection = TestCycle.collection()
  const result = {
    found: 0,
    updated: 0,
    missing: []
  }

  const cursor = FeedbackCollection.find({ dimension: { $exists: false } })
  result.found = cursor.count()

  cursor.forEach(feedbackDoc => {
    let tcDoc = tcCache.get(feedbackDoc.testCycle)

    if (!tcDoc) {
      tcDoc = TestCycleCollection.findOne(feedbackDoc.testCycle)
      tcCache.set(feedbackDoc.testCycle, tcDoc)
    }

    if (!tcDoc) {
      result.missing.push({ testCycle: feedbackDoc.testCycle })
      return debug('[addDimensionToFeedback]: found no testCycle for', feedbackDoc.testCycle)
    }

    const { dimension } = tcDoc

    const updated = dryRun
      ? 0
      : FeedbackCollection.update(feedbackDoc._id, { $set: { dimension } })

    debug('[addDimensionToFeedback]: updated ', feedbackDoc._id, !!updated)
    result.updated += updated
  })

  debug('[addDimensionToFeedback]: result', result)
  return result
}
