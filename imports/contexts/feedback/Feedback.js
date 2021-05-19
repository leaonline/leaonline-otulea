import { onServerExec } from '../../utils/archUtils'

export const Feedback = {
  name: 'feedback',
  label: 'feedback.title',
  icon: 'star-half-alt'
}

Feedback.schema = {
  sessionId: String,
  userId: String,
  competencies: Array,
  'competencies.$': Object,
  'competencies.$.competencyId': String,
  'competencies.$.limit': Number,
  'competencies.$.count': Number,
  'competencies.$.undef': Number,
  'competencies.$.perc': Number,
  'competencies.$.gradeName': String,
  'competencies.$.gradeIndex': Number,
  'competencies.$.isGraded': Boolean

  // alphaLevels: Array
}

Feedback.publications = {}

Feedback.methods = {}

Feedback.methods.generate = {
  name: 'feedback.methods.generate',
  schema: {
    sessionId: String
  },
  run: onServerExec(function () {
    import { generateFeedback } from './api/generateFeedback'

    return function ({ sessionId }) {
      const { userId } = this
      return generateFeedback({ sessionId, userId })
    }
  })
}
