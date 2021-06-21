/* eslint-env mocha */
import { HTTP } from 'meteor/jkuester:http'
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { stub, restoreAll } from '../../../../tests/helpers.tests'
import { getCompetencies } from '../api/getCompetencies'

describe(getCompetencies.name, function () {
  afterEach(function () {
    restoreAll()
  })

  it('fetches competency docs by given ids and returns them as a map', function () {
    const id1 = Random.id()
    const id2 = Random.id()
    const docs = [{
      _id: id1,
      title: Random.id()
    }, {
      _id: id2,
      title: Random.id()
    }]
    stub(HTTP, 'get', (url, requestOptions) => {
      expect(requestOptions.params.ids).to.deep.equal([id1, id2])
      return { data: docs }
    })

    const map = getCompetencies([id1, id2])
    expect(map.size).to.equal(2)
    expect(map.get(id1)).to.deep.equal(docs[0])
    expect(map.get(id2)).to.deep.equal(docs[1])
  })
})
