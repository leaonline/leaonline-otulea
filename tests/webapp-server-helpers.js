import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { WebApp } from 'meteor/webapp'
import { Random } from 'meteor/random'
import { EJSON } from 'meteor/ejson'

const toPath = name => `/${name}`

export const createUrl = path => Meteor.absoluteUrl(path)

export const urls = {
  path400: toPath('path400'),
  path200: toPath('path200')
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
  WebApp.handlers.get(urls.path200, function (req, res, next) {
    next()
  })

  WebApp.handlers.get(urls.path400, function (req, res) {
    res.status(400)
    res.send('not found')
  })

  WebApp.handlers.get(RequestedDocsContext.routes.byId.path, function (req, res) {
    const { _id } = req.query

    if (_id === 'plain') {
      res.status(200).set({ 'Content-Type': 'application/json; charset=UTF-8' }).send(EJSON.stringify(new Date()))
      return
    }

    if (_id !== RequestedDocsContext.doc._id) {
      res.status(404).send(`Invalid request id ${_id}`)
      return
    }

    const { doc } = RequestedDocsContext
    res.status(200).set({ 'Content-Type': 'application/json; charset=UTF-8' }).send(EJSON.stringify(doc))
  })

  WebApp.handlers.get(RequestedDocsContext.routes.all.path, function (req, res) {
    const { noId, noDocs, noArray, empty, createError } = req.query

    if (noId) {
      const doc = { ...RequestedDocsContext.doc }
      delete doc._id

      res.status(200).set({ 'Content-Type': 'application/json; charset=UTF-8' }).send(EJSON.stringify([doc]))
      return
    }

    if (noDocs) {
      res.set(200).set({ 'Content-Type': 'application/json; charset=UTF-8' }).send(EJSON.stringify([]))
      return
    }

    if (noArray) {
      res.status(200).set({ 'Content-Type': 'application/json; charset=UTF-8' }).send(EJSON.stringify(RequestedDocsContext.doc))
      return
    }

    if (empty) {
      res.status(200).set({ 'Content-Type': 'application/json; charset=UTF-8' }).send(EJSON.stringify([]))
      return
    }

    if (createError) {
      res.status(404).send('Invalid request / createError')
      return
    }

    const { doc } = RequestedDocsContext
    res.status(200).set({ 'Content-Type': 'application/json; charset=UTF-8' }).send(EJSON.stringify([doc]))
  })
}
