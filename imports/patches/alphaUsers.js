import { Meteor } from 'meteor/meteor'
import { Session } from '../contexts/session/Session'
import { TestCycle } from '../contexts/testcycle/TestCycle'
import { Feedback } from '../contexts/feedback/Feedback'
import { Dimension } from '../contexts/Dimension'
import { Level } from '../contexts/Level'
import { getCompetencies } from '../contexts/feedback/api/getCompetencies'
import { getAlphaLevels } from '../contexts/feedback/api/getAlphaLevels'
import { generateFeedback } from '../contexts/feedback/api/generateFeedback'
import fs from 'fs'

const fields = {
  sessionId: 1,
  userId: 1,
  tag: 1,
  code: 1,
  testCycleId: 1,
  dimension: 1,
  level: 1,
  startedAt: 1,
  completedAt: 1,
  duration: 1,
  cancelledAt: 1,
  progress: 1,
  maxProgress: 1,
  isComplete: 1,
}

const fieldNames = Object.keys(fields)

const createCachedGetter = (collection) => {
  const map = new Map()
  return (_id) => {
    if (!map.has(_id)) {
      map.set(_id, collection.findOne({ _id }))
    }
    return map.get(_id)
  }
}

const getDimension = createCachedGetter(Dimension.collection())
const getLevel = createCachedGetter(Level.collection())
const getCompetency = _id => {
  const map = getCompetencies([_id])
  return map.get(_id)
}
const getAlphaLevel = _id => {
  const map = getAlphaLevels([_id])
  return map.get(_id)
}
const toDate = value => value ? new Date(value).toISOString() : ''

class Row {
  constructor ({ user }) {
    this.user = user
    this.userId = user._id
    this.code = user.username
    this.dimension = ''
    this.level = ''
    this.startedAt = ''
    this.completedAt = ''
    this.cancelledAt = ''
    this.duration = ''
    this.competencies = {}
    this.alphaLevels = {}
    this.tag = user.comment ?? ''
  }

  addSession (sessionDoc, testCycleDoc) {
    this.sessionId = sessionDoc._id
    this.testCycleId = testCycleDoc._id
    this.dimension = getDimension(testCycleDoc.dimension).title ?? 'missing'
    this.level = getLevel(testCycleDoc.level).title ?? 'missing'
    this.startedAt = toDate(sessionDoc.startedAt)
    this.completedAt = toDate(sessionDoc.completedAt)
    this.cancelledAt = toDate(sessionDoc.cancelledAt)
    this.isCancelled = this.cancelledAt || !this.completedAt
    this.progress = sessionDoc.progress
    this.maxProgress = sessionDoc.maxProgress || -999
    this.isComplete = this.progress === this.maxProgress

    if (!this.cancelledAt && sessionDoc.startedAt && sessionDoc.completedAt) {
      this.duration = new Date(sessionDoc.completedAt).getTime() - new Date(sessionDoc.startedAt).getTime()
    }
    else {
      this.duration = -999 // no time computable
    }
  }

  addRecord (doc = {}) {
    if (this.sessionId !== doc.sessionId) {
      throw new Error(`Session Id mismatch! Expected ${this.sessionId}, got ${doc.sessionId}`)
    }
    const competencies = doc.competencies || []
    const alphaLevels = doc.alphaLevels || []

    alphaLevels.forEach(({ alphaLevelId, count, scored, undef }) => {
      const alphaLevelDoc = getAlphaLevel(alphaLevelId)
      const shortCode = alphaLevelDoc?.shortCode ?? `missing-${alphaLevelId}`
      const existingComp = this.alphaLevels[shortCode] || { count: 0, scored: 0, perc: 0, undef: 0, graded: 0 }
      existingComp.count += (count || 0)
      existingComp.scored += (scored || 0)
      existingComp.undef += (undef || 0)
      existingComp.perc += existingComp.scored / (existingComp.count || 1)
      this.alphaLevels[shortCode] = existingComp
    })

    competencies.forEach(({ competencyId, count, scored, undef }) => {
      const competencyDoc = getCompetency(competencyId)
      const shortCode = competencyDoc?.shortCode ?? `missing-${competencyId}`
      const existingComp = this.competencies[shortCode] || { count: 0, scored: 0, perc: 0, undef: 0, graded: 0 }
      existingComp.count += (count || 0)
      existingComp.scored += (scored || 0)
      existingComp.undef += (undef || 0)
      existingComp.perc += existingComp.scored / (existingComp.count || 1)
      this.competencies[shortCode] = existingComp
    })
  }
}

export const alphaUsers = ({ dryRun = true, includeAlphaLevels, includeCompetencies }) => {
  const rows = []
  let eventLog = []
  const log = (...args) => eventLog.push(args.join(' '))

  Meteor.users.find({}).forEach((user) => {
    if (!user || !user.username || !user._id || !user.createdAt || !user.updatedAt) {
      return log('[Skip] incomplete user', JSON.stringify(user, null, 0))
    }

    const username =  `${user.username}-(${user._id})`
    const sessionCursor = Session.collection().find({ userId: user._id, completedAt: { $exists: true } })

    if (sessionCursor.count() === 0) {
      return log('[Skip] incomplete session for user', username)
    }



    let rowHasData = false

    sessionCursor.forEach(sessionDoc => {
      const row = new Row({ user })

      if (!sessionDoc.testCycle) {
        return log(`[Missing] test cycle for ${username} and session ${sessionDoc._id}`)
      }

      const testCycleDoc = TestCycle.collection().findOne(sessionDoc.testCycle)

      if (!testCycleDoc) {
        return log(`[Missing] test cycle for ${username} and session ${sessionDoc._id}`)
      }

      row.addSession(sessionDoc, testCycleDoc)

      const feedbackDocs = getFeedbackDocs({ sessionDoc, testCycleDoc, user, log })
      const feedbackCount = feedbackDocs.count()

      // if we have an existing feedback it's all fine
      if (feedbackCount === 0) {
        return log(`[Missing] no feedback found/generated for ${username} and session ${sessionDoc._id}`)
      }

      if (feedbackCount > 1) {
        log(`[Warning] found ${feedbackCount} feedback docs for ${username} and session ${sessionDoc._id}`)
      }

      // finally add records from this feedback doc
      feedbackDocs.forEach(doc => row.addRecord(doc))
      rowHasData = true
      rows.push(row)
    })
  })

  // get all alpha levels and competencies to build our header
  const allAlphaLevels = {}
  const allCompetencies = {}

  rows.forEach(row => {
    const ckeys = Object.keys(row.competencies)
    const akeys = Object.keys(row.alphaLevels)

    // print(row.code, ckeys.length, akeys.length)
    ckeys.forEach(key => {
      allCompetencies[`${key}#c`] = 1
      allCompetencies[`${key}#s`] = 1
      allCompetencies[`${key}#u`] = 1
      allCompetencies[`${key}#p`] = 1
    })
    akeys.forEach(key => {
      allAlphaLevels[`${key}#c`] = 1
      allAlphaLevels[`${key}#s`] = 1
      allAlphaLevels[`${key}#u`] = 1
      allAlphaLevels[`${key}#p`] = 1
    })
  })

  const header = []
  const addToHeader = name => header.push(name)
  fieldNames.forEach(addToHeader)

  let alphaKeys
  let competencyKeys

  if (includeAlphaLevels) {
    alphaKeys = Object.keys(allAlphaLevels)
    alphaKeys.sort().forEach(addToHeader)
  }
  if (includeCompetencies) {
    competencyKeys = Object.keys(allCompetencies)
    competencyKeys.sort().forEach(addToHeader)
  }

  let out = header.join(';') + '\n'

  rows.forEach(row => {
    let line = ''
    const addToLine = value => {
      if (value === null || value === undefined) {
        value = ''
      }
      line += `${value};`
    }
    const addComplex = target => keyWithHash => {
      const [key, type] = keyWithHash.split('#')
      const value = target[key] || {}

      switch (type) {
        case 'c':
          return addToLine(value.count)
        case 's':
          return addToLine(value.scored)
        case 'u':
          return addToLine(value.undef)
        case 'p':
          return addToLine(value.perc)
        default:
          log( `[Warning] unknown type ${type} in alphe/competency ${key}`)
      }
    }

    fieldNames.forEach(key => addToLine(row[key]))

    if (includeAlphaLevels) {
      alphaKeys.forEach(addComplex(row.alphaLevels))
    }
    if (includeCompetencies) {
      competencyKeys.forEach(addComplex(row.competencies))
    }

    out += line + '\n'
  })

  if (!dryRun) {
    const timestamp = new Date().toISOString()
    const logFilePath = `${process.cwd()}/log-${timestamp}.txt`
    log('saving log to', logFilePath)
    fs.writeFile(logFilePath, eventLog.join('\n'), (err) => {
      if (err) {
        console.log('error', logFilePath, err.message)
      } else {
        console.log(logFilePath, 'saved')
      }
    })

    const alphaCsvPath = `${process.cwd()}/${includeAlphaLevels ? 'a-' : ''}${includeCompetencies ? 'c-' : ''}${timestamp}.csv`
    log('saving alpha levels CSV to', alphaCsvPath)
    fs.writeFile(alphaCsvPath, out, (err) => {
      if (err) {
        console.log('error', alphaCsvPath, err)
      } else {
        console.log(alphaCsvPath, 'saved')
      }
    })
  }
}

const getFeedbackDocs = ({ sessionDoc, testCycleDoc, user, log }) => {
  const query = { sessionId: sessionDoc._id }
  let cursor =  Feedback.collection().find(query)

  if (cursor.count() === 0) {
    log(`[Create] feedback for ${user.username} session ${sessionDoc._id}`)
    try {
      generateFeedback({ sessionDoc, testCycleDoc, userId: user._id })
    } catch (e) {
      log('[Error]', e.message)
    }
  }

  cursor = Feedback.collection().find(query)
  return cursor
}
