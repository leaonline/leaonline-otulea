import { Template } from 'meteor/templating'
import { fadeIn } from '../../../utils/animationUtils'
import './container.html'

export const createContainerOnRendered = ({
  animate = fadeIn,
  reportError = console.error,
} = {}) =>
  function onRendered() {
    const instance = this
    animate('.lea-base-container', instance, (err, $target) => {
      if (err) return reportError(err)
      $target.data('visible', true)
    })
  }

Template.container.onRendered(createContainerOnRendered())
