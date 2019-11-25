import { Meteor } from 'meteor/meteor'
import { LeaCoreLib } from '../../api/core/LeaCoreLib'
import { i18n } from '../../api/i18n/I18n'
import Detector from 'detect-os'

Meteor.startup(() => {
  const detector = new Detector()
  detector.detect()
  const detected = detector.detected
  const types = Detector.types
  let mode
  switch (detected.os) {
    case types.macos.os:
    case types.windows.os:
    case types.ios.os:
    case types.android.os:
      mode = LeaCoreLib.ttsEngine.modes.browser
      break
    default:
      mode = LeaCoreLib.ttsEngine.modes.server
  }

  LeaCoreLib.i18n.load(i18n)
  LeaCoreLib.ttsEngine.configure({ ttsUrl: Meteor.settings.public.tts.url, mode })
})
