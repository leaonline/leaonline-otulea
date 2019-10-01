import { check, Match } from 'meteor/check'
import ValidatedMethod from './ValidatedMethod'
import { isObject, maybe } from '../../utils/matchUtils'
import { Schema } from '../../api/schema/Schema'

const createMethod = ({ name, schema, run, roles, group, isPublic }) => {
  check(name, String)
  check(schema, isObject)
  check(run, Function)
  check(isPublic, maybe(Boolean))
  check(roles, isPublic ? maybe([String]) : [String])
  check(group, isPublic ? maybe(String) : String)

  const validationSchema = Schema.create(schema)
  const validate = function validate (document = {}) {
    validationSchema.validate(document)
  }

  return new ValidatedMethod({ name, validate, run, roles, group, isPublic })
}

export const createMethods = methods => {
  check(methods, [isObject])
  return methods.map(method => {
    createMethod(method)
    console.dev('Method created: ', method.name)
  })
}
