import { Meteor } from 'meteor/meteor'
import { Scoring } from '../../contexts/Scoring'
import { extractItemDefinition } from './extractItemDefinition'

export const scoreResponses = function (responseDoc) {
  const { unitId, contentId, page } = responseDoc

  const itemDoc = extractItemDefinition({ unitId, contentId, page })

  if (!itemDoc || !itemDoc.value) {
    throw new Meteor.Error('scoreResponses.error', 'items.expectedItemDefinition', responseDoc)
  }

  return Scoring.run(itemDoc.subtype, itemDoc.value, responseDoc)
}
