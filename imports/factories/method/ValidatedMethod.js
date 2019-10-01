/* global Roles */
import { Meteor } from 'meteor/meteor'
import { ValidatedMethod } from 'meteor/mdg:validated-method'
import { PermissionDeniedError } from '../../api/errors/PermissionDenied'

const PermissionsMixin = function (options) {
  const runFct = options.run
  options.run = function run (...args) {
    const exception = options.isPublic || (options.permission && options.permission(...args))
    if (exception) {
      return runFct.call(this, ...args)
    }

    // user level permission
    const { userId } = this
    if (!userId || !Meteor.users.findOne(userId)) {
      throw new PermissionDeniedError(PermissionDeniedError.NO_USER)
    }

    return runFct.call(this, ...args)
  }
  return options
}

const RoleMixin = function (options) {
  if (options.roles) {
    const runFct = options.run
    options.run = function run (...args) {
      const { userId } = this
      const { roles } = options
      const { group } = options

      // CHECK ROLES
      if (!Roles.userIsInRole(userId, roles, group)) {
        throw new PermissionDeniedError(PermissionDeniedError.NOT_IN_ROLES)
      }

      return runFct.call(this, ...args)
    }
  }

  return options
}

const ErrorLogMixin = function (options) {
  // OVERRIDE RUN
  if (options.log) {
    const { log } = options
    const originalRun = options.run
    options.run = function (...args) {
      try {
        return originalRun.call(this, ...args)
      } catch (error) {
        log.call(this, error)
        throw error
      }
    }
  }
  return options
}

class ExtendedValidatedMethod extends ValidatedMethod {
  constructor (methodDefinition) {
    // ADD DEFAULT MIXINS
    if (Array.isArray(methodDefinition.mixins)) {
      methodDefinition.mixins = methodDefinition.mixins.concat(ErrorLogMixin, RoleMixin, PermissionsMixin)
    } else {
      methodDefinition.mixins = [ErrorLogMixin, RoleMixin, PermissionsMixin]
    }

    super(methodDefinition)
  }
}

export { ExtendedValidatedMethod as default }
