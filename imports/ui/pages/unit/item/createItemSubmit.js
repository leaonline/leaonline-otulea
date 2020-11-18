import { callMethod } from '../../../../infrastructure/methods/callMethod'
import { Response } from '../../../../contexts/Response'

/**
 * Returns a submit function that restores values from cache and sends them
 * to the server.
 * @param cache
 * @return {function({sessionId?: *, unitDoc: *, page?: *}): *}
 */
export const createItemSubmit = ({ cache }) => {

  /**
   *
   * @param sessionId {String} The current {Session} id
   * @param unitDoc {Unit} The current {Unit} document
   * @param page {Number} the current page of this unit
   * @return {Promise} A promise that resolves, once all items been submitted
   */
  return ({ sessionId, unitDoc, page }) => {
    const unitId = unitDoc._id
    const allResponseDocs = []
    unitDoc.pages[page].content.forEach(entry => {
      // we iterate the full page stgructure
      // so we skip on any content
      // that is not flagged as item tyoe
      if (entry.type !== 'item') return

      const { contentId } = entry
      const responseDoc = { sessionId, unitId, page, contentId }
      const responseValue = cache.load(responseDoc)
      responseDoc.responses = (responseValue?.responses) || []
      allResponseDocs.push(responseDoc)
    })

    return Promise.all(allResponseDocs.map(responseDoc => {
      callMethod({
        name: Response.methods.submit.name,
        args: responseDoc,
        failure: console.error,
        success: () => cache.clear(responseDoc)
      })
    }))

  }
}