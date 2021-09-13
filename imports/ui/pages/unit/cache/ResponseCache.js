/* global btoa atob */
import { EJSON } from 'meteor/ejson'
import { simpleHash } from '../../../../utils/simpleHash'

/**
 * Keeps responses in a storage (Storage API).
 */
export class ResponseCache {
  static create (storage) {
    return new ResponseCache(storage)
  }

  constructor (storage) {
    this.storage = storage
  }

  save (responseData) {
    const key = getKey(responseData)
    const value = EJSON.stringify(responseData)
    const b64Value = btoa(value)
    this.storage.setItem(key, b64Value)
  }

  load (responseData) {
    const key = getKey(responseData)
    const value = this.storage.getItem(key)
    return value && EJSON.parse(atob(value))
  }

  clear (responseData) {
    const key = getKey(responseData)
    // no need to clear items that do not exist
    if (!this.storage.getItem(key)) {
      return true
    }

    this.storage.removeItem(key)
    return !this.storage.getItem(key)
  }

  flush () {
    const self = this
    const items = { ...self.storage }
    Object.entries(items).forEach(([key, value]) => {
      if (key.includes('rc-')) {
        console.warn('[ResponseCache]: delete zombie entry', key, value)
        self.storage.removeItem(key)
      }
    })
  }
}

function getKey ({ sessionId, unitId, page, contentId }) {
  const hash = simpleHash(`${sessionId}-${unitId}-${page}-${contentId}`)
  return `rc-${hash}`
}
