/* eslint-env mocha */
import { expect } from 'chai'
import { addRecord } from '../api/addRecord'
import { Random } from 'meteor/random'
import { Record } from '../Record'
import { Competency } from '../../Competency'
import { AlphaLevel } from '../../AlphaLevel'
import { mockCollection, restoreCollection } from '../../../../tests/mockCollection'

const randomHex = () => Math.round(Math.random() * 100000).toString(16)

describe(addRecord.name, function () {
  beforeEach(function () {
    mockCollection(Record)
    mockCollection(Competency, { attachSchema: false })
    mockCollection(AlphaLevel, { attachSchema: false })
  })
  afterEach(function () {
    restoreCollection(Record)
    restoreCollection(Competency)
    restoreCollection(AlphaLevel)
  })

  it('throws if params are missing or invalid', function () {
    expect(() => addRecord({})).to.throw('Missing key \'userId\'')
    expect(() => addRecord({
      userId: Random.id(6),
      testCycleDoc: {},
      sessionDoc: {},
      feedbackDoc: {}
    })).to.throw('Missing key \'dimension\' in field testCycleDoc')
    expect(() => addRecord({
      userId: Random.id(6),
      testCycleDoc: {
        dimension: Random.id(4),
        level: Random.id(4),
      },
      sessionDoc: {},
      feedbackDoc: {}
    })).to.throw('Missing key \'startedAt\' in field sessionDoc')
    expect(() => addRecord({
      userId: Random.id(6),
      testCycleDoc: {
        dimension: Random.id(4),
        level: Random.id(4),
      },
      sessionDoc: {
        startedAt: new Date(),
        completedAt: new Date(),
        cancelledAt: new Date()
      },
      feedbackDoc: {
        competencies: [],
        alphaLevels: ['foo'],
      }
    })).to.throw('Expected object, got string in field feedbackDoc.alphaLevels[0]')
  })
  it('creates a new record if none exists for the given user/dimension/level/date', function () {
    const alphaLevelId = AlphaLevel.collection().insert({
      shortCode: randomHex(),
      description: randomHex(),
      level: 99
    })
    const competencyId = Competency.collection().insert({
      shortCode: randomHex(),
      description: randomHex(),
      level: alphaLevelId,
      category: randomHex()
    })

    const data = {
      userId: Random.id(6),
      testCycleDoc: {
        _id: Random.id(6),
        dimension: Random.id(4),
        level: Random.id(4),
      },
      sessionDoc: {
        _id: Random.id(6),
        startedAt: new Date(),
        completedAt: new Date(),
        cancelledAt: new Date()
      },
      feedbackDoc: {
        _id: Random.id(6),
        competencies: [{
          competencyId: competencyId,
          count: 10,
          scored: 9,
          perc: 0.9,
          undef: 0,
          isGraded: true
        }],
        alphaLevels: [{
          alphaLevelId: alphaLevelId,
          count: 1,
          scored: 1,
          perc: 1,
          undef: 0,
          isGraded: true
        }],
      }
    }

    const result = addRecord(data)
    expect(result.numberAffected).to.equal(1)
    expect(result.insertedId).to.be.a('string')

    const recordDoc = Record.collection().findOne()

    const { completedAt, startedAt, ...rest } = recordDoc
    expect(completedAt).to.be.instanceOf(Date)
    expect(startedAt).to.be.instanceOf(Date)

    const alphaLevelDoc = AlphaLevel.collection().findOne(alphaLevelId)
    const competencyDoc = Competency.collection().findOne(competencyId)

    expect(rest).to.deep.equal({
      _id: result.insertedId,
      userId: data.userId,
      dimension: data.testCycleDoc.dimension,
      level: data.testCycleDoc.level,
      testCycle: data.testCycleDoc._id,
      session: data.sessionDoc._id,
      feedback: data.feedbackDoc._id,

      competencies: [{
        _id: competencyId,
        description: competencyDoc.description,
        shortCode: competencyDoc.shortCode,
        alphaLevel: competencyDoc.level,
        category: competencyDoc.category,
        count: data.feedbackDoc.competencies[0].count,
        scored: data.feedbackDoc.competencies[0].scored,
        perc: data.feedbackDoc.competencies[0].perc,
        undef: data.feedbackDoc.competencies[0].undef,
        isGraded: data.feedbackDoc.competencies[0].isGraded,
        development: 'new'
      }],

      alphaLevels: [{
        _id: alphaLevelId,
        description: alphaLevelDoc.description,
        shortCode: alphaLevelDoc.shortCode,
        level: alphaLevelDoc.level,
        count: data.feedbackDoc.alphaLevels[0].count,
        scored: data.feedbackDoc.alphaLevels[0].scored,
        perc: data.feedbackDoc.alphaLevels[0].perc,
        isGraded: data.feedbackDoc.alphaLevels[0].isGraded,
        development: 'new'
      }]
    })
  })
  it('replaces an existing record, if such already exists', function () {
    const alphaLevelId = AlphaLevel.collection().insert({
      shortCode: randomHex(),
      description: randomHex(),
      level: 99
    })
    const competencyId = Competency.collection().insert({
      shortCode: randomHex(),
      description: randomHex(),
      level: alphaLevelId,
      category: randomHex()
    })

    const data = {
      userId: Random.id(6),
      testCycleDoc: {
        _id: Random.id(6),
        dimension: Random.id(4),
        level: Random.id(4),
      },
      sessionDoc: {
        _id: Random.id(6),
        startedAt: new Date(),
        completedAt: new Date(),
        cancelledAt: new Date()
      },
      feedbackDoc: {
        _id: Random.id(6),
        competencies: [{
          competencyId: competencyId,
          count: 10,
          scored: 9,
          perc: 0.9,
          undef: 0,
          isGraded: true
        }],
        alphaLevels: [{
          alphaLevelId: alphaLevelId,
          count: 1,
          scored: 1,
          perc: 1,
          undef: 0,
          isGraded: true
        }],
      }
    }

    const result = addRecord(data)
    expect(Record.collection().find().count()).to.equal(1)

    const offset = data.sessionDoc.completedAt.getTime() + 2 * 60 * 60 * 1000
    data.sessionDoc._id = Random.id(6)
    data.sessionDoc.startedAt.setTime(offset)
    data.sessionDoc.completedAt.setTime(offset)

    // same results
    addRecord(data)
    expect(Record.collection().find().count()).to.equal(1)

    const recordDoc = Record.collection().findOne()

    const { completedAt, startedAt, ...rest } = recordDoc
    expect(completedAt).to.be.instanceOf(Date)
    expect(startedAt).to.be.instanceOf(Date)

    const alphaLevelDoc = AlphaLevel.collection().findOne(alphaLevelId)
    const competencyDoc = Competency.collection().findOne(competencyId)

    expect(rest).to.deep.equal({
      _id: result.insertedId,
      userId: data.userId,
      dimension: data.testCycleDoc.dimension,
      level: data.testCycleDoc.level,
      testCycle: data.testCycleDoc._id,
      session: data.sessionDoc._id,
      feedback: data.feedbackDoc._id,

      competencies: [{
        _id: competencyId,
        description: competencyDoc.description,
        shortCode: competencyDoc.shortCode,
        alphaLevel: competencyDoc.level,
        category: competencyDoc.category,
        count: data.feedbackDoc.competencies[0].count,
        scored: data.feedbackDoc.competencies[0].scored,
        perc: data.feedbackDoc.competencies[0].perc,
        undef: data.feedbackDoc.competencies[0].undef,
        isGraded: data.feedbackDoc.competencies[0].isGraded,
        development: 'new'
      }],

      alphaLevels: [{
        _id: alphaLevelId,
        description: alphaLevelDoc.description,
        shortCode: alphaLevelDoc.shortCode,
        level: alphaLevelDoc.level,
        count: data.feedbackDoc.alphaLevels[0].count,
        scored: data.feedbackDoc.alphaLevels[0].scored,
        perc: data.feedbackDoc.alphaLevels[0].perc,
        isGraded: data.feedbackDoc.alphaLevels[0].isGraded,
        development: 'new'
      }]
    })
  })
  it('compares compatencies / alphalevels development with previous days', function () {
    const alphaLevelId = AlphaLevel.collection().insert({
      shortCode: randomHex(),
      description: randomHex(),
      level: 99
    })
    const competencyId = Competency.collection().insert({
      shortCode: randomHex(),
      description: randomHex(),
      level: alphaLevelId,
      category: randomHex()
    })

    const data = {
      userId: Random.id(6),
      testCycleDoc: {
        _id: Random.id(6),
        dimension: Random.id(4),
        level: Random.id(4),
      },
      sessionDoc: {
        _id: Random.id(6),
        startedAt: new Date(),
        completedAt: new Date(),
        cancelledAt: new Date()
      },
      feedbackDoc: {
        _id: Random.id(6),
        competencies: [{
          competencyId: competencyId,
          count: 10,
          scored: 9,
          perc: 0.9,
          undef: 0,
          isGraded: true
        }],
        alphaLevels: [{
          alphaLevelId: alphaLevelId,
          count: 1,
          scored: 1,
          perc: 1,
          undef: 0,
          isGraded: true
        }],
      }
    }
    const yesterday = data.sessionDoc.startedAt.getDate() - 1
    data.sessionDoc.startedAt.setDate(yesterday)
    data.sessionDoc.completedAt.setDate(yesterday)

    const result = addRecord(data)

    // same record
    data.sessionDoc._id = Random.id(6)
    data.sessionDoc.startedAt = new Date()
    data.sessionDoc.completedAt = new Date()

    const { insertedId } = addRecord(data)
    expect(Record.collection().find().count()).to.equal(2)
    expect(result.insertedId).to.not.equal(insertedId)

    const record = Record.collection().findOne(insertedId)
    expect(record.competencies[0].development).to.equal('same')
    expect(record.alphaLevels[0].development).to.equal('same')

    // improved
    data.sessionDoc._id = Random.id(6)
    data.feedbackDoc.competencies[0].perc = 1
    data.feedbackDoc.alphaLevels[0].perc = 1

    addRecord(data)
    expect(Record.collection().find().count()).to.equal(2)
    const record2 = Record.collection().findOne(insertedId)
    expect(record2.competencies[0].development).to.equal('improved')
    expect(record2.alphaLevels[0].development).to.equal('same')

    // declined
    data.sessionDoc._id = Random.id(6)
    data.feedbackDoc.competencies[0].perc = 0.4
    data.feedbackDoc.alphaLevels[0].perc = 0.4

    addRecord(data)
    expect(Record.collection().find().count()).to.equal(2)
    const record3 = Record.collection().findOne(insertedId)
    expect(record3.competencies[0].development).to.equal('declined')
    expect(record3.alphaLevels[0].development).to.equal('declined')
  })
})
