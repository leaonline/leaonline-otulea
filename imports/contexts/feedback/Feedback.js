import { onServerExec } from '../../utils/archUtils'

export const Feedback = {
  name: 'feedback',
  label: 'feedback.title',
  icon: 'star-half-alt'
}

Feedback.schema = {
  sessionId: String,
  testCycle: String,
  userId: String,
  competencies: Array,
  'competencies.$': Object,
  'competencies.$.competencyId': String,
  'competencies.$.count': Number,
  'competencies.$.scored': Number,
  'competencies.$.undef': Number,
  'competencies.$.perc': Number,
  'competencies.$.gradeName': String,
  'competencies.$.gradeIndex': Number,
  'competencies.$.isGraded': Boolean,

  alphaLevels: Array,
  'alphaLevels.$': Object,
  'alphaLevels.$.alphaLevelId': String,
  'alphaLevels.$.count': Number,
  'alphaLevels.$.scored': Number,
  'alphaLevels.$.perc': Number,
  'alphaLevels.$.gradeName': String,
  'alphaLevels.$.gradeIndex': Number,
  'alphaLevels.$.isGraded': Boolean
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
      const { userId, debug } = this
      return generateFeedback({ sessionId, userId, debug })
    }
  })
}
