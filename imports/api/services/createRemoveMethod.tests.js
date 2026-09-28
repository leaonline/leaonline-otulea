/* eslint-env mocha */
import { expect } from 'chai'
import { Mongo } from 'meteor/mongo'
import sinon from 'sinon'
import { createRemoveMethod } from './createRemoveMethod'

describe('createRemoveMethod', () => {
  it('creates a backend definition that removes by id', async () => {
    const collection = new Mongo.Collection(null)
    await collection.insertAsync({ _id: 'remove-me' })
    await collection.insertAsync({ _id: 'keep-me' })
    const definition = createRemoveMethod({
      context: { name: 'documents', collection: () => collection },
    })

    expect(definition.name).to.equal('documents.methods.remove')
    expect(definition.backend).to.equal(true)
    expect(await definition.run({ _id: 'remove-me' })).to.equal(1)
    expect(await collection.findOneAsync('remove-me')).to.equal(undefined)
    expect(await collection.findOneAsync('keep-me')).to.exist
  })

  it('preserves a custom removal function', async () => {
    const run = sinon.stub().resolves('custom')
    const definition = createRemoveMethod({
      context: { name: 'documents' },
      run,
    })

    expect(await definition.run({ _id: 'one' })).to.equal('custom')
    expect(run.calledWith({ _id: 'one' })).to.equal(true)
  })
})
