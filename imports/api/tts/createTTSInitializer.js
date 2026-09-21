const noop = () => {}

const normalizeError = (error, createError) =>
  error instanceof Error ? error : createError(error)

/**
 * Build the TTS initialization/fallback workflow around an injected engine.
 * The returned function retains the public `initializeTTS(debug)` shape.
 */
export const createTTSInitializer = ({
  loadEngine,
  hash,
  url,
  maxServerRetries = -1,
  createError,
  fatal,
  sendError,
  logError = console.error,
}) =>
  async function initializeTTS(debug = noop) {
    const engine = await loadEngine()
    const serverMode = engine.modes.server
    debug('[initializeTTS]: configure TTS in mode', serverMode)
    let serverFails = 0

    const reportFailure = (error) => {
      fatal({
        error: {
          message: 'tts.failed',
          original: error.message,
        },
      })
      sendError({ error })
    }

    const externalServerTTSLoader = (requestText, callback, loaderDebug = noop) => {
      loaderDebug(`[ServerTTSLoader]: request for text "${requestText}"`)
      return callback(null, `${url}?hash=${hash(requestText)}`)
    }

    let globalErrorHandler
    const browserFallback = ({ onComplete }) => {
      debug('[initializeTTS]: fallback to mode', engine.modes.browser)
      engine.configure({
        debug,
        loader: externalServerTTSLoader,
        mode: engine.modes.browser,
        globalErrorHandler,
        onError: (value) => {
          const error = normalizeError(value, createError)
          logError('[initializeTTS]: configure failed => ', error.message)
          reportFailure(error)
        },
        onComplete() {
          debug('[initializeTTS]: fallback complete')
          onComplete()
        },
      })
    }

    const errorHandlers = {
      [engine.modes.server]: (error) => {
        serverFails += 1
        debug(`[ServerTTSLoader]: failed ${serverFails} times`, error)
        browserFallback({
          onComplete() {
            engine.replay()
            if (maxServerRetries < 0 || serverFails <= maxServerRetries) {
              debug(
                `reset to ${engine.modes.server} (${serverFails}/${maxServerRetries})`,
              )
              engine.mode = engine.modes.server
            }
          },
        })
      },
      [engine.modes.browser]: (error) => {
        logError(error)
        reportFailure(error)
      },
    }

    globalErrorHandler = (error) => {
      const handler = errorHandlers[engine.mode]
      if (handler) return handler(error)
      debug('[initializeTTS]: globalErrorHandler fallback', error)
    }

    return new Promise((resolve) => {
      engine.configure({
        debug,
        loader: externalServerTTSLoader,
        mode: serverMode,
        globalErrorHandler,
        onError: (value) => {
          const error = normalizeError(value, createError)
          logError('[initializeTTS]: configure failed => ', error.message)
          reportFailure(error)
          resolve(engine)
        },
        onComplete() {
          debug('[initializeTTS]: configure complete')
          engine.defaults({ rate: 0.8 })
          resolve(engine)
        },
      })
    })
  }
