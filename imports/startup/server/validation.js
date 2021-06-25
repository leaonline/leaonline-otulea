import { Schema } from '../../api/schema/Schema'
import { SchemaValidator } from 'meteor/leaonline:corelib/validation/SchemaValidator'

SchemaValidator.set(function (schema) {
  const instance = Schema.create(schema)
  return doc => instance.validate(doc)
})
