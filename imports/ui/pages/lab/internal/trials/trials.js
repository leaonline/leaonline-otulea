import './trials.html'
import { Session} from "../../../../../contexts/session/Session";
import {TestCycle} from "../../../../../contexts/testcycle/TestCycle";
import {loadAllContentDocs} from "../../../../loading/loadAllContentDocs";
import {Trial} from "../../../../../contexts/trial/Trial";
import {callMethod} from "../../../../../infrastructure/methods/callMethod";
import {errorToObject} from "../../../../../utils/object/errorToObject";
import {getLocalCollection} from "../../../../../infrastructure/collections/getLocalCollection";
import {dataTarget} from "../../../../../utils/dataTarget";

const TrialCollection = getLocalCollection(Trial.name)

Template.trials.onCreated(async function () {
    this.fail = e => this.state.set({ error: errorToObject(e) })
    this.initDependencies({
        language: true,
        contexts: [Trial, TestCycle, Session],
        tts: true,
        debug: true,
        onComplete: async () => {
            const {trial: trialDocs} = await loadAllContentDocs({
                context: Trial,
                collection: TrialCollection,
                ignoreFailedUpsert: true,
                debug: console.debug
            })
            const testCycleIds = [...new Set(trialDocs.map(doc => doc.testCycleId))].filter(Boolean)
            await loadAllContentDocs({
                context: TestCycle,
                unlessExists: true,
                ids: testCycleIds,
                debug: console.debug
            })

            this.state.set('dependenciesComplete', true)
        },
        onError: (e) => {
            this.state.set('dependenciesComplete', true)
            this.fail(e)
        },
    })

    this.loadTrialData = async ({ trialId, testCycleId }) => {
        const trialData = await callMethod({
            name: Trial.methods.getData,
            args: { trialId, testCycleId }
        })

        trialData.trialId = trialId
        trialData.sessionDocs.forEach(doc => {
            const user = trialData.users.find(u => u._id === doc.userId)
            doc.username = user ? user.username : '?'

            let duration = -1
            if (doc.startedAt && doc.completedAt) {
                duration = new Date(doc.completedAt) - new Date(doc.startedAt)
            }
            doc.duration = duration
        })
        trialData.count = trialData.sessionDocs.length
        this.state.set({ trialData })
    }
})

Template.trials.helpers({
    dependenciesComplete() {
        return Template.getState('dependenciesComplete') && !Template.getState('loading')
    },
    testCycle(id) {
        const doc = TestCycle.collection().findOne(id)
        return doc ? doc.shortCode : id
    },
    qrData ({ _id, title, testCycleId }) {
        const route = 'trial'
        const args = [_id, testCycleId]
        const testCycleDoc = TestCycle.collection().findOne(testCycleId)
        const label = `${title} - ${testCycleDoc?.shortCode ?? ''}`
        return new URLSearchParams({ route, args, label }).toString()
    },
    toDate (d) {
      return d ? new Date(d).toLocaleDateString() : '-'
    },
    toTime (d) {
        return d ? new Date(d).toLocaleTimeString() : '-'
    },
    trials() {
        if (!Template.getState('dependenciesComplete')) {
            return null
        }
        console.debug('helper', TrialCollection.find().fetch())
        return TrialCollection.find()
    },
    form() {
        return Template.getState('form')
    },
    formSchema() {
        return Template.instance().formSchema
    },
    error() {
        return Template.getState('error')
    },
    submitting () {
        return Template.getState('submitting')
    },
    showEntry (entry) {
        const data = Template.getState('trialData')
        if (!data) return true
        return data.trialId === entry._id
    },
    trialData () {
        return Template.getState('trialData')
    }
})

Template.trials.events({
    'click .create-btn'(event, instance) {
        event.preventDefault()
        instance.formSchema = Object.entries(Trial.methods.create.schema).map(([name, val]) => {
            return {name, label: name, type: val.type === Date ? 'date' : 'text'}
        })
        instance.state.set({
            form: {isInsert:true}
        })
    },
    'click .cancel-form-btn' (event, instance) {
        instance.state.set({ form: null })
    },
    'click .submit-form-btn'(event, instance) {
        event.preventDefault()
        const formData = new FormData(instance.$('#trialForm')[0])
        const args = Object.fromEntries(formData.entries())
        const formDef = instance.state.get('form')
        let method

        if (formDef.isInsert) {
            method = Trial.methods.create
        }

        if (formDef.isUpdate) {
            method = Trial.methods.update
        }

        if (args.until) args.until = new Date(args.until)
        if (args.from) args.from = new Date(args.from)

        instance.state.set({ submitting: true })
        callMethod({
            name: method,
            args,
            receive: () => instance.state.set({ submitting: false }),
            onError: instance.fail,
            success: (trialDoc) => {
                TrialCollection.upsert({
                    _id: trialDoc._id
                }, {
                    $set: trialDoc
                })
                instance.state.set({ form: null })
            }
        })
    },
    'click .view-data-btn': async (event, instance) => {
        event.preventDefault()
        const trialId = dataTarget(event, 'trial')
        const testCycleId = dataTarget(event, 'testCycle')
        await instance.loadTrialData({ trialId, testCycleId })
    }
})