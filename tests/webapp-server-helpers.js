import { WebApp } from 'meteor/webapp'
import { Random } from 'meteor/random'
import { Meteor } from 'meteor/meteor'
import { EJSON } from 'meteor/ejson'

const toPath = name => `/${name}`

export const createUrl = path => Meteor.absoluteUrl(path)

export const urls = {
  path400: toPath('path400'),
  path200: toPath('path200'),
}

export const RequestedDocsContext = {
  name: Random.id(),
  routes: {
    byId: {
      path: toPath('singleDocById'),
      method: 'get',
      docId: '0123456789'
    },
    all: {
      path: toPath('allDocsById'),
      method: 'get'
    }
  },
  doc: {
    _id: '0123456789',
    foo: 'bar',
    date: new Date('2018-05-09'),
    regex: /[a-z]/g
  }
}

const _singleDocCollection = new Mongo.Collection(null)
RequestedDocsContext.collection = () => _singleDocCollection

if (Meteor.isServer) {
  WebApp.connectHandlers.use(urls.path200, function (req, res, next) {
    next()
  })

  WebApp.connectHandlers.use(urls.path400, function (req, res) {
    res.writeHead(400)
    res.end('not found')
  })

  WebApp.connectHandlers.use(RequestedDocsContext.routes.byId.path, function (req, res) {
    const { _id } = req.query

    if (_id === 'plain') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' })
      res.end(EJSON.stringify(new Date()))
      return
    }

    if (_id !== RequestedDocsContext.doc._id) {
      res.writeHead(404)
      res.end(`Invalid request id ${_id}`)
      return
    }

    res.writeHead(200, {
      'Content-Type': 'application/json; charset=UTF-8'
    })

    const { doc } = RequestedDocsContext
    res.end(EJSON.stringify(doc))
  })

  WebApp.connectHandlers.use(RequestedDocsContext.routes.all.path, function (req, res) {
    const { noId, noDocs, noArray, empty, createError } = req.query

    if (noId) {
      const doc = { ...RequestedDocsContext.doc }
      delete doc._id

      res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' })
      res.end(EJSON.stringify([doc]))
      return
    }

    if (noDocs) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' })
      res.end(EJSON.stringify([]))
      return
    }

    if (noArray) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' })
      res.end(EJSON.stringify(RequestedDocsContext.doc))
      return
    }

    if (empty) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' })
      res.end(EJSON.stringify([]))
      return
    }

    if (createError) {
      res.writeHead(404)
      res.end(`Invalid request / createError`)
      return
    }

    res.writeHead(200, {
      'Content-Type': 'application/json; charset=UTF-8'
    })

    const { doc } = RequestedDocsContext
    res.end(EJSON.stringify([doc]))
  })
}
