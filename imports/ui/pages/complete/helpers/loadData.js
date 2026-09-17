import { callMethod } from '../../../../infrastructure/methods/callMethod'
import { loadAllContentDocs } from '../../../loading/loadAllContentDocs'
import { Competency } from '../../../../contexts/Competency'
import { Dimension } from '../../../../contexts/Dimension'
import { AlphaLevel } from '../../../../contexts/AlphaLevel'
import { Thresholds } from '../../../../contexts/thresholds/Thresholds'
import { Session } from '../../../../contexts/session/Session'
import { truncatePercent } from './truncatePercent'

export const loadData = async ({ sessionId, debug }) => {
  const thresholdRequest = await loadAllContentDocs({
    context: Thresholds,
    debug,
  })
  const thresholdDoc = thresholdRequest[Thresholds.name]
  if (!thresholdDoc) {
    throw new Meteor.Error('error.loadDataFailed', 'loadError.noThresholds')
  }
  const evaluationResults = await callMethod({
    name: Session.methods.results,
    args: { sessionId },
  })
  if (!evaluationResults) {
    throw new Meteor.Error(
      'error.loadDataFailed',
      'loadError.noEvaluationResults',
    )
  }

  const { competencies, alphaLevels } = evaluationResults

  // fetch competency documents
  // which are required to display the related texts
  const competencyIds = competencies.map((c) => c.competencyId)

  // by default this is true, but it will be set to false, once
  // we have at least one graded competency
  let noScoredCompetencies = true

  const competencyRequest = await loadAllContentDocs({
    context: Competency,
    ids: competencyIds,
  })
  const competencyDocs = competencyRequest?.[Competency.name] ?? []

  if (competencyDocs.length === 0) {
    throw new Meteor.Error(
      'error.loadDataFailed',
      'loadError.competenciesNotFound',
    )
  }

  const CompetencyCollection = Competency.collection()
  const aggregatedResults = competencies
    .map((resultDoc) => {
      const { competencyId } = resultDoc
      const competencyDoc = CompetencyCollection.findOne(competencyId)

      if (noScoredCompetencies && resultDoc.gradeIndex > -1) {
        noScoredCompetencies = false
      }

      if (!competencyDoc) {
        return console.warn('Found no competency doc for _id', competencyId)
      }

      resultDoc.shortCode = competencyDoc.shortCode
      resultDoc.description = competencyDoc.descriptionSimple
      resultDoc.gradeLabel = `thresholds.${resultDoc.gradeName}`

      const percentValue = Number(resultDoc.perc ?? 0) * 100
      resultDoc.perc = truncatePercent(percentValue)
      return resultDoc
    })
    .sort((a, b) => a.shortCode.localeCompare(b.shortCode))

  debug({ aggregatedResults })

  const alphaLevelIds = alphaLevels.map((c) => c.alphaLevelId)
  let noScoredAlphas = true

  const alphaLevelRequest = await loadAllContentDocs({
    context: AlphaLevel,
    ids: alphaLevelIds,
  })
  const alphaLevelDocs = alphaLevelRequest?.[AlphaLevel.name] ?? []

  if (alphaLevelDocs.length === 0) {
    throw new Meteor.Error(
      'error.loadDataFailed',
      'loadError.alphaLevelsNotFound',
    )
  }

  const AlphaLevelCollection = AlphaLevel.collection()
  const aggregatedAlphaLevels = alphaLevels
    .map((alpha) => {
      const { alphaLevelId } = alpha
      const alphaLevelDoc = AlphaLevelCollection.findOne(alphaLevelId)

      if (noScoredAlphas && alpha.gradeIndex > -1) {
        noScoredAlphas = false
      }

      if (!alphaLevelDoc) {
        return console.warn('Found no alphaLevel doc for _id', alphaLevelId)
      }

      const dimension = Dimension.collection().findOne(alphaLevelDoc.dimension)
      alpha.dimension = dimension && `${dimension.title} ${alphaLevelDoc.level}`
      alpha.level = alphaLevelDoc.level
      alpha.shortCode = alphaLevelDoc.shortCode
      alpha.description = alphaLevelDoc.description
      alpha.gradeLabel = `thresholds.${alpha.gradeName}`

      const percentValue = Number(alpha.perc ?? 0) * 100
      alpha.perc = truncatePercent(percentValue)

      return alpha
    })
    .sort((a, b) => a.shortCode.localeCompare(b.shortCode))

  debug({ aggregatedAlphaLevels })

  return {
    thresholdDoc,
    aggregatedResults,
    noScoredCompetencies,
    noScoredAlphas,
    alphaLevels: aggregatedAlphaLevels,
    alphaLevelsLoaded: true,
    competenciesLoaded: true,
  }
}
