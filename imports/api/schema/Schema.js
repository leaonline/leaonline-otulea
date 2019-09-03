import { Tracker } from 'meteor/tracker'
import SimpleSchema from 'simpl-schema'

export const Schema = {}

Schema.create = function (schemaDefinition, options) {
  return new SimpleSchema(schemaDefinition, Object.assign({}, options, { tracker: Tracker }))
}
