import { Meteor } from 'meteor/meteor'
import { check, Match } from 'meteor/check'

/**
 *
 * @param input.unitDoc {Object} the unit doc
 * @param input.page {Number} the current page
 * @param input.contentId {String} _id of the current input/item
 * @return {*}
 */
export const extractItemDefinition = (input, debug = () => {}) => {
  check(input, Match.ObjectIncluding({
    unitDoc: Object,
    page: Number,
    contentId: String
  }))

  const { unitDoc, page, contentId } = input
  const unitId = unitDoc._id

  // if we have a out of bound situation we dfinitely throw an error
  if (!unitDoc.pages?.length || page < 0 || page > unitDoc.pages.length) {
    debug('[extractItemDefinition]: no pages on unitDoc')
    debug(unitDoc)
    throw new Meteor.Error(toErr('error'), toErr('arrayIndexOutOfBounds'), {
      unitId,
      page
    })
  }

  const { content } = unitDoc.pages[page]

  if (!content?.length) {
    debug('[extractItemDefinition]: no content found for page', page)
    debug(unitDoc)

    const { shortCode } = unitDoc
    throw new Meteor.Error(toErr('error'), toErr('noContent'), {
      unitId,
      shortCode,
      page
    })
  }

  const entry = content.find(obj => obj.contentId === contentId)

  if (!entry) {
    debug('[extractItemDefinition]: entry not found by contentId', contentId)
    debug(content)
    const { shortCode } = unitDoc
    throw new Meteor.Error(toErr('error'), toErr('entryNotFound'), {
      unitId, page, contentId, shortCode
    })
  }

  return entry
}

const toErr = name => `${extractItemDefinition.name}.${name}`
