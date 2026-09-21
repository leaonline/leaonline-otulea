import { Blaze } from 'meteor/blaze'
import { Template } from 'meteor/templating'
import { Tracker } from 'meteor/tracker'
import 'meteor/leaonline:ui/components/actionButton/actionButton'
import 'meteor/leaonline:ui/components/icon/icon'
import 'meteor/leaonline:ui/components/image/image'
import 'meteor/leaonline:ui/components/routeButton/routeButton'
import 'meteor/leaonline:ui/components/soundbutton/soundbutton'
import 'meteor/leaonline:ui/components/text/text'
import 'meteor/leaonline:ui/components/textgroup/textgroup'
import 'meteor/leaonline:ui/renderers/factory/TaskRendererFactory'
import 'meteor/leaonline:ui/renderers/page/taskPageRenderer'

const flushTracker = async () => {
  await new Promise((resolve) => {
    Tracker.afterFlush(resolve)
    Tracker.flush()
  })
  await Promise.resolve()
}

export const createBlazeHarness = () => {
  const renderings = []
  let i18nInstalled = false
  const helpers = {
    fullUrl: (path) => path,
    i18n: (key) => key,
    isDebugUser: () => false,
    isDemoUser: () => false,
    isEnv: () => false,
    route: () => '#',
  }

  const render = async (template, data = {}) => {
    if (!i18nInstalled) {
      Template.registerHelper('i18n', helpers.i18n)
      i18nInstalled = true
    }
    const host = document.createElement('div')
    document.body.appendChild(host)
    const definition = typeof template === 'string' ? Template[template] : template
    let view
    try {
      view = Blaze.renderWithData(definition, { ...helpers, ...data }, host)
    } catch (error) {
      host.remove()
      throw error
    }
    let templateView = host.firstChild && Blaze.getView(host.firstChild)
    while (templateView && templateView.template !== definition) {
      templateView = templateView.parentView
    }
    const rendering = {
      host,
      view,
      instance: templateView?.templateInstance(),
    }
    renderings.push(rendering)
    await flushTracker()
    return rendering
  }

  const dispatch = async (target, type, properties = {}) => {
    const event = new Event(type, { bubbles: true, cancelable: true })
    Object.entries(properties).forEach(([name, value]) => {
      Object.defineProperty(event, name, { configurable: true, value })
    })
    target.dispatchEvent(event)
    await flushTracker()
    return event
  }

  const cleanup = async () => {
    while (renderings.length > 0) {
      const { host, view } = renderings.pop()
      Blaze.remove(view)
      await flushTracker()
      host.remove()
    }
    if (i18nInstalled) {
      Template.deregisterHelper('i18n')
      i18nInstalled = false
    }
  }

  return {
    cleanup,
    dispatch,
    flush: flushTracker,
    render,
  }
}
