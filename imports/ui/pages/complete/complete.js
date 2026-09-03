import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Dimension } from '../../../contexts/Dimension'
import { Session } from '../../../contexts/session/Session'
import { Thresholds } from '../../../contexts/thresholds/Thresholds'
import { Competency } from '../../../contexts/Competency'
import { AlphaLevel } from '../../../contexts/AlphaLevel'
import { Response } from '../../../contexts/response/Response'
import { Unit } from '../../../contexts/Unit'
import { translate } from '../../../api/i18n/translate'
import '../../components/container/container'
import '../../layout/navbar/navbar'
import './complete.scss'
import './complete.html'
import { loadData } from './helpers/loadData'
import { loadSessionData } from './helpers/loadSessionData'
import { loadResponses } from './helpers/loadResponses'

const states = {
  showResults: 'showResults',
  showDecision: 'showDecision',
  showFailed: 'showFailed',
}

const stateValues = Object.values(states)

Template.complete.onCreated(async function () {
  const instance = this
  const { sessionId } = instance.data.params
  const { api } = instance.initDependencies({
    language: true,
    tts: true,
    translations: {
      de: () => import('./i18n/de'),
    },
    contexts: [
      Dimension,
      Session,
      Competency,
      Thresholds,
      AlphaLevel,
      Response,
      Unit,
    ],
    onComplete: async () => {
      instance.state.set({
        dependenciesComplete: true,
      })
    },
  })

  const { queryParam, debug, hasProperty } = api
  const onFailed = (e) => {
    console.error(e)
    instance.state.set({
      competenciesLoaded: true,
      sessionLoaded: true,
      failed: e
        ? { error: e.error ?? 'error.default', reason: e.reason || e.message }
        : true,
    })
  }

  try {
    const data = await loadData({ sessionId, debug })
    instance.state.set(data)
  } catch (e) {
    onFailed(e)
  }

  try {
    const sessionData = await loadSessionData({ debug, sessionId })
    if (sessionData.action === 'next') {
      instance.data.exit({ sessionId })
    } else {
      instance.state.set(sessionData)
    }
  } catch (e) {
    onFailed(e)
  }

  // basic routes / state handling
  instance.autorun(() => {
    const v = queryParam('v') || 0
    const currentView = stateValues[parseInt(v, 10)]

    if (currentView && hasProperty(states, currentView)) {
      instance.state.set('view', currentView)
    } else {
      instance.state.set('view', states.showResults)
    }
  })

  // if we have a debug user we can ask for her responses in detail so our
  // team members can see their response-scoring in detail
  instance.autorun(() => {
    const user = Meteor.user()
    if (!user?.debug || instance.state.get('callingResponses')) {
      return
    }

    instance.state.set('callingResponses', true)
    loadResponses({ sessionId, debug })
      .then((responses) => instance.state.set({ responses }))
      .catch(onFailed)
      .finally(() => instance.state.set('callingResponses', false))
  })
})

Template.complete.helpers({
  loadComplete() {
    const instance = Template.instance()
    return (
      instance.state.get('dependenciesComplete') &&
      // instance.state.get('competenciesLoaded') &&
      instance.state.get('sessionLoaded')
    )
  },
  failed() {
    return Template.getState('failed')
  },
  feedbackComplete() {
    return (
      Template.getState('competenciesLoaded') &&
      Template.getState('alphaLevelsLoaded')
    )
  },
  competenciesLoaded() {
    return Template.getState('competenciesLoaded')
  },
  alphaLevelsLoaded() {
    return Template.getState('alphaLevelsLoaded')
  },
  competencies() {
    return Template.getState('aggregatedResults')
  },
  alphaLevels() {
    return Template.getState('alphaLevels')
  },
  getCompetency(_id) {
    const competencyDoc = Competency.collection().findOne(_id)
    if (competencyDoc) {
      return {
        shortCode: competencyDoc.shortCode,
        description:
          competencyDoc.descriptionSimple || competencyDoc.description,
        example: competencyDoc.example,
      }
    }

    return { description: _id }
  },
  minCountCompetency() {
    return Template.getState('minCountCompetency')
  },
  printOptions() {
    return Template.getState('printOptions')
  },
  evaluationResults() {
    return Template.getState('results')
  },
  showThanks() {
    const viewState = Template.getState('view')
    const failed = Template.getState('failed')
    return viewState === states.showResults || failed
  },
  showResults() {
    const instance = Template.instance()
    const failed = instance.state.get('failed')
    return instance.state.get('view') === states.showResults && !failed
  },
  showDecision() {
    const instance = Template.instance()
    const failed = instance.state.get('failed')
    return (
      !failed &&
      instance.state.get('sessionDoc') &&
      instance.state.get('view') === states.showDecision
    )
  },
  showCompetencies() {
    return Template.getState('showCompetencies')
  },
  navbarData() {
    const instance = Template.instance()
    const sessionDoc = instance.state.get('sessionDoc')
    const levelDoc = instance.state.get('levelDoc')
    const unitSetDoc = instance.state.get('unitSetDoc')
    const dimensionDoc = instance.state.get('dimensionDoc')

    return {
      sessionDoc,
      levelDoc,
      unitSetDoc,
      dimensionDoc,
      showProgress: false,
      showUsername: true,
    }
  },
  currentType() {
    return Template.instance().state.get('color')
  },
  getPercent(doc = {}) {
    const percent = String(doc.perc ?? 0)
    return translate('pages.complete.percent', { percent })
  },
  // ///////////////////////////////////////////////////////////////////////////
  // DEBUG-USER-ONLY!
  // ///////////////////////////////////////////////////////////////////////////
  responses() {
    return Template.getState('responses')
  },
  stringify(obj) {
    return JSON.stringify(obj, null, 0)
  },
  isScored(entry) {
    return entry === 'true' || entry === true
  },
  showExtended(isGraded, isDemoUser) {
    return isGraded || isDemoUser
  },
  noScoredCompetencies() {
    return Template.getState('noScoredCompetencies')
  },
  noScoredAlpha() {
    return Template.getState('noScoredAlphas')
  },
})

Template.complete.events({
  'click .lea-showresults-forward-button'(event, templateInstance) {
    event.preventDefault()
    const { queryParam } = templateInstance.api
    queryParam({ v: stateValues.indexOf(states.showDecision) })
  },
  'click .lea-showdecision-back-button'(event, templateInstance) {
    event.preventDefault()
    const { queryParam } = templateInstance.api
    queryParam({ v: stateValues.indexOf(states.showResults) })
  },
  'click .print-simple'(event) {
    event.preventDefault()
    // printHTMLElement('lea-complete-print-root')
    window.print()
  },
  'click .lea-end-button'(event, templateInstance) {
    event.preventDefault()
    templateInstance.api.fadeOut('.lea-complete-container', () =>
      templateInstance.data?.end(),
    )
  },
  'click .lea-continue-button'(event, templateInstance) {
    event.preventDefault()
    templateInstance.api.fadeOut('.lea-complete-container', () =>
      templateInstance.data?.next(),
    )
  },
  'click .lea-to-overview-button'(event, templateInstance) {
    event.preventDefault()
    templateInstance.api.fadeOut('.lea-complete-container', () =>
      templateInstance.data?.next(),
    )
  },
  'click .toggle-competency-display'(event, templateInstance) {
    event.preventDefault()
    const showCompetencies = templateInstance.state.get('showCompetencies')

    if (showCompetencies) {
      templateInstance.state.set('showCompetencies', false)
      templateInstance.api.fadeOut('.competencies-body', () => {})
    } else {
      templateInstance.state.set('showCompetencies', true)
      templateInstance.api.fadeIn('.competencies-body', () => {})
    }
  },
})
