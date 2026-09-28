import { Meteor } from 'meteor/meteor'
import { callMethod } from '../../../../infrastructure/methods/callMethod'
import { loadAllContentDocs } from '../../../loading/loadAllContentDocs'
import { Competency } from '../../../../contexts/Competency'
import { Dimension } from '../../../../contexts/Dimension'
import { AlphaLevel } from '../../../../contexts/AlphaLevel'
import { Thresholds } from '../../../../contexts/thresholds/Thresholds'
import { Session } from '../../../../contexts/session/Session'
import { truncatePercent } from './truncatePercent'

export const createDataLoader = ({
  methodCall = callMethod,
  loadAll = loadAllContentDocs,
  contexts = { Competency, Dimension, AlphaLevel, Thresholds, Session },
  createError = (...args) => new Meteor.Error(...args),
} = {}) => {
  const {
    Competency: CompetencyContext,
    Dimension: DimensionContext,
    AlphaLevel: AlphaLevelContext,
    Thresholds: ThresholdsContext,
    Session: SessionContext,
  } = contexts

  return async ({ sessionId, debug = () => {} }) => {
    const thresholdRequest = await loadAll({
      context: ThresholdsContext,
      debug,
    })
    const thresholdDoc = thresholdRequest?.[ThresholdsContext.name]
    if (!Array.isArray(thresholdDoc) || thresholdDoc.length === 0) {
      throw createError('error.loadDataFailed', 'loadError.noThresholds')
    }

    const evaluationResults = await methodCall({
      name: SessionContext.methods.results,
      args: { sessionId },
    })
    if (!evaluationResults) {
      throw createError('error.loadDataFailed', 'loadError.noEvaluationResults')
    }

    const { competencies = [], alphaLevels = [] } = evaluationResults
    const competencyIds = competencies.map(({ competencyId }) => competencyId)
    const competencyRequest = await loadAll({
      context: CompetencyContext,
      ids: competencyIds,
    })
    const competencyDocs = competencyRequest?.[CompetencyContext.name] ?? []
    if (competencyDocs.length === 0) {
      throw createError(
        'error.loadDataFailed',
        'loadError.competenciesNotFound',
      )
    }

    let noScoredCompetencies = true
    const competencyCollection = CompetencyContext.collection()
    const aggregatedResults = competencies
      .map((resultDocument) => {
        const competencyDocument = competencyCollection.findOne(
          resultDocument.competencyId,
        )
        if (!competencyDocument) {
          throw createError(
            'error.loadDataFailed',
            'loadError.competencyNotFound',
            { competencyId: resultDocument.competencyId },
          )
        }
        if (resultDocument.gradeIndex > -1) noScoredCompetencies = false
        return {
          ...resultDocument,
          shortCode: competencyDocument.shortCode,
          description: competencyDocument.descriptionSimple,
          gradeLabel: `thresholds.${resultDocument.gradeName}`,
          perc: truncatePercent(Number(resultDocument.perc ?? 0) * 100),
        }
      })
      .sort((a, b) => a.shortCode.localeCompare(b.shortCode))
    debug({ aggregatedResults })

    const alphaLevelIds = alphaLevels.map(({ alphaLevelId }) => alphaLevelId)
    const alphaLevelRequest = await loadAll({
      context: AlphaLevelContext,
      ids: alphaLevelIds,
    })
    const alphaLevelDocs = alphaLevelRequest?.[AlphaLevelContext.name] ?? []
    if (alphaLevelDocs.length === 0) {
      throw createError('error.loadDataFailed', 'loadError.alphaLevelsNotFound')
    }

    let noScoredAlphas = true
    const alphaLevelCollection = AlphaLevelContext.collection()
    const aggregatedAlphaLevels = alphaLevels
      .map((alphaResult) => {
        const alphaLevelDocument = alphaLevelCollection.findOne(
          alphaResult.alphaLevelId,
        )
        if (!alphaLevelDocument) {
          throw createError(
            'error.loadDataFailed',
            'loadError.alphaLevelNotFound',
            { alphaLevelId: alphaResult.alphaLevelId },
          )
        }
        if (alphaResult.gradeIndex > -1) noScoredAlphas = false
        const dimension = DimensionContext.collection().findOne(
          alphaLevelDocument.dimension,
        )
        return {
          ...alphaResult,
          dimension:
            dimension && `${dimension.title} ${alphaLevelDocument.level}`,
          level: alphaLevelDocument.level,
          shortCode: alphaLevelDocument.shortCode,
          description: alphaLevelDocument.description,
          gradeLabel: `thresholds.${alphaResult.gradeName}`,
          perc: truncatePercent(Number(alphaResult.perc ?? 0) * 100),
        }
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
}

export const loadData = createDataLoader()
