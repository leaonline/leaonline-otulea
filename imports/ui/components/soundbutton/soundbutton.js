import { Template } from 'meteor/templating'
import { TTSEngine } from '../../../api/tts/TTSEngine'
import { getBsType } from '../../../utils/bootstrapUtils'
import './soundbutton.html'
import { i18n } from '../../../api/i18n/I18n'

Template.soundbutton.onCreated(function () {
  const instance = this
  const { data } = instance

  const btnType = getBsType(data.type, data.outline)
  const btnBlock = data.block ? 'btn-block' : ''
  const btnLg = data.lg ? 'btn-lg' : ''
  const btnXl = data.xl ? 'btn-xl' : ''
  const btnSm = data.sm ? 'btn-sm' : ''
  const customClass = data.class || ''

  instance.isPlaying = new ReactiveVar(false)
  instance.attributes = new ReactiveVar({
    id: data.id,
    title: data.title,
    class: `lea-sound-btn btn btn-${btnType} ${btnBlock} ${btnSm} ${btnLg} ${btnXl} ${customClass}`,
    'data-tts': data.tts,
    'aria-label': data.title || i18n.get('aria.readText')
  })
})

Template.soundbutton.helpers({
  attributes () {
    const isPlaying = Template.instance().isPlaying.get()
    const atts = Object.assign({}, Template.instance().attributes.get())
    if (isPlaying) {
      atts.class += ' active'
    }
    return atts
  },
  isPlaying () {
    return Template.instance().isPlaying.get()
  }
})

Template.soundbutton.events({
  'click .lea-sound-btn' (event, templateInstance) {
    event.preventDefault()

    const isPlaying = templateInstance.isPlaying.get()

    if (isPlaying) {
      TTSEngine.stop()
      templateInstance.isPlaying.set(false)
      return
    }

    const id = templateInstance.$(event.currentTarget).data('tts')
    const onEnd = () => templateInstance.isPlaying.set(false)
    if (id) {
      try {
        TTSEngine.play({ id, onEnd })
        templateInstance.isPlaying.set(true)
      } catch (e) {
        console.error(e)
        // TODO noitfy?
      }
    }
  }
})
