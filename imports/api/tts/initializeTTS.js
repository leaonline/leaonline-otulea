import { Meteor } from 'meteor/meteor'
import { sendError } from '../../contexts/errors/api/sendError'
import { fatal } from '../../ui/components/fatal/fatal'

export const initializeTTS = async () => {
  const { TTSEngine } = await import('../../api/tts/TTSEngine')
  const mode = TTSEngine.modes.browser

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
        console.error('[initializeTTS]: configure failed => ', error.message)
        // TODO communicate error to user in an understandable way
        // TODO fallback to server-rendered TTS
        fatal({
          error: {
            message: 'tts.failed',
            original: error.message
          }
        })

        sendError({ error })
        resolve(TTSEngine)
      },
      onComplete () {
        console.debug('[initializeTTS]: configure complete')
        TTSEngine.defaults({ rate: 0.8 })
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
