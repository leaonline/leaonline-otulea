import { Meteor } from 'meteor/meteor'
import { Session } from '../contexts/session/Session'
import { TestCycle } from '../contexts/testcycle/TestCycle'
import { Feedback } from '../contexts/feedback/Feedback'
import { Dimension } from '../contexts/Dimension'
import { Level } from '../contexts/Level'
import { getCompetencies } from '../contexts/feedback/api/getCompetencies'
import { getAlphaLevels } from '../contexts/feedback/api/getAlphaLevels'
import fs from 'fs'

const fields = {
  userId: 1,
  code: 1,
  startedAt: 1,
  completedAt: 1,
  duration: 1,
  cancelledAt: 1,
  dimension: 1,
  level: 1
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
const toDate = value => value ? new Date(value).toLocaleDateString() : ''

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
  }

  addSession (sessionDoc, testCycleDoc = {}) {
    this.dimension = getDimension(testCycleDoc.dimension).title ?? 'missing'
    this.level = getLevel(testCycleDoc.level).title ?? 'missing'
    this.startedAt = toDate(sessionDoc.startedAt)
    this.completedAt = toDate(sessionDoc.completedAt)
    this.cancelledAt = toDate(sessionDoc.cancelledAt)
    this.isCancelled = this.cancelledAt || !this.completedAt
    this.progress = sessionDoc.progress || 0
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

export const alphaUsers = ({ dryRun = true }) => {
  const rows = []
  let missing = ''

  Meteor.users.find({}).forEach((user) => {
    if (!user || !user.username || !user._id || !user.createdAt || !user.updatedAt) {
      return
    }

    const sessionCursor = Session.collection().find({ userId: user._id })
    if (sessionCursor.count() === 0) { return }

    const row = new Row({ user })
    sessionCursor.forEach(sessionDoc => {
      if (!sessionDoc.testCycle) {
        missing += `[Missing] test cycle for ${user.username} and session ${sessionDoc._id}\n`
        return
      }

      const testCycleDoc = TestCycle.collection().findOne(sessionDoc.testCycle)

      if (!testCycleDoc) {
        missing += `[Missing] test cycle for ${user.username} and session ${sessionDoc._id}\n`
        return
      }

      row.addSession(sessionDoc, testCycleDoc)

      // if we have an existing feedback it's all fine
      if (sessionDoc.completedAt) {
        Feedback.collection().find({ sessionId: sessionDoc._id }).forEach(doc => row.addRecord(doc))
      }

      // otherwise we need to generate it first!
      else {
        missing += `[Missing] report for ${user.username} and session ${sessionDoc._id}\n`
      }
    })

    rows.push(row)
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
  const alphaKeys = Object.keys(allAlphaLevels)
  alphaKeys.sort().forEach(addToHeader)

  const competencyKeys = Object.keys(allCompetencies)
  competencyKeys.sort().forEach(addToHeader)

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
      }
    }

    fieldNames.forEach(key => addToLine(row[key]))
    alphaKeys.forEach(addComplex(row.alphaLevels))
    competencyKeys.forEach(addComplex(row.competencies))

    out += line + '\n'
  })

  if (!dryRun) {
    fs.writeFile(`${process.cwd()}/missing.txt`, missing, (err) => {
      if (err) console.log(err)
    })
    fs.writeFile(`${process.cwd()}/alphaUsers.csv`, out, (err) => {
      if (err) console.log(err)
    })
  }
}
