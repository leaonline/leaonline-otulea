import { check, Match } from 'meteor/check'
import { Record } from '../Record'
import { docsToMap } from '../../../utils/documents/docsToMap'
import { getCompetencies } from '../../feedback/api/getCompetencies'
import { getAlphaLevels } from '../../feedback/api/getAlphaLevels'

const hint = { $natural: -1 }
const byCompetencyId = c => c.competencyId
const byAlphaLevelId = a => a.alphaLevelId

/**
 * Creates a new record document for a given feedback and testCycle.
 *
 * It looks first, whether another record has been created today. This is,
 * because records are focused on a single date. If a testCycle has been
 * completed multiple times on the same date, then it will only update
 * the doc. Otherwise we cannot create a comparable overview.
 *
 *
 * @param options
 * @param options.userId {string}
 * @param options.testCycleDoc {object}
 * @param options.sessionDoc {object}
 * @param options.feedbackDoc {object}
 * @return {any | void}
 */
export const addRecord = (options) => {
  check(options, Match.ObjectIncluding({
    userId: String,
    testCycleDoc: Match.ObjectIncluding({
      dimension: String,
      level: String
    }),
    sessionDoc: Match.ObjectIncluding({
      startedAt: Date,
      completedAt: Date,
      cancelledAt: Match.Maybe(Date),
      continuedAt: Match.Maybe(Date)
    }),
    feedbackDoc: Match.ObjectIncluding({
      competencies: [Object],
      alphaLevels: [Object]
    })
  }))

  const { userId, testCycleDoc, sessionDoc, feedbackDoc } = options
  const { dimension, level } = testCycleDoc
  const { startedAt, completedAt, cancelledAt, continuedAt } = sessionDoc
  const { competencies, alphaLevels } = feedbackDoc

  const compareDate = new Date(completedAt)
  compareDate.setHours(0)
  compareDate.setMinutes(0)
  compareDate.setSeconds(0)
  compareDate.setMilliseconds(0)

  // TODO: update the current record if we already have a record doc generated

  const previousRecordData = getPreviousRecord({
    userId: userId,
    dimension: dimension,
    level: level,
    completedAt: { $lt: compareDate }
  })

  // first we need to iterate the competencies / alphalevels
  // and map them to their docs, which we need to assign their info

  const competencyDocsMap = getCompetencies(competencies.map(byCompetencyId))
  const alphaLevelDocsMap = getAlphaLevels(alphaLevels.map(byAlphaLevelId))

  // then iterate the entries from the feedback and create a merged version
  // of both documents, containing all relevant data for analysis

  const competencyDocs = competencies.map(feedbackCompetency => {
    const { competencyId } = feedbackCompetency
    const competencyDoc = competencyDocsMap.get(competencyId)
    const previousDoc = previousRecordData.competency(competencyId)

    let status = Record.status.new
    let previousId = ''
    if (previousDoc) {
      status = getStatus(previousDoc.perc, feedbackCompetency.perc)
      previousId = previousDoc._id
    }

    return {
      _id: competencyDoc._id,
      shortCode: competencyDoc.shortCode,
      description: competencyDoc.description,
      alphaLevel: competencyDoc.level,
      category: competencyDoc.category,
      count: feedbackCompetency.count,
      scored: feedbackCompetency.scored,
      perc: feedbackCompetency.perc,
      undef: feedbackCompetency.undef,
      isGraded: feedbackCompetency.isGraded,
      gradeName: feedbackCompetency.gradeName,
      example: feedbackCompetency.example,
      previousId: previousId,
      development: status
    }
  })

  const alphaLevelDocs = alphaLevels.map(alphaLevel => {
    const { alphaLevelId } = alphaLevel
    const doc = alphaLevelDocsMap.get(alphaLevelId)
    const previousDoc = previousRecordData.alphaLevel(alphaLevelId)

    let status = 'new'

    if (previousDoc) {
      status = getStatus(previousDoc.perc, alphaLevel.perc)
    }

    return {
      _id: doc._id,
      shortCode: doc.shortCode,
      description: doc.description,
      level: doc.level,
      count: alphaLevel.count,
      scored: alphaLevel.scored,
      perc: alphaLevel.perc,
      isGraded: alphaLevel.isGraded,
      development: status
    }
  })

  const query = {
    userId: userId,
    dimension: dimension,
    level: level,
    completedAt: compareDate
  }

  const recordDoc = {
    ...query,
    testCycle: testCycleDoc._id,
    session: sessionDoc._id,
    feedback: feedbackDoc._id,
    startedAt: startedAt,
    cancelledAt: cancelledAt,
    continuedAt: continuedAt,
    competencies: competencyDocs,
    alphaLevels: alphaLevelDocs
  }

  return Record.collection().upsert(query, { $set: recordDoc })
}

const getPreviousRecord = query => {
  const previousRecord = Record.collection().findOne(query, { hint })

  if (!previousRecord) {
    return {
      doc: null,
      competency: () => {},
      alphaLevel: () => {}
    }
  }

  const competencies = docsToMap(previousRecord.competencies)
  const alphaLevels = docsToMap(previousRecord.alphaLevels)

  return {
    doc: previousRecord,
    competency: id => competencies.get(id),
    alphaLevel: id => alphaLevels.get(id)
  }
}

const getStatus = (prev, current) => {
  if (prev < current) { return Record.status.improved }
  if (prev > current) { return Record.status.declined }
  if (prev === current) { return Record.status.same }

  throw new Error('this should never occur')
}
