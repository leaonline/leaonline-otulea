export const storage = {
    data: {},
    getItem(key) {
        return this.data[key]
    },
    setItem(key, value) {
        this.data[key] = value
    },
    removeItem(key) {
        delete this.data[key]
    },
    getAll() {
        return { ...this.data }
    },
}

