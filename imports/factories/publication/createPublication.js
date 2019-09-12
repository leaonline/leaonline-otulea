import { isObject, maybe } from '../../utils/matchUtils'
import { Schema } from '../../api/schema/Schema'
import { check } from 'meteor/check'
import ValidatedPublication from './ValidatedPublication'

const createPublication = ({ name, schema, projection, run, roles, group, isPublic }) => {
  check(name, String)
  check(schema, isObject)
  check(run, Function)
  check(isPublic, maybe(Boolean))
  check(roles, isPublic ? maybe([String]) : [String])
  check(group, isPublic ? maybe(String) : String)

  const validationSchema = Schema.create(schema)
  const validate = function validate (...args) {
    validationSchema.validate(...args)
  }

  return ValidatedPublication({ name, validate, run, roles, group, isPublic })
}

export const createPublications = methods => {
  check(methods, [isObject])
  return methods.map(createPublication())
}
