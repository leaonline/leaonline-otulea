import { Meteor } from 'meteor/meteor'
import { check } from 'meteor/check'
import { checkDocument } from '../../infrastructure/mixins/checkDocument'
import { getProperty } from '../../utils/object/getProperty'

class DocumentList {
  constructor ({ context, fieldName } = {}) {
    check({ contextName: context?.name, fieldName }, {
      contextName: String,
      fieldName: String
    })
    this.context = context
    this.fieldName = fieldName
    return this
  }

  setDocument (document) {
    const { context, fieldName } = this
    checkDocument(document, context)

    this.documentId = document._id
    this.list = getProperty(document, fieldName)

    if (!this.list?.length) {
      throw new Meteor.Error('DocumentList.error', 'DocumentList.noList', {
        context: context.name,
        document: document._id,
        field: fieldName
      })
    }

    return this
  }

  setCurrent (currentId) {
    this.currentId = currentId
    this.index = this.list.indexOf(currentId)

    // make sure the current doc is even located in this set
    if (this.index === -1 || this.index > this.list.length - 1) {
      throw new Meteor.Error('DocumentList.error', 'DocumentList.idNotInSet', {
        current: this.currentId,
        context: this.context.name,
        document: this.documentId,
      })
    }

    return this
  }

  isFirst () {
    return this.index === 0
  }

  isLast () {
    const { index, list } = this
    return index === list.length - 1
  }

  getNext () {
    const { index, list } = this

    // if this is already the last doc, return null to indicate this state
    if (index === list.length - 1) {
      return null
    }

    // otherwise return the incremented index-based doc
    return list[index + 1]
  }
}

export { DocumentList }
