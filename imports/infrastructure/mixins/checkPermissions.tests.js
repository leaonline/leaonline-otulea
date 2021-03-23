/* eslint-env mocha */
import { Random } from 'meteor/random'
import { expect } from 'chai'
import { checkPermissions } from './checkPermissions'

describe(checkPermissions.name, function () {
  it('skips if isPublic flag is set', function () {
    const value = Random.id()
    const options = {
      isPublic: true,
      run: () => value
    }

    const updatedOptions = checkPermissions(options)
    expect(updatedOptions.run()).to.equal(value)
  })
  it('falls back using Meteor.user in case')
  it('throws if there is no logged in user')
  it('throws if the method is backend-flagged but the user is no backend-user')
  it('runs the function if there is a user')
})
