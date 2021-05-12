import { onServer } from '../../utils/archUtils'

export const Feedback = {
  name: 'feedback',
  label: 'feedback.title',
  icon: 'star-half-alt'
}

Feedback.schema = {
  sessionId: String
  // competencies: Array,
  // alphaLevels: Array
}

Feedback.publications = {}

Feedback.methods = {}

Feedback.methods.generate = {
  name: 'feedback.methods.generate',
  schema: {
    sessionId: String
  },
  run: onServer(function ({ sessionId }) {
    const { userId } = this
    const collection = Feedback.collection()
    const doc = collection.findOne({ createdBy: userId, sessionId })

    if (doc) return doc

    // TODO create feedback and return here
  })
}
