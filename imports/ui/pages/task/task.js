import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { ReactiveVar } from 'meteor/reactive-var'
import { Session } from '../../../api/session/Session'
import { Task } from '../../../api/session/Task'
import { Response } from '../../../api/session/Response'
import { Router } from '../../../api/routing/Router'
import { Dimensions } from '../../../api/session/Dimensions'
import { Levels } from '../../../api/session/Levels'
import { LeaCoreLib } from '../../../api/core/LeaCoreLib'
import { fadeOut, fadeIn } from '../../../utils/animationUtils'
import { dataTarget } from '../../../utils/eventUtils'
import { isTaskRoute } from '../../../utils/routeUtils'
import '../../components/container/container'
import '../../layout/navbar/navbar'
import './task.html'

const components = LeaCoreLib.components
const coreComponentsLoaded = components.load([ components.template.actionButton ])

const renderers = LeaCoreLib.renderers
const renderUrl = Meteor.settings.public.hosts.items.renderUrl
renderers.h5p.configure({ renderUrl })

const taskRendererFactoryLoaded = new ReactiveVar(false)
renderers.factory.load().then(() => taskRendererFactoryLoaded.set(true)).catch(e => {
  console.error('could not load TaskRendererFactory')
  console.error(e)
})

function abortTask (instance) {
  const route = instance.data.prev()
  fadeOut('.lea-task-container', instance, () => {
    Router.go(route)
  })
}

Template.task.onCreated(function () {
  const instance = this
  const currentPageCount = Router.queryParam('p') || 0

  instance.autorun(() => {
    const data = Template.currentData()
    const { taskId } = data.params
    Task.helpers.load(taskId)
      .then(taskDoc => {
        console.log('task loaded', taskDoc)
        if (taskDoc) {
          instance.state.set('taskDoc', taskDoc)
          instance.state.set('taskStory', taskDoc.story)
          instance.state.set('maxPages', taskDoc.pages.length)
          instance.state.set('currentPageCount', currentPageCount)
          instance.state.set('currentPage', taskDoc.pages[ currentPageCount ])
          instance.state.set('hasNext', taskDoc.pages.length > currentPageCount + 1)
        } else {
          abortTask(instance)
        }
      })
      .catch(err => {
        console.error(err)
        abortTask(instance)
      })
  })

  instance.autorun(() => {
    const taskDoc = instance.state.get('taskDoc')
    if (!taskDoc) return

    const data = Template.currentData()
    const { sessionId } = data.params

    const sessionSub = Session.publications.current.subscribe()
    if (sessionSub.ready()) {
      const sessionDoc = Session.helpers.byId(sessionId)
      if (sessionDoc) {
        const { currentTask } = sessionDoc
        const { tasks } = sessionDoc

        instance.state.set('progress', Session.helpers.getProgress(sessionDoc))
        instance.state.set('currentTaskCount', tasks.indexOf(currentTask) + 1)
        instance.state.set('maxTasksCount', tasks.length)
        instance.state.set('sessionDoc', sessionDoc)
        if (instance.state.get('fadedOut')) {
          fadeIn('.lea-task-container', instance, () => {})
        }
      } else {
        const route = instance.data.prev()
        fadeOut('.lea-task-container', instance, () => {
          Router.go(route)
        })
      }
    }
  })
})

Template.task.onDestroyed(function () {
  const instance = this
  instance.state.set({
    'fadedOut': null
  })
})

Template.task.helpers({
  loadComplete () {
    const instance = Template.instance()
    return taskRendererFactoryLoaded.get() && coreComponentsLoaded.get() &&
      instance.state.get('sessionDoc') && instance.state.get('taskDoc')
  },
  taskStory () {
    return taskRendererFactoryLoaded.get() && coreComponentsLoaded.get() && Template.getState('taskStory')
  },
  taskDoc () {
    return taskRendererFactoryLoaded.get() && coreComponentsLoaded.get() && Template.getState('taskDoc')
  },
  currentTaskCount () {
    return Template.getState('currentTaskCount')
  },
  maxTasksCount () {
    return Template.getState('maxTasksCount')
  },
  sessionDoc () {
    return Template.getState('sessionDoc')
  },
  dimension () {
    const sessionDoc = Template.getState('sessionDoc')
    if (!sessionDoc) return

    return Dimensions.types[ sessionDoc.dimension ]
  },
  level () {
    const sessionDoc = Template.getState('sessionDoc')
    if (!sessionDoc) return

    return Levels.types[ sessionDoc.level ]
  },
  currentType () {
    const sessionDoc = Template.getState('sessionDoc')
    if (!sessionDoc) return

    const dimension = Dimensions.types[ sessionDoc.dimension ]
    return dimension && dimension.type
  },
  currentPage () {
    return Template.getState('currentPage')
  },
  currentPageCount () {
    return Template.getState('currentPageCount') + 1
  },
  maxPages () {
    return Template.getState('maxPages')
  },
  hasNext () {
    return Template.getState('hasNext')
  },
  hasPrev () {
    return Template.getState('hasPrev')
  },
  progress () {
    return Template.getState('progress')
  },
  itemData (content) {
    const instance = Template.instance()
    const sessionDoc = instance.state.get('sessionDoc')
    const sessionId = sessionDoc._id
    const taskDoc = instance.state.get('taskDoc')
    const taskId = taskDoc._id
    const userId = Meteor.userId()
    return Object.assign({}, content, { userId, sessionId, taskId })
  }
})

Template.task.events({
  'click .lea-pagenav-button' (event, templateInstance) {
    event.preventDefault()
    const action = dataTarget(event, templateInstance, 'action')
    const taskDoc = templateInstance.state.get('taskDoc')
    const currentPageCount = templateInstance.state.get('currentPageCount')
    const newPage = {}

    if (action === 'next') {
      newPage.currentPageCount = currentPageCount + 1
      newPage.currentPage = taskDoc.pages[ newPage.currentPageCount ]
      newPage.hasNext = (newPage.currentPageCount + 1) < taskDoc.pages.length
    }

    if (action === 'back') {
      newPage.currentPageCount = currentPageCount - 1
      newPage.currentPage = taskDoc.pages[ newPage.currentPageCount ]
      newPage.hasNext = (newPage.currentPageCount + 1) < taskDoc.pages.length
    }

    if (!newPage.currentPage) {
      throw new Error(`Undefined page for current index ${newPage.currentPageCount}`)
    }

    const $current = templateInstance.$('.lea-task-current-content-container')
    const currentHeight = $current.height()
    const oldContainerCss = $current.css('height') || ''
    $current.css('height', `${currentHeight}px`)

    fadeOut('.lea-task-current-content', templateInstance, () => {
      templateInstance.state.set(newPage)
      setTimeout(() => {
        fadeIn('.lea-task-current-content', templateInstance, () => {
          $current.css('height', oldContainerCss)
        })
      }, 100)
    })
  },
  'click .lea-task-finishstory-button' (event, templateInstance) {
    event.preventDefault()
    fadeOut('.lea-task-story-container', templateInstance, () => {
      templateInstance.state.set('taskStory', null)
    })
  },
  'click .lea-pagenav-finish-button' (event, templateInstance) {
    event.preventDefault()
    const { taskId } = templateInstance.data.params
    const sessionDoc = templateInstance.state.get('sessionDoc')
    const answers = [] // TODO
    const sessionId = sessionDoc._id

    // WHEN A TASK IS FINISHED, THE FOLLOWING
    // STEPS ARE TAKEN
    // 1. SEND RESPONSES
    // 2. UPDATE SESSION
    // 3. CHECK IF SESSION IS COMPLETE
    //  a - if complete call finish()
    //  b - else call next()
    Response.methods.send.call({ taskId, sessionId, answers }, (err, responseId) => {
      if (err) {
        console.error(err)
        return
      }
      Session.methods.update.call({ sessionId, responseId }, (err, taskId) => {
        if (err) {
          console.error(err)
          return
        }
        const route = taskId
          ? templateInstance.data.next({ taskId })
          : templateInstance.data.finish({ sessionId })

        // we check if the route is to another task
        // se we would fade the navbar only when the
        // result page (or another pahe) will be shown
        const fadeTarget = isTaskRoute(route)
          ? '.lea-task-content-container'
          : '.lea-task-container'

        fadeOut(fadeTarget, templateInstance, () => {
          templateInstance.state.set('taskDoc', null)
          templateInstance.state.set('fadedOut', true)
          Router.go(route)
        })
      })
    })
  }
})