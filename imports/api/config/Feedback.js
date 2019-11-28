import { Meteor } from 'meteor/meteor'
import { onClient, onServer } from '../../utils/archUtils'

export const Feedback = {
  name: 'feedback',
  label: 'feedback.title',
  icon: 'star-half-alt'
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
    type: String,
    label: 'feedback.levelDescription'
  }
}

Feedback.collection = function () {
  throw new Error('not yet implemented')
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

Feedback.methods.update = {
  name: 'feedback.methods.update',
  isPublic: true, // FIXME only backend editors and admins
  numRequests: 1,
  timeInterval: 250,
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
    } else {
      return FeedbackCollection.update(feedbackDoc._id, { $set: { notEvaluable, levels } })
    }
  })
}

Feedback.methods.get = {
  name: 'feedback.methods.get',
  isPublic: true,
  numRequests: 1,
  timeInterval: 250,
  schema: {},
  run: onServer(function () {
    return Feedback.collection().findOne()
  }),
  call: onClient(function (cb) {
    Meteor.call(Feedback.methods.get.name, cb)
  })
}
