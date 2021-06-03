import { Meteor } from 'meteor/meteor'
import { Feedback } from '../Feedback'
import { Session } from '../../session/Session'
import { getThresholds } from '../../thresholds/api/getThresholds'
import { getSessionResponses } from '../../session/api/getSessionResponses'
import { getGrade } from '../../thresholds/api/getGrade'
import { getAlphaLevels } from './getAlphaLevels'
import { getCompetencies } from './getCompetencies'

export const generateFeedback = ({ sessionId, userId, debug = () => {} }) => {
  debug('(generateFeedback)', { sessionId, userId })
  const existingFeedback = Feedback.collection().findOne({ sessionId, userId })

  if (existingFeedback) {
    return existingFeedback
  }

  // ///////////////////////////////////////////////////////////////////////////
  // STEP 0 - PREPARE
  // ///////////////////////////////////////////////////////////////////////////
  debug('(generateFeedback)', 'generate new')
  const sessionDoc = Session.collection().findOne(sessionId)

  // someone could call this method with a passed sessionId through the console
  // so we need to make sure it is only called, when we are "done" with testing
  if (
    !sessionDoc ||
    !sessionDoc.completedAt ||
    sessionDoc.progress < sessionDoc.maxProgress
  ) {
    throw new Meteor.Error(
      'generateFeedback.error',
      'generateFeedback.notComplete',
      { userId, sessionId })
  }

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
  const aggregatedCompetencies = new Map()
  const competencyIds = new Set()
  const alphaLevelIds = new Set()

  // iteration 1 to retrieve competencies and alpaheLevels
  responses
    .forEach(result => result
      .forEach(({ competency }) => competency
        .forEach(competencyId => competencyIds.add(competencyId))))

  debug('(generateFeedback)', 'get competencies')
  const competencyMap = getCompetencies(Array.from(competencyIds))
  competencyMap.forEach(doc => alphaLevelIds.add(doc.level))

  debug('(generateFeedback)', 'get AlphaLevels')
  const alphaLevelMap = getAlphaLevels(Array.from(alphaLevelIds))

  debug('(generateFeedback)', 'start counting competencies')
  const aggregatedAlphaLevels = new Map()

  responses.forEach(result => {
    result.forEach(({ competency, score, isUndefined }) => {
      // since competency can actually hold more than one competency we
      // need another iteration to break it down to it's pieces
      competency.forEach(competencyId => {
        const current = aggregatedCompetencies.get(competencyId) || {
          count: 0, // max occurrences
          scored: 0, // positive scores
          undef: 0, // skipped items
          min: minCountCompetency, // threshold
          perc: 0 // percent of positive scores
        }

        current.competencyId = competencyId
        current.count += 1
        current.scored += (score === 'true' ? 1 : 0)
        current.undef += (isUndefined === 'true' ? 1 : 0)

        aggregatedCompetencies.set(competencyId, current)
      })
    })
  })

  debug('(generateFeedback)', 'start grading competencies')
  aggregatedCompetencies.forEach((current, competencyId) => {
    current.perc = current.count && (current.scored / current.count)

    const grade = getGrade({
      minCount: current.min,
      count: current.count,
      percent: current.perc,
      thresholds: sortedThresholdsCompetency
    })

    current.gradeName = grade.name
    current.gradeIndex = grade.index
    current.isGraded = grade.index > -1

    aggregatedCompetencies.set(competencyId, current)

    const competencyDoc = competencyMap.get(competencyId)
    const alphaLevelDoc = alphaLevelMap.get(competencyDoc.level)
    const alpha = aggregatedAlphaLevels.get(competencyDoc.level) || {
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

    aggregatedAlphaLevels.set(alphaLevelDoc._id, alpha)
  })

  debug('(generateFeedback)', 'start grading alpha levels')
  aggregatedAlphaLevels.forEach((alpha, alphaLevelId) => {
    alpha.perc = alpha.count && (alpha.scored / alpha.count)

    const grade = getGrade({
      minCount: alpha.min,
      count: alpha.count,
      percent: alpha.perc,
      thresholds: sortedThresholdsAlphaLevel
    })

    alpha.gradeName = grade.name
    alpha.gradeIndex = grade.index
    alpha.isGraded = grade.index > -1

    aggregatedAlphaLevels.set(alphaLevelId, alpha)
  })

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
