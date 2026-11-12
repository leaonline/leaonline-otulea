import { Unit } from '../../../../contexts/Unit'

export const createOnEvaluate = ({ storage, instance }) => {
    return () => {
        const unitDoc = instance.state.get('unitDoc')
        const currentPage = instance.state.get('currentPageCount')
        const allResponses = Object.entries(storage.data)
            .filter((entry) => {
                // filter out entries from other pages
                const [_sessionId, _unitId, page] = entry[0].split('-')
                return _unitId === unitDoc._id && page == currentPage
            })
            .map((value) => {
                const [sessionId, unitId, page, itemId] = value[0].split('-')
                const data = {
                    sessionId,
                    unitId,
                    page,
                    itemId,
                    ...EJSON.parse(value[1]),
                }
                const itemDefinitions = Unit.getContentElement({
                    unit: unitDoc,
                    contentId: itemId,
                    page: Number(page),
                })

                return Scoring.run(itemDefinitions.subtype, itemDefinitions.value, data)
            })

        return allResponses.flat()
    }
}