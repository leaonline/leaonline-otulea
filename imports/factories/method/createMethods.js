import { createMethodFactory } from 'meteor/leaonline:method-factory'
import { Schema } from '../../api/schema/Schema'
import { checkPermissions } from '../../api/mixins/checkPermissions'
import { environmentExtensionMixin } from '../../api/mixins/environmentExtensionMixin'

export const createMethod = createMethodFactory({
  schemaFactory: Schema.create,
  mixins: [checkPermissions, environmentExtensionMixin]
})

export const createMethods = methods => methods.forEach(methodDef => {
  console.info(`[methodFactory]: create ${methodDef.name}`)
  createMethod(methodDef)
})
