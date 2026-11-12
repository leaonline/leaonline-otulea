import { onServerExec } from '../../utils/archUtils'
import {createGetMethod} from "../../api/services/createGetMethod";
import {createGetAllMethod} from "../../api/services/createGetAllMethod";

export const Trial = {
    name: 'trial',
    label: 'trial.title',
    icon: 'flask',
    methods: {},
    publications: {}
}

Trial.schema = {

    /**
     * The user who this session belongs to.
     */

    userId: String,

    /**
     * Temporal start and end indicators.
     */

    startedAt: Date,

    /**
     * Indicate the end of a session
     */
    completedAt: {
        type: Date,
        optional: true,
    },

    /**
     * See the last time the session has been updated
     */
    updatedAt: {
        type: Date,
        optional: true,
    },

    /**
     * Optional entry to flag a session, that has been superseded by a "restart"
     */
    cancelledAt: {
        type: Date,
        optional: true,
    },

    /**
     * Optional flag to indicate, that this is a continued session
     */
    continuedAt: {
        type: Date,
        optional: true,
    },

    /**
     * The current unit set to complete. There may be more than one unit-sets
     * for a given test-cycle, because a unit-set is used to summarize a certain
     * content, while test-cycle summarize a set of tests.
     */

    unitSetId: String,

    /**
     * The current unit to solve.
     * If not set the trial is considered finished (all units done)
     */
    unitId: {
        type: String,
        optional: true,
    },

    /**
     * Progress indicates the amount of units (pages = tasks) being solved
     */

    progress: {
        type: Number,
        defaultValue: 0,
        min: 0,
    },

    maxProgress: {
        type: Number,
        defaultValue: 0,
        min: 0,
    },
}

Trial.methods.start = {
    name: 'trial.methods.start',
    schema: {
        unitSetId: String,
    },
    numRequests: 1,
    timeInterval: 1000,
    run: onServerExec(() => {
        const { startTrial } = require('./api/startTrial')

        return async function ({ unitSetId }) {
            return startTrial({
                unitSetId,
                userId: this.userId,
            })
        }
    }),
}

Trial.methods.get = createGetMethod({ context: Trial })

Trial.methods.getAll = createGetAllMethod({ context: Trial })
