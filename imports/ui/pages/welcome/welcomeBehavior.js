const loginCharacter = /^[a-zA-Z0-9]{1}$/i
const whitespace = /\s+/

export const combineLoginCode = (values) =>
  values.map((value) => value ?? '').join('')

export const normalizePastedCode = (value, expectedLength) => {
  const normalized = String(value ?? '').replace(/\s+/g, '')
  return normalized.length === expectedLength ? normalized : undefined
}

export const updateLoginInput = ({ values, index, key }) => {
  const updated = [...values]
  if (loginCharacter.test(key)) {
    updated[index] = key
    return {
      accepted: true,
      values: updated,
      focusIndex: index < updated.length - 1 ? index + 1 : undefined,
      complete: index === updated.length - 1,
    }
  }
  if (whitespace.test(key)) {
    updated[index] = ''
    return {
      accepted: true,
      values: updated,
      focusIndex: index,
      complete: false,
    }
  }
  return {
    accepted: false,
    values: updated,
    focusIndex: index,
    complete: false,
  }
}

export const deleteLoginInput = ({ values, index }) => {
  const updated = [...values]
  const targetIndex = updated[index] ? index : Math.max(0, index - 1)
  updated[targetIndex] = ''
  return { values: updated, focusIndex: targetIndex }
}

export const createWelcomeAuth = ({
  callMethod,
  loginWithPassword,
  registerMethod,
  onFailure,
  onLoginSuccess,
}) => {
  const login = (code) =>
    loginWithPassword(code, code, (error) => {
      if (error) return onFailure(error)
      onLoginSuccess()
    })

  const register = ({ code, registerCode, isDemoUser }) => {
    if (registerCode !== code) {
      onFailure()
      return false
    }

    callMethod({
      name: registerMethod,
      args: { code, isDemoUser },
      prepare: () => {},
      failure: onFailure,
      success: () => login(code),
    })
    return true
  }

  return { login, register }
}
