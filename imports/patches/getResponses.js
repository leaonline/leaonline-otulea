import { Meteor } from 'meteor/meteor'
import { Response } from '../contexts/response/Response'
import { Unit } from '../contexts/Unit'
import fs from 'fs'

const fields = {
  responseId: 1,
  userId: 1,
  code: 1,
  tag: 1,
  sessionId: 1,
  unitCode: 1,
  page: 1,
  contentId: 1,
  itemId: 1,
  score: 1,
  responses: 1
}

export const getResponses = ({ dryRun }) => {
  const rows = [
    Object.keys(fields).join(';')
  ]

  Response.collection().find().forEach(responseDoc => {
    const userDoc = Meteor.users.findOne(responseDoc.userId)
    const unitDoc = Unit.collection().findOne(responseDoc.unitId)

    if (!userDoc || userDoc.isDemoUser || userDoc.isDemo || userDoc.debug) {
      return console.debug('skip invalid user ', responseDoc.userId)
    }

    if (!unitDoc) {
      return console.debug('skip missing unit ', responseDoc.unitId)
    }

    const row = toRow({ responseDoc, userDoc, unitDoc })
    rows.push(row)
  })

  const csvContent = rows.join('\n')

  if (!dryRun) {
    const timestamp = new Date().toUTCString().replace(/\s+/, '')
    const filePath = `${process.cwd()}/competencies-${timestamp}.csv`
    console.debug(filePath, 'will be saved')

    fs.writeFile(filePath, csvContent, (err) => {
      if (err) {
        console.log(filePath, err)
      }
      else {
        console.log(filePath, 'saved')
      }
    })
  }
}

const toRow = ({ responseDoc, userDoc, unitDoc }) => {
  const userId = userDoc._id
  const code = userDoc.username
  const tag = userDoc.comment || ''
  const { sessionId, responses, page, contentId, scores } = responseDoc
  const unitCode = unitDoc.shortCode
  const itemId = getItemId({ contentId, page, unitDoc })

  let score = 0
  scores.forEach((entry) => {
    const value = entry.score === 'true' ? 1 : 0
    score = (score + value) / scores.length
  })

  return [
    responseDoc._id,
    userId,
    code,
    tag,
    sessionId,
    unitCode,
    page,
    contentId,
    itemId,
    score,
    `"${responses.join(',')}"`
  ].join(';')
}

const getItemId = ({ contentId, page, unitDoc }) => {
  const contentPage = unitDoc.pages[page]

  if (!contentPage) return '?'

  let itemIndex = -1
  contentPage.content.some(entry => {
    if (entry.type === 'item') {
      itemIndex++
    }

    return entry.contentId === contentId
  })

  return `${unitDoc.shortCode}_${page}_${itemIndex}`
}
