import { Template } from 'meteor/templating'
import { Blaze } from 'meteor/blaze'
import { Tracker } from 'meteor/tracker'

export const UITests = {}

const withDiv = function withDiv (callback) {
  const el = document.createElement('div')
  document.body.appendChild(el)
  try {
    callback(el)
  }
  finally {
    document.body.removeChild(el)
  }
}

UITests.withRenderedTemplate = function withRenderedTemplate (template, data) {
  return new Promise(resolve => {
    withDiv(el => {
      const ourTemplate = typeof template === 'string'
        ? Template[template]
        : template
      Blaze.renderWithData(ourTemplate, data, el)
      Tracker.flush()
      resolve(el)
    })
  })
}

UITests.preRender = () => Template.registerHelper('_', key => key)

UITests.postRender = () => Template.deregisterHelper('_')

UITests.wait = ms => new Promise(resolve => setTimeout(() => resolve(), ms))
