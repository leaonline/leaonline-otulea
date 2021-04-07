import { createMethodFactory } from 'meteor/leaonline:method-factory'
import { Schema } from '../../../api/schema/Schema'
import { checkPermissions } from '../../mixins/checkPermissions'
import { environmentExtensionMixin } from '../../mixins/environmentExtensionMixin'
import { errorMixin } from '../../mixins/errorMixin'

export const createMethod = createMethodFactory({
  schemaFactory: Schema.create,
  mixins: [errorMixin, checkPermissions, environmentExtensionMixin]
})

export const createMethods = methods => methods.forEach(methodDef => {
  console.info(`[methodFactory]: create ${methodDef.name}`)
  createMethod(methodDef)
})
