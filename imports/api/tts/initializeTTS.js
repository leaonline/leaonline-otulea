import { Meteor } from 'meteor/meteor'
import { HTTP } from 'meteor/jkuester:http'
import { sendError } from '../../contexts/errors/api/sendError'
import { getOSInfo } from '../../ui/utils/getOSInfo'

export const initializeTTS = async () => {
  const { TTSEngine } = await import('../../api/tts/TTSEngine')

  let failed
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
        mode = TTSEngine.modes.server
    }
  }
  catch (error) {
    failed = true
    mode = TTSEngine.modes.server
    console.error('[initializeTTS]: Failed to detect os, use fallback. (Error send)')
    console.error('[initializeTTS]: Fallback User Agent:', window.navigator.userAgent)
    console.error('[initializeTTS]: Fallback Platform:', window.navigator.platform)
    sendError({ error })
    throw error
  }

  console.debug('[initializeTTS]: configure TTS')
  return new Promise((resolve, reject) => {
    TTSEngine.configure({
      loader: externalServerTTSLoader,
      mode: mode,
      onError: error => {
        failed = true
        reject(error)
      },
      onComplete () {
        resolve(TTSEngine)
      }
    })
  })
}

function externalServerTTSLoader (requestText, callback) {
  const url = Meteor.settings.public.tts.url
  const options = {
    params: { text: requestText },
    headers: {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    }
  }

  HTTP.post(url, options, (err, res) => {
    if (err) {
      sendError({ error: err })
      return callback(err)
    }

    callback(undefined, res?.data?.url)
  })
}
