import { Meteor } from 'meteor/meteor'
import { sendError } from '../../contexts/errors/api/sendError'
import { fatal } from '../../ui/components/fatal/fatal'
import { noop } from '../../utils/noop'

export const initializeTTS = async (debug = noop) => {
  const { TTSEngine } = await import('../../api/tts/TTSEngine')
  const mode = TTSEngine.modes.server
  debug('[initializeTTS]: configure TTS in mode', mode)

  return new Promise((resolve) => {
    TTSEngine.configure({
      debug,
      loader: externalServerTTSLoader,
      mode: mode,
      globalErrorHandler: error => {
        console.error(error)
        // fall back to browser if we used server mode
        if (TTSEngine.mode === TTSEngine.modes.server) {
          return browserFallback({
            TTSEngine,
            debug,
            onComplete () {
              TTSEngine.replay()
            },
            onError: err => {
              fatal({
                error: {
                  message: 'tts.failed',
                  original: err.message
                }
              })
            }
          })
        }
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
        debug('[initializeTTS]: configure complete')
        TTSEngine.defaults({ rate: 0.8 })
        resolve(TTSEngine)
      }
    })
  })
}

const browserFallback = ({ TTSEngine, debug, onComplete }) => {
  debug('[initializeTTS]: fallback to mode', TTSEngine.modes.browser)
  TTSEngine.configure({
    debug,
    loader: externalServerTTSLoader,
    mode: TTSEngine.modes.browser,
    globalErrorHandler: error => {
      console.error(error)
      // fall back to browser if we used server mode
      if (TTSEngine.mode === TTSEngine.modes.browser) {
        fatal({
          error: {
            message: 'tts.failed',
            original: error.message
          }
        })
      }
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
    },
    onComplete () {
      debug('[initializeTTS]: fallback complete')
      onComplete()
    }
  })
}

function externalServerTTSLoader (requestText, callback, debug = noop) {
  debug(`[ServerTTSLoader]: request for text ${requestText}`)
  const url = 'http://localhost:3030/speech' // Meteor.settings.public.tts.url
  const hash = '85bde9708cfe0c44b3ccf1950f0618341704948583d213d5ef27eaad37474d7d' // SHA256(requestText)
  const options = {
    params: { hash },
    headers: {
      Accept: '*/*',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    }
  }
  debug(`[ServerTTSLoader]: request from ${url} with ${JSON.stringify(options)}`)
  HTTP.get(url, options, (err, res) => {
    if (err) {
      sendError({ error: err })
      return callback(err)
    }

    callback(undefined, res?.data)
  })
}
