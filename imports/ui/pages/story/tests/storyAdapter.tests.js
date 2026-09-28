/* eslint-env mocha */
import { expect } from 'chai'
import { Blaze } from 'meteor/blaze'
import { Meteor } from 'meteor/meteor'
import sinon from 'sinon'
import { initClientContext } from '../../../../api/context/initClientContext'
import { Dimension } from '../../../../contexts/Dimension'
import { Level } from '../../../../contexts/Level'
import { Session } from '../../../../contexts/session/Session'
import { Unit } from '../../../../contexts/Unit'
import { UnitSet } from '../../../../contexts/unitSet/UnitSet'
import { createBlazeHarness } from '../../../../../tests/blazeHarness'
import '../story'
import { asyncTimeout } from '../../../../utils/asyncTimeout'

const installDependencies = (sandbox) =>
  sandbox
    .stub(Blaze.TemplateInstance.prototype, 'initDependencies')
    .callsFake(function (options) {
      this.api = {
        callMethod: sinon.spy(),
        debug: sinon.spy(),
        fadeIn: (_target, callback) => callback(),
        fadeOut: (_target, callback) => callback(),
        info: sinon.spy(),
        queryParam: sinon.spy(),
        sendError: sinon.spy(),
      }
      options.onComplete()
      return this
    })

const settle = async (harness) => {
  for (let index = 0; index < 12; index += 1) await Promise.resolve()
  await harness.flush()
}

describe('story Blaze adapter', () => {
  let sandbox
  let harness

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    harness = createBlazeHarness()
    installDependencies(sandbox)
    ;[Session, Unit, UnitSet, Dimension, Level].forEach((context) =>
      initClientContext(context, () => {}),
    )
  })

  afterEach(async () => {
    await harness.cleanup()
    sandbox.restore()
  })

  it('aborts immediately when required route identifiers are missing', async () => {
    sandbox.stub(console, 'error')
    const exit = sandbox.spy()

    const rendered = await harness.render('story', {
      params: {},
      exit,
      next: sandbox.spy(),
    })

    expect(rendered.instance.state.get('dependenciesComplete')).to.equal(true)
    expect(exit.calledOnceWithExactly()).to.equal(true)
    expect(console.error.calledWith('abort story')).to.equal(true)
  })

  it('loads linked session documents and finishes through the rendered action', async () => {
    const docs = {
      session: {
        _id: 'session',
        unitSet: 'set',
        currentUnit: 'unit',
        progress: 0,
        maxProgress: 1,
      },
      set: {
        _id: 'set',
        dimension: 'dimension',
        level: 'level',
        story: [],
      },
      dimension: {
        _id: 'dimension',
        title: 'Reading',
        colorType: 0,
      },
      level: { _id: 'level', title: 'Level 1' },
      unit: { _id: 'unit', pages: [{ content: [] }] },
    }
    sandbox.stub(UnitSet, 'collection').returns({
      findOne: ({ _id }) => docs[_id],
    })
    sandbox.stub(Dimension, 'collection').returns({
      findOne: ({ _id }) => docs[_id],
    })
    sandbox.stub(Level, 'collection').returns({
      findOne: ({ _id }) => docs[_id],
    })
    sandbox.stub(Unit, 'collection').returns({
      findOne: ({ _id }) => docs[_id],
    })
    sandbox.stub(Meteor, 'call').callsFake((name, args, callback) => {
      expect(name).to.equal(Session.methods.currentById.name)
      expect(args).to.deep.equal({ sessionId: 'session' })
      callback(null, docs.session)
    })
    const next = sandbox.spy()
    const exit = sandbox.spy()

    const rendered = await harness.render('story', {
      params: { sessionId: 'session', unitId: 'unit', unitSetId: 'set' },
      exit,
      next,
    })
    await settle(harness)

    expect(rendered.instance.state.get('sessionDoc')).to.deep.equal(
      docs.session,
    )
    expect(rendered.instance.state.get('unitSetDoc')).to.deep.equal(docs.set)
    expect(rendered.instance.state.get('dimensionDoc')).to.deep.equal(
      docs.dimension,
    )
    expect(rendered.instance.state.get('levelDoc')).to.deep.equal(docs.level)

    await asyncTimeout(150)
    expect(
      rendered.host.querySelector('.lea-story-finish-button'),
    ).to.not.equal(null)

    await harness.dispatch(
      rendered.host.querySelector('.lea-story-finish-button'),
      'click',
    )
    await asyncTimeout(150)
    expect(
      next.calledOnceWithExactly({
        sessionId: 'session',
        unitId: 'unit',
      }),
    ).to.equal(true)
    expect(exit.called).to.equal(false)
  })

  it('aborts when the session loader rejects', async () => {
    const expected = new Error('session unavailable')
    sandbox.stub(console, 'error')
    sandbox
      .stub(Meteor, 'call')
      .callsFake((_name, _args, callback) => callback(expected))
    const exit = sandbox.spy()

    await harness.render('story', {
      params: { sessionId: 'missing', unitId: 'unit' },
      exit,
      next: sandbox.spy(),
    })
    await settle(harness)

    expect(exit.calledOnceWithExactly()).to.equal(true)
    expect(console.error.calledWith(expected)).to.equal(true)
  })
})
