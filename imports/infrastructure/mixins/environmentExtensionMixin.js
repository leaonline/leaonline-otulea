import { createLog } from '../../utils/createLog'

export const environmentExtensionMixin = function (options) {
  const { env } = options
  if (env === null || env === false) return options

  const envOptions = env || {}
  const { devOnly = true } = envOptions

  const info = createLog({ name: options.name, type: 'info', devOnly: devOnly })

  const runFct = options.run
  options.run = function run (...args) {
    this.info = info
    info('call', { userId: this.userId })
    return runFct.call(this, ...args)
  }

  return options
}
