class DocNotFoundError extends Meteor.Error {
  constructor (name, details) {
    super(`${name}.error`, 'errors.docNotFound', details)
  }
}

export { DocNotFoundError }
