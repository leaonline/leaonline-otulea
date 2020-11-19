import { Meteor } from 'meteor/meteor'

export class DocumentNotFoundError extends Meteor.Error {
  constructor (name, docId) {
    super('Document not found', `Found no ${name} document by id ${docId}`, {
      name,
      docId
    })
  }
}
