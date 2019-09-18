import { Renderers } from '../Renderers'
import './TaskRendererFactory.html'

Template.TaskRendererFactory.onCreated(function () {
  const instance = this

  instance.autorun(() => {
    const data = Template.currentData()
    const {content} = data

    // skip current autorun if we have no content
    // or the template has already been loaded
    // for this current content type
    if (!content || instance.state.get(content.subtype)) {
      return
    }

    const rendererContext = Renderers[content.subtype]
    if (!rendererContext) {
      // something weirdly failed, what to do here?
      return
    }

    rendererContext
      .load()
      .then(() => instance.state.set(content.subtype, rendererContext.template))
      .catch(e => console.error(e))
  })
})

Template.TaskRendererFactory.helpers({
  templateContext () {
    const instance = Template.instance()
    const { data } = instance
    const { content } = data
    if (!content) {
      return
    }

    const template = instance.state.get(content.subtype)
    return template && { template, data: content }
  }
})