import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'

const forbidden = /[0oq17ij5s]+/gi

export const generateUserCode = (length = 5, maxRetries = 10) => {
  let count = 0

  while (count++ < maxRetries) {
    const code = Random.id(length).toUpperCase()
    if (!forbidden.test(code) && !Meteor.users.find({ code }).count()) {
      return code
    }
  }
}
