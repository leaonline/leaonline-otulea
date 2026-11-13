export const once = (fn) => {
    let result
    return (...args) => {
        if (result === undefined) {
            result = fn(...args)
        }
        return result
    }
}
