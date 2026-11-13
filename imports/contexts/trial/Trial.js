import {onClientExec, onServerExec} from '../../utils/archUtils'
import {createGetMethod} from "../../api/services/createGetMethod";
import {createGetAllMethod} from "../../api/services/createGetAllMethod";

export const Trial = {
    name: 'trial',
    label: 'trial.title',
    icon: 'flask',
    methods: {},
    publications: {}
}

onClientExec(() => {
    import {LocalCollections} from "../../infrastructure/collections/LocalCollections";

    // we use this to create a local manageable collection
    // while also ensuring pub/sub with the server-connected collection
    const TrialCollection = new Mongo.Collection(null)
    TrialCollection._name = Trial.name
    // TrialCollection.attachSchema(Trial.schema)
    LocalCollections.add(Trial.name, TrialCollection)
})

Trial.schema = {
    title: {
        type: String
    },
    description: {
        type: String,
        optional: true
    },
    testCycleId: {
        type: String
    },
    from: {
        type: Date,
        optional: true
    },
    until: {
        type: Date,
        optional: true
    },
    location: {
        type: String,
        optional: true
    },
    createdBy: {
        type: String
    },
    createdAt: {
        type: Date
    },
    updatedBy: {
        type: String,
        optional: true
    },
    updatedAt: {
        type: Date,
        optional: true
    }
}

Trial.methods.create = {
    name: 'trial.methods.create',
    schema: {
        title: {
            type: String
        },
        description: {
            type: String,
            optional: true
        },
        testCycleId: {
            type: String
        },
        from: {
            type: Date,
            optional: true
        },
        until: {
            type: Date,
            optional: true
        },
        location: {
            type: String,
            optional: true
        },
    },
    numRequests: 1,
    timeInterval: 1000,
    backendOnly: true,
    run: onServerExec(() => {
        return async function ({ title, description, testCycleId, from, until, location }) {
            const createdBy = this.userId
            const createdAt = new Date()
            return Trial.collection().insertAsync({
                title, description, testCycleId, from, until, location, createdAt, createdBy
            })
        }
    }),
}

Trial.methods.getData = {
    name: 'trial.methods.getData',
    schema: {
        trialId: {
            type: String,
        },
        testCycleId: {
            type: String
        },
    },
    numRequests: 1,
    timeInterval: 1000,
    backendOnly: true,
    run: onServerExec(() => {
        import { Session } from "../session/Session";

        return async ({ trialId, testCycleId }) => {
            const sessionDocs = await Session.collection().find({trialId, testCycle: testCycleId }).fetchAsync()
            const userIds = [...new Set(sessionDocs.map(doc => doc.userId))]
            const users = await Meteor.users.find({ _id: { $in: userIds } }).fetchAsync()
            return { sessionDocs, users }
        }
    })
}

Trial.methods.get = createGetMethod({ context: Trial, backendOnly: false })
Trial.methods.getAll = createGetAllMethod({ context: Trial, backendOnly: true })
