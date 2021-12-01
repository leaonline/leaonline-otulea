import { sendError } from '../../contexts/errors/api/sendError'
import { getOSInfo } from '../../ui/utils/getOSInfo'

export const initializeTTS = async () => {
  const { TTSEngine } = await import('../../api/tts/TTSEngine')
  let mode
  try {
    const { detected, types } = await getOSInfo()
    console.debug('[initializeTTS]: detected os', detected.os)

    switch (detected.os) {
      case types.macos.os:
      case types.windows.os:
      case types.ios.os:
      case types.android.os:
      case types.linux.os:
        mode = TTSEngine.modes.browser
        break
      default:
        mode = TTSEngine.modes.browser
        // TODO: switch to mode = TTSEngine.modes.server when imeplemented
    }
  }
  catch (error) {
    mode = TTSEngine.modes.server
    console.error('[initializeTTS]: Failed to detect os, use fallback. (Error send)')
    console.error('[initializeTTS]: Fallback User Agent:', window.navigator.userAgent)
    console.error('[initializeTTS]: Fallback Platform:', window.navigator.platform)
    sendError({ error })
  }

  console.debug('[initializeTTS]: configure TTS in mode', mode)
  return await new Promise((resolve) => {
    TTSEngine.configure({
      loader: externalServerTTSLoader,
      mode: mode,
      globalErrorHandler: error => {
        console.error(error)
        sendError({ error })
      },
      onError: err => {
        const error = err && err instanceof Error
          ? err
          : new Meteor.Error('tts.failed', 'tts.initFailed', err)
        console.debug('[initializeTTS]: configure failed => ', error.message)
        // TODO communicate error to user in an understandable way
        // TODO fallback to server-rendered TTS
        sendError({ error })
        resolve(TTSEngine)
      },
      onComplete (voices) {
        console.debug('[initializeTTS]: configure complete', voices)
        sendError({ error: new Meteor.Error('tts.loaded', 'tts.loadtest', { voices: voices.length }) })
        resolve(TTSEngine)
      }
    })
  })
}

function externalServerTTSLoader (requestText, callback) {
  // TODO uncomment when ServerTTS is available
  // const url = Meteor.settings.public.tts.url
  // const options = {
  //   params: { text: requestText },
  //   headers: {
  //     Accept: 'application/json, text/plain, */*',
  //     'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
  //   }
  // }
  //
  // HTTP.post(url, options, (err, res) => {
  //   if (err) {
  //     sendError({ error: err })
  //     return callback(err)
  //   }
  //
  //   callback(undefined, res?.data?.url)
  // })
  throw new Error('not implemented')
}
