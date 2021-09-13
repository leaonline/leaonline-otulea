/* eslint-env mocha */
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { scoreResponses } from '../scoreResponses'
import { restoreAll, stub } from '../../../../tests/helpers.tests'
import { Scoring } from '../../../contexts/Scoring'

describe(scoreResponses.name, function () {
  afterEach(function () {
    restoreAll()
  })
  it('throws if there is no item definition for the given document', function () {
    expect(() => scoreResponses()).to.throw('scoreResponses.error')
  })
  it('scores responses for a given response document', function () {
    const value = Random.id()
    const subtype = Random.id()
    const result = Random.id()
    const doc = { foo: Random.id() }

    stub(Scoring, 'run', (type, val, document) => {
      expect(type).to.equal(subtype)
      expect(val).to.equal(value)
      expect(document).to.deep.equal(doc)
      return result
    })

    expect(scoreResponses({
      itemDoc: { subtype, value },
      responseDoc: doc
    })).to.equal(result)
  })
})
