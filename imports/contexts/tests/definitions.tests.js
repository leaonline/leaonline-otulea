/* eslint-env mocha */
import { expect } from 'chai'
import sinon from 'sinon'
import { Meteor } from 'meteor/meteor'
import { Items } from '../Items'
import { Diagnostics } from '../diagnostics/Diagnostics'
import { Legal } from '../legal/Legal'
import { Logos } from '../logos/Logos'
import { ContextRegistry } from '../registry/ContextRegistry'

describe('context definitions', () => {
  it('exports item and diagnostics context contracts', () => {
    expect(Items).to.be.an('object')
    expect(Diagnostics).to.include({
      name: 'diagnostics',
      representative: 'allPassed',
    })
    expect(Diagnostics.api.run).to.be.a('function')
    expect(Diagnostics.methods.send.isPublic).to.equal(true)
  })

  it('stores contexts by their registry name', () => {
    const context = { name: 'test-context' }
    ContextRegistry.add(context.name, context)
    expect(ContextRegistry.get(context.name)).to.equal(context)
  })

  if (Meteor.isServer) {
    describe('configuration context methods', () => {
      afterEach(() => sinon.restore())

      it('initializes and reads legal configuration', async () => {
        const insertAsync = sinon.stub().resolves('legal-id')
        const findOneAsync = sinon.stub().onFirstCall().resolves(undefined).onSecondCall().resolves({
          privacy: 'Private',
        })
        sinon.stub(Legal, 'collection').returns({ findOneAsync, insertAsync })

        await Legal.helpers.init()
        expect(insertAsync.calledWith({
          imprint: 'Imprint',
          privacy: 'Privacy',
          terms: 'Terms',
          contact: 'Contact',
        })).to.equal(true)
        expect(await Legal.methods.get.run({ name: 'privacy' })).to.equal('Private')
      })

      it('inserts then updates logo configuration', async () => {
        const insertAsync = sinon.stub().resolves('logo-id')
        const updateAsync = sinon.stub().resolves(1)
        const findOneAsync = sinon.stub().onFirstCall().resolves(undefined).onSecondCall().resolves({
          _id: 'logo-id',
        }).onThirdCall().resolves({ footer: [{ url: '/logo.svg' }] })
        sinon.stub(Logos, 'collection').returns({ findOneAsync, insertAsync, updateAsync })

        const footer = [{ url: '/logo.svg' }]
        expect(await Logos.methods.update.run({ footer })).to.equal('logo-id')
        await Logos.methods.update.run({ footer })
        expect(updateAsync.calledWith('logo-id', { $set: { footer } })).to.equal(true)
        expect(await Logos.methods.get.run()).to.deep.equal({ footer })
      })
    })
  }
})
