import { Meteor } from 'meteor/meteor'
import { check, Match } from 'meteor/check'
import { UnitSet } from '../../unitSet/UnitSet'
import { Unit } from '../../Unit'
import { Trial } from '../Trial'
import { checkDocument } from '../../../infrastructure/mixins/checkDocument'
import { getDocument } from '../../../infrastructure/mixins/getDocument'

/**
 * Starts a new trial session for a given unitSet.
 *
 * The unit set inherits the involved units.
 * There is  at least one unit.
 *
 * @param options.unitSetId {string} linked unit set to be tried
 * @param options.userId {string} user who runs the trial
 * @return {object} the created trial document
 */
export const startTrial = async (options = {}) => {
    check(
        options,
        Match.ObjectIncluding({
            unitSetId: String,
            userId: String,
        }),
    )

    const { unitSetId, userId } = options

    const TrialCollection = Trial.collection()
    const trialDoc = await TrialCollection.findOneAsync({
        userId,
        unitSetId,
        completedAt: { $exists: false },
        cancelledAt: { $exists: false },
    })

    // There may be the the case where we find an aborted session.
    if (trialDoc) {
        await TrialCollection.updateAsync({ _id: trialDoc._id }, {
            $set: { continuedAt: new Date() },
        })
        return TrialCollection.findOneAsync(trialDoc._id)
    }


    // get the initial unit-set
    const unitSetDoc = await getDocument(unitSetId, UnitSet)
    const progress = 0
    const maxProgress = unitSetDoc.progress

    // we also strictly require the unitSetDoc to start a session
    checkDocument(unitSetDoc, UnitSet, { unitSetId })

    // get the initial unit
    const unitId = unitSetDoc.units?.[0]
    const unitDoc = await getDocument(unitId, Unit)

    // unit is also strictly required to start a session
    checkDocument(unitDoc, Unit, { unitId })

    // if all docs exist, we can create a new session document
    const startedAt = new Date()
    const insertDoc = { userId, startedAt, unitSetId, unitId, progress, maxProgress }

    const newTrialId = await TrialCollection.insertAsync(insertDoc)
    return TrialCollection.findOneAsync(newTrialId)
}
