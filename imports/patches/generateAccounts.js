import { Meteor } from 'meteor/meteor'
import { Accounts } from 'meteor/accounts-base'
import { Random } from 'meteor/random'
import { generateUserCode } from '../api/accounts/generateUserCode'

const settings = Meteor.settings.public.accounts
const codeLength = settings.code.length
const defaultMaxRetries = settings.code.maxRetries

export const generateAccounts = ({ amount, dryRun, isDemo = false, comment, debug = () => {} }, callback) => {
  debug('[generateAccounts]: run', { dryRun, amount, isDemo, comment })

  let usersLength = Meteor.users.find().count()
  let count = 0

  const output = {
    amount: amount,
    created: 0,
    isDemo: isDemo,
    comment: comment,
    dryRun: dryRun,
    users: [],
    updated: 0
  }

  function createUser ({ codeLength, usersLength }) {
    const maxRetries = usersLength > defaultMaxRetries
      ? usersLength
      : defaultMaxRetries

    const code = generateUserCode(codeLength, maxRetries)
    const userId = dryRun
      ? Random.id()
      : Accounts.createUser({ username: code, password: code })

    debug('[generateAccounts]: created user', { userId, code })
    return { userId, code }
  }

  function generate () {
    const result = createUser({ codeLength, usersLength })
    if (result) {
      output.users.push(result)
      usersLength += dryRun ? 0 : 1
      output.created += dryRun ? 0 : 1
      count++
    }

    decide()
  }

  function decide () {
    if (count < amount) {
      return Meteor.setTimeout(generate, 250)
    }
    else {
      return complete()
    }
  }

  // on complete we need to update all users with respective flags
  function complete () {
    debug('[generateAccounts]: update all users')
    const ids = output.users.map(({ userId }) => userId)
    const query = { _id: { $in: ids } }
    const modifier = { $set: { isDemo, comment } }
    const options = { multi: true }
    output.updated = dryRun
      ? 0
      : Meteor.users.update(query, modifier, options)
    debug('[generateAccounts]: updated', output.updated)

    callback(output)
  }

  decide()
}
