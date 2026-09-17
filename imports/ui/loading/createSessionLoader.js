import { callMethod } from '../../infrastructure/methods/callMethod'
import { Session } from '../../contexts/session/Session'
import { loadContentDoc } from './loadContentDoc'
import { UnitSet } from '../../contexts/unitSet/UnitSet'
import { Level } from '../../contexts/Level'
import { Dimension } from '../../contexts/Dimension'
import { ColorType } from '../../contexts/types/ColorType'
import { Unit } from '../../contexts/Unit'
import { initClientContext } from '../../api/context/initClientContext'
import { fixImageUrl } from '../../utils/image/fixImageUrl'

/**
 * Creates a loader for the "current session" and all it's dependants.
 * @param instance
 * @return fn {async Function} the load function, loading a session for unit
 */
export const createSessionLoader = ({ debug = () => {} }) => {
  ;[UnitSet, Level, Dimension, Session, Unit].forEach((ctx) =>
    initClientContext(ctx),
  )

  return async ({ sessionId, unitId, unitSetId }) => {
    debug('load session docs')

    const sessionDoc =
      sessionId &&
      (await callMethod({
        name: Session.methods.currentById.name,
        args: { sessionId },
      }))

    const finalUnitSetId = unitSetId || sessionDoc?.unitSet
    const unitDoc =
      unitId &&
      (await loadContentDoc({
        context: Unit,
        query: { _id: unitId },
        unlessExists: true,
      }))
    const unitSetDoc = await loadContentDoc({
      context: UnitSet,
      query: { _id: finalUnitSetId },
      unlessExists: true,
    })
    if (Meteor.isDevelopment) {
      if (unitSetDoc?.story) {
        for (const element of unitSetDoc.story) {
          fixImageUrl(element)
        }
      }
      if (unitDoc?.instructions) {
        for (const element of unitDoc.instructions) {
          fixImageUrl(element)
        }
      }
      if (unitDoc?.stimuli) {
        for (const element of unitDoc.stimuli) {
          fixImageUrl(element)
        }
      }
      if (unitDoc?.pages) {
        for (const page of unitDoc.pages) {
          for (const element of page.content) {
            fixImageUrl(element)
          }
        }
      }
    }

    const levelDoc =
      unitSetDoc &&
      (await loadContentDoc({
        context: Level,
        query: { _id: unitSetDoc?.level },
        unlessExists: true,
      }))
    const dimensionDoc =
      unitSetDoc &&
      (await loadContentDoc({
        context: Dimension,
        query: { _id: unitSetDoc?.dimension },
        unlessExists: true,
      }))

    const colorType = dimensionDoc && ColorType.byIndex(dimensionDoc?.colorType)
    const color = colorType?.type

    return { sessionDoc, unitSetDoc, unitDoc, levelDoc, dimensionDoc, color }
  }
}
