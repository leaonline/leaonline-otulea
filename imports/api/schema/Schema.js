import { ServiceRegistry } from '../services/ServiceRegistry'
import SimpleSchema from 'meteor/aldeed:simple-schema'
import { isomorph } from '../../utils/archUtils'

const schemaOptions = Object.keys(ServiceRegistry.schemaOptions)
SimpleSchema.extendOptions(schemaOptions)

export const Schema = {}

Schema.provider = SimpleSchema

Schema.create = isomorph({
  onServer: () => (schemaDefinition, options) =>
    new SimpleSchema(schemaDefinition, options),
  onClient: () => {
    const { Tracker } = require('meteor/tracker')

    return (schemaDefinition, options) =>
      new SimpleSchema(
        schemaDefinition,
        Object.assign({ tracker: Tracker }, options),
      )
  },
})
