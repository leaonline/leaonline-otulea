import { Meteor } from 'meteor/meteor'
import { Accounts } from 'meteor/accounts-base'
import { Random } from 'meteor/random'
import { generateUserCode } from '../api/accounts/generateUserCode'
import { asyncTimeout } from '../utils/asyncTimeout'

const settings = Meteor.settings.public.accounts
const codeLength = settings.code.length
const defaultMaxRetries = settings.code.maxRetries

export const generateAccounts = async ({ amount, dryRun, isDemo = false, comment, debug = () => {} }) => {
  debug('[generateAccounts]: run', { dryRun, amount, isDemo, comment })

  let usersLength = Meteor.users.estimatedDocumentCount()
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

  async function createUser ({ codeLength, usersLength }) {
    const maxRetries = usersLength > defaultMaxRetries
      ? usersLength
      : defaultMaxRetries

    const code = await generateUserCode(codeLength, maxRetries)
    const userId = dryRun
      ? Random.id()
      : await Accounts.createUserAsync({ username: code, password: code })

    debug('[generateAccounts]: created user', { userId, code })
    return { userId, code }
  }

  async function generate () {
    const result = await createUser({ codeLength, usersLength })
    if (result) {
      output.users.push(result)
      usersLength += dryRun ? 0 : 1
      output.created += dryRun ? 0 : 1
      count++
    }

    return decide()
  }

  async function decide () {
    if (count < amount) {
      await asyncTimeout(generate, 250)
      return generate()
    }
    else {
      return complete()
    }
  }

  // on complete we need to update all users with respective flags
  async function complete () {
    debug('[generateAccounts]: update all users')
    const ids = output.users.map(({ userId }) => userId)
    const query = { _id: { $in: ids } }
    const modifier = { $set: { isDemo, comment } }
    const options = { multi: true }
    output.updated = dryRun
      ? 0
      : await Meteor.users.updateAsync(query, modifier, options)
    debug('[generateAccounts]: updated', output.updated)
    return output
  }

  return decide()
}
