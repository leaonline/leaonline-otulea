/* global Roles */
import { Meteor } from 'meteor/meteor'

export const ValidatedPublication = ({ name, validate, run, roles, group, isPublic }) => {
  const publication = function (...args) {
    const self = this
    const { userId } = self

    // first validate permissions
    if (!isPublic && !Roles.userIsInRole(userId, roles, group)) {
      // throw new Meteor.Error('errors.permissionDenied')
      return self.ready()
    }

    // then validate input
    validate.call(self, ...args)

    const cursor = run.call(self, ...args)

    if (cursor) {
      return cursor
    } else {
      return self.ready()
    }
  }
  publication.name = name
  Meteor.publish(name, publication)
  return publication
}
