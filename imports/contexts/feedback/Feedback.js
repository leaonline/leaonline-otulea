export const Feedback = {
  name: 'feedback',
  label: 'feedback.title',
  icon: 'star-half-alt'
}

Feedback.schema = {
  sessionId: String,
  testCycle: String,
  userId: String,

  // XXX: added to collection in order to provide a one-step access
  // to feedbacks from teacher dashboard, filtered by dimension
  dimension: {
    type: String,
    optional: true
  },

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
