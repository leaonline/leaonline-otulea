import { Meteor } from 'meteor/meteor'
import { removeDeadAccounts } from '../../api/accounts/removeDeadAccounts'
import { createLog } from '../../utils/createLog'

const { removeOlderThanDays, removeIncompleteSessions } = Meteor.settings.accounts

Meteor.startup(function() {
  const log = createLog({ name: 'removeDeadAccounts', type: 'log' })
  log('run', { removeOlderThanDays, removeIncompleteSessions })
  const removed = removeDeadAccounts({
    days: removeOlderThanDays,
    removeIncompleteSessions: removeIncompleteSessions
  })
  log('removed', removed)
})
