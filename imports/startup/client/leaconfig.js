import { Meteor } from 'meteor/meteor'

export const initializeTTS = async () => {
  const { TTSEngine } = await import('../../api/tts/TTSEngine')
  const Detector = (await import('detect-os')).default

  let mode
  try {
    const detector = new Detector()
    detector.detect()

    const detected = detector.detected
    const types = Detector.types

    switch (detected.os) {
      case types.macos.os:
      case types.windows.os:
      case types.ios.os:
      case types.android.os:
        mode = TTSEngine.modes.browser
        break
      default:
        mode = TTSEngine.modes.server
    }
  } catch (error) {
    console.error('Failed to detect os, use fallback')
    console.error(error)
    console.error('Debug: ', window.navigator.userAgent, window.navigator.platform)
    mode = TTSEngine.modes.server
  }

  TTSEngine.configure({ ttsUrl: Meteor.settings.public.tts.url, mode })
}
