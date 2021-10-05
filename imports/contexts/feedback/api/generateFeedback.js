import { Meteor } from 'meteor/meteor'
import { Feedback } from '../Feedback'
import { Session } from '../../session/Session'
import { getThresholds } from '../../thresholds/api/getThresholds'
import { getSessionResponses } from '../../session/api/getSessionResponses'
import { getGrade } from '../../thresholds/api/getGrade'
import { getAlphaLevels } from './getAlphaLevels'
import { getCompetencies } from './getCompetencies'
import { notifyUsersAboutError } from '../../../api/notify/notifyUsersAboutError'

export const generateFeedback = ({ sessionId, userId, debug = () => {} }) => {
  debug('(generateFeedback)', { sessionId, userId })
  const existingFeedback = Feedback.collection().findOne({ sessionId, userId })

  if (existingFeedback) {
    return existingFeedback
  }

  // ///////////////////////////////////////////////////////////////////////////
  // STEP 0 - CHECK
  // ///////////////////////////////////////////////////////////////////////////
  debug('(generateFeedback)', 'generate new')
  const sessionDoc = Session.collection().findOne(sessionId)

  // someone could call this method with a passed sessionId through the console
  // so we need to make sure it is only called, when we are "done" with testing

  if (!sessionDoc || !sessionDoc.completedAt) {
    throw new Meteor.Error(
      'generateFeedback.error',
      'generateFeedback.sessionNotComplete', {
        userId,
        sessionId,
        testCycle: sessionDoc?.testCycle,
        completedAt: sessionDoc?.completedAt,
        progress: sessionDoc?.progress,
        maxProgress: sessionDoc?.maxProgress
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
    current.isGraded = grade.index > -1

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
    alpha.isGraded = grade.index > -1

    alphaLevels.set(alphaLevelId, alpha)
  })
}
