import {loadContentDoc} from "../../../loading/loadContentDoc";
import {ColorType} from "../../../../contexts/types/ColorType";
import { Dimension } from "../../../../contexts/Dimension";
import { isDefined } from "../../../../utils/isDefined";

export const getColor = async ({ dimensionId, from }) => {
    if (!dimensionId) return 'primary'
    const dimensionDoc = await loadContentDoc({
        context: Dimension,
        from,
        throwIfNotFound: false,
        query: { _id: dimensionId },
    })
    if (!isDefined(dimensionDoc?.colorType)) return 'primary'
    const colorType = ColorType.byIndex(dimensionDoc.colorType)
    return colorType?.type ?? 'primary'
}
