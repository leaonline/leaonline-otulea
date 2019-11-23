import { Meteor } from 'meteor/meteor'
import { LeaCoreLib } from '../../api/core/LeaCoreLib'
import { i18n } from '../../api/i18n/I18n'
import Detector from 'detect-os'

Meteor.startup(() => {
  const detector = new Detector()
  detector.detect()
  console.log(detector.detected)

  LeaCoreLib.i18n.load(i18n)
  LeaCoreLib.ttsEngine.configure({ ttsUrl: Meteor.settings.public.tts.url })
})
