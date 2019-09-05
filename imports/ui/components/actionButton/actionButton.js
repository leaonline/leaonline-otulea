import { Template } from 'meteor/templating'
import { getBsType } from '../../../utils/bootstrapUtils'

import './actionButton.html'

Template.actionButton.helpers({
  attributes () {
    const instance = Template.instance()
    const { data } = instance

    const btnType = getBsType(data.type, data.outline)
    const btnBlock = data.block ? 'btn-block' : ''
    const customClass = data.btnClass || ''

    return {
      id: data.id,
      title: data.title,
      class: `lea-action-button btn btn-${btnType} ${btnBlock} ${customClass}`,
      'aria-label': data.label || data.title || 'button'
    }
  },
  groupAttributes () {
    const instance = Template.instance()
    const { data } = instance

    const btnLg = data.lg ? 'btn-group-lg' : ''
    const btnXl = data.xl ? 'btn-group-xl' : ''
    const btnSm = data.sm ? 'btn-group-sm' : ''
    const customClass = data.class || ''

    return {
      id: data.id,
      title: data.title,
      class: `btn-group  ${btnSm} ${btnLg} ${btnXl} ${customClass}`
    }
  }
})
