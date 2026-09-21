import { Meteor } from 'meteor/meteor'
import { DDP } from 'meteor/ddp-client'
import { createJWTFactory } from 'meteor/leaonline:jwt'

/**
 * Creates an isolated connection to the remote content service. Dependencies
 * are injectable so tests never have to open a live DDP connection.
 *
 * @param options
 * @return {{connect: Function, get: Function, isConnected: Function}}
 */
export const createContentConnection = ({
  settings = Meteor.settings,
  absoluteUrl = Meteor.absoluteUrl,
  ddpConnect = DDP.connect,
  jwtFactory = createJWTFactory,
  setTimer = setTimeout,
  clearTimer = clearTimeout,
  createError = (...args) => new Meteor.Error(...args),
} = {}) => {
  let connection
  const { content } = settings.remotes
  const contentUrl = content.url
  const url = absoluteUrl()
  const getToken = jwtFactory({
    url: url.substring(0, url.length - 1),
    key: content.jwt.key,
    sub: content.jwt.sub,
    expires: content.jwt.expires,
    debug: Meteor.isDevelopment ? console.debug : undefined,
  })

  return {
    connect({ log, timeout = 5000 } = {}) {
      return new Promise((resolve, reject) => {
        if (log) log('establish connection to', contentUrl)
        let settled = false
        let timer

        const onError = (error) => {
          if (settled) return
          settled = true
          clearTimer(timer)
          connection?.disconnect()
          reject(error)
        }

        timer = setTimer(() => {
          onError(
            createError('errors.notConnected', 'remote.timeOut', {
              contentUrl,
              timeout,
            }),
          )
        }, timeout)

        connection = ddpConnect(contentUrl, {
          retry: false,
          onConnected: (error) => {
            if (error) return onError(error)
            if (settled) return

            settled = true
            clearTimer(timer)
            if (log) log('connection established with', contentUrl, !!connection)
            resolve()
          },
        })
      })
    },

    isConnected() {
      if (typeof connection?.status !== 'function') return false
      return connection.status()?.status === 'connected'
    },

    get({ name, ids = [], log }) {
      return new Promise((resolve) => {
        const methodName =
          ids.length > 0 ? `${name}.methods.get` : `${name}.methods.getAll`
        const params = { token: getToken({ name: methodName }) }

        if (ids.length > 0) params.ids = ids
        if (log) log('call', methodName)
        connection.call(methodName, params, (error, result) => {
          if (error) {
            if (log) log(error.message)
            return resolve([])
          }
          return resolve(result)
        })
      })
    },
  }
}

/**
 * Manages the application's connection and calls to the content server.
 * @category api
 * @namespace
 */
let defaultConnection
const getDefaultConnection = () => {
  if (!defaultConnection) defaultConnection = createContentConnection()
  return defaultConnection
}

export const ContentConnection = {
  connect: (...args) => getDefaultConnection().connect(...args),
  isConnected: (...args) => getDefaultConnection().isConnected(...args),
  get: (...args) => getDefaultConnection().get(...args),
}
