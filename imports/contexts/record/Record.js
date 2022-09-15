import { onServerExec } from '../../utils/archUtils'

/**
 * The record is a dataset for each user for evaluation purposes
 * (as with the teacher's dashboard application).
 *
 * It summarizes, which TestCycles (sessions) were completed and which results
 * were assigned and which documents are associated to minimize effort for loading
 * and processing such data.
 *
 * In contrast to Feedback it also contains comparable information between the
 * records. See Record.status for more information.
 */
export const Record = {
  name: 'record',
  label: 'record.title',
  icon: 'user',
  methods: {},
  publications: {}
}

/**
 * The record contains info on how this recent feedback compares to past ones.
 * It always compares to the immediate predecessor.
 */
Record.status = {
  /**
   * There is no previous record for the same TestCycle
   */
  new: 'new',
  /**
   * Perc values of the previous and current record are the same
   */
  same: 'same',
  /**
   * Current is "better" than previous; perc value is higher
   */
  improved: 'improved',
  /**
   * Current is "worse" tha previous; perc value is lower
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
  previousId: {
    type: String, // the previous record doc id to be compared with
    optional: true
  },

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

      // we can let users determine an "oldest"
      // as long as it's not older than the oldest possible

      if (oldest) {
        query.completedAt = { $gte: oldest }
      }

      // we can also let users determine oldest date
      // as long as it's not older than the oldest possible

      if (newest) {
        query.completedAt = { $lte: newest }
      }

      return Record.collection().find(query, transform).fetch()
    }
  })
}
