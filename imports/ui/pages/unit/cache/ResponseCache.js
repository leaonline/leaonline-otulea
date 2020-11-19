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
    const value = JSON.stringify(responseData)
    this.storage.setItem(key, value)
  }

  load (responseData) {
    const key = getKey(responseData)
    const value = this.storage.getItem(key)
    return value && JSON.parse(value)
  }

  clear (responseData) {
    const key = getKey(responseData)
    return this.storage.removeItem(key)
  }
}

function getKey ({ sessionId, unitId, page, contentId }) {
  return `${sessionId}-${unitId}-${page}-${contentId}`
}
