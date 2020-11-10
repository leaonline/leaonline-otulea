import { ServiceRegistry } from '../config/BackendConfig'
import SimpleSchema from 'simpl-schema'
import { isomorph } from '../../utils/archUtils'

const schemaOptions = Object.keys(ServiceRegistry.schemaOptions)
SimpleSchema.extendOptions(schemaOptions)

export const Schema = {}

Schema.create = isomorph({
  onServer: function () {
    return function (schemaDefinition, options) {
      return new SimpleSchema(schemaDefinition, options)
    }
  },
  onClient: function () {
    import { Tracker } from 'meteor/tracker'
    return function (schemaDefinition, options) {
      return new SimpleSchema(schemaDefinition, Object.assign({ tracker: Tracker }, options))
    }
  },
})
