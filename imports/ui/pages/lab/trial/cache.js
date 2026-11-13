import {ResponseCache} from "../../unit/cache/ResponseCache";
import {UnitPageCache} from "../../unit/cache/UnitPageCache";
import {createItemSubmit} from "../../unit/item/createItemSubmit";

export const responseCache = ResponseCache.create(window.sessionStorage)
export const pageCache = UnitPageCache.create(window.sessionStorage)
export const submitItems = createItemSubmit({
    loadValue: (responseDoc) => responseCache.load(responseDoc),
    prepare: (responseDoc) => console.info('[Template.Unit]: submit to server', responseDoc),
    onError: (error, responseDoc) => console.error(error, responseDoc),
    onSuccess: (result, responseDoc) => {
        const cleared = responseCache.clear(responseDoc)
        console.info('[Template.Unit]: clear storage', cleared, responseDoc)
    },
})