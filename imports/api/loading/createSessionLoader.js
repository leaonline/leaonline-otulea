import { callMethod } from '../../infrastructure/methods/callMethod'
import { Session } from '../../contexts/session/Session'
import { loadContentDoc } from './loadContentDoc'
import { UnitSet } from '../../contexts/unitSet/UnitSet'
import { Level } from '../../contexts/Level'
import { Dimension } from '../../contexts/Dimension'
import { ColorType } from '../../types/ColorType'
import { Unit } from '../../contexts/Unit'
import { initClientContext } from '../../startup/client/context'

/**
 * Creates a loader for the "current session" and all it's dependants.
 * @param instance
 * @return fn {async Function} the load function, loading a session for unit
 */
export const createSessionLoader = ({ info = () => {} }) => {
  [UnitSet, Level, Dimension, Session, Unit].forEach(ctx => initClientContext(ctx))

  return async ({ sessionId, unitId, unitSetId }) => {
    info('load session docs')

    const sessionDoc = sessionId && await callMethod({
      name: Session.methods.currentById.name,
      args: { sessionId }
    })

    const finalUnitSetId = (unitSetId || sessionDoc?.unitSet)
    const unitSetDoc = await loadContentDoc(UnitSet, finalUnitSetId)
    const unitDoc = unitId && await loadContentDoc(Unit, unitId)
    const levelDoc = unitSetDoc && await loadContentDoc(Level, unitSetDoc?.level)
    const dimensionDoc = unitSetDoc && await loadContentDoc(Dimension, unitSetDoc?.dimension)

    const colorType = dimensionDoc && ColorType.byIndex(dimensionDoc?.colorType)
    const color = colorType?.type

    return { sessionDoc, unitSetDoc, unitDoc, levelDoc, dimensionDoc, color }
  }
}
