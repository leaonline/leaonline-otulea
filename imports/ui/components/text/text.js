import { Template } from 'meteor/templating'
import { dataTarget } from '../../../utils/eventUtils'
import { TTSEngine } from '../../../api/tts/TTSEngine'
import './text.css'
import './text.html'

const OUT_TIMEOUT = 100

Template.text.onCreated(function () {
  const instance = this
})

Template.text.helpers({
  tokens () {
    const { src } = Template.instance().data
    return src.split(/\s+/g)
  },
  tokenAttributes (currentIndex) {
    const instance = Template.instance()
    const { data } = instance
    const customTokenClass = data.tokenClass || ''

    return { class: `lea-text-token ${customTokenClass}` }
  }
})

Template.text.events({
  'click .lea-text-token' (event, templateinstance) {
    event.preventDefault()
    const text = templateinstance.$(event.currentTarget).text()
    TTSEngine.play({ text })
  }
})