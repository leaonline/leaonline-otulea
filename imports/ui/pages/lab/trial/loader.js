import { Session } from "../../../../contexts/session/Session";
import { Trial } from "../../../../contexts/trial/Trial";
import { TestCycle } from "../../../../contexts/testcycle/TestCycle"
import { UnitSet } from "../../../../contexts/unitSet/UnitSet";
import { Unit } from "../../../../contexts/Unit";
import { Dimension } from "../../../../contexts/Dimension";
import { getLocalCollection } from "../../../../infrastructure/collections/getLocalCollection";
import { loadContentDoc } from "../../../loading/loadContentDoc";
import {callMethod} from "../../../../infrastructure/methods/callMethod";
import {getColor} from "../shared/getColor";

export const createLoadTrialData = ({ instance }) => async ({ testCycleId, trialId }) => {
    const trialDoc = await loadContentDoc({
        context: Trial,
        query: { _id: trialId },
        collection: getLocalCollection(Trial.name),
        throwIfNotFound: true
    })
    const testCycleDoc = await loadContentDoc({
        context: TestCycle,
        query: { _id: testCycleId },
        collection: getLocalCollection(TestCycle.name),
        throwIfNotFound: true
    })
    const data  = { trialDoc, testCycleDoc }
    instance.state.set({ trialDoc, testCycleDoc })
    return data
}

export const createLoadSession = ({ instance }) => async ({ testCycleId, trialId }) => {
    if (!Meteor.user()) return
    const sessionDoc = await callMethod({
        name: Session.methods.byTestCycle,
        args: { testCycleId, trialId }
    })

    instance.state.set({ sessionDoc })
    return sessionDoc
}

export const createSessionStarter = ({ instance }) => async ({ sessionId, testCycleId, trialId, isContinue, isRestart }) => {
    const args = isContinue ? { sessionId } : { testCycleId, trialId }
    const method = isContinue ? Session.methods.continue : Session.methods.start
    const sessionDoc = await callMethod({
        name: method,
        args,
        prepare: () => instance.state.set('starting', true),
        receive: () => instance.state.set('starting', false),
        failure: instance.fail
    })
    instance.state.set({ sessionDoc })
    return sessionDoc
}


export const createLoadUnitData = ({ instance }) => async ({ sessionDoc }) => {
    const unitSetId = sessionDoc.unitSet
    const unitId = sessionDoc.currentUnit

    // data loading dependencies
    const unitSetDoc = await loadContentDoc({
        context: UnitSet,
        from: 'remote',
        throwIfNotFound: true,
        query: {_id: unitSetId},
    })

    const dimensionDoc = await loadContentDoc({
        context: Dimension,
        from: 'remote',
        throwIfNotFound: true,
        query: {_id: unitSetDoc.dimension},
    })

    const color = await getColor({dimensionId: unitSetDoc.dimension, from: 'remote'})

    // pre-load unit
    const unitDoc = await loadContentDoc({
        context: Unit,
        from: 'remote',
        throwIfNotFound: true,
        // load step-bound unit or first one as default
        query: {_id: unitId ?? unitSetDoc.units[0]},
    })

    const data = { unitDoc, dimensionDoc, unitSetDoc, color }
    instance.state.set(data)
    return data
}