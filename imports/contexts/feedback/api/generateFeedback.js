import { Feedback } from '../Feedback'
import { getThresholds } from '../../thresholds/api/getThresholds'
import { getSessionResponses } from '../../session/api/getSessionResponses'
import { getGradeForCompetency } from '../../thresholds/api/getGradeForCompetency'

export const generateFeedback = ({ sessionId, userId }) => {
  const existingFeedback = Feedback.collection().findOne({ sessionId, userId })

  if (existingFeedback) {
    return existingFeedback
  }

  // TODO caching thresholds
  const { minCountCompetency, thresholdsCompetency } = getThresholds()
  const sortedThresholds = Object
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

  const responses = getSessionResponses({ sessionId, userId })
  const aggregatedCompetencies = new Map()
  responses.forEach(result => {
    result.forEach(({ competency, score, isUndefined }) => {
      // since competency can actually hold more than one competency we
      // need another iteration to break it down to it's pieces
      competency.forEach(competencyId => {
        const current = aggregatedCompetencies.get(competencyId) || {
          limit: 0, // max occurrences
          count: 0, // positive scores
          undef: 0, // skipped items
          min: minCountCompetency, // threshold
          perc: 0 // percent of positive scores
        }

        current.competencyId = competencyId
        current.limit += 1
        current.count += (score === 'true' ? 1 : 0)
        current.undef += (isUndefined === 'true' ? 1 : 0)
        current.perc = (current.count / current.limit) * 100

        const grade = getGradeForCompetency({
          count: current.limit,
          minCount: minCountCompetency,
          correct: current.count,
          thresholds: sortedThresholds
        })
        // current.grade.label = `thresholds.${current.grade.name}` // TODO -> do on client
        current.gradeName = grade.name
        current.gradeIndex = grade.index
        current.isGraded = grade.index > -1
        aggregatedCompetencies.set(competencyId, current)
      })
    })
  })

  const feedbackDoc = {
    sessionId,
    userId,
    competencies: Array.from(aggregatedCompetencies.values())
  }

  const docId = Feedback.collection().insert(feedbackDoc)
  return Feedback.collection().findOne(docId)
}
