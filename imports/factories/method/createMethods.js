import { ValidatedMethod } from 'meteor/mdg:validated-method'
import { getCreateMethods } from 'meteor/leaonline:factories'
import { Schema } from '../../api/schema/Schema'

export const createMethods = getCreateMethods(ValidatedMethod, Schema.create)
