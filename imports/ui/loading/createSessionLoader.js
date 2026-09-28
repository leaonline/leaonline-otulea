import { Meteor } from 'meteor/meteor'
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
export const createSessionLoader = ({
  debug = () => {},
  call = callMethod,
  load = loadContentDoc,
  initializeContext = initClientContext,
  rewriteImage = fixImageUrl,
  isDevelopment = Meteor.isDevelopment,
  contexts = { UnitSet, Level, Dimension, Session, Unit },
  colorByIndex = ColorType.byIndex,
} = {}) => {
  const {
    UnitSet: UnitSetContext,
    Level: LevelContext,
    Dimension: DimensionContext,
    Session: SessionContext,
    Unit: UnitContext,
  } = contexts
  ;[
    UnitSetContext,
    LevelContext,
    DimensionContext,
    SessionContext,
    UnitContext,
  ].forEach((context) => initializeContext(context))

  return async ({ sessionId, unitId, unitSetId }) => {
    debug('load session docs')

    const sessionDoc =
      sessionId &&
      (await call({
        name: SessionContext.methods.currentById.name,
        args: { sessionId },
      }))

    const finalUnitSetId = unitSetId || sessionDoc?.unitSet
    const unitDoc =
      unitId &&
      (await load({
        context: UnitContext,
        query: { _id: unitId },
        unlessExists: true,
      }))
    const unitSetDoc =
      finalUnitSetId &&
      (await load({
        context: UnitSetContext,
        query: { _id: finalUnitSetId },
        unlessExists: true,
      }))
    if (isDevelopment) {
      if (unitSetDoc?.story) {
        for (const element of unitSetDoc.story) {
          rewriteImage(element)
        }
      }
      if (unitDoc?.instructions) {
        for (const element of unitDoc.instructions) {
          rewriteImage(element)
        }
      }
      if (unitDoc?.stimuli) {
        for (const element of unitDoc.stimuli) {
          rewriteImage(element)
        }
      }
      if (unitDoc?.pages) {
        for (const page of unitDoc.pages) {
          for (const element of page.content ?? []) {
            rewriteImage(element)
          }
        }
      }
    }

    const levelDoc =
      unitSetDoc &&
      (await load({
        context: LevelContext,
        query: { _id: unitSetDoc?.level },
        unlessExists: true,
      }))
    const dimensionDoc =
      unitSetDoc &&
      (await load({
        context: DimensionContext,
        query: { _id: unitSetDoc?.dimension },
        unlessExists: true,
      }))

    const colorType = dimensionDoc && colorByIndex(dimensionDoc?.colorType)
    const color = colorType?.type

    return { sessionDoc, unitSetDoc, unitDoc, levelDoc, dimensionDoc, color }
  }
}
