import { onClient, onServer } from '../../utils/archUtils'

export const Feedback = {
  name: 'feedback',
  label: 'feedback.title',
  icon: 'star-half-alt',
  isConfigDoc: true
}

Feedback.schema = {
  notEvaluable: {
    label: 'feedback.notEvaluable',
    type: String
  },
  levels: {
    type: Array,
    label: 'feedback.levels'
  },
  'levels.$': {
    type: Object,
    label: 'common.entry'
  },
  'levels.$.description': {
    type: String,
    label: 'common.description'
  },
  'levels.$.threshold': {
    type: Number,
    min: 0,
    max: 100,
    label: 'feedback.threshold'
  },
  'levels.$.icon': {
    type: String,
    label: 'common.icon'
  }
}

Feedback.publications = {}

Feedback.publications.single = {
  name: 'feedback.publications.single',
  isPublic: true,
  schema: {},
  numRequests: 1,
  timeInterval: 250,
  run: onServer(function () {
    return Feedback.collection().find({}, { limit: 1 })
  })
}

Feedback.methods = {}

/**
 * This method is defined for the backend only. Updates the feedback doc.
 */
Feedback.methods.update = {
  name: 'feedback.methods.update',
  backend: true,
  schema: Object.assign({}, Feedback.schema, {
    _id: {
      type: String,
      optional: true
    }
  }),
  run: onServer(function ({ notEvaluable, levels }) {
    const FeedbackCollection = Feedback.collection()
    const feedbackDoc = FeedbackCollection.findOne()

    if (!feedbackDoc) {
      return FeedbackCollection.insert({ notEvaluable, levels })
    }

    else {
      return FeedbackCollection.update(feedbackDoc._id, { $set: { notEvaluable, levels } })
    }
  })
}

Feedback.methods.get = {
  name: 'feedback.methods.get',
  schema: {},
  run: onServer(function () {
    return Feedback.collection().findOne()
  })
}
