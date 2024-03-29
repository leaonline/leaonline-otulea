import { Schema } from '../../../api/schema/Schema'

/**
 * Computes the grade of a competency by given parameters.
 *
 * Note:
 * The result will be faulty, if the thresholds list is not ordered from highest
 * to lowest.
 *
 * The threshold entries must contain a {max} value of type {Number} that defines
 * the upper bounds of the threshold-level and a name of type {String}.
 *
 * The max value must be within 0 and 1.
 *
 * If the count is lower than the min. required amount then an Object with
 * {{ name: null, index: -1 }} will be returned.
 *
 * @param count {Number} the amount of solved competencies
 * @param minCount {Number} the amount of min. required competencies
 * @param percent {Number} the amount of correct-scored competencies
 * @param thresholds {Array} the list of thresholds, ordered from highest to lowest.
 * @return {{ name: String, index: Number }} an Object with name and index
 */
export const getGrade = ({ count, minCount, percent, thresholds }) => {
  gradeSchema.validate({ count, minCount, percent, thresholds })

  // XXX: uncommented, we should not defy the grade with a "notEnough"
  // but rather use the hypothetical grade that we found
  // and indicate with a flag, that it has not been graded enough
  // if () return { name: 'notEnough', index: -1 }
  const notEnough = count < 1 || count < minCount

  for (let index = 0; index < thresholds.length; index++) {
    const { max, name } = thresholds[index]

    if (percent >= max) {
      return { name, index, notEnough }
    }
  }

  throw new Error(`Unexpected code reach: expected ${percent} to be within defined thresholds.`)
}

const gradeSchema = Schema.create({
  count: {
    type: Number,
    min: 0
  },
  minCount: {
    type: Number,
    min: 1
  },
  percent: {
    type: Number,
    min: 0,
    max: 1
  },
  thresholds: Array,
  'thresholds.$': Object,
  'thresholds.$.name': String,
  'thresholds.$.max': {
    type: Number,
    min: 0,
    max: 1
  }
})
