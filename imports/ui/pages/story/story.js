import { Template } from 'meteor/templating'
import { UnitSet } from '../../../contexts/unitSet/UnitSet'
import { Dimension } from '../../../contexts/Dimension'
import { Session } from '../../../contexts/session/Session'
import { Level } from '../../../contexts/Level'
import { createSessionLoader } from '../../loading/createSessionLoader'
import { initTaskRenderers } from '../../renderers/initTaskRenderers'
import { resolveStorySession, storyNavigation } from './storyBehavior'
import '../../components/container/container'
import '../../layout/navbar/navbar'
import './story.html'


Template.story.onCreated(function () {
  const instance = this
  instance.renderersLoaded = initTaskRenderers()
  const { api } = instance.initDependencies({
    tts: true,
    language: true,
    translations: {
      de: () => import('./i18n/de'),
    },
    contexts: [UnitSet, Session, Dimension, Level],
    onComplete() {
      instance.state.set('dependenciesComplete', true)
    },
  })

  const { debug } = api
  const loadSessionDocs = createSessionLoader({ debug })

  instance.autorun((computation) => {
    if (instance.renderersLoaded.get()) {
      debug('renderers loaded')
      return computation.stop()
    }
  })

  instance.autorun(() => {
    const data = Template.currentData()
    const { unitId, sessionId } = data.params

    if (!unitId || !sessionId) {
      return abortStory(instance)
    }

    loadSessionDocs({ sessionId })
      .then((responseData) => {
        const decision = resolveStorySession({
          unitId,
          sessionId,
          responseData,
        })
        if (decision.action === 'exit') return abortStory(instance)
        instance.state.set(decision.state)
      })
      .catch((err) => abortStory(instance, err))
  })
})

Template.story.helpers({
  loadComplete() {
    const instance = Template.instance()
    return (
      instance.state.get('dependenciesComplete') &&
      instance.state.get('sessionDoc') &&
      instance.state.get('unitSetDoc') &&
      instance.state.get('dimensionDoc') &&
      instance.renderersLoaded.get()
    )
  },
  pageContentData() {
    const intsance = Template.instance()
    const unitSetDoc = intsance.state.get('unitSetDoc')
    const sessionDoc = intsance.state.get('sessionDoc')
    const color = intsance.state.get('color')

    return {
      isStory: true,
      currentPageCount: -1,
      sessionId: sessionDoc._id,
      doc: unitSetDoc,
      color: color,
    }
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
      showProgress: true,
      onExit: instance.data.exit,
    }
  },
  currentType() {
    const intsance = Template.instance()
    return intsance.state.get('color')
  },
})

Template.story.events({
  'click .lea-story-finish-button'(event, templateInstance) {
    event.preventDefault()
    const sessionDoc = templateInstance.state.get('sessionDoc')
    const { unitId } = templateInstance.data.params
    templateInstance.data?.next(storyNavigation({ sessionDoc, unitId }))
  },
})

function abortStory(instance, err) {
  console.error('abort story')
  console.error(err)
  instance.data?.exit()
}
