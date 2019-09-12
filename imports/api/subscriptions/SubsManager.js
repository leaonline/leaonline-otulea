import { Meteor } from 'meteor/meteor'
import { check, Match } from 'meteor/check'
import { SubsCache } from 'meteor/ccorcos:subs-cache'

// ////////////////////////////////////////////////////////////////////////////
//
// INTERNAL
//
// ////////////////////////////////////////////////////////////////////////////

let _connection = Meteor.Connection
const _subs = {}
let _subsCache = null
let _subsCacheTimeout = -1 // never timeout
let _subsCacheMaxPubs = -1 // no limit
const _debug = false

function getCache () {
  if (!_subsCache) {
    _subsCache = new SubsCache(_subsCacheTimeout, _subsCacheMaxPubs, false)
  }
  return _subsCache
}

function createHandle (publicationName, opts, callbacks) {
  const options = opts || {}
  const _callbacks = callbacks || {
    onStop (e) {
      if (_debug && e) console.error(e)
    }
  }

  const handle = getCache().subscribe(publicationName, options, _callbacks)
  _subs[publicationName] = { handle, options }
  return handle
}

// ////////////////////////////////////////////////////////////////////////////
//
// PUBLIC
//
// ////////////////////////////////////////////////////////////////////////////

export const SubsManager = {

  connection: {
    /**
     * Sets the current connection. Default is Meteor.connection.
     * Stops all subs, if any already running.
     * You may use this method before subscribing to remote publications.
     * @param connection A DDP remote connection or Meteor.Connection
     */
    set (connection) {
      check(connection, Match.Where(c => !!c && !!c.subscribe))
      SubsManager.each((name) => SubsManager.unsubscribe(name))
      _connection = connection
    },
    /**
     * Returns the current internally used connection.
     * Returns either a Meter.Connection or DDP connection.
     */
    get () {
      return _connection
    }
  },

  /**
   * Return the current snapshot of all subscriptions
   */
  all () {
    return Object.assign({}, _subs)
  },

  cache: {
    setTimeout (value) {
      check(value, Number)
      _subsCacheTimeout = value
    },
    setLimit (value) {
      check(value, Number)
      _subsCacheMaxPubs = value
    },
    get: getCache
  },

  // ////////////////////////////////////////////////////////////////
  //
  // SUBSCRIPTION MANAGEMENT
  //
  // ////////////////////////////////////////////////////////////////

  subscribe (publicationName, options = {}) {
    if (!Meteor.isClient) throw new Meteor.Error(this.errors.EXECUTION_CLIENT_ONLY)
    if (!Meteor.userId()) return { ready () { return false } }

    if (this.has(publicationName)) {
      const existingSub = this.handle(publicationName)
      if (JSON.stringify(existingSub.options) === JSON.stringify(options)) {
        return existingSub.handle
      }
    }

    return createHandle(publicationName, options)
  },

  unsubscribe (publicationName) {
    if (!this.has(publicationName)) {
      return false
    }

    const { handle } = this.handle(publicationName)
    handle.stopNow()
    delete _subs[publicationName]
    return !this.has(publicationName)
  },

  each (fct) {
    Object.keys(_subs).forEach(publicationName => {
      const handle = this.handle(publicationName)
      fct.call(this, publicationName, handle)
    })
  },

  dispose () {
    Object.keys(_subs).forEach(key => {
      const handle = _subs[key].handle
      handle.stopNow()
      delete _subs[key]
    })
    SubsCache.clearAll()
    _subsCache = null
  },

  has (publicationName) {
    return !!(_subs[publicationName])
  },

  handle (publicationName) {
    return _subs[publicationName]
  }
}
