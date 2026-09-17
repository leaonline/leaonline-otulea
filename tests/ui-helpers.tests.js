import { Template } from 'meteor/templating'
import { Blaze } from 'meteor/blaze'
import { Tracker } from 'meteor/tracker'

export const UITests = {}

UITests.withRenderedTemplate = (template, data) => {
  return new Promise((resolve, reject) => {
    const el = document.createElement('div')
    try {
      document.body.appendChild(el)
      const ourTemplate = typeof template === 'string'
        ? Template[template]
        : template
      Blaze.renderWithData(ourTemplate, data, el)
      Tracker.flush()
      resolve(el)
    }
    catch (e) {
      reject(e)
    }
    finally {
      document.body.removeChild(el)
    }
  })
}

UITests.preRender = () => Template.registerHelper('_', key => key)

UITests.postRender = () => Template.deregisterHelper('_')

UITests.wait = ms => new Promise(resolve => setTimeout(() => resolve(), ms))
