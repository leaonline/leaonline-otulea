export const getArrayIndexPercent = (element, array, { round } = {}) => {
  const index = array.indexOf(element)

  if (index === -1) {
    throw new Error(`Expected ${element} to be in array ${array.toString()}`)
  }

  const percent = (index / array.length) * 100
  return round ? Math.floor(percent) : percent
}