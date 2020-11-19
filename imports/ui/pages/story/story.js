import { Template } from 'meteor/templating'
import { ReactiveVar } from "meteor/reactive-var"
import { TaskRenderers } from '../../renderers/TaskRenderers'
import { UnitSet } from '../../../contexts/unitSet/UnitSet'
import { ColorType } from '../../../types/ColorType'
import { Dimension } from '../../../contexts/Dimension'
import { Session } from '../../../contexts/session/Session'
import { isCurrentUnit } from '../../../contexts/session/isCurrentUnit'
import { callMethod } from '../../../infrastructure/methods/callMethod'
import { Level } from '../../../contexts/Level'
import '../../components/container/container'
import '../../layout/navbar/navbar'
import './story.html'

const renderersLoaded = new ReactiveVar()

Template.story.onCreated(function () {
  const instance = this
  const { api } = instance.initDependencies({
    tts: true,
    language: true,
    contexts: [UnitSet, Session, Dimension, Level],
    onComplete () {
      instance.state.set('dependenciesComplete', true)
    }
  })

  const { info, loadContentDoc } = api

  instance.autorun(computation => {
    if (renderersLoaded.get()) {
      info('renderers loaded')
      return computation.stop()
    }

    TaskRenderers.init()
      .then(() => renderersLoaded.set(true))
      .catch(e => console.error(e))
  })

  instance.autorun(computation => {
    const data = Template.currentData()
    const { unitSetId, sessionId } = data.params

    if (!unitSetId || !sessionId) {
      return abortStory(instance)
    }

    callMethod({
      name: Session.methods.currentById.name,
      args: { sessionId },
      failure: er => abortStory(instance, er),
      success: sessionDoc => {
        if (!sessionDoc) {
          computation.stop()
          return abortStory(instance)
        }

        const { currentUnit } = sessionDoc

        // if we encounter a sessionDoc that is already completed, we just
        // skip any further attempts to load units and immediately finish
        if (Session.helpers.isComplete(sessionDoc)) {
          computation.stop()
          return instance.data.finish({ sessionId })
        }

        // if we encounter a unit, that is different from the sessionDoc's
        // current unit we skip directly to the "next" unit via currentUnit
        if (!isCurrentUnit({ sessionDoc, unitId: currentUnit })) {
          computation.stop()
          return instance.data.next({ unitId: currentUnit, sessionId })
        }

        // otherwise we're good and can continue with the current session
        instance.state.set({ sessionDoc })
      }
    })
  })

  instance.autorun(() => {
    const data = Template.currentData()
    const { unitSetId, sessionId } = data.params

    if (!unitSetId || !sessionId) {
      return abortStory(instance)
    }

    loadContentDoc(UnitSet, unitSetId)
      .catch(err => abortStory(instance, err))
      .then(unitSetDoc => instance.state.set({ unitSetDoc }))
  })

  instance.autorun(() => {
    const unitSetDoc = instance.state.get('unitSetDoc')
    if (!unitSetDoc) return
    const { dimension, level } = unitSetDoc

    loadContentDoc(Level, level)
      .catch(err => abortStory(instance, err))
      .then(levelDoc => instance.state.set({ levelDoc }))

    loadContentDoc(Dimension, dimension)
      .catch(err => abortStory(instance, err))
      .then(dimensionDoc => {
        const colorType = ColorType.byIndex(dimensionDoc?.colorType)
        const color = colorType?.type
        instance.state.set({ dimensionDoc, color })
      })
  })
})

Template.story.helpers({
  loadComplete () {
    const instance = Template.instance()
    return instance.state.get('dependenciesComplete') &&
      instance.state.get('sessionDoc') &&
      instance.state.get('unitSetDoc') &&
      instance.state.get('dimensionDoc') &&
      renderersLoaded.get()
  },
  pageContentData () {
    const intsance = Template.instance()
    const unitSetDoc = intsance.state.get('unitSetDoc')
    const sessionDoc = intsance.state.get('sessionDoc')
    const color = intsance.state.get('color')

    return {
      isPreview: true,
      currentPageCount: 0,
      sessionId: sessionDoc._id,
      doc: unitSetDoc,
      color: color
    }
  },
  navbarData () {
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
      onExit: instance.data.exit
    }
  },
  currentType () {
    const intsance = Template.instance()
    return intsance.state.get('color')
  }
})

Template.story.events({
  'click .lea-story-finish-button' (event, templateInstance) {
    event.preventDefault()
    const sessionDoc = templateInstance.state.get('sessionDoc')
    const sessionId = sessionDoc._id
    const { unitId } = templateInstance.data.params

    templateInstance.data?.next({ sessionId, unitId })
  }
})

function abortStory (instance, err) {
  console.error('abort story')
  console.error(err)
}
