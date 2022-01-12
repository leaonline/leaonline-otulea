import { onServerExec } from '../../utils/archUtils'

/**
 * The record is a dataset for each user, that represents the current state,
 * like a snapshot to be used for evaluation purposes (as with the teacher's
 * dashboard application).
 *
 * It summarizes, which tests (sessions) were made and which results were
 * assigned and which documents are associated to minimize effort for loading
 * and processing such data.
 *
 * A record entry is unique by
 */
export const Record = {
  name: 'record',
  label: 'record.title',
  icon: 'user',
  methods: {},
  publications: {}
}

Record.status = {
  /**
   * There is no previous record
   */
  new: 'new',
  /**
   * Perc values of the previous and current record are the same
   */
  same: 'same',
  /**
   * Current is "better" than previous
   */
  improved: 'improved',
  /**
   * Current is "worse" tha previous
   */
  declined: 'declined'
}

Record.schema = {
  // associations
  userId: String,
  dimension: String,
  level: String,

  // references
  testCycle: String,
  session: String,
  feedback: String,

  // timestamps
  startedAt: Date,
  completedAt: Date,

  competencies: Array,
  'competencies.$': Object,
  'competencies.$._id': String,
  'competencies.$.shortCode': String,
  'competencies.$.description': String,
  'competencies.$.alphaLevel': String,
  'competencies.$.category': {
    type: String,
    optional: true
  },
  'competencies.$.count': Number,
  'competencies.$.scored': Number,
  'competencies.$.undef': Number,
  'competencies.$.perc': Number,
  'competencies.$.isGraded': Boolean,
  'competencies.$.gradeName': String,
  'competencies.$.example': {
    type: String,
    optional: true
  },
  'competencies.$.development': {
    type: String,
    allowedValues: Object.values(Record.status)
  },

  alphaLevels: Array,
  'alphaLevels.$': Object,
  'alphaLevels.$._id': String,
  'alphaLevels.$.shortCode': String,
  'alphaLevels.$.description': String,
  'alphaLevels.$.level': Number,
  'alphaLevels.$.count': Number,
  'alphaLevels.$.scored': Number,
  'alphaLevels.$.perc': Number,
  'alphaLevels.$.isGraded': Boolean,
  'alphaLevels.$.development': {
    type: String,
    allowedValues: Object.values(Record.status)
  }
}

Record.methods.getForUsers = {
  name: 'record.methods.getForUsers',
  schema: {
    users: Array,
    'users.$': String,
    dimension: String,
    skip: {
      type: Array,
      optional: true
    },
    'skip.$': String,
    oldest: {
      type: Date,
      optional: true
    },
    newest: {
      type: Date,
      optional: true
    }
  },
  backend: true,
  run: onServerExec(function () {
    const transform = {
      hint: { $natural: -1 }
    }
    return function ({ users = [], dimension, skip = [], oldest, newest }) {
      const query = {
        userId: { $in: users },
        dimension: dimension
      }

      // skip allows to not include those docs, which are
      // already cached on the target server

      if (skip.length > 0) {
        query._id = { $nin: skip }
      }

      // we can let users determine an "oldest" or "newest" date
      // to fetch a specific range of records

      if (oldest) {
        query.completedAt = { $gte: oldest }
      }

      else {
        const defaultOldest = new Date()
        const aMonthAgo = defaultOldest.getDate() - 31 // this is just an estimate
        defaultOldest.setDate(aMonthAgo)
        query.completedAt = { $gte: defaultOldest }
      }

      if (newest) {
        query.completedAt = { $lte: newest }
      }

      return Record.collection().find(query, transform).fetch()
    }
  })
}
