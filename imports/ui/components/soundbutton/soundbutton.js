import { Template } from 'meteor/templating'
import { TTSEngine } from '../../../api/tts/TTSEngine'
import './soundbutton.html'

const getBsType = (type, outline) => {
  if (!type) return 'secondary'
  return outline ? `outline-${type}` : type
}

Template.soundbutton.onCreated(function () {
  const instance = this
  const { data } = instance

  const btnOutline = data.outline
  const btnType = getBsType(data.type, btnOutline)
  const btnBlock = data.block ? 'btn-block' : ''
  const btnLg = data.lg ? 'btn-lg' : ''
  const btnXl = data.xl ? 'btn-xl' : ''
  const btnSm = data.sm ? 'btn-sm' : ''

  const btnPlayClass = data.playHover
    ? 'lea-sound-hover'
    : 'lea-sound-btn'

  const attributes = {
    id: data.id,
    title: data.title,
    class: `${btnPlayClass} btn btn-${btnType} ${btnBlock} ${btnSm} ${btnLg} ${btnXl}`,
    'data-tts': data.tts
  }

  instance.state.set('attributes', attributes)
})

Template.soundbutton.helpers({
  attributes () {
    return Template.getState('attributes')
  }
})

function playEvent (event, templateInstance) {
  const id = templateInstance.$(event.currentTarget).data('tts')
  if (id) {
    try {
      TTSEngine.play({ id })
    } catch (e) {
      console.error(e)
      // TODO noitfy?
    }
  }
}

Template.soundbutton.events({
  'click .lea-sound-btn' (event, templateInstance) {
    event.preventDefault()
    playEvent(event, templateInstance)
  },
  'mouseover .lea-sound-hover' (event, templateInstance) {
    event.preventDefault()
    playEvent(event, templateInstance)
  }
})
