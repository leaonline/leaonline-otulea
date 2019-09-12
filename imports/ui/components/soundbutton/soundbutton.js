import { Template } from 'meteor/templating'
import { ReactiveVar } from 'meteor/reactive-var'
import { TTSEngine } from '../../../api/tts/TTSEngine'
import { getBsType } from '../../../utils/bootstrapUtils'
import { i18n } from '../../../api/i18n/I18n'
import './soundbutton.html'

Template.soundbutton.onCreated(function () {
  const instance = this
  const { data } = instance

  const initialTTS = data.tts
  const btnType = getBsType(data.type, data.outline)
  const btnBlock = data.block ? 'btn-block' : ''
  const btnSize = data.md || data.xs || data.lg || 'btn-sm'
  const customClass = data.class || ''
  const activeClass = data.active ? 'active' : ''
  const borderClass = data.border ? '' : 'border-0'

  instance.isPlaying = new ReactiveVar(false)
  instance.tts = new ReactiveVar(initialTTS)
  instance.attributes = new ReactiveVar({
    id: data.id,
    title: data.title,
    class: `lea-sound-btn btn btn-${btnType} ${btnBlock} ${btnSize} ${borderClass} ${activeClass} ${customClass}`,
    'data-tts': initialTTS,
    'aria-label': data.title || i18n.get('aria.readText')
  })

  instance.autorun(() => {
    const reactiveData = Template.currentData()

    if (reactiveData.tts !== instance.tts.get()) {
      // if the TTS target changed reactively
      // we need to stop the current playing
      if (instance.isPlaying.get()) {
        TTSEngine.stop()
      }
      // we need to update the internal
      // TTS target state to allow playing the new sound
      instance.tts.set(reactiveData.tts)
    }
  })
})

Template.soundbutton.onDestroyed(function () {
  const instance = this
  const isPlaying = instance.isPlaying.get()

  if (isPlaying) {
    TTSEngine.stop()
  }
})

Template.soundbutton.helpers({
  attributes () {
    const instance = Template.instance()
    const isPlaying = instance.isPlaying.get()
    const atts = Object.assign({}, instance.attributes.get())

    if (isPlaying || instance.data.active) {
      atts.class += ' active'
    }
    atts['data-tts'] = instance.tts.get()

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
