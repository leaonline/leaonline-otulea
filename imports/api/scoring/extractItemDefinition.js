import { Meteor } from 'meteor/meteor'
import { check, Match } from 'meteor/check'

/**
 *
 * @param input.unitDoc {Object} the unit doc
 * @param input.page {Number} the current page
 * @param input.contentId {String} _id of the current input/item
 * @return {*}
 */
export const extractItemDefinition = (input) => {
  check(input, Match.ObjectIncluding({
    unitDoc: Object,
    page: Number,
    contentId: String
  }))

  const { unitDoc, page, contentId } = input
  const unitId = unitDoc._id

  // if we have a out of bound situation we dfinitely throw an error
  if (page < 0 || page > unitDoc.pages.length) {
    throw new Meteor.Error(toErr('error'), toErr('arrayIndexOutOfBounds'), {
      unitId,
      page
    })
  }

  const { content } = unitDoc.pages[page]

  if (!content || !content.length) {
    throw new Meteor.Error(toErr('error'), toErr('noContent'), { unitId, page })
  }

  const entry = content.find(entry => {
    return entry.contentId === contentId
  })

  if (!entry) {
    throw new Meteor.Error(toErr('error'), toErr('entryNotFound'), {
      unitId, page, contentId
    })
  }

  return entry
}

const toErr = name => `${extractItemDefinition.name}.${name}`
