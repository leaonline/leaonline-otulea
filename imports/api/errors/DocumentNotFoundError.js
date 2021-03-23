import { Meteor } from 'meteor/meteor'

export class DocumentNotFoundError extends Meteor.Error {
  constructor (name, docId) {
    super(DocumentNotFoundError.errorName, `Found no ${name} document by id ${docId}`, {
      name,
      docId
    })
  }
}

DocumentNotFoundError.errorName = 'errors.documentNotFound'
