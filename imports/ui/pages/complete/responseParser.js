/*
   ID     KB Status korrekt bewertet uebersprungen unbewertet gesehen
10 CD S.2.07      3       6        6             0          0       6
12 CD S.2.08      2       4        5             0          0       5
3  CD  L.4.2     -1       0        0             0          0       0
1  CD  L.4.3     -1       0        0             0          0       0
2  CD  L.4.4     -1       0        0             0          0       0
4  CD S.1.06     -1       0        0             0          1       1
*/
const settings = Meteor.settings.public.evaluation.parse

const toInt = value => {
  if (typeof value === 'undefined' || value === null) {
    return -1
  } else {
    return parseInt(value, 10)
  }
}

const index = (arr) => toInt(arr[settings.index])
const competencyId = (arr) => arr[settings.competencyId]
const status = (arr) => toInt(arr[settings.status])
const occurrences = (arr) => toInt(arr[settings.occurrences])
const correct = (arr) => toInt(arr[settings.correct])

export const ResponseParser = {}

ResponseParser.parse = function (lines, { skipNonOccurred = true } = {}) {
  return lines
    .map(line => {
      const split = line.split(/\s+/g)
      return {
        index: index(split),
        competencyId: competencyId(split),
        status: status(split),
        occurrences: occurrences(split),
        correct: correct(split)
      }
    })
    .filter(entry => {
      if (skipNonOccurred && entry.occurrences === 0) {
        return false
      }

      return true
    })
    .sort((a, b) => b.status - a.status)
}
