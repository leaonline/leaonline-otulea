import { Meteor } from 'meteor/meteor'

const { length, allowedChars} = Meteor.settings.public.accounts.code
const charSet = new Set(allowedChars)

export const MAX_CODE_LENGTH = length

export const codeIsValid = (code) => {
    if (typeof code !== 'string' || code.length !== length) {
        return false
    }

    for (const char of code) {
        if (!charSet.has(char)) {
            return false
        }
    }

    return true
}