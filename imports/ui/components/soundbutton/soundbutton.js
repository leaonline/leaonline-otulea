import { Template } from 'meteor/templating'
import { TTSEngine } from '../../../api/tts/TTSEngine'
import './soundbutton.html'

const getBsType = (type, outline) => {
  if (!type) return outline ? `outline-secondary` : 'secondary'
  return outline ? `outline-${type}` : type
}

Template.soundbutton.helpers({
  attributes () {
    const instance = Template.instance()
    const { data } = instance

    const btnType = getBsType(data.type, data.outline)
    const btnBlock = data.block ? 'btn-block' : ''
    const btnLg = data.lg ? 'btn-lg' : ''
    const btnXl = data.xl ? 'btn-xl' : ''
    const btnSm = data.sm ? 'btn-sm' : ''
    const customClass = data.class || ''

    return {
      id: data.id,
      title: data.title,
      class: `lea-sound-btn btn btn-${btnType} ${btnBlock} ${btnSm} ${btnLg} ${btnXl} ${customClass}`,
      'data-tts': data.tts
    }
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
  }
})
