import { Meteor } from 'meteor/meteor'
import { Scoring } from '../../contexts/Scoring'

/**
 * Scores response(s) for a given response document.
 * Delegates the scoring to the respective implementation.
 * @return {function({ itemDoc, responseDoc }): *}
 */
export const scoreResponses = function ({ itemDoc, responseDoc } = {}) {
  // XXX: compat with subType and subtype
  if (!itemDoc || !itemDoc.value || !(itemDoc.subtype || itemDoc.subType)) {
    throw new Meteor.Error('scoreResponses.error', 'items.expectedItemDefinition', responseDoc)
  }

  return Scoring.run(itemDoc.subtype || itemDoc.subType, itemDoc.value, responseDoc)
}
