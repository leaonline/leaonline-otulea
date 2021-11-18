import { Feedback } from '../contexts/feedback/Feedback'
import { TestCycle } from '../contexts/testcycle/TestCycle'

export const addDimensionToFeedback = ({ dryRun } = {}) => {
  const tcCache = new Map()
  const FeedbackCollection = Feedback.collection()
  const TestCycleCollection = TestCycle.collection()

  FeedbackCollection.find().forEach(feedbackDoc => {
    let tcDoc = tcCache.get(feedbackDoc.testCycle)

    if (!tcDoc) {
      tcDoc = TestCycleCollection.findOne(feedbackDoc.testCycle)
      tcCache.set(feedbackDoc.testCycle, tcDoc)
    }

    if (!tcDoc) {
      return console.warn('[addDimensionToFeedback]: found no testcycle for', feedbackDoc.testCycle)
    }

    const { dimension } = tcDoc

    let updated
    if (!dryRun) {
      updated = FeedbackCollection.update(feedbackDoc._id, { $set: { dimension } })
    }

    console.debug('[addDimensionToFeedback]: updated ', feedbackDoc._id, !!updated)
  })
}
