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
import {
  completionNavigation,
  completionStates as states,
  completionViewIndex,
  createCompletionFailureState,
  createResponseDetailsLoader,
  resolveCompletionSession,
  resolveCompletionView,
} from './completeBehavior'

Template.complete.onCreated(async function () {
  const { sessionId } = this.data.params
  const { api } = this.initDependencies({
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
      this.state.set({
        dependenciesComplete: true,
      })
    },
  })

  const { queryParam, debug, hasProperty } = api
  const onFailed = (e) => {
    console.error(e)
    this.state.set(createCompletionFailureState(e))
  }

  try {
    const data = await loadData({ sessionId, debug })
    this.state.set(data)
  } catch (e) {
    onFailed(e)
  }

  try {
    const sessionData = await loadSessionData({ debug, sessionId })
    const decision = resolveCompletionSession({ sessionData, sessionId })
    if (decision.action === 'exit') {
      this.data.exit(decision.args)
    } else {
      this.state.set(decision.state)
    }
  } catch (e) {
    onFailed(e)
  }

  // basic routes / state handling
  this.autorun(() => {
    const currentView = resolveCompletionView(queryParam('v'))
    this.state.set(
      'view',
      hasProperty(states, currentView) ? currentView : states.showResults,
    )
  })

  this.responseDetailsLoader = createResponseDetailsLoader({
    sessionId,
    debug,
    load: loadResponses,
    onFailed,
  })

  // Debug response details are attempted once per page lifetime. The adapter
  // owns the attempted/loaded transition so this autorun cannot refetch after
  // its own callingResponses update.
  this.autorun(() => {
    void this.responseDetailsLoader.run({
      user: Meteor.user(),
      state: this.state,
    })
  })
})

Template.complete.onDestroyed(function () {
  this.responseDetailsLoader?.stop()
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
    queryParam({ v: completionViewIndex(states.showDecision) })
  },
  'click .lea-showdecision-back-button'(event, templateInstance) {
    event.preventDefault()
    const { queryParam } = templateInstance.api
    queryParam({ v: completionViewIndex(states.showResults) })
  },
  'click .print-simple'(event) {
    event.preventDefault()
    // printHTMLElement('lea-complete-print-root')
    window.print()
  },
  'click .lea-end-button'(event, templateInstance) {
    event.preventDefault()
    const target = completionNavigation('end')
    templateInstance.api.fadeOut('.lea-complete-container', () =>
      templateInstance.data?.[target](),
    )
  },
  'click .lea-continue-button'(event, templateInstance) {
    event.preventDefault()
    const target = completionNavigation('continue')
    templateInstance.api.fadeOut('.lea-complete-container', () =>
      templateInstance.data?.[target](),
    )
  },
  'click .lea-to-overview-button'(event, templateInstance) {
    event.preventDefault()
    const target = completionNavigation('overview')
    templateInstance.api.fadeOut('.lea-complete-container', () =>
      templateInstance.data?.[target](),
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
