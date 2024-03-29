import { Meteor } from 'meteor/meteor'
import { Email } from 'meteor/email'
import { addDimensionToFeedback } from '../../patches/addDimensionToFeedback'
import { generateAccounts } from '../../patches/generateAccounts'
import { removeDeadAccounts } from '../../patches/removeDeadAccounts'
import { alphaUsers } from '../../patches/alphaUsers'
import { getResponses } from '../../patches/getResponses'

const appName = Meteor.settings.public.app.label
const { notify: defaultNotify, replyTo, from } = Meteor.settings.email

const { patches } = Meteor.settings

console.debug('[patches]: run patches, if active')

if (patches.removeDeadAccounts?.active) {
  console.debug('[patches]: run removeDeadAccounts')
  Meteor.defer(function () {
    const result = removeDeadAccounts(patches.removeDeadAccounts)
    const { notify, dryRun } = patches.removeDeadAccounts

    notifyUsers({
      patchName: removeDeadAccounts.name,
      dryRun: dryRun,
      result: result,
      notify: notify
    })
  })
}

if (patches.addDimensionToFeedback?.active) {
  console.debug('[patches]: run addDimensionToFeedback')
  Meteor.defer(function () {
    addDimensionToFeedback(patches.addDimensionToFeedback)
  })
}

if (patches.generateAccounts?.active) {
  console.debug('[patches]: run generateAccounts')
  Meteor.defer(function () {
    generateAccounts(patches.generateAccounts, function (result) {
      const { notify, dryRun } = patches.generateAccounts
      notifyUsers({
        patchName: generateAccounts.name,
        dryRun: dryRun,
        result: result,
        notify: notify
      })
    })
  })
}

function notifyUsers ({ notify = [], patchName, result, dryRun }) {
  const isDryRun = dryRun ? '(dry-run)' : ''
  const subject = `${appName} [patch][${patchName}]: successful ${isDryRun}`
  const allEmails = new Set(defaultNotify.concat(notify))

  allEmails.forEach(address => {
    Email.send({
      to: address,
      subject: subject,
      replyTo: replyTo,
      from: from,
      text: JSON.stringify(result, null, 2)
    })
  })
}

if (patches.alphaUsers?.active) {
  console.debug('[patches]: run alphaUsers')
  Meteor.defer(function () {
    alphaUsers(patches.alphaUsers)
  })
}

if (patches?.getResponses?.active) {
  console.debug('[patches]: run getResponses')
  Meteor.defer(function () {
    getResponses(patches.getResponses)
  })
}
