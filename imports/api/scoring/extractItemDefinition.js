import { Meteor } from 'meteor/meteor'
import { Unit } from '../../contexts/Unit'

export const extractItemDefinition = ({ unitId, page, contentId }) => {
  const unitDoc = Unit.collection().findOne(unitId)

  // if we have a out of bound situation we dfinitely throw an error
  if (page < 0 || page > unitDoc.pages.length) {
    throw new Meteor.Error('extractItemDefinition.error', 'array.indexOutOfBounds', {
      unitId,
      page
    })
  }

  const { content } = unitDoc.pages[page]

  if (!content || !content.length) {
    throw new Meteor.Error('extractItemDefinition.error', 'extractItemDefinition.noContent', {
      unitId, page
    })
  }

  const entry = content.find(entry => {
    return entry.contentId === contentId
  })

  if (!entry) {
    throw new Meteor.Error('extractItemDefinition.error', 'extractItemDefinition.entryNotFound', {
      unitId, page, contentId
    })
  }

  return entry
}
