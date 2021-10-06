export const isValidNumber = num => (typeof num === 'number') && !Number.isNaN(num)

export const isValidInteger = num => isValidNumber(num) && Number.isSafeInteger(num)

export const isValidFloat = num => {
  if (!isValidNumber(num)) return false
  if (num === 0) return true
  return isInFloatBounds(num < 0 ? -num : num)
}

const isInFloatBounds = num => num >= Number.MIN_VALUE && num <= Number.MAX_VALUE
