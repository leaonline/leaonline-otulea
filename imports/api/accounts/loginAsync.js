export const loginAsync = async (code) => {
    return new Promise((resolve, reject) => {
        Meteor.loginWithPassword(code, code, (err) => {
            if (err) return reject(err)
            return resolve()
        })
    })
}