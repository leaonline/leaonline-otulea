import { Meteor } from 'meteor/meteor'

export class DocumentNotFoundError extends Meteor.Error {
  static errorName = 'errors.documentNotFound'

  constructor (name, docId) {
    super(DocumentNotFoundError.errorName, `Found no ${name} document by id ${docId}`, {
      name,
      docId
    })
  }
}
