import { Meteor } from 'meteor/meteor'
import { normalizeError } from '../../errors/api/normalizeError'

const getInspect = (results) => async (name, fn) => {
  const collector = (data) => {
    if (data.error) {
      data.error = normalizeError({
        error: data.error,
        template: 'diagnostics'
      })
    }
    const label = `diagnostics.${name}`
    results.push({ label, ...data, name })
  }

  try {
    await fn(collector)
  }
  catch (error) {
    collector({ error })
  }
}

export const runDiagnostics = async function runDiagnostics () {
  const results = []
  const inspect = getInspect(results)
  await inspect('performance', initPerformance)
  await inspect('osinfo', checkOSInfo)
  await inspect('font', checkFont)
  await inspect('localStorage', checkLocalStoage)
  await inspect('serviceworker', checkServiceWorker)
  await inspect('tts', checkTTS)
  await inspect('language', checkLanguage)
  await inspect('screen', checkScreen)
  await inspect('graphics', checkGraphics)
  // canvas
  // lazy loading images
  // svg images
  await inspect('performance', measurePerformance)
  return results
}

const initPerformance = () => window.performance.mark('diagnosticsStart')

async function checkServiceWorker (collector) {
  if (!navigator.serviceWorker) {
    return collector({ status: 'notDefined' })
  }

  const url = Meteor.absoluteUrl()
  const registrations = await navigator.serviceWorker.getRegistrations()
  const found = registrations.find(worker => {
    if (!worker?.scope) return false

    return worker.scope.includes(url)
  })

  if (!found) {
    return collector({ status: 'notFound' })
  }

  return collector({
    status: 'found',
    success: true,
    active: !!found.active,
    installing: !!found.installing,
    waiting: !!found.waiting
  })
}

async function checkOSInfo (collector) {
  const { getOSInfo } = await import('../../../ui/utils/getOSInfo')
  const UAParser = (await import('ua-parser-js')).default
  const parser = new UAParser()
  const parsed = parser.getResult()

  let result
  try {
    result = await getOSInfo()
  }
  catch (e) {
    parsed.error = e
  }

  if (result?.detected) {
    parsed.device.isMobile = result.detected.isMobile
    parsed.device.ram = result.detected.ram
    parsed.os.codename = result.detected.name
    parsed.os.release = result.detected.version
    parsed.success = true
  }

  return collector(parsed)
}

async function checkTTS (collector) {
  const { initializeTTS } = await import('../../../api/tts/initializeTTS')

  const result = {}
  let engine

  try {
    engine = await initializeTTS()
  }
  catch (initError) {
    console.error('init error', initError.message)
    result.error = initError
    result.status = 'failed'
    return collector(result)
  }

  if (!engine?.isConfigured()) {
    result.status = 'failed'
    result.error = new Error('TTS engine config failed')
    return collector(result)
  }

  return new Promise((resolve) => {
    engine.play({
      text: ' ',
      volume: 0.1,
      onEnd: () => {
        result.status = 'successful'
        result.success = true
        resolve(collector(result))
      },
      onError: event => {
        console.error('play error', event.error.message)
        if (event.error) {
          result.error = event.error
        }
        result.status = 'failed'
        resolve(collector(result))
      }
    })
  })
}

async function checkLanguage (collector) {
  const { initLanguage } = await import('../../../api/i18n/initLanguage')
  const translation = await import('./diagnosts_de')
  const i18n = await initLanguage()
  i18n.set('de', translation)
  collector({ success: !i18n.get('diagnostics.title').includes('.') })
}

async function checkScreen (collector) {
  const screen = window.screen || {}
  collector({
    availWidth: screen.availWidth,
    availHeight: screen.availHeight,
    width: screen.width,
    height: screen.height,
    colorDepth: screen.colorDepth,
    pixelDepth: screen.pixelDepth,
    orientation: screen.orientation?.type,
    success: true
  })
}

async function checkGraphics (collector) {
  const gl = document.createElement('canvas').getContext('webgl')
  if (!gl) {
    return collector({ gl: 'no webgl' })
  }

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
  if (debugInfo) {
    return collector({
      gl: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
      glVendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
      glRenderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
      success: true
    })
  }

  return collector({ gl: 'no WEBGL_debug_renderer_info' })
}

async function checkFont (collector) {
  /**
   * Checks if a font is available to be used on a web page.
   * @license MIT
   * @copyright Sam Clarke 2013
   * @author Sam Clarke <sam@samclarke.com>
   */
  const isFontAailable = (function (document) {
    let width
    const body = document.body

    const container = document.createElement('span')
    container.innerHTML = Array(100).join('wi')
    container.style.cssText = [
      'position:absolute',
      'width:auto',
      'font-size:128px',
      'left:-99999px'
    ].join(' !important;')

    const getWidth = function (fontFamily) {
      container.style.fontFamily = fontFamily

      body.appendChild(container)
      width = container.clientWidth
      body.removeChild(container)

      return width
    }

    // Pre compute the widths of monospace, serif & sans-serif
    // to improve performance.
    const monoWidth = getWidth('monospace')
    const serifWidth = getWidth('serif')
    const sansWidth = getWidth('sans-serif')

    return function (font) {
      return monoWidth !== getWidth(font + ',monospace') ||
        sansWidth !== getWidth(font + ',sans-serif') ||
        serifWidth !== getWidth(font + ',serif')
    }
  })(window.document)

  return collector({ success: isFontAailable('Semikolon') })
}

async function checkLocalStoage (collector) {
  const key = Math.random().toString(10)
  const value = Math.random().toString(10)
  window.localStorage.setItem(key, value)
  const value2 = window.localStorage.getItem(key)
  if (value !== value2) throw new Error('values do not match for key')
  window.localStorage.removeItem(key)
  return collector({ success: true })
}

const measurePerformance = collector => {
  window.performance.mark('diagnosticsEnd')
  window.performance.measure('diagnosticsComplete', 'diagnosticsStart', 'diagnosticsEnd')
  const result = window.performance.getEntriesByName('diagnosticsComplete')[0]

  collector({
    success: true,
    duration: result.duration,
    startTime: result.startTime
  })
}
