import { Meteor } from 'meteor/meteor'
import { check, Match } from 'meteor/check'
import { Feedback } from '../Feedback'
import { getThresholds } from '../../thresholds/api/getThresholds'
import { getSessionResponses } from '../../session/api/getSessionResponses'
import { getGrade } from '../../thresholds/api/getGrade'
import { getAlphaLevels } from './getAlphaLevels'
import { getCompetencies } from './getCompetencies'
import { notifyUsersAboutError } from '../../../api/notify/notifyUsersAboutError'

/**
 * The general evaluation algorithm for a single TestCycle.
 * This can be considered "atomic" to the extend, that it won't look
 * into prior TestCycles to generate comparative results.
 * It works by collecting the responses, competencies and their alpha levels,
 * which were covered during a TestCycle.
 *
 * It then compares the scores for each competency against thresholds (defined
 * in the lea. backend) and assigns a gradeName (how the score is titled),
 * a gradeIndex (the position in the thresholds list) and a isGraded flag
 * (indicating, that this grade may not be accurate due to not enough covered
 * items during the TestCycle).
 *
 * It then creates a mean for all competencies, that associate with the same
 * alpha level and uses this mean score in order to apply the same grading
 * mechanism (as described above) but with alpha level.
 *
 * The advantage of this approach is, that we have a clear and reproducible
 * procedure, easily testable with few parameters (compared to other models).
 *
 * The drawback of this approach is, that we might face a situation, where
 * we never have enough competencies covered to reach a certain threshold
 * and since we don't compare with recent feedback, we may end up having
 * many competencies marked as isGraded = false
 *
 * Note: isGraded means here "reached the threshold of minimum count of graded
 * occurrences" - it just remains isGraded due to backwards compatibility.
 *
 * @param options
 * @param options.sessionDoc {document} the related doc from this session
 * @param options.testCycleDoc {document} the related doc from this session's testCycle
 * @param options.userId {string} the user, for which this feedback applies
 * @param options.debug {function=} optional function for debugging
 * @return {*}
 */
export const generateFeedback = (options) => {
  check(options, {
    sessionDoc: Match.ObjectIncluding({ _id: String }),
    testCycleDoc: Match.ObjectIncluding({ _id: String }),
    userId: String,
    debug: Match.Maybe(Function)
  })

  const { sessionDoc, testCycleDoc, userId, debug = () => {} } = options
  const sessionId = sessionDoc._id

  debug('(generateFeedback)', { sessionId, userId })
  const existingFeedback = Feedback.collection().findOne({ sessionId, userId })

  if (existingFeedback) {
    existingFeedback.fromDB = true
    return existingFeedback
  }

  // ///////////////////////////////////////////////////////////////////////////
  // STEP 0 - CHECK
  // ///////////////////////////////////////////////////////////////////////////
  debug('(generateFeedback)', 'generate new')

  // someone could call this method with a passed sessionId through the console
  // so we need to make sure it is only called, when we are "done" with testing

  if (!sessionDoc.completedAt) {
    throw new Meteor.Error(
      'generateFeedback.error',
      'generateFeedback.sessionNotComplete', {
        userId,
        sessionId,
        testCycle: sessionDoc.testCycle,
        completedAt: sessionDoc.completedAt,
        progress: sessionDoc.progress,
        maxProgress: sessionDoc.maxProgress
      })
  }

  // ///////////////////////////////////////////////////////////////////////////
  // STEP 1A - FETCH INPUT
  // ///////////////////////////////////////////////////////////////////////////

  debug('(generateFeedback)', 'get thresholds')
  const {
    minCountCompetency,
    thresholdsCompetency,
    minCountAlphaLevel,
    thresholdsAlphaLevel
  } = getThresholds()

  // TODO cache to prevent many avoidable iterations
  const sortedThresholdsCompetency = Object
    .entries(thresholdsCompetency)
    .map(([key, value]) => {
      return {
        max: value,
        name: key
      }
    })
    .sort((a, b) => {
      return b.max - a.max
    })

  const sortedThresholdsAlphaLevel = Object
    .entries(thresholdsAlphaLevel)
    .map(([key, value]) => {
      return {
        max: value,
        name: key
      }
    })
    .sort((a, b) => {
      return b.max - a.max
    })

  debug('(generateFeedback)', 'get responses')
  const responses = getSessionResponses({ sessionId, userId })
  const competencyIds = new Set()
  const alphaLevelIds = new Set()

  // iteration 1 to retrieve competencies and alpaheLevels
  responses.forEach(scores => {
    scores.forEach(({ competency }) => {
      competency.forEach(competencyId => {
        competencyIds.add(competencyId)
      })
    })
  })

  debug('(generateFeedback)', 'get competencies')
  const competencyMap = getCompetencies(Array.from(competencyIds))
  competencyMap.forEach(doc => alphaLevelIds.add(doc.level))

  debug('(generateFeedback)', 'get AlphaLevels')
  const alphaLevelMap = getAlphaLevels(Array.from(alphaLevelIds))

  // ///////////////////////////////////////////////////////////////////////////
  // STEP 1B - TRANSFORM INPUT
  // ///////////////////////////////////////////////////////////////////////////

  debug('(generateFeedback)', 'start counting competencies')
  const aggregatedCompetencies = countCompetencies({
    responses,
    minCountCompetency,
    debug
  })

  // ///////////////////////////////////////////////////////////////////////////
  // STEP 2 - GRADE COMPETENCIES
  // ///////////////////////////////////////////////////////////////////////////
  debug('(generateFeedback)', 'start grading competencies')
  const aggregatedAlphaLevels = gradeCompetenciesAndCountAlphaLevels({
    competencies: aggregatedCompetencies,
    getCompetency: id => competencyMap.get(id),
    getAlphaLevel: id => alphaLevelMap.get(id),
    minCountAlphaLevel: minCountAlphaLevel,
    thresholds: sortedThresholdsCompetency,
    sessionDoc: sessionDoc
  })

  // ///////////////////////////////////////////////////////////////////////////
  // STEP 3 - GRADE ALPHA LEVELS
  // ///////////////////////////////////////////////////////////////////////////

  debug('(generateFeedback)', 'start grading alpha levels')
  gradeAlphaLevels({
    alphaLevels: aggregatedAlphaLevels,
    thresholds: sortedThresholdsAlphaLevel
  })

  // ///////////////////////////////////////////////////////////////////////////
  // STEP 4 - POST-TRANSFORM AND RETURN
  // ///////////////////////////////////////////////////////////////////////////

  const feedbackDoc = {
    sessionId,
    userId,
    dimension: testCycleDoc.dimension,
    testCycle: sessionDoc.testCycle,
    competencies: Array.from(aggregatedCompetencies.values()),
    alphaLevels: Array.from(aggregatedAlphaLevels.values())
  }

  const docId = Feedback.collection().insert(feedbackDoc)
  return Feedback.collection().findOne(docId)
}

// ///////////////////////////////////////////////////////////////////////////
//
//  INTERNAL - ONLY EXPORTED FOR BETTER TESTING
//
// ///////////////////////////////////////////////////////////////////////////
export const countCompetencies = ({ responses, minCountCompetency }) => {
  const competencies = new Map()

  responses.forEach(result => {
    result.forEach(({ competency, score, isUndefined }) => {
      // since competency can actually hold more than one competency we
      // need another iteration to break it down to it's pieces
      competency.forEach(competencyId => {
        const current = competencies.get(competencyId) || {
          count: 0, // max occurrences
          scored: 0, // positive scores
          undef: 0, // skipped items
          min: minCountCompetency, // threshold
          perc: 0 // percent of positive scores
        }

        current.competencyId = competencyId
        current.count += 1

        if (score === 'true') {
          current.scored++
        }

        current.undef += (isUndefined === 'true' ? 1 : 0)

        competencies.set(competencyId, current)
      })
    })
  })

  // finally generate percent values in one iteration
  competencies.forEach((val, key) => {
    if (val.count > 0) {
      val.perc = (val.scored / val.count)
      competencies.set(key, val)
    }
  })

  return competencies
}

export const gradeCompetenciesAndCountAlphaLevels = ({ competencies, minCountAlphaLevel, thresholds, getCompetency, getAlphaLevel, sessionDoc = {} }) => {
  const alphaLevels = new Map()
  const sessionId = sessionDoc._id

  competencies.forEach((current, competencyId) => {
    const competencyDoc = getCompetency(competencyId)

    // XXX: to support older tests, where linked competencies didn't exist we
    // need to skip them an send an error to inform about the incident but
    // we do not throw the Error in order to preserve the feedback
    if (!competencyDoc) {
      const noCompetencyError = new Meteor.Error(
        'generateFeedback.error',
        'generateFeedback.noCompetencyDoc', {
          competencyId,
          sessionId,
          testCycle: sessionDoc.testCycle,
          completedAt: sessionDoc.completedAt,
          progress: sessionDoc.progress,
          maxProgress: sessionDoc.maxProgress
        })

      return notifyUsersAboutError(noCompetencyError)
    }

    const grade = getGrade({
      minCount: current.min,
      count: current.count,
      percent: current.perc,
      thresholds: thresholds
    })

    current.gradeName = grade.name
    current.gradeIndex = grade.index
    current.isGraded = !grade.notEnough

    competencies.set(competencyId, current)

    const alphaLevelDoc = getAlphaLevel(competencyDoc.level)
    if (!alphaLevelDoc) {
      throw new Meteor.Error(
        'generateFeedback.error',
        'generateFeedback.noAlphaLevelDoc', {
          competencyId,
          alphaLevel: competencyDoc.level,
          sessionId,
          testCycle: sessionDoc.testCycle,
          completedAt: sessionDoc.completedAt,
          progress: sessionDoc.progress,
          maxProgress: sessionDoc.maxProgress
        }
      )
    }
    const alpha = alphaLevels.get(competencyDoc.level) || {
      alphaLevelId: alphaLevelDoc._id,
      min: minCountAlphaLevel,
      count: 0,
      scored: 0,
      perc: 0
    }

    if (current.isGraded) {
      alpha.count += 1
      alpha.scored += current.perc
    }

    alphaLevels.set(alphaLevelDoc._id, alpha)
  })

  // finally add percent values
  alphaLevels.forEach((value, key) => {
    if (value.count > 0) {
      value.perc = value.count && (value.scored / value.count)
    }

    alphaLevels.set(key, value)
  })

  return alphaLevels
}

export const gradeAlphaLevels = ({ alphaLevels, thresholds }) => {
  alphaLevels.forEach((alpha, alphaLevelId) => {
    const grade = getGrade({
      minCount: alpha.min,
      count: alpha.count,
      percent: alpha.perc,
      thresholds: thresholds
    })

    alpha.gradeName = grade.name
    alpha.gradeIndex = grade.index
    alpha.isGraded = !grade.notEnough

    alphaLevels.set(alphaLevelId, alpha)
  })
}
