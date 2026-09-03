import { Meteor } from 'meteor/meteor'

export const checkPermissions = (options) => {
  const { isPublic, backend } = options

  if (isPublic) {
    return options
  }

  const runFct = options.run
  options.run = async function run(...args) {
    const userId = this.userId

    if (!userId) {
      throw new Meteor.Error('errors.permissionDenied', 'errors.userNotExists')
    }

    if (backend) {
      const user = await Meteor.users.findOneAsync(userId)
      if (!user?.services?.lea) {
        throw new Meteor.Error(
          'errors.permissionDenied',
          'errors.backendOnly',
          userId,
        )
      }
    }

    return runFct.call(this, ...args)
  }

  return options
}
