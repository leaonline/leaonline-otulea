import { createPublicationFactory } from 'meteor/leaonline:publication-factory'
import { checkPermissions } from '../../api/mixins/checkPermissions'
import { Schema } from '../../api/schema/Schema'
import { environmentExtensionMixin } from '../../api/mixins/environmentExtensionMixin'

export const createPublication = createPublicationFactory({
  schemaFactory: Schema.create,
  mixins: [checkPermissions, environmentExtensionMixin]
})

export const createPublications = publications => publications.forEach(publicationDef => {
  console.info(`[publicationFactory]: create ${publicationDef.name}`)
  createPublication(publicationDef)
})
