import { EJSON } from 'meteor/ejson'

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
    this.storage.setItem(key, value)
  }

  load (responseData) {
    const key = getKey(responseData)
    const value = this.storage.getItem(key)
    return value && EJSON.parse(value)
  }

  clear (responseData) {
    const key = getKey(responseData)
    return this.storage.removeItem(key)
  }
}

function getKey ({ sessionId, unitId, page, contentId }) {
  return `${sessionId}-${unitId}-${page}-${contentId}`
}
